import { Vector2, Camera, PerspectiveCamera, Vector3, Object3D, OrthographicCamera, Scene } from 'three';
import { PerspectiveType, Perspectives } from './perspective';
import { ThirdPersonCamera } from './third-person';
import { Fixed2DCamera } from './fixed-2d';
import { StageEntity } from '../interfaces/entity';
import { CameraOrbitController, CameraDebugDelegate } from './camera-debug-delegate';
import { RendererManager, DEFAULT_VIEWPORT } from './renderer-manager';
import type { ZylemRenderer, RendererType, Viewport } from './renderer-manager';

// Re-export for backwards compatibility
export type { CameraDebugState, CameraDebugDelegate } from './camera-debug-delegate';
export type { RendererType, ZylemRenderer } from './renderer-manager';
export { isWebGPUSupported } from './renderer-manager';

/**
 * Interface for perspective-specific camera controllers
 */
export interface PerspectiveController {
	setup(params: { screenResolution: Vector2; renderer: ZylemRenderer; scene: Scene; camera: ZylemCamera }): void;
	update(delta: number): void;
	resize(width: number, height: number): void;
}

/**
 * ZylemCamera is a lightweight camera wrapper that manages the Three.js camera,
 * perspective controller, and viewport configuration. It no longer owns a renderer;
 * rendering is handled by RendererManager.
 */
export class ZylemCamera {
	cameraRig: Object3D | null = null;
	camera: Camera;
	screenResolution: Vector2;
	_perspective: PerspectiveType;
	frustumSize = 10;
	rendererType: RendererType;
	sceneRef: Scene | null = null;

	/** Name for camera manager lookup */
	name: string = '';

	/**
	 * Viewport in normalized coordinates (0-1).
	 * Default is fullscreen: { x: 0, y: 0, width: 1, height: 1 }
	 */
	viewport: Viewport = { ...DEFAULT_VIEWPORT };

	/**
	 * Multiple targets for the camera to follow/frame.
	 * Replaces the old single `target` property.
	 */
	targets: StageEntity[] = [];

	/**
	 * @deprecated Use `targets` array instead. This getter/setter is kept for backward compatibility.
	 */
	get target(): StageEntity | null {
		return this.targets.length > 0 ? this.targets[0] : null;
	}

	set target(entity: StageEntity | null) {
		if (entity) {
			if (this.targets.length === 0) {
				this.targets.push(entity);
			} else {
				this.targets[0] = entity;
			}
		} else {
			this.targets = [];
		}
	}

	// Perspective controller delegation
	perspectiveController: PerspectiveController | null = null;

	// Orbit controls
	private orbitController: CameraOrbitController | null = null;
	private _useOrbitalControls = false;

	/** Reference to the shared renderer manager (set during setup) */
	private _rendererManager: RendererManager | null = null;

	constructor(perspective: PerspectiveType, screenResolution: Vector2, frustumSize: number = 10, rendererType: RendererType = 'webgl') {
		this._perspective = perspective;
		this.screenResolution = screenResolution;
		this.frustumSize = frustumSize;
		this.rendererType = rendererType;

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
	}

	/**
	 * Setup the camera with a scene and renderer manager.
	 * The renderer manager provides shared rendering infrastructure.
	 */
	async setup(scene: Scene, rendererManager?: RendererManager): Promise<void> {
		this.sceneRef = scene;

		if (rendererManager) {
			this._rendererManager = rendererManager;
		}

		// Ensure renderer manager is initialized
		if (this._rendererManager && !this._rendererManager.initialized) {
			await this._rendererManager.initRenderer();
		}

		// Setup perspective controller
		if (this.perspectiveController && this._rendererManager) {
			this.perspectiveController.setup({
				screenResolution: this.screenResolution,
				renderer: this._rendererManager.renderer,
				scene: scene,
				camera: this
			});
		}

		// Initialize orbit controller if renderer is available
		if (this._rendererManager) {
			this.orbitController = new CameraOrbitController(
				this.camera,
				this._rendererManager.renderer.domElement,
				this.cameraRig
			);
			this.orbitController.setScene(scene);

			// If orbital controls were requested, enable them
			if (this._useOrbitalControls) {
				this.orbitController.enableUserOrbitControls();
			}
		}
	}

	/**
	 * Legacy setup method for backward compatibility.
	 * Creates a temporary RendererManager internally.
	 * @deprecated Use setup(scene, rendererManager) instead.
	 */
	async setupLegacy(scene: Scene): Promise<void> {
		if (!this._rendererManager) {
			this._rendererManager = new RendererManager(this.screenResolution, this.rendererType);
			await this._rendererManager.initRenderer();

			// Setup render pass for WebGL
			this._rendererManager.setupRenderPass(scene, this.camera);

			// Start render loop
			this._rendererManager.startRenderLoop((delta) => {
				this.update(delta);
				if (this._rendererManager && this.sceneRef) {
					this._rendererManager.render(this.sceneRef, this.camera);
				}
			});
		}

		await this.setup(scene, this._rendererManager);
	}

