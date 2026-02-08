import { Vector2, Vector3 } from "three";
import { PerspectiveType } from "./perspective";
import { ZylemCamera } from "./zylem-camera";
import { RendererType, Viewport, DEFAULT_VIEWPORT } from "./renderer-manager";
import { StageEntity } from "../interfaces/entity";

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
}

/**
 * CameraWrapper is the user-facing camera handle returned by createCamera().
 * It provides convenience methods for target management, orbital controls, and viewport configuration.
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

	// Set viewport if provided
	if (options.viewport) {
		zylemCamera.viewport = { ...options.viewport };
	}

	// Configure orbital controls
	if (options.useOrbitalControls) {
		// Mark for enablement -- actual OrbitControls are created during setup()
		// when the renderer DOM element is available
		(zylemCamera as any)._useOrbitalControls = true;
	}

	return new CameraWrapper(zylemCamera);
}
