import {
	Scene,
	Color,
	AmbientLight,
	DirectionalLight,
	Object3D,
	Vector3,
	GridHelper,
	Texture,
	Light,
	SRGBColorSpace,
} from 'three';
import { Entity, LifecycleFunction } from '../interfaces/entity';
import { GameEntity } from '../entities/entity';
import { syncPendingPlacementVisibility } from '../entities/spawn-placement';
import { isManagedRenderEntity } from './render-category';
import { FOG_TYPE, ZylemFog } from '../entities/fog';
import { ZylemCamera } from '../camera/zylem-camera';
import { CameraManager } from '../camera/camera-manager';
import { RendererManager } from '../camera/renderer-manager';
import { debugState } from '../debug/debug-state';
import { SetupFunction } from '../core/base-node-life-cycle';
import { getGlobals } from '../game/game-state';
import { assetManager } from '../core/asset-manager';
import { ZylemShader, isTSLShader } from './material';

interface SceneState {
	backgroundColor: Color | string;
	backgroundImage: string | null;
	backgroundShader?: ZylemShader | null;
	/**
	 * When `false`, skip the engine's built-in ambient + directional lights so
	 * the caller can configure the scene's lighting entirely via
	 * `createLight(...)` entities. Defaults to `true` for backward
	 * compatibility with existing demos.
	 */
	defaultLighting?: boolean;
}

export class ZylemScene implements Entity<ZylemScene> {
	public type = 'Scene';

	_setup?: SetupFunction<ZylemScene>;
	scene!: Scene;
	/** @deprecated Use cameraManager instead */
	zylemCamera!: ZylemCamera;
	cameraManager: CameraManager | null = null;
	containerElement: HTMLElement | null = null;
	update: LifecycleFunction<ZylemScene> = () => { };
	_collision?: ((entity: any, other: any, globals?: any) => void) | undefined;
	_destroy?: ((globals?: any) => void) | undefined;
	name?: string | undefined;
	tag?: Set<string> | undefined;

	constructor(id: string, camera: ZylemCamera, state: SceneState) {
		const scene = new Scene();
		const isColor = state.backgroundColor instanceof Color;
		const backgroundColor = (isColor) ? state.backgroundColor : new Color(state.backgroundColor);
		scene.background = backgroundColor as Color;

		if (state.backgroundShader) {
			this.setupBackgroundShader(scene, state.backgroundShader);
		} else if (state.backgroundImage) {
			// Load background image asynchronously via asset manager. Tag it sRGB
			// so it is decoded correctly (otherwise it renders too bright).
			assetManager.loadTexture(state.backgroundImage, { colorSpace: SRGBColorSpace }).then(texture => {
				scene.background = texture;
			});
		}

		this.scene = scene;
		this.zylemCamera = camera;

		if (state.defaultLighting !== false) {
			this.setupLighting(scene);
		}
		if (debugState.enabled) {
			this.debugScene();
		}
	}

	/**
	 * Render the shader as a true skybox via the WebGPU renderer's
	 * `scene.backgroundNode`. The node is evaluated per background pixel at
	 * infinite depth — inside it, `normalWorld` (from `three/tsl`) is the
	 * per-pixel view direction, so the sky is stable under camera movement
	 * with no skybox mesh, far-plane sizing, or camera-follow logic.
	 *
	 * WebGPU-only: background shaders must be authored in TSL
	 * ({@link ZylemTSLShader}). A GLSL shader logs a warning and is ignored
	 * (the solid background color is kept).
	 */
	private setupBackgroundShader(scene: Scene, shader: ZylemShader) {
		if (!isTSLShader(shader)) {
			console.warn(
				'ZylemScene: GLSL background shaders are not supported on the WebGPU renderer. ' +
					'Provide a TSL shader (ZylemTSLShader) as backgroundShader. Keeping solid background.',
			);
			return;
		}

		// Clear the solid color background and install the node-based one.
		scene.background = null;
		scene.backgroundNode = shader.colorNode;
	}

	setup() {
		if (this._setup) {
			this._setup({ me: this, camera: this.zylemCamera, globals: getGlobals() });
		}
	}

	destroy() {
		// Destroy via camera manager if available, otherwise legacy single camera
		if (this.cameraManager) {
			this.cameraManager.dispose();
			this.cameraManager = null;
		} else if (this.zylemCamera && (this.zylemCamera as any).destroy) {
			(this.zylemCamera as any).destroy();
		}
		if (this.scene) {
			this.scene.backgroundNode = null;
			// Dispose background texture if present
			if (this.scene.background instanceof Texture) {
				this.scene.background.dispose();
				this.scene.background = null;
			}

			this.scene.traverse((obj: any) => {
				if (obj.geometry) {
					obj.geometry.dispose?.();
				}
				if (obj.material) {
					const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
					for (const mat of materials) {
						// Dispose all texture maps on the material
						if (mat.map) mat.map.dispose?.();
						if (mat.normalMap) mat.normalMap.dispose?.();
						if (mat.aoMap) mat.aoMap.dispose?.();
						if (mat.emissiveMap) mat.emissiveMap.dispose?.();
						if (mat.roughnessMap) mat.roughnessMap.dispose?.();
						if (mat.metalnessMap) mat.metalnessMap.dispose?.();
						if (mat.envMap) mat.envMap.dispose?.();
						if (mat.lightMap) mat.lightMap.dispose?.();
						if (mat.bumpMap) mat.bumpMap.dispose?.();
						if (mat.displacementMap) mat.displacementMap.dispose?.();
						if (mat.alphaMap) mat.alphaMap.dispose?.();
						mat.dispose?.();
					}
				}
				// Dispose shadow map render targets on lights
				if ((obj as Light).isLight && (obj as any).shadow?.map) {
					(obj as any).shadow.map.dispose();
				}
			});

			this.scene.clear();
		}
	}

