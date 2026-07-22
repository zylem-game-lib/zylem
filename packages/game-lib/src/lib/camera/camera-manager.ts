import { Vector2, Scene, Object3D, Vector3 } from 'three';
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

	/** Gameplay primary camera saved while the debug camera is active. */
	private _preDebugPrimary: ZylemCamera | null = null;

	/** Scene anchor at world origin for debug orbit when nothing is selected. */
	private _debugOrbitTargetAnchor: Object3D | null = null;

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
	 * Gameplay primary camera that was active before debug mode was enabled.
	 */
	get preDebugPrimary(): ZylemCamera | null {
		return this._preDebugPrimary;
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

		// Create the debug camera (registered in `cameras`, not activated)
		this.createDebugCamera(rendererManager.screenResolution);

		// Origin anchor for debug orbit when nothing is selected
		this._debugOrbitTargetAnchor = new Object3D();
		this._debugOrbitTargetAnchor.name = '__debug_orbit_target__';
		scene.add(this._debugOrbitTargetAnchor);

		// Setup all registered cameras (including __debug__)
		for (const camera of this.cameras.values()) {
			camera.setRendererManager(rendererManager);
			await camera.setup(scene, rendererManager);
		}

		if (this._debugCamera && this._debugOrbitTargetAnchor) {
			this._debugCamera.setDefaultOrbitTarget(this._debugOrbitTargetAnchor);
		}
	}

	/**
	 * Switch the primary viewport to the debug orbit camera, remembering the
	 * previous primary so gameplay cameras (e.g. first-person) can be restored.
	 */
	activateDebugCamera(): boolean {
		if (!this._debugCamera) return false;
		const primary = this.primaryCamera;
		if (primary === this._debugCamera) return true;
		this._preDebugPrimary = primary;
		const activated = this.setActiveCamera(this._debugCamera);
		if (activated) {
			this.seedDebugCameraPose(primary);
		}
		return activated;
	}

	/**
	 * Restore the gameplay primary camera that was active before
	 * {@link activateDebugCamera}.
	 */
	deactivateDebugCamera(): boolean {
		if (!this._debugCamera) return false;
		const restore = this._preDebugPrimary;
		this._preDebugPrimary = null;
		if (restore && restore !== this._debugCamera) {
			return this.setActiveCamera(restore);
		}
		for (const cam of this.cameras.values()) {
			if (cam !== this._debugCamera) {
				return this.setActiveCamera(cam);
			}
		}
		return false;
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

		// One tick per render frame so OrbitControls damping/target follow the
		// display refresh even when `ZylemGame.step()` is paused.
		this.updateOrbitingCamerasForRender();

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

	private updateOrbitingCamerasForRender(): void {
		for (const camera of this._activeCameras) {
			if (camera.isOrbitActive) {
				camera.updateOrbitControls();
			}
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
		// __debug__ is registered in `cameras` when created; only destroy here
		// if createDebugCamera never registered it.
		if (this._debugCamera && !this.cameras.has('__debug__')) {
			this._debugCamera.destroy();
		}
		this.cameras.clear();
		this._activeCameras = [];
		this._debugCamera = null;
		this._preDebugPrimary = null;
		if (this._debugOrbitTargetAnchor && this._sceneRef) {
			this._sceneRef.remove(this._debugOrbitTargetAnchor);
		}
		this._debugOrbitTargetAnchor = null;
		this._rendererManager = null;
		this._sceneRef = null;
	}

	/**
	 * Create the always-available debug camera with orbit controls.
	 * Registered for lookup/activation, but not added to the active list.
	 */
	private createDebugCamera(screenResolution: Vector2): void {
		this._debugCamera = new ZylemCamera(Perspectives.ThirdPerson, screenResolution);
		this._debugCamera.name = '__debug__';
		this._debugCamera.isDebugViewCamera = true;
		this._debugCamera.enableOrbitalControls();
		this.cameras.set('__debug__', this._debugCamera);
	}

	/**
	 * Seed the debug camera orbit pose on first activation, framing the origin
	 * or offsetting from the saved gameplay primary.
	 */
	private seedDebugCameraPose(gameplayPrimary: ZylemCamera | null): void {
		if (!this._debugCamera || this._debugCamera.isDebugOrbitPoseSeeded()) return;

		const origin = new Vector3(0, 0, 0);
		const defaultPosition = new Vector3(0, 6, 12);

		if (gameplayPrimary && gameplayPrimary !== this._debugCamera) {
			const camPos = gameplayPrimary.camera.position;
			const offset = new Vector3().subVectors(camPos, origin);
			if (offset.lengthSq() > 1) {
				defaultPosition.copy(offset.normalize().multiplyScalar(12).add(new Vector3(0, 4, 0)));
			}
		}

		this._debugCamera.seedDebugOrbitPose(defaultPosition, origin);
	}

	/**
	 * Resolve a camera from a name or reference.
	 */
	private resolveCamera(nameOrRef: string | ZylemCamera): ZylemCamera | null {
		if (typeof nameOrRef === 'string') {
			return this.cameras.get(nameOrRef) ?? null;
		}
		if (nameOrRef === this._debugCamera) {
			return this._debugCamera;
		}
		// Check if the reference exists in our registry
		for (const cam of this.cameras.values()) {
			if (cam === nameOrRef) return cam;
		}
		return null;
	}
}
