import { Vector2, Vector3, Texture } from "three";
import { PerspectiveType } from "./perspective";
import { ZylemCamera } from "./zylem-camera";
import { RendererType, Viewport, DEFAULT_VIEWPORT } from "./renderer-manager";
import { StageEntity } from "../interfaces/entity";
import type { CameraBehavior, CameraAction, CameraPerspective, CameraPipelineState } from "./types";
import { createPerspective } from "./perspectives";
import type { PerspectiveOptions } from "./perspectives";

export interface CameraOptions {
	perspective?: PerspectiveType;
	position?: Vector3 | { x: number; y: number; z: number };
	target?: Vector3 | { x: number; y: number; z: number } | any;
	zoom?: number;
	screenResolution?: Vector2;
	/**
	 * Renderer type: 'auto' | 'webgpu' | 'webgl'
	 * Use 'webgpu' for TSL shaders
	 * @default 'webgl'
	 */
	rendererType?: RendererType;
	/**
	 * Enable orbital controls for this camera.
	 * Can be toggled at runtime via enableOrbitalControls() / disableOrbitalControls().
	 * @default false
	 */
	useOrbitalControls?: boolean;
	/**
	 * Viewport in normalized coordinates (0-1).
	 * Defines where this camera renders on the canvas.
	 * @default { x: 0, y: 0, width: 1, height: 1 } (fullscreen)
	 */
	viewport?: Viewport;
	/**
	 * Optional name for camera manager lookup.
	 */
	name?: string;
	/**
	 * Initial behaviors to attach to the camera pipeline.
	 * Keys are used for idempotent add/remove.
	 */
	behaviors?: Record<string, CameraBehavior>;
	/**
	 * Pipeline smoothing factor (0-1).
	 * 1 = instant snap, 0 = no movement.
	 * @default 0.15
	 */
	damping?: number;
	/**
	 * When set, the camera renders to an offscreen texture instead of a
	 * screen viewport. Use with setCameraFeed() to display the feed on
	 * an in-scene mesh (jumbotron, security monitor, portal, etc.).
	 *
	 * @default undefined (renders to screen)
	 */
	renderToTexture?: {
		/** Texture width in pixels. @default 512 */
		width?: number;
		/** Texture height in pixels. @default 512 */
		height?: number;
	};
	/**
	 * When true, this camera will not activate orbital controls in debug mode.
	 * The pipeline (and its behaviors) will always run for this camera.
	 * Use for cameras with custom behaviors (e.g. FPS mouse-look) that must
	 * control the camera through the pipeline rather than debug orbit controls.
	 * @default false
	 */
	skipDebugOrbit?: boolean;
}

/**
 * CameraWrapper is the user-facing camera handle returned by createCamera().
 * It provides convenience methods for target management, orbital controls,
 * viewport configuration, and the camera pose pipeline.
 */
export class CameraWrapper {
	cameraRef: ZylemCamera;

	constructor(camera: ZylemCamera) {
		this.cameraRef = camera;
	}

	// ─── Target management ──────────────────────────────────────────────────

	/**
	 * Add a target entity for the camera to follow/frame.
	 * With multiple targets, the camera auto-frames to include all of them.
	 */
	addTarget(entity: StageEntity): void {
		this.cameraRef.addTarget(entity);
	}

	/**
	 * Remove a target entity from the camera.
	 */
	removeTarget(entity: StageEntity): void {
		this.cameraRef.removeTarget(entity);
	}

	/**
	 * Clear all targets. Camera will look at world origin.
	 */
	clearTargets(): void {
		this.cameraRef.clearTargets();
	}

	// ─── Orbital controls ───────────────────────────────────────────────────

	/**
	 * Enable orbital controls for this camera.
	 * Allows the user to orbit, pan, and zoom the camera.
	 */
	enableOrbitalControls(): void {
		this.cameraRef.enableOrbitalControls();
	}

	/**
	 * Disable orbital controls for this camera.
	 */
	disableOrbitalControls(): void {
		this.cameraRef.disableOrbitalControls();
	}

	// ─── Viewport ───────────────────────────────────────────────────────────

	/**
	 * Set the viewport for this camera (normalized 0-1 coordinates).
	 * @param x Left edge (0 = left of canvas)
	 * @param y Bottom edge (0 = bottom of canvas)
	 * @param width Width as fraction of canvas
	 * @param height Height as fraction of canvas
	 */
	setViewport(x: number, y: number, width: number, height: number): void {
		this.cameraRef.setViewport(x, y, width, height);
	}

	// ─── Pipeline: Behaviors ────────────────────────────────────────────────

	/**
	 * Add or replace a behavior by key (idempotent).
	 * Behaviors modify the desired camera pose each frame.
	 *
	 * @param key   Unique key for this behavior (used for replacement/removal).
	 * @param behavior  The CameraBehavior implementation.
	 */
	addBehavior(key: string, behavior: CameraBehavior): void {
		this.cameraRef.pipeline.addBehavior(key, behavior);
	}

