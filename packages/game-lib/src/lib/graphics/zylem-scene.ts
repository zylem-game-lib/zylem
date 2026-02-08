import {
	Scene,
	Color,
	AmbientLight,
	DirectionalLight,
	Object3D,
	Vector3,
	GridHelper,
	BoxGeometry,
	ShaderMaterial,
	Mesh,
	BackSide,
	Material,
} from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { Entity, LifecycleFunction } from '../interfaces/entity';
import { GameEntity } from '../entities/entity';
import { ZylemCamera } from '../camera/zylem-camera';
import { CameraManager } from '../camera/camera-manager';
import { RendererManager } from '../camera/renderer-manager';
import { debugState } from '../debug/debug-state';
import { SetupFunction } from '../core/base-node-life-cycle';
import { getGlobals } from '../game/game-state';
import { assetManager } from '../core/asset-manager';
import { ZylemShader, isTSLShader, isGLSLShader } from './material';

interface SceneState {
	backgroundColor: Color | string;
	backgroundImage: string | null;
	backgroundShader?: ZylemShader | null;
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

	// Skybox for background shaders (supports both GLSL ShaderMaterial and TSL MeshBasicNodeMaterial)
	private skyboxMaterial: Material | null = null;

	constructor(id: string, camera: ZylemCamera, state: SceneState) {
		const scene = new Scene();
		const isColor = state.backgroundColor instanceof Color;
		const backgroundColor = (isColor) ? state.backgroundColor : new Color(state.backgroundColor);
		scene.background = backgroundColor as Color;
		
		console.log('ZylemScene state.backgroundShader:', state.backgroundShader);
		
		if (state.backgroundShader) {
			this.setupBackgroundShader(scene, state.backgroundShader);
		} else if (state.backgroundImage) {
			// Load background image asynchronously via asset manager
			assetManager.loadTexture(state.backgroundImage).then(texture => {
				scene.background = texture;
			});
		}

		this.scene = scene;
		this.zylemCamera = camera;

		this.setupLighting(scene);
		if (debugState.enabled) {
			this.debugScene();
		}
	}

	/**
	 * Create a large inverted box with the shader for skybox effect
	 * Supports both GLSL (ShaderMaterial) and TSL (MeshBasicNodeMaterial) shaders
	 */
	private setupBackgroundShader(scene: Scene, shader: ZylemShader) {
		// Clear the solid color background
		scene.background = null;

		if (isTSLShader(shader)) {
			// TSL shader - use MeshBasicNodeMaterial for WebGPU
			this.skyboxMaterial = new MeshBasicNodeMaterial();
			(this.skyboxMaterial as MeshBasicNodeMaterial).colorNode = shader.colorNode;
			if (shader.transparent) {
				this.skyboxMaterial.transparent = true;
			}
			this.skyboxMaterial.side = BackSide;
			this.skyboxMaterial.depthWrite = false;
			console.log('Skybox created with TSL shader');
		} else if (isGLSLShader(shader)) {
			// GLSL shader - use ShaderMaterial for WebGL
			// Skybox vertex shader with depth trick (pos.xyww ensures depth = 1.0)
			const skyboxVertexShader = `
				varying vec2 vUv;
				varying vec3 vWorldPosition;
				
				void main() {
					vUv = uv;
					vec4 worldPosition = modelMatrix * vec4(position, 1.0);
					vWorldPosition = worldPosition.xyz;
					vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
					gl_Position = pos.xyww;  // Ensures depth is always 1.0 (farthest)
				}
			`;

			// Create shader material with skybox-specific settings
			this.skyboxMaterial = new ShaderMaterial({
				vertexShader: skyboxVertexShader,
				fragmentShader: shader.fragment,
				uniforms: {
					iTime: { value: 0.0 },
				},
				side: BackSide,  // Render on inside of geometry
				depthWrite: false,  // Don't write to depth buffer
				depthTest: true,  // But do test depth
			});
			console.log('Skybox created with GLSL shader');
		}

		// Use BoxGeometry for skybox
		const geometry = new BoxGeometry(1, 1, 1);
		const skybox = new Mesh(geometry, this.skyboxMaterial!);
		skybox.scale.setScalar(100000);  // Scale up significantly
		skybox.frustumCulled = false;  // Always render
		scene.add(skybox);
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
		if (this.skyboxMaterial) {
			this.skyboxMaterial.dispose();
		}
		if (this.scene) {
			this.scene.traverse((obj: any) => {
				if (obj.geometry) {
					obj.geometry.dispose?.();
				}
				if (obj.material) {
					if (Array.isArray(obj.material)) {
						obj.material.forEach((m: any) => m.dispose?.());
					} else {
						obj.material.dispose?.();
					}
				}
			});
		}
	}

	/**
	 * Setup camera with the scene.
	 * Supports both legacy single camera and CameraManager modes.
	 */
	setupCamera(scene: Scene, camera: ZylemCamera, rendererManager?: RendererManager) {
		// Add camera rig or camera directly to scene
		this.addCameraToScene(scene, camera);

		if (rendererManager) {
			// New path: camera setup with shared renderer manager
			camera.setup(scene, rendererManager);
		} else {
			// Legacy path: camera handles its own renderer
			camera.setupLegacy(scene);
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
		const ambientLight = new AmbientLight(0xffffff, 2);
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
		if (entity.group) {
			this.add(entity.group, entity.options.position);
		} else if (entity.mesh) {
			this.add(entity.mesh, entity.options.position);
		}
	}

	/**
	 * Add an entity's group or mesh to the scene (for late-loaded models).
	 * Uses entity's current body position if physics is active.
	 */
	addEntityGroup(entity: GameEntity<any>): void {
		const position = entity.body
			? new Vector3(
				entity.body.translation().x,
				entity.body.translation().y,
				entity.body.translation().z
			  )
			: entity.options.position;

		if (entity.group) {
			this.add(entity.group, position);
		} else if (entity.mesh) {
			this.add(entity.mesh, position);
		}
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

	/**
	 * Update skybox shader uniforms (only applies to GLSL ShaderMaterial)
	 * TSL shaders use the time node which auto-updates
	 */
	updateSkybox(delta: number) {
		if (this.skyboxMaterial && this.skyboxMaterial instanceof ShaderMaterial) {
			if (this.skyboxMaterial.uniforms?.iTime) {
				this.skyboxMaterial.uniforms.iTime.value += delta;
			}
		}
	}
}