	/**
	 * Update camera controllers (called each frame).
	 * Does NOT render -- rendering is handled by RendererManager.
	 */
	update(delta: number): void {
		// Update orbit controls (if debug mode or user orbital controls enabled)
		this.orbitController?.update();

		// Skip perspective controller updates when orbit controls are active
		if (this.perspectiveController && !this.isDebugModeActive() && !this._useOrbitalControls) {
			this.perspectiveController.update(delta);
		}
	}

	/**
	 * Check if debug mode is active (orbit controls taking over camera)
	 */
	isDebugModeActive(): boolean {
		return this.orbitController?.isActive ?? false;
	}

	/**
	 * Enable user-configured orbital controls (not debug mode).
	 */
	enableOrbitalControls(): void {
		this._useOrbitalControls = true;
		this.orbitController?.enableUserOrbitControls();
	}

	/**
	 * Disable user-configured orbital controls.
	 */
	disableOrbitalControls(): void {
		this._useOrbitalControls = false;
		this.orbitController?.disableUserOrbitControls();
	}

	/**
	 * Whether user orbital controls are enabled.
	 */
	get useOrbitalControls(): boolean {
		return this._useOrbitalControls;
	}

	/**
	 * Add a target entity for the camera to follow/frame.
	 */
	addTarget(entity: StageEntity): void {
		if (!this.targets.includes(entity)) {
			this.targets.push(entity);
		}
	}

	/**
	 * Remove a target entity.
	 */
	removeTarget(entity: StageEntity): void {
		const index = this.targets.indexOf(entity);
		if (index !== -1) {
			this.targets.splice(index, 1);
		}
	}

	/**
	 * Clear all targets.
	 */
	clearTargets(): void {
		this.targets = [];
	}

	/**
	 * Dispose camera resources (not the renderer -- that's managed by RendererManager).
	 */
	destroy(): void {
		try {
			this.orbitController?.dispose();
		} catch { /* noop */ }
		this.sceneRef = null;
		this.targets = [];
		this._rendererManager = null;
	}

	/**
	 * Attach a delegate to react to debug state changes.
	 */
	setDebugDelegate(delegate: CameraDebugDelegate | null): void {
		this.orbitController?.setDebugDelegate(delegate);
	}

	/**
	 * Resize camera projection.
	 */
	resize(width: number, height: number): void {
		this.screenResolution.set(width, height);

		if (this.camera instanceof PerspectiveCamera) {
			this.camera.aspect = width / height;
			this.camera.updateProjectionMatrix();
		}

		if (this.perspectiveController) {
			this.perspectiveController.resize(width, height);
		}
	}

	/**
	 * Set the viewport for this camera (normalized 0-1 coordinates).
	 */
	setViewport(x: number, y: number, width: number, height: number): void {
		this.viewport = { x, y, width, height };
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
	private initializePerspectiveController(): void {
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
	private moveCamera(position: Vector3): void {
		if (this._perspective === Perspectives.Flat2D || this._perspective === Perspectives.Fixed2D) {
			this.frustumSize = position.z;
		}
		if (this.cameraRig) {
			this.cameraRig.position.set(position.x, position.y, position.z);
		} else {
			this.camera.position.set(position.x, position.y, position.z);
		}
	}

	move(position: Vector3): void {
		this.moveCamera(position);
	}

	rotate(pitch: number, yaw: number, roll: number): void {
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
	 * Get the DOM element for the renderer.
	 * @deprecated Access via RendererManager instead.
	 */
	getDomElement(): HTMLCanvasElement {
		if (this._rendererManager) {
			return this._rendererManager.getDomElement();
		}
		throw new Error('ZylemCamera: No renderer manager available. Call setup() first.');
	}

	/**
	 * Get the renderer manager reference.
	 */
	getRendererManager(): RendererManager | null {
		return this._rendererManager;
	}

	/**
	 * Set the renderer manager reference (used by CameraManager during setup).
	 */
	setRendererManager(manager: RendererManager): void {
		this._rendererManager = manager;
	}

	// ─── Legacy compatibility methods ────────────────────────────────────────

	/**
	 * @deprecated Renderer is now owned by RendererManager
	 */
	get renderer(): any {
		return this._rendererManager?.renderer;
	}

	/**
	 * @deprecated Composer is now owned by RendererManager
	 */
	get composer(): any {
		return this._rendererManager?.composer;
	}

	/**
	 * @deprecated Use RendererManager.setPixelRatio() instead
	 */
	setPixelRatio(dpr: number): void {
		this._rendererManager?.setPixelRatio(dpr);
	}
}