	/**
	 * Remove a behavior by key.
	 */
	removeBehavior(key: string): boolean {
		return this.cameraRef.pipeline.removeBehavior(key);
	}

	// ─── Pipeline: Actions ──────────────────────────────────────────────────

	/**
	 * Add a transient action (screenshake, recoil, etc.).
	 * Actions apply additive deltas and self-expire when isDone() returns true.
	 */
	addAction(action: CameraAction): void {
		this.cameraRef.pipeline.addAction(action);
	}

	// ─── Pipeline: Perspective ──────────────────────────────────────────────

	/**
	 * Switch the camera's active perspective at runtime.
	 * The first frame after switching snaps to the new pose (no lerp).
	 *
	 * @param type     Perspective type string (e.g. Perspectives.ThirdPerson).
	 * @param options  Perspective-specific options (distance, height, zoom, etc.).
	 */
	setPerspective(type: PerspectiveType, options?: PerspectiveOptions): void {
		this.cameraRef.pipeline.setPerspective(createPerspective(type, options));
	}

	/**
	 * Retrieve the active perspective instance, cast to the desired type.
	 * Useful for calling perspective-specific methods (e.g. FirstPersonPerspective.look()).
	 *
	 * @example
	 * const fps = camera.getPerspective<FirstPersonPerspective>();
	 * fps.look(dx, dy);
	 */
	getPerspective<T extends CameraPerspective = CameraPerspective>(): T {
		return this.cameraRef.pipeline.perspective as T;
	}

	// ─── Pipeline: Debug state ──────────────────────────────────────────────

	/**
	 * Return a debug snapshot of the camera pipeline state.
	 * Includes: active perspective, desired/final pose, behavior keys, action count.
	 */
	getState(): CameraPipelineState {
		return this.cameraRef.pipeline.getState();
	}

	// ─── Render-to-texture ─────────────────────────────────────────────────

	/**
	 * Get the offscreen render texture for this camera.
	 * Returns null if the camera was not created with renderToTexture.
	 * Use with setCameraFeed() or apply directly to a mesh material.
	 */
	getRenderTexture(): Texture | null {
		return this.cameraRef.getRenderTexture();
	}
}

/**
 * Create a camera with the given options.
 * Returns a CameraWrapper for convenient access to camera features.
 */
export function createCamera(options: CameraOptions): CameraWrapper {
	const screenResolution = options.screenResolution || new Vector2(window.innerWidth, window.innerHeight);
	let frustumSize = 10;
	if (options.perspective === 'fixed-2d') {
		frustumSize = options.zoom || 10;
	}
	const zylemCamera = new ZylemCamera(
		options.perspective || 'third-person',
		screenResolution,
		frustumSize,
		options.rendererType || 'webgl'
	);

	// Set camera name if provided
	if (options.name) {
		zylemCamera.name = options.name;
	}

	// Set initial position and target
	const position = options.position 
		? (options.position instanceof Vector3 ? options.position : new Vector3(options.position.x, options.position.y, options.position.z))
		: new Vector3(0, 0, 0);
	
	const target = options.target
		? (options.target instanceof Vector3 ? options.target : new Vector3(options.target.x, options.target.y, options.target.z))
		: new Vector3(0, 0, 0);
	
	zylemCamera.move(position);
	zylemCamera.camera.lookAt(target);

	// Reconfigure the perspective with user-specified options (position, zoom, etc.)
	// so the pipeline produces the correct base pose from the first frame.
	const perspType = options.perspective || 'third-person';
	if (perspType === 'fixed-2d' || perspType === 'flat-2d') {
		zylemCamera.pipeline.setPerspective(
			createPerspective(perspType, { zoom: frustumSize })
		);
	} else {
		zylemCamera.pipeline.setPerspective(
			createPerspective(perspType, {
				initialPosition: position.clone(),
				initialLookAt: target.clone(),
			})
		);
	}

	// Set viewport if provided
	if (options.viewport) {
		zylemCamera.viewport = { ...options.viewport };
	}

	// Configure orbital controls
	if (options.useOrbitalControls) {
		(zylemCamera as any)._useOrbitalControls = true;
	}

	// Opt out of debug-mode orbital controls
	if (options.skipDebugOrbit) {
		zylemCamera._skipDebugOrbit = true;
	}

	// Configure pipeline damping
	if (options.damping != null) {
		zylemCamera.pipeline.damping = options.damping;
	}

	// Attach initial behaviors
	if (options.behaviors) {
		for (const [key, behavior] of Object.entries(options.behaviors)) {
			zylemCamera.pipeline.addBehavior(key, behavior);
		}
	}

	// Create render target for RTT cameras
	if (options.renderToTexture) {
		const { width = 512, height = 512 } = options.renderToTexture;
		zylemCamera.createRenderTarget(width, height);
	}

	return new CameraWrapper(zylemCamera);
}
