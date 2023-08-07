import {
	Scene,
	Color,
	Vector2,
	WebGLRenderer,
	AmbientLight,
	DirectionalLight,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ZylemCamera } from './ZylemCamera';
import RenderPass from './rendering/RenderPass';
import { Entity, GameEntity } from '@interfaces/Entity';
import { StageState } from '@/state';

export class ZylemScene implements Entity<ZylemScene> {
	_type = 'Scene';
	scene!: Scene;
	screenResolution!: Vector2;
	renderer!: WebGLRenderer;
	composer!: EffectComposer;
	zylemCamera!: ZylemCamera;

	constructor(id: string) {
		const scene = new Scene();
		scene.background = new Color(StageState.state.backgroundColor);

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
		element.appendChild(this.renderer.domElement);
	}

	setup() { }

	destroy() { }

	update(delta: number) {
		this.composer.render(delta);
	}

	setupCamera(scene: Scene) {
		this.zylemCamera = new ZylemCamera(this.screenResolution);
		let renderResolution = this.screenResolution.clone().divideScalar(2);
		renderResolution.x |= 0;
		renderResolution.y |= 0;
		scene.add(this.zylemCamera.cameraRig);
		this.composer.addPass(new RenderPass(renderResolution, scene, this.zylemCamera.camera));
	}

	setupLighting(scene: Scene) {
		const ambientLight = new AmbientLight(0xffffff, 0.8);
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
		const screenResolution = new Vector2(window.innerWidth, window.innerHeight);
		this.screenResolution = screenResolution;

		this.renderer = new WebGLRenderer({ antialias: false });
		this.renderer.setSize(screenResolution.x, screenResolution.y);
		this.composer = new EffectComposer(this.renderer);
	}

	addEntity(entity: GameEntity<any>) {
		this.scene.add(entity.mesh);
	}
}