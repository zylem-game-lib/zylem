import { Vector2, Scene } from 'three';
import { ZylemCamera } from './zylem-camera';
import { RendererManager } from './renderer-manager';
import { Perspectives } from './perspective';
import { nanoid } from 'nanoid';

/**
 * CameraManager orchestrates multiple cameras per stage.
 *
 * Responsibilities:
 * - Named camera registry (add/remove/get by name or reference)
 * - Active camera list management (determines which cameras render)
 * - Always-available debug camera with orbit controls
 * - Per-frame update of all active cameras' perspective controllers
 * - Coordinating rendering via RendererManager for all active viewports
 */
export class CameraManager {
	/** Named camera registry */
	private cameras: Map<string, ZylemCamera> = new Map();

	/** Currently active cameras, ordered by render layer (first = bottom) */
	private _activeCameras: ZylemCamera[] = [];

	/** Auto-created debug camera with orbit controls */
	private _debugCamera: ZylemCamera | null = null;

	/** Reference to the shared renderer manager */
	private _rendererManager: RendererManager | null = null;

	/** Scene reference */
	private _sceneRef: Scene | null = null;

	/** Counter for auto-generated camera names */
	private _autoNameCounter = 0;

	constructor() {
		// Debug camera is created lazily during setup when we have screen resolution
	}

	/**
	 * Get the list of currently active cameras.
	 */
	get activeCameras(): ReadonlyArray<ZylemCamera> {
		return this._activeCameras;
	}

	/**
	 * Get the primary active camera (first in the active list).
	 */
	get primaryCamera(): ZylemCamera | null {
		return this._activeCameras.length > 0 ? this._activeCameras[0] : null;
	}

	/**
	 * Get the debug camera.
	 */
	get debugCamera(): ZylemCamera | null {
		return this._debugCamera;
	}

	/**
	 * Get all registered cameras.
	 */
	get allCameras(): ReadonlyArray<ZylemCamera> {
		return Array.from(this.cameras.values());
	}

	/**
	 * Add a camera to the manager.
	 * If no name is provided, one is auto-generated.
	 * The first camera added becomes the active camera.
	 *
	 * @param camera The ZylemCamera instance to add
	 * @param name Optional name for lookup
	 * @returns The assigned name
	 */
	addCamera(camera: ZylemCamera, name?: string): string {
		const resolvedName = name || camera.name || `camera_${this._autoNameCounter++}`;
		camera.name = resolvedName;
		this.cameras.set(resolvedName, camera);

		// First camera added automatically becomes active
		if (this._activeCameras.length === 0) {
			this._activeCameras.push(camera);
		}

		return resolvedName;
	}

	/**
	 * Remove a camera by name or reference.
	 * Cannot remove the debug camera via this method.
	 */
	removeCamera(nameOrRef: string | ZylemCamera): boolean {
		let name: string | undefined;

		if (typeof nameOrRef === 'string') {
			name = nameOrRef;
		} else {
			// Find by reference
			for (const [key, cam] of this.cameras.entries()) {
				if (cam === nameOrRef) {
					name = key;
					break;
				}
			}
		}

		if (!name) return false;

		const camera = this.cameras.get(name);
		if (!camera) return false;

		// Prevent removing the debug camera
		if (camera === this._debugCamera) {
			console.warn('CameraManager: Cannot remove the debug camera');
			return false;
		}

		this.cameras.delete(name);

		// Remove from active cameras
		const activeIndex = this._activeCameras.indexOf(camera);
		if (activeIndex !== -1) {
			this._activeCameras.splice(activeIndex, 1);
		}

		return true;
	}

	/**
	 * Set a camera as the primary active camera (replaces all active cameras
	 * except additional viewport cameras).
	 *
	 * @param nameOrRef Camera name or reference to activate
	 */
	setActiveCamera(nameOrRef: string | ZylemCamera): boolean {
		const camera = this.resolveCamera(nameOrRef);
		if (!camera) {
			console.warn(`CameraManager: Camera not found: ${nameOrRef}`);
			return false;
		}

		// Set as the sole active camera (keeping PiP cameras if any)
		const pipCameras = this._activeCameras.filter(c => {
			return c !== this._activeCameras[0] && c.viewport.width < 1;
		});

		this._activeCameras = [camera, ...pipCameras];
		return true;
	}

