import { Vector2, Camera, PerspectiveCamera, Vector3, Object3D, OrthographicCamera, Scene, WebGLRenderTarget, Texture, LinearFilter } from 'three';
import { PerspectiveType, Perspectives } from './perspective';
import { StageEntity } from '../interfaces/entity';
import { CameraOrbitController, CameraDebugDelegate } from './camera-debug-delegate';
import { RendererManager, DEFAULT_VIEWPORT } from './renderer-manager';
import type { ZylemRenderer, RendererType, Viewport } from './renderer-manager';
import { CameraPipeline } from './camera-pipeline';
import { createPerspective } from './perspectives';
import type { CameraContext, TransformLike, CameraPose } from './types';

// Re-export for backwards compatibility
export type { CameraDebugState, CameraDebugDelegate } from './camera-debug-delegate';
export type { RendererType, ZylemRenderer } from './renderer-manager';
export { isWebGPUSupported } from './renderer-manager';

/**
 * ZylemCamera is a lightweight camera wrapper that manages the Three.js camera,
 * the camera pose pipeline, and viewport configuration. Rendering is handled
 * by RendererManager.
 *
 * The pipeline runs: Perspective -> Behaviors -> Actions -> Smoothing -> Commit.
 * When orbit/debug controls are active, the pipeline is bypassed.
 */
export class ZylemCamera {
	/**
	 * @deprecated No longer used. Kept as null for backward compatibility
	 * with code that checks `camera.cameraRig` (e.g. scene graph insertion).
	 */
	cameraRig: Object3D | null = null;

	camera: Camera;
	screenResolution: Vector2;
	_perspective: PerspectiveType;
	frustumSize = 10;
	rendererType: RendererType;
	sceneRef: Scene | null = null;

	/** Name for camera manager lookup. */
	name: string = '';

	/**
	 * Viewport in normalized coordinates (0-1).
	 * Default is fullscreen: { x: 0, y: 0, width: 1, height: 1 }
	 */
	viewport: Viewport = { ...DEFAULT_VIEWPORT };

	/**
	 * Multiple targets for the camera to follow/frame.
	 */
	targets: StageEntity[] = [];

	/**
	 * The camera pose pipeline.
	 * Exposed so CameraWrapper can delegate addBehavior/addAction/getState.
	 */
	pipeline: CameraPipeline;

	/**
	 * Offscreen render target for render-to-texture (RTT) cameras.
	 * When set, the camera renders to this target instead of the screen viewport.
	 * Created via createRenderTarget() or automatically by setCameraFeed().
	 */
	renderTarget: WebGLRenderTarget | null = null;

	/**
	 * @deprecated Use `targets` array instead. Kept for backward compatibility.
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

	// Orbit controls
	private orbitController: CameraOrbitController | null = null;
	private _useOrbitalControls = false;

	/** When true, debug-mode orbital controls are not attached to this camera. */
	_skipDebugOrbit = false;

	/** Reference to the shared renderer manager (set during setup). */
	private _rendererManager: RendererManager | null = null;

	/** Elapsed time tracker for CameraContext. */
	private _elapsedTime = 0;

	constructor(perspective: PerspectiveType, screenResolution: Vector2, frustumSize: number = 10, rendererType: RendererType = 'webgl') {
		this._perspective = perspective;
		this.screenResolution = screenResolution;
		this.frustumSize = frustumSize;
		this.rendererType = rendererType;

		// Create Three.js camera based on perspective
		const aspectRatio = screenResolution.x / screenResolution.y;
		this.camera = this.createCameraForPerspective(aspectRatio);

		// Position camera directly (no rig)
		this.camera.position.set(0, 0, 10);
		this.camera.lookAt(new Vector3(0, 0, 0));

		// Create pipeline with the appropriate perspective implementation
		const perspectiveImpl = createPerspective(perspective);
		this.pipeline = new CameraPipeline(perspectiveImpl);
	}

