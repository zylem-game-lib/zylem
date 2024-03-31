import {
	Scene,
	Color,
	Vector2,
	WebGLRenderer,
	AmbientLight,
	DirectionalLight,
	Object3D,
	Vector3,
	TextureLoader,
	GridHelper
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ZylemCamera } from '../core/camera';
import RenderPass from './render-pass';
import { Entity, GameEntity } from '../interfaces/entity';
import { SetupCallback } from '~/lib/interfaces/game';
import { stageState } from '../state';
import { EntityParameters } from '../core/entity';
import { ThirdPersonCamera } from '../entities/camera/third-person';

export class ZylemScene implements Entity<ZylemScene> {
	type = 'Scene';
	_setup?: SetupCallback;
	scene!: Scene;
	screenResolution!: Vector2;
	renderer!: WebGLRenderer;
	composer!: EffectComposer;
	zylemCamera!: ThirdPersonCamera;
	containerElement: HTMLElement | null = null;

	constructor(id: string) {
		const scene = new Scene();
		scene.background = new Color(stageState.backgroundColor);
		if (stageState.backgroundImage) {
			const loader = new TextureLoader();
			const texture = loader.load(stageState.backgroundImage);
			scene.background = texture;
		}

		this.setupRenderer();
		this.setupLighting(scene);
		this.setupCamera(scene);

		this.scene = scene;
		const element = document.getElementById(id);
		if (!element) {
			throw new Error(`Could not find element with id: ${id}`);
		}
		if (element.firstChild) {
			element.removeChild(element.firstChild);
		}
		this.containerElement = element;
		element.appendChild(this.renderer.domElement);
		// TODO: this needs to be exposed at the stage options level
		this.debugScene();
	}

	setup() {
		if (this._setup) {
			this._setup({ scene: this, camera: this.zylemCamera });
		}
	}

	destroy() { }

	update({ delta }: EntityParameters<any>) {
		this.zylemCamera.update();
		this.composer.render(delta);
	}

	setupCamera(scene: Scene) {
		this.zylemCamera = new ThirdPersonCamera(this.screenResolution, this.renderer);
		let renderResolution = this.screenResolution.clone().divideScalar(2);
		renderResolution.x |= 0;
		renderResolution.y |= 0;
		scene.add(this.zylemCamera.cameraRig);
		this.composer.addPass(new RenderPass(renderResolution, scene, this.zylemCamera.camera));
	}

	setupLighting(scene: Scene) {
		const ambientLight = new AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		const directionalLight = new DirectionalLight(0xffffff, 1);
		directionalLight.name = 'Light';
		directionalLight.position.set(0, 100, 0);
		directionalLight.castShadow = true;
		directionalLight.shadow.camera.near = 0.1;
		directionalLight.shadow.camera.far = 2000;
		directionalLight.shadow.mapSize.width = 1024;
		directionalLight.shadow.mapSize.height = 1024;
		scene.add(directionalLight);
	}

	setupRenderer() {
		const width = this.containerElement?.clientWidth || window.innerWidth;
		const height = this.containerElement?.clientHeight || window.innerHeight;
		const screenResolution = new Vector2(width, height);
		this.screenResolution = screenResolution;

		this.renderer = new WebGLRenderer({ antialias: false, alpha: true });
		this.renderer.setSize(screenResolution.x, screenResolution.y);
		this.composer = new EffectComposer(this.renderer);
	}

	updateRenderer(width: number, height: number) {
		this.screenResolution = new Vector2(width, height);
		this.renderer.setSize(this.screenResolution.x, this.screenResolution.y, true);
		this.composer.setSize(this.screenResolution.x, this.screenResolution.y);
	}

	add(object: Object3D, position: Vector3 = new Vector3(0, 0, 0)) {
		object.position.set(position.x, position.y, position.z);
		this.scene.add(object);
	}

	addEntity(entity: GameEntity<any>) {
		this.scene.add(entity.group);
	}

	debugScene() {
		const size = 1000;
		const divisions = 100;

		const gridHelper = new GridHelper(size, divisions);
		this.scene.add(gridHelper);
	}
}