	/**
	 * Add a camera as an additional active camera (for split-screen or PiP).
	 */
	addActiveCamera(nameOrRef: string | ZylemCamera): boolean {
		const camera = this.resolveCamera(nameOrRef);
		if (!camera) return false;

		if (!this._activeCameras.includes(camera)) {
			this._activeCameras.push(camera);
		}
		return true;
	}

	/**
	 * Remove a camera from the active render list (does not remove from registry).
	 */
	deactivateCamera(nameOrRef: string | ZylemCamera): boolean {
		const camera = this.resolveCamera(nameOrRef);
		if (!camera) return false;

		const index = this._activeCameras.indexOf(camera);
		if (index !== -1) {
			this._activeCameras.splice(index, 1);
			return true;
		}
		return false;
	}

	/**
	 * Get a camera by name.
	 */
	getCamera(name: string): ZylemCamera | null {
		return this.cameras.get(name) ?? null;
	}

	/**
	 * Setup all cameras with the given scene and renderer manager.
	 * Also creates the debug camera.
	 */
	async setup(scene: Scene, rendererManager: RendererManager): Promise<void> {
		this._sceneRef = scene;
		this._rendererManager = rendererManager;

		// Create the debug camera
		this.createDebugCamera(rendererManager.screenResolution);

		// Setup all registered cameras
		for (const camera of this.cameras.values()) {
			camera.setRendererManager(rendererManager);
			await camera.setup(scene, rendererManager);
		}

		// Setup the debug camera
		if (this._debugCamera) {
			this._debugCamera.setRendererManager(rendererManager);
			await this._debugCamera.setup(scene, rendererManager);
		}
	}

	/**
	 * Update all active cameras' controllers.
	 */
	update(delta: number): void {
		for (const camera of this._activeCameras) {
			camera.update(delta);
		}
	}

	/**
	 * Render all active cameras through the renderer manager.
	 * RTT cameras (those with a renderTarget) are rendered first to their
	 * offscreen textures, then viewport cameras are rendered to the screen.
	 */
	render(scene: Scene): void {
		if (!this._rendererManager || this._activeCameras.length === 0) return;

		const rttCameras: ZylemCamera[] = [];
		const viewportCameras: ZylemCamera[] = [];

		for (const cam of this._activeCameras) {
			if (cam.renderTarget) {
				rttCameras.push(cam);
			} else {
				viewportCameras.push(cam);
			}
		}

		// RTT pass first so textures are ready for the viewport pass
		for (const cam of rttCameras) {
			this._rendererManager.renderCameraToTarget(scene, cam);
		}

		// Viewport pass renders to the screen canvas
		if (viewportCameras.length > 0) {
			this._rendererManager.renderCameras(scene, viewportCameras);
		}
	}

	/**
	 * Create a default third-person camera if no cameras have been added.
	 */
	ensureDefaultCamera(): ZylemCamera {
		if (this.cameras.size === 0 || this._activeCameras.length === 0) {
			const screenRes = this._rendererManager?.screenResolution
				|| new Vector2(window.innerWidth, window.innerHeight);
			const defaultCam = new ZylemCamera(Perspectives.ThirdPerson, screenRes);
			this.addCamera(defaultCam, 'default');
			return defaultCam;
		}
		return this._activeCameras[0];
	}

	/**
	 * Dispose all cameras and cleanup.
	 */
	dispose(): void {
		for (const camera of this.cameras.values()) {
			camera.destroy();
		}
		this._debugCamera?.destroy();
		this.cameras.clear();
		this._activeCameras = [];
		this._debugCamera = null;
		this._rendererManager = null;
		this._sceneRef = null;
	}

	/**
	 * Create the always-available debug camera with orbit controls.
	 */
	private createDebugCamera(screenResolution: Vector2): void {
		this._debugCamera = new ZylemCamera(Perspectives.ThirdPerson, screenResolution);
		this._debugCamera.name = '__debug__';
		this._debugCamera.enableOrbitalControls();
		// Debug camera is NOT added to the active cameras by default;
		// it's activated via the debug system
	}

	/**
	 * Resolve a camera from a name or reference.
	 */
	private resolveCamera(nameOrRef: string | ZylemCamera): ZylemCamera | null {
		if (typeof nameOrRef === 'string') {
			return this.cameras.get(nameOrRef) ?? null;
		}
		// Check if the reference exists in our registry
		for (const cam of this.cameras.values()) {
			if (cam === nameOrRef) return cam;
		}
		return null;
	}
}