	/**
	 * Setup the camera with a scene and renderer manager.
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

		// Initialize orbit controller if renderer is available
		if (this._rendererManager) {
			this.orbitController = new CameraOrbitController(
				this.camera,
				this._rendererManager.renderer.domElement,
				null // no camera rig
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
	 * Update the camera each frame.
	 *
	 * When orbit/debug controls are active, the pipeline is skipped and
	 * orbit controls manage the camera directly. Otherwise, the pipeline
	 * runs: Perspective -> Behaviors -> Actions -> Smoothing -> Commit.
	 */
	update(delta: number): void {
		// Update orbit controls (if debug mode or user orbital controls enabled)
		this.orbitController?.update();

		// Skip pipeline when orbit controls are active
		if (this.isDebugModeActive() || this._useOrbitalControls) {
			return;
		}

		// Accumulate elapsed time
		this._elapsedTime += delta;

		// Build context from current state
		const ctx = this.buildContext(delta);

		// Run the pipeline
		const finalPose = this.pipeline.run(ctx);

		// Commit the result to the Three.js camera
		this.commitPose(finalPose);
	}

	/**
	 * Check if debug mode is active (orbit controls taking over camera).
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

	// ─── Target management ──────────────────────────────────────────────────

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

	// ─── Viewport & resize ──────────────────────────────────────────────────

	/**
	 * Set the viewport for this camera (normalized 0-1 coordinates).
	 */
	setViewport(x: number, y: number, width: number, height: number): void {
		this.viewport = { x, y, width, height };
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

		if (this.camera instanceof OrthographicCamera) {
			const aspect = width / height;
			this.camera.left = this.frustumSize * aspect / -2;
			this.camera.right = this.frustumSize * aspect / 2;
			this.camera.top = this.frustumSize / 2;
			this.camera.bottom = this.frustumSize / -2;
			this.camera.updateProjectionMatrix();
		}
	}

	// ─── Render-to-texture ─────────────────────────────────────────────────

