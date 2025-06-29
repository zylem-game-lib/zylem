import { Vector2, Camera, PerspectiveCamera, Vector3, Object3D, OrthographicCamera, WebGLRenderer, Scene } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PerspectiveType, Perspectives } from './perspective';
import { ThirdPersonCamera } from './third-person';
import { Fixed2DCamera } from './fixed-2d';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import RenderPass from '../graphics/render-pass';
import { StageEntity } from '../interfaces/entity';

const zModifier = 50;

/**
 * Interface for perspective-specific camera controllers
 */
export interface PerspectiveController {
	setup(params: { screenResolution: Vector2; renderer: WebGLRenderer; scene: Scene; camera: ZylemCamera }): void;
	update(delta: number): void;
	resize(width: number, height: number): void;
}

export class ZylemCamera {
	cameraRig: Object3D;
	camera: Camera;
	screenResolution: Vector2;
	renderer: WebGLRenderer;
	composer: EffectComposer;
	_perspective: PerspectiveType;
	orbitControls: OrbitControls | null = null;
	target: StageEntity | null = null;
	sceneRef: Scene | null = null;

	// Perspective controller delegation
	perspectiveController: PerspectiveController | null = null;

	constructor(perspective: PerspectiveType, screenResolution: Vector2) {
		this._perspective = perspective;
		this.screenResolution = screenResolution;

		// Initialize renderer
		this.renderer = new WebGLRenderer({ antialias: false, alpha: true });
		this.renderer.setSize(screenResolution.x, screenResolution.y);
		this.renderer.shadowMap.enabled = true;

		// Initialize composer
		this.composer = new EffectComposer(this.renderer);

		// Create camera based on perspective
		const aspectRatio = screenResolution.x / screenResolution.y;
		this.camera = this.createCameraForPerspective(aspectRatio);

		// Setup camera rig
		this.cameraRig = new Object3D();
		this.cameraRig.position.set(0, 3, 10);
		this.cameraRig.add(this.camera);
		this.camera.lookAt(new Vector3(0, 2, 0));

		// Initialize perspective controller
		this.initializePerspectiveController();
	}

	/**
	 * Setup the camera with a scene
	 */
	async setup(scene: Scene) {
		this.sceneRef = scene;

		// Setup orbit controls
		if (this.orbitControls === null) {
			this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
			this.orbitControls.enableDamping = true;
			this.orbitControls.dampingFactor = 0.05;
			this.orbitControls.screenSpacePanning = false;
			this.orbitControls.minDistance = 1;
			this.orbitControls.maxDistance = 500;
			this.orbitControls.maxPolarAngle = Math.PI / 2;
		}

		// Setup render pass
		let renderResolution = this.screenResolution.clone().divideScalar(2);
		renderResolution.x |= 0;
		renderResolution.y |= 0;
		const pass = new RenderPass(renderResolution, scene, this.camera);
		this.composer.addPass(pass);

		// Setup perspective controller
		if (this.perspectiveController) {
			this.perspectiveController.setup({
				screenResolution: this.screenResolution,
				renderer: this.renderer,
				scene: scene,
				camera: this
			});
		}

		// Start render loop
		this.renderer.setAnimationLoop((delta) => {
			this.update(delta || 0);
		});
	}

	/**
	 * Update camera and render
	 */
	update(delta: number) {
		this.orbitControls?.update();

		// Delegate to perspective controller
		if (this.perspectiveController) {
			this.perspectiveController.update(delta);
		}

		// Render the scene
		this.composer.render(delta);
	}

	/**
	 * Resize camera and renderer
	 */
	resize(width: number, height: number) {
		this.screenResolution.set(width, height);
		this.renderer.setSize(width, height, true);
		this.composer.setSize(width, height);

		if (this.camera instanceof PerspectiveCamera) {
			this.camera.aspect = width / height;
			this.camera.updateProjectionMatrix();
		}

		if (this.perspectiveController) {
			this.perspectiveController.resize(width, height);
		}
	}

	/**
	 * Create camera based on perspective type
	 */
	private createCameraForPerspective(aspectRatio: number): Camera {
		switch (this._perspective) {
			case Perspectives.ThirdPerson:
				return this.createThirdPersonCamera(aspectRatio);
			case Perspectives.FirstPerson:
				return this.createFirstPersonCamera(aspectRatio);
			case Perspectives.Isometric:
				return this.createIsometricCamera(aspectRatio);
			case Perspectives.Flat2D:
				return this.createFlat2DCamera(aspectRatio);
			case Perspectives.Fixed2D:
				return this.createFixed2DCamera(aspectRatio);
			default:
				return this.createThirdPersonCamera(aspectRatio);
		}
	}

	/**
	 * Initialize perspective-specific controller
	 */
	private initializePerspectiveController() {
		switch (this._perspective) {
			case Perspectives.ThirdPerson:
				this.perspectiveController = new ThirdPersonCamera();
				break;
			case Perspectives.Fixed2D:
				this.perspectiveController = new Fixed2DCamera();
				break;
			default:
				this.perspectiveController = new ThirdPersonCamera();
		}
	}

	private createThirdPersonCamera(aspectRatio: number): PerspectiveCamera {
		return new PerspectiveCamera(75, aspectRatio, 0.1, 1000);
	}

	private createFirstPersonCamera(aspectRatio: number): PerspectiveCamera {
		return new PerspectiveCamera(75, aspectRatio, 0.1, 1000);
	}

	private createIsometricCamera(aspectRatio: number): OrthographicCamera {
		const frustumSize = 20;
		return new OrthographicCamera(
			frustumSize * aspectRatio / -2,
			frustumSize * aspectRatio / 2,
			frustumSize / 2,
			frustumSize / -2,
			1,
			1000
		);
	}

	private createFlat2DCamera(aspectRatio: number): OrthographicCamera {
		const frustumSize = 10;
		return new OrthographicCamera(
			frustumSize * aspectRatio / -2,
			frustumSize * aspectRatio / 2,
			frustumSize / 2,
			frustumSize / -2,
			1,
			1000
		);
	}

	private createFixed2DCamera(aspectRatio: number): OrthographicCamera {
		return this.createFlat2DCamera(aspectRatio);
	}

	// Movement methods
	private moveCamera(position: Vector3) {
		const adjustedZ = (this._perspective !== Perspectives.Flat2D) ? position.z + zModifier : position.z;
		this.cameraRig.position.set(position.x, position.y, adjustedZ);
	}

	move(position: Vector3) {
		this.moveCamera(position);
	}

	rotate(pitch: number, yaw: number, roll: number) {
		this.cameraRig.rotateX(pitch);
		this.cameraRig.rotateY(yaw);
		this.cameraRig.rotateZ(roll);
	}

	/**
	 * Get the DOM element for the renderer
	 */
	getDomElement(): HTMLCanvasElement {
		return this.renderer.domElement;
	}
}