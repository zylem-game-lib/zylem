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
import { Entity } from '../interfaces/entity';
import { SetupCallback } from '~/lib/interfaces/game';
import { stageState } from '../state';
import { GameEntity } from '../entities/entity';
import { ZylemCamera } from '../camera/zylem-camera';
import { debugState } from '../state/debug-state';

export class ZylemScene implements Entity<ZylemScene> {
	public type = 'Scene';

	_setup?: SetupCallback;
	scene!: Scene;
	zylemCamera!: ZylemCamera;
	containerElement: HTMLElement | null = null;

	constructor(id: string, camera: ZylemCamera) {
		// Create Three.js scene
		const scene = new Scene();
		scene.background = new Color(stageState.backgroundColor);

		// Setup background image if provided
		if (stageState.backgroundImage) {
			const loader = new TextureLoader();
			const texture = loader.load(stageState.backgroundImage);
			scene.background = texture;
		}

		this.scene = scene;
		this.zylemCamera = camera;

		// Setup DOM element
		this.setupContainer(id);

		// Setup lighting
		this.setupLighting(scene);

		// Setup camera with scene
		this.setupCamera(scene, camera);

		// Debug setup
		if (debugState.on) {
			this.debugScene();
		}
	}

	/**
	 * Setup the container element and append camera's renderer
	 */
	private setupContainer(id: string) {
		let element = document.getElementById(id);
		if (!element) {
			console.warn(`Could not find element with id: ${id}`);
			const main = document.createElement('main');
			main.setAttribute('id', id);
			document.body.appendChild(main);
			element = main;
		}
		if (element?.firstChild) {
			element.removeChild(element.firstChild);
		}
		this.containerElement = element;
		element?.appendChild(this.zylemCamera.getDomElement());
	}

	setup() {
		if (this._setup) {
			this._setup({ scene: this, camera: this.zylemCamera });
		}
	}

	destroy() {
		// Scene cleanup if needed
	}

	update({ delta }: Partial<any>) {
		// Scene no longer handles rendering - camera does this
		// Any scene-specific updates can go here
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
			this.scene.add(entity.group);
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