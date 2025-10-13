import {
	Scene,
	Color,
	AmbientLight,
	DirectionalLight,
	Object3D,
	Vector3,
	TextureLoader,
	GridHelper
} from 'three';
import { Entity, LifecycleFunction } from '../interfaces/entity';
import { GameEntity } from '../entities/entity';
import { ZylemCamera } from '../camera/zylem-camera';
import { debugState } from '../debug/debug-state';
import { SetupFunction } from '../core/base-node-life-cycle';
import { getGlobalState } from '../game/game-state';

interface SceneState {
	backgroundColor: Color | string;
	backgroundImage: string | null;
}

export class ZylemScene implements Entity<ZylemScene> {
	public type = 'Scene';

	_setup?: SetupFunction<ZylemScene>;
	scene!: Scene;
	zylemCamera!: ZylemCamera;
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
		if (state.backgroundImage) {
			const loader = new TextureLoader();
			const texture = loader.load(state.backgroundImage);
			scene.background = texture;
		}

		this.scene = scene;
		this.zylemCamera = camera;

		this.setupLighting(scene);
		this.setupCamera(scene, camera);
		if (debugState.on) {
			this.debugScene();
		}
	}

	setup() {
		if (this._setup) {
			this._setup({ me: this, camera: this.zylemCamera, globals: getGlobalState() });
		}
	}

	destroy() {
		if (this.zylemCamera && (this.zylemCamera as any).destroy) {
			(this.zylemCamera as any).destroy();
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
	 * Setup camera with the scene
	 */
	setupCamera(scene: Scene, camera: ZylemCamera) {
		scene.add(camera.cameraRig);
		// Camera handles its own setup now
		camera.setup(scene);
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
	 * Update renderer size - delegates to camera
	 */
	updateRenderer(width: number, height: number) {
		this.zylemCamera.resize(width, height);
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
	 * Add debug helpers to scene
	 */
	debugScene() {
		const size = 1000;
		const divisions = 100;

		const gridHelper = new GridHelper(size, divisions);
		this.scene.add(gridHelper);
	}
}