	/**
	 * Setup camera with the scene.
	 * Supports both legacy single camera and CameraManager modes.
	 */
	async setupCamera(
		scene: Scene,
		camera: ZylemCamera,
		rendererManager?: RendererManager,
	): Promise<void> {
		// Add camera rig or camera directly to scene
		this.addCameraToScene(scene, camera);

		if (rendererManager) {
			// New path: camera setup with shared renderer manager
			await camera.setup(scene, rendererManager);
		} else {
			// Legacy path: camera handles its own renderer
			await camera.setupLegacy(scene);
		}
	}

	/**
	 * Setup with a CameraManager (multi-camera support).
	 */
	async setupCameraManager(scene: Scene, cameraManager: CameraManager, rendererManager: RendererManager): Promise<void> {
		this.cameraManager = cameraManager;

		// Add all active cameras to the scene
		for (const camera of cameraManager.activeCameras) {
			this.addCameraToScene(scene, camera);
		}

		// Setup the camera manager (initializes all cameras)
		await cameraManager.setup(scene, rendererManager);
	}

	/**
	 * Add a camera (rig or direct) to the scene graph.
	 */
	private addCameraToScene(scene: Scene, camera: ZylemCamera): void {
		if (camera.cameraRig) {
			scene.add(camera.cameraRig);
		} else {
			scene.add(camera.camera as Object3D);
		}
	}

	/**
	 * Setup scene lighting
	 */
	setupLighting(scene: Scene) {
		// Ambient is intentionally lower than the directional key light: with
		// correct sRGB textures under PBR (MeshStandardNodeMaterial), a high
		// ambient term washes surfaces toward white. The directional light
		// keeps shading + shadows.
		const ambientLight = new AmbientLight(0xffffff, 1);
		scene.add(ambientLight);

		const directionalLight = new DirectionalLight(0xffffff, 2);
		directionalLight.name = 'Light';
		directionalLight.position.set(0, 100, 0);
		directionalLight.castShadow = true;
		directionalLight.shadow.camera.near = 0.1;
		directionalLight.shadow.camera.far = 2000;
		directionalLight.shadow.camera.left = -100;
		directionalLight.shadow.camera.right = 100;
		directionalLight.shadow.camera.top = 100;
		directionalLight.shadow.camera.bottom = -100;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);
	}

	/**
	 * Update renderer size - delegates to camera manager or camera
	 */
	updateRenderer(width: number, height: number) {
		if (this.cameraManager) {
			// Resize all cameras
			for (const camera of this.cameraManager.allCameras) {
				camera.resize(width, height);
			}
		} else {
			this.zylemCamera.resize(width, height);
		}
	}

	/**
	 * Add object to scene
	 */
	add(object: Object3D, position: Vector3 = new Vector3(0, 0, 0)) {
		object.position.set(position.x, position.y, position.z);
		this.scene.add(object);
	}

	/**
	 * Add game entity to scene
	 */
	addEntity(entity: GameEntity<any>) {
		const target = entity.group ?? entity.mesh;
		if (!target || this.isAttachedOutsideScene(target)) return;
		this.add(target, entity.options.position);
	}

	/**
	 * Add an entity's group or mesh to the scene (for late-loaded models).
	 * Uses entity's current body position if physics is active.
	 *
	 * Fog entities ({@link ZylemFog}) are routed through the normal add
	 * pipeline so their empty placeholder group is parented for cleanup,
	 * but they also get an `attachToScene` call that wires `scene.fog`
	 * and starts the optional material patcher.
	 */
	addEntityGroup(entity: GameEntity<any>): void {
		if (isManagedRenderEntity(entity)) {
			return;
		}

		const target = entity.group ?? entity.mesh;
		if (!target || this.isAttachedOutsideScene(target)) return;

		const fogEntity = asFogEntity(entity);
		if (fogEntity) {
			fogEntity.attachToScene(this.scene);
		}

		let position = entity.options.position ?? new Vector3(0, 0, 0);
		if (entity.physicsAttached && entity.body) {
			try {
				const translation = entity.body.translation();
				position = new Vector3(
					translation.x,
					translation.y,
					translation.z,
				);
			} catch {
				position = entity.options.position ?? new Vector3(0, 0, 0);
			}
		}

		this.add(target, position);
		syncPendingPlacementVisibility(entity);
	}

	private isAttachedOutsideScene(object: Object3D): boolean {
		return object.parent != null && object.parent !== this.scene;
	}

	/**
	 * Add debug helpers to scene
	 */
	debugScene() {
		const size = 1000;
		const divisions = 100;

		const gridHelper = new GridHelper(size, divisions);
		this.scene.add(gridHelper);
	}

}

/**
 * Try to view a generic `GameEntity` as a {@link ZylemFog}. Uses the static
 * `type` symbol rather than `instanceof` to keep the scene module free
 * of structural coupling to subclass constructors (subclasses & cloned
 * factories should still match).
 *
 * Returns the cast entity on match, or `null` otherwise. We use this
 * instead of a `type is ZylemFog` predicate because `GameEntity`'s
 * collision-callback signature creates a contravariant relationship
 * that TypeScript can't narrow through.
 */
function asFogEntity(entity: GameEntity<any>): ZylemFog | null {
	if ((entity.constructor as { type?: symbol }).type === FOG_TYPE) {
		return entity as unknown as ZylemFog;
	}
	return null;
}