	/**
	 * Create an offscreen render target for this camera.
	 * When a render target is present, CameraManager renders this camera
	 * to the target instead of the screen viewport.
	 *
	 * @param width  Texture width in pixels (default 512)
	 * @param height Texture height in pixels (default 512)
	 */
	createRenderTarget(width: number = 512, height: number = 512): WebGLRenderTarget {
		if (this.renderTarget) {
			this.renderTarget.dispose();
		}
		this.renderTarget = new WebGLRenderTarget(width, height, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
		});
		return this.renderTarget;
	}

	/**
	 * Get the texture from the render target (for applying to a mesh material).
	 * Returns null if no render target has been created.
	 */
	getRenderTexture(): Texture | null {
		return this.renderTarget?.texture ?? null;
	}

	// ─── Lifecycle ──────────────────────────────────────────────────────────

	/**
	 * Dispose camera resources.
	 */
	destroy(): void {
		try {
			this.orbitController?.dispose();
		} catch { /* noop */ }
		try {
			this.renderTarget?.dispose();
		} catch { /* noop */ }
		this.renderTarget = null;
		this.sceneRef = null;
		this.targets = [];
		this._rendererManager = null;
	}

	// ─── Debug delegate ─────────────────────────────────────────────────────

	/**
	 * Attach a delegate to react to debug state changes.
	 * Skipped when _skipDebugOrbit is true so the pipeline always runs.
	 */
	setDebugDelegate(delegate: CameraDebugDelegate | null): void {
		if (this._skipDebugOrbit) return;
		this.orbitController?.setDebugDelegate(delegate);
	}

	// ─── Movement helpers (backward compat) ─────────────────────────────────

	/**
	 * Directly set the camera position.
	 */
	move(position: Vector3): void {
		if (this._perspective === Perspectives.Flat2D || this._perspective === Perspectives.Fixed2D) {
			this.frustumSize = position.z;
		}
		this.camera.position.set(position.x, position.y, position.z);
	}

	/**
	 * Apply incremental rotation to the camera.
	 */
	rotate(pitch: number, yaw: number, roll: number): void {
		(this.camera as Object3D).rotateX(pitch);
		(this.camera as Object3D).rotateY(yaw);
		(this.camera as Object3D).rotateZ(roll);
	}

	// ─── Renderer manager access ────────────────────────────────────────────

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

	/** @deprecated Renderer is now owned by RendererManager */
	get renderer(): any {
		return this._rendererManager?.renderer;
	}

	/** @deprecated Composer is now owned by RendererManager */
	get composer(): any {
		return this._rendererManager?.composer;
	}

	/** @deprecated Use RendererManager.setPixelRatio() instead */
	setPixelRatio(dpr: number): void {
		this._rendererManager?.setPixelRatio(dpr);
	}

	// ─── Private helpers ────────────────────────────────────────────────────

	/**
	 * Build a CameraContext from current ZylemCamera state.
	 * Converts StageEntity[] targets into Record<string, TransformLike>.
	 */
	private buildContext(delta: number): CameraContext {
		const targets: Record<string, TransformLike> = {};

		for (let i = 0; i < this.targets.length; i++) {
			const entity = this.targets[i];
			const key = i === 0 ? 'primary' : `target_${i}`;
			if (entity.group) {
				targets[key] = {
					position: entity.group.position,
					rotation: entity.group.quaternion,
				};
			}
		}

		return {
			dt: delta,
			time: this._elapsedTime,
			viewport: {
				width: this.screenResolution.x,
				height: this.screenResolution.y,
				aspect: this.screenResolution.x / this.screenResolution.y,
			},
			targets,
		};
	}

	/**
	 * Apply the final pipeline pose to the Three.js camera.
	 */
	private commitPose(pose: CameraPose): void {
		this.camera.position.copy(pose.position);

		if (pose.lookAt) {
			this.camera.lookAt(pose.lookAt);
		} else {
			this.camera.quaternion.copy(pose.rotation);
		}

		if (this.camera instanceof PerspectiveCamera) {
			if (pose.fov != null) this.camera.fov = pose.fov;
			if (pose.near != null) this.camera.near = pose.near;
			if (pose.far != null) this.camera.far = pose.far;
			this.camera.updateProjectionMatrix();
		}

		if (this.camera instanceof OrthographicCamera) {
			if (pose.zoom != null) {
				const aspect = this.screenResolution.x / this.screenResolution.y;
				const size = pose.zoom;
				this.camera.left = -size * aspect / 2;
				this.camera.right = size * aspect / 2;
				this.camera.top = size / 2;
				this.camera.bottom = -size / 2;
			}
			if (pose.near != null) this.camera.near = pose.near;
			if (pose.far != null) this.camera.far = pose.far;
			this.camera.updateProjectionMatrix();
		}
	}

	/**
	 * Create a Three.js camera based on perspective type.
	 */
	private createCameraForPerspective(aspectRatio: number): Camera {
		switch (this._perspective) {
			case Perspectives.ThirdPerson:
				return new PerspectiveCamera(75, aspectRatio, 0.1, 1000);
			case Perspectives.FirstPerson:
				return new PerspectiveCamera(75, aspectRatio, 0.1, 1000);
			case Perspectives.Isometric:
				return new OrthographicCamera(
					this.frustumSize * aspectRatio / -2,
					this.frustumSize * aspectRatio / 2,
					this.frustumSize / 2,
					this.frustumSize / -2,
					1, 1000
				);
			case Perspectives.Flat2D:
			case Perspectives.Fixed2D:
				return new OrthographicCamera(
					this.frustumSize * aspectRatio / -2,
					this.frustumSize * aspectRatio / 2,
					this.frustumSize / 2,
					this.frustumSize / -2,
					1, 1000
				);
			default:
				return new PerspectiveCamera(75, aspectRatio, 0.1, 1000);
		}
	}
}
