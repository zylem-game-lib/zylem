import { Vector2, Camera, PerspectiveCamera, Vector3, Object3D, OrthographicCamera, WebGLRenderer, Scene } from 'three';
import { PerspectiveType, Perspectives } from './perspective';
import { ThirdPersonCamera } from './third-person';
import { Fixed2DCamera } from './fixed-2d';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import RenderPass from '../graphics/render-pass';
import { StageEntity } from '../interfaces/entity';
import { CameraOrbitController, CameraDebugDelegate } from './camera-debug-delegate';

// Re-export for backwards compatibility
export type { CameraDebugState, CameraDebugDelegate } from './camera-debug-delegate';

/**
 * Interface for perspective-specific camera controllers
 */
export interface PerspectiveController {
	setup(params: { screenResolution: Vector2; renderer: WebGLRenderer; scene: Scene; camera: ZylemCamera }): void;
	update(delta: number): void;
	resize(width: number, height: number): void;
}

export class ZylemCamera {
	cameraRig: Object3D | null = null;
	camera: Camera;
	screenResolution: Vector2;
	renderer: WebGLRenderer;
	composer: EffectComposer;
	_perspective: PerspectiveType;
	target: StageEntity | null = null;
	sceneRef: Scene | null = null;
	frustumSize = 10;

	// Perspective controller delegation
	perspectiveController: PerspectiveController | null = null;

	// Debug/orbit controls delegation
	private orbitController: CameraOrbitController | null = null;

	constructor(perspective: PerspectiveType, screenResolution: Vector2, frustumSize: number = 10) {
		this._perspective = perspective;
		this.screenResolution = screenResolution;
		this.frustumSize = frustumSize;
		// Initialize renderer
		this.renderer = new WebGLRenderer({ antialias: false, alpha: true });
		this.renderer.setSize(screenResolution.x, screenResolution.y);
		this.renderer.shadowMap.enabled = true;

		// Initialize composer
		this.composer = new EffectComposer(this.renderer);

		// Create camera based on perspective
		const aspectRatio = screenResolution.x / screenResolution.y;
		this.camera = this.createCameraForPerspective(aspectRatio);

		// Setup camera rig only for perspectives that need it (e.g., third-person following)
		if (this.needsRig()) {
			this.cameraRig = new Object3D();
			this.cameraRig.position.set(0, 3, 10);
			this.cameraRig.add(this.camera);
			this.camera.lookAt(new Vector3(0, 2, 0));
		} else {
			// Position camera directly for non-rig perspectives
			this.camera.position.set(0, 0, 10);
			this.camera.lookAt(new Vector3(0, 0, 0));
		}

		// Initialize perspective controller
		this.initializePerspectiveController();

		// Initialize orbit controller (handles debug mode orbit controls)
		this.orbitController = new CameraOrbitController(this.camera, this.renderer.domElement, this.cameraRig);
	}

	/**
	 * Setup the camera with a scene
	 */
	async setup(scene: Scene) {
		this.sceneRef = scene;

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

		// Set scene reference for orbit controller (needed for camera rig detachment)
		this.orbitController?.setScene(scene);

		// Start render loop
		this.renderer.setAnimationLoop((delta) => {
			this.update(delta || 0);
		});
	}

	/**
	 * Update camera and render
	 */
	update(delta: number) {
		// Update orbit controls (if debug mode is enabled)
		this.orbitController?.update();

		// Skip perspective controller updates when in debug mode
		// This keeps the debug camera isolated from game camera logic
		if (this.perspectiveController && !this.isDebugModeActive()) {
			this.perspectiveController.update(delta);
		}

		// Render the scene
		this.composer.render(delta);
	}

	/**
	 * Check if debug mode is active (orbit controls taking over camera)
	 */
	isDebugModeActive(): boolean {
		return this.orbitController?.isActive ?? false;
	}

	/**
	 * Dispose renderer, composer, controls, and detach from scene
	 */
	destroy() {
		try {
			this.renderer.setAnimationLoop(null as any);
		} catch { /* noop */ }
		try {
			this.orbitController?.dispose();
		} catch { /* noop */ }
		try {
			this.composer?.passes?.forEach((p: any) => p.dispose?.());
			// @ts-ignore dispose exists on EffectComposer but not typed here
			this.composer?.dispose?.();
		} catch { /* noop */ }
		try {
			this.renderer.dispose();
		} catch { /* noop */ }
		this.sceneRef = null;
	}

	/**
	 * Attach a delegate to react to debug state changes.
	 */
	setDebugDelegate(delegate: CameraDebugDelegate | null) {
		this.orbitController?.setDebugDelegate(delegate);
	}

	/**
	 * Resize camera and renderer
	 */
	resize(width: number, height: number) {
		this.screenResolution.set(width, height);
		this.renderer.setSize(width, height, false);
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
	 * Update renderer pixel ratio (DPR)
	 */
	setPixelRatio(dpr: number) {
		const safe = Math.max(1, Number.isFinite(dpr) ? dpr : 1);
		this.renderer.setPixelRatio(safe);
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
		return new OrthographicCamera(
			this.frustumSize * aspectRatio / -2,
			this.frustumSize * aspectRatio / 2,
			this.frustumSize / 2,
			this.frustumSize / -2,
			1,
			1000
		);
	}

	private createFlat2DCamera(aspectRatio: number): OrthographicCamera {
		return new OrthographicCamera(
			this.frustumSize * aspectRatio / -2,
			this.frustumSize * aspectRatio / 2,
			this.frustumSize / 2,
			this.frustumSize / -2,
			1,
			1000
		);
	}

	private createFixed2DCamera(aspectRatio: number): OrthographicCamera {
		return this.createFlat2DCamera(aspectRatio);
	}

	// Movement methods
	private moveCamera(position: Vector3) {
		if (this._perspective === Perspectives.Flat2D || this._perspective === Perspectives.Fixed2D) {
			this.frustumSize = position.z;
		}
		if (this.cameraRig) {
			this.cameraRig.position.set(position.x, position.y, position.z);
		} else {
			this.camera.position.set(position.x, position.y, position.z);
		}
	}

	move(position: Vector3) {
		this.moveCamera(position);
	}

	rotate(pitch: number, yaw: number, roll: number) {
		if (this.cameraRig) {
			this.cameraRig.rotateX(pitch);
			this.cameraRig.rotateY(yaw);
			this.cameraRig.rotateZ(roll);
		} else {
			(this.camera as Object3D).rotateX(pitch);
			(this.camera as Object3D).rotateY(yaw);
			(this.camera as Object3D).rotateZ(roll);
		}
	}

	/**
	 * Check if this perspective type needs a camera rig
	 */
	private needsRig(): boolean {
		return this._perspective === Perspectives.ThirdPerson;
	}

	/**
	 * Get the DOM element for the renderer
	 */
	getDomElement(): HTMLCanvasElement {
		return this.renderer.domElement;
	}
}