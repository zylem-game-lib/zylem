import { Box3, Vector2, Vector3, Scene, OrthographicCamera, PerspectiveCamera } from 'three';
import { ZylemCamera } from './zylem-camera';
import { RendererManager } from './renderer-manager';
import { Perspectives, type PerspectiveType } from './perspective';
import {
	boxesWithinFitLimit,
	clipRangeForBoxes,
	frustumHeightForFit,
	perspectiveFovMatchingOrthographic,
	pictureSize,
} from './editor-view-frame';
import {
	EDITOR_CAMERAS,
	GAME_CAMERA_ID,
	editorCamerasAreAttached,
	registerEditorCameraHost,
	type EditorCameraHost,
} from './editor-camera-session';

/**
 * Depth slab for the isometric view. A negative near plane keeps geometry
 * behind the camera, so the diagonal view is not cut by a clip plane through
 * the scene.
 */
const ISOMETRIC_DEPTH = 10_000;

/** Where an editor view sits relative to the game camera's look-at. */
interface EditorViewSpec {
	id: string;
	perspective: PerspectiveType;
	lockRotation: boolean;
	/** Pan in the view plane. Side moves on YZ, top on XZ. */
	screenSpacePan: boolean;
	/** Orbit through the lower hemisphere so a low gameplay camera is not snapped level. */
	fullPolarRange?: boolean;
	near?: number;
	far?: number;
	position(lookAt: Vector3, distance: number, gamePosition: Vector3): Vector3;
	up(gameUp: Vector3): Vector3;
}

const EDITOR_VIEWS: EditorViewSpec[] = [
	{
		id: EDITOR_CAMERAS.side,
		perspective: Perspectives.Fixed2D,
		lockRotation: true,
		screenSpacePan: true,
		position: (lookAt, distance) => new Vector3(lookAt.x + distance, lookAt.y, lookAt.z),
		up: () => new Vector3(0, 1, 0),
	},
	{
		id: EDITOR_CAMERAS.top,
		perspective: Perspectives.TopDown,
		lockRotation: true,
		screenSpacePan: true,
		position: (lookAt, distance) => new Vector3(lookAt.x, lookAt.y + distance, lookAt.z),
		up: () => new Vector3(0, 0, -1),
	},
	{
		id: EDITOR_CAMERAS.isometric,
		perspective: Perspectives.Isometric,
		lockRotation: true,
		screenSpacePan: true,
		near: -ISOMETRIC_DEPTH,
		far: ISOMETRIC_DEPTH,
		position: (lookAt, distance) => lookAt.clone().add(
			new Vector3(1, 1, 1).normalize().multiplyScalar(distance),
		),
		up: () => new Vector3(0, 1, 0),
	},
	{
		id: EDITOR_CAMERAS.free,
		perspective: Perspectives.ThirdPerson,
		lockRotation: false,
		screenSpacePan: false,
		fullPolarRange: true,
		position: (lookAt, distance, gamePosition) => {
			if (gamePosition.distanceTo(lookAt) > 0.5) return gamePosition.clone();
			return lookAt.clone().add(new Vector3(0, distance * 0.5, distance));
		},
		up: (gameUp) => gameUp.clone(),
	},
];

/** Look-at and distance implied by a camera's current forward vector. */
function captureFraming(camera: { position: Vector3; getWorldDirection(target: Vector3): Vector3 }): {
	lookAt: Vector3;
	distance: number;
} {
	const direction = new Vector3();
	camera.getWorldDirection(direction);
	const toOrigin = new Vector3().sub(camera.position);
	const along = toOrigin.dot(direction);
	const distance = along > 1 ? along : 12;
	return {
		lookAt: camera.position.clone().add(direction.multiplyScalar(distance)),
		distance,
	};
}

/**
 * CameraManager orchestrates multiple cameras per stage.
 *
 * Responsibilities:
 * - Named camera registry (add/remove/get by name or reference)
 * - Active camera list management (determines which cameras render)
 * - Editor view cameras (side, top, isometric, free), created only while an editor is attached
 * - Per-frame update of all active cameras' perspective controllers
 * - Coordinating rendering via RendererManager for all active viewports
 */
export class CameraManager implements EditorCameraHost {
	/** Named camera registry */
	private cameras: Map<string, ZylemCamera> = new Map();

	/** Currently active cameras, ordered by render layer (first = bottom) */
	private _activeCameras: ZylemCamera[] = [];

	/** Editor view cameras, keyed by `editor:*` id. */
	private _editorCameras: Map<string, ZylemCamera> = new Map();

	/** Which editor views freeze rotation. */
	private _lockedEditorIds = new Set<string>();

	/** Which editor views pan in screen space (the view plane). */
	private _screenSpacePanIds = new Set<string>();

	/** Side, top, and isometric views that have already been placed on the gameplay camera. */
	private _framedEditorViews = new Set<string>();

	/** World boxes of stage entities, read when an orthographic view is first shown. */
	private _entityBounds: (() => readonly Box3[]) | null = null;

	/** Game camera to restore when the editor releases the main view. */
	private _rememberedGameCamera: ZylemCamera | null = null;

	/**
	 * True while an editor view is the main camera. Game calls to
	 * {@link setActiveCamera} update {@link _rememberedGameCamera} and leave
	 * the view on screen.
	 */
	private _editorViewLocked = false;

	/** Game cameras whose orbit input was suspended for an editor view. */
	private _suspendedOrbits = new Set<ZylemCamera>();

	/** In-flight creation, so a second attach does not build a second set. */
	private _editorCamerasPromise: Promise<void> | null = null;

	/** Reference to the shared renderer manager */
	private _rendererManager: RendererManager | null = null;

	/** Scene reference */
	private _sceneRef: Scene | null = null;

	/** Counter for auto-generated camera names */
	private _autoNameCounter = 0;

	private _unregisterEditorHost: (() => void) | null = null;

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

	/** True while side, top, isometric, or free is the main view. */
	isEditorViewActive(): boolean {
		return this._editorViewLocked;
	}

	/** Id of the editor view that is currently the main camera, if one is. */
	activeEditorCameraId(): string | null {
		const primary = this.primaryCamera;
		if (!primary || !this._editorViewLocked) return null;
		for (const [id, camera] of this._editorCameras) {
			if (camera === primary) return id;
		}
		return null;
	}

	/** True after the four editor views have been created. */
	hasEditorCameras(): boolean {
		return this._editorCameras.size > 0;
	}

	/**
	 * World boxes used the first time side, top, or isometric is shown.
	 * Pass null to stop contributing boxes.
	 */
	setEditorEntityBounds(read: (() => readonly Box3[]) | null): void {
		this._entityBounds = read;
	}

	/**
	 * Copy the gameplay camera onto the free view, then show that view.
	 * Waits for the editor cameras when they have not been created yet.
	 */
	syncFreeCameraToGame(): void {
		const run = () => {
			if (!this.copyFreeFromGame()) return;
			this.activateCameraById(EDITOR_CAMERAS.free);
		};
		if (this.hasEditorCameras()) {
			run();
			return;
		}
		void this.ensureEditorCameras().then(run);
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
	 */
	removeCamera(nameOrRef: string | ZylemCamera): boolean {
		let name: string | undefined;

		if (typeof nameOrRef === 'string') {
			name = nameOrRef;
		} else {
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

		this.cameras.delete(name);

		const activeIndex = this._activeCameras.indexOf(camera);
		if (activeIndex !== -1) {
			this._activeCameras.splice(activeIndex, 1);
		}

		if (this._rememberedGameCamera === camera) {
			this._rememberedGameCamera = null;
		}
		this._suspendedOrbits.delete(camera);

		return true;
	}

	/**
	 * Set a camera as the primary active camera (replaces all active cameras
	 * except additional viewport cameras).
	 *
	 * While an editor view owns the main view, a game camera is remembered
	 * and the rendered camera does not change.
	 *
	 * @param nameOrRef Camera name or reference to activate
	 */
	setActiveCamera(nameOrRef: string | ZylemCamera): boolean {
		const camera = this.resolveCamera(nameOrRef);
		if (!camera) {
			console.warn(`CameraManager: Camera not found: ${nameOrRef}`);
			return false;
		}

		if (this._editorViewLocked && !this.isEditorCamera(camera)) {
			this._rememberedGameCamera = camera;
			return true;
		}

		if (!this.isEditorCamera(camera)) {
			this._rememberedGameCamera = camera;
			this.restoreOrbitFor(camera);
		}

		return this.commitActive(camera);
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
	 * Editor view cameras are created here only when an editor is already attached.
	 */
	async setup(scene: Scene, rendererManager: RendererManager): Promise<void> {
		this._sceneRef = scene;
		this._rendererManager = rendererManager;

		for (const camera of this.cameras.values()) {
			camera.setRendererManager(rendererManager);
			await camera.setup(scene, rendererManager);
		}

		this._unregisterEditorHost = registerEditorCameraHost(this);
		if (editorCamerasAreAttached()) {
			await this.ensureEditorCameras();
		}
	}

	/**
	 * Create side, top, isometric, and free cameras seeded from the current
	 * game camera. Does not change which camera is rendering.
	 */
	ensureEditorCameras(): Promise<void> {
		if (this._editorCameras.size > 0) return Promise.resolve();
		if (this._editorCamerasPromise) return this._editorCamerasPromise;
		this._editorCamerasPromise = this.createEditorCameras().finally(() => {
			this._editorCamerasPromise = null;
		});
		return this._editorCamerasPromise;
	}

	/**
	 * Restore the game camera when an editor view is showing, then destroy
	 * the four editor cameras.
	 */
	destroyEditorCameras(): void {
		const showingEditor = this.primaryCamera !== null && this.isEditorCamera(this.primaryCamera);
		this._editorViewLocked = false;
		if (showingEditor) {
			const restore = this.gameCameraToRestore();
			if (restore) {
				this.restoreOrbitFor(restore);
				this.commitActive(restore);
			}
		}

		for (const camera of this._editorCameras.values()) {
			this.removeCamera(camera);
			camera.destroy();
		}
		this._editorCameras.clear();
		this._lockedEditorIds.clear();
		this._screenSpacePanIds.clear();
		this._framedEditorViews.clear();
	}

	/**
	 * Switch the main view.
	 *
	 * `game` releases to the remembered game camera. Editor view ids show
	 * that view. Any other id activates a game-registered camera and clears
	 * the editor override.
	 */
	activateCameraById(id: string): boolean {
		if (id === GAME_CAMERA_ID) {
			const restore = this.gameCameraToRestore();
			if (!restore) return false;
			return this.showGameCamera(restore);
		}

		const editor = this._editorCameras.get(id);
		if (editor) return this.showEditorCamera(id, editor);

		const named = this.getCamera(id);
		if (!named || this.isEditorCamera(named)) return false;
		this._rememberedGameCamera = named;
		return this.showGameCamera(named);
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
		this._unregisterEditorHost?.();
		this._unregisterEditorHost = null;
		this._editorViewLocked = false;

		for (const camera of this.cameras.values()) {
			camera.destroy();
		}
		this.cameras.clear();
		this._activeCameras = [];
		this._editorCameras.clear();
		this._lockedEditorIds.clear();
		this._screenSpacePanIds.clear();
		this._framedEditorViews.clear();
		this._entityBounds = null;
		this._rememberedGameCamera = null;
		this._suspendedOrbits.clear();
		this._rendererManager = null;
		this._sceneRef = null;
	}

	private async createEditorCameras(): Promise<void> {
		if (this._editorCameras.size > 0) return;
		if (!this._sceneRef || !this._rendererManager) return;

		const source = this.primaryCamera ?? this.ensureDefaultCamera();
		if (!source.sceneRef) {
			source.setRendererManager(this._rendererManager);
			await source.setup(this._sceneRef, this._rendererManager);
		}

		const framing = captureFraming(source.camera);
		const resolution = this._rendererManager.screenResolution.clone();
		const frustum = Math.max(framing.distance, 4);

		if (!this.isEditorCamera(source)) {
			this._rememberedGameCamera = source;
		}

		for (const spec of EDITOR_VIEWS) {
			const camera = new ZylemCamera(spec.perspective, resolution, frustum);
			camera._skipDebugOrbit = true;
			const position = spec.position(framing.lookAt, framing.distance, source.camera.position);
			const up = spec.up(source.camera.up);
			camera.camera.up.copy(up);
			camera.camera.position.copy(position);
			camera.camera.lookAt(framing.lookAt);
			if (camera.camera instanceof OrthographicCamera || camera.camera instanceof PerspectiveCamera) {
				camera.camera.near = spec.near ?? 0.1;
				camera.camera.far = spec.far ?? 2000;
				camera.camera.updateProjectionMatrix();
			}

			this.addCamera(camera, spec.id);
			this._editorCameras.set(spec.id, camera);
			if (spec.lockRotation) this._lockedEditorIds.add(spec.id);
			if (spec.screenSpacePan) this._screenSpacePanIds.add(spec.id);

			camera.setRendererManager(this._rendererManager);
			await camera.setup(this._sceneRef, this._rendererManager);
			if (spec.fullPolarRange) camera.allowFullOrbit();
			camera.seedDebugOrbitPose(position, framing.lookAt);
		}
	}

	private showEditorCamera(id: string, camera: ZylemCamera): boolean {
		if (!this._editorViewLocked) {
			const primary = this.primaryCamera;
			if (primary && !this.isEditorCamera(primary)) {
				this._rememberedGameCamera = primary;
			}
		}
		if (this.isOrthographicEditorView(id) && !this._framedEditorViews.has(id)) {
			if (this.frameOrthographicView(id, camera)) this._framedEditorViews.add(id);
		}
		this._editorViewLocked = true;
		this.suspendOtherOrbits(camera);
		this.syncEditorOrbit(id);
		return this.commitActive(camera);
	}

	private showGameCamera(camera: ZylemCamera): boolean {
		this._editorViewLocked = false;
		this.syncEditorOrbit(null);
		this.restoreOrbitFor(camera);
		return this.commitActive(camera);
	}

	/** Enable orbit on the active editor view only. Inactive views keep their pose. */
	private syncEditorOrbit(activeId: string | null): void {
		for (const [id, camera] of this._editorCameras) {
			if (id === activeId) {
				if (id === EDITOR_CAMERAS.free) camera.allowFullOrbit();
				camera.armEditorOrbit(this._lockedEditorIds.has(id), this._screenSpacePanIds.has(id));
			} else {
				camera.disarmEditorOrbit();
			}
		}
	}

	private isOrthographicEditorView(id: string): boolean {
		return id === EDITOR_CAMERAS.side || id === EDITOR_CAMERAS.top || id === EDITOR_CAMERAS.isometric;
	}

	/** Snapshot the gameplay camera onto the free orbit camera. Does not switch views. */
	private copyFreeFromGame(): boolean {
		const free = this._editorCameras.get(EDITOR_CAMERAS.free);
		const game = this.gameCameraToRestore();
		if (!free || !game) return false;

		const source = game.camera;
		source.updateMatrixWorld(true);
		const framing = captureFraming(source);
		free.camera.up.copy(source.up);
		if (source instanceof PerspectiveCamera || source instanceof OrthographicCamera) {
			this.copyGameplayProjection(source, free, framing.distance);
		}
		free.allowFullOrbit();
		free.replaceOrbitPose(source.position, framing.lookAt);
		return true;
	}

	private copyGameplayProjection(source: PerspectiveCamera | OrthographicCamera, free: ZylemCamera, distance: number): void {
		const dest = free.camera;
		if (!(dest instanceof PerspectiveCamera)) return;
		if (source instanceof PerspectiveCamera) {
			dest.fov = source.fov;
			dest.zoom = source.zoom;
			dest.near = source.near;
			dest.far = source.far;
		} else if (source instanceof OrthographicCamera) {
			dest.fov = perspectiveFovMatchingOrthographic(source, distance);
			dest.zoom = 1;
		}
		dest.updateProjectionMatrix();
	}

	/**
	 * Place an orthographic view on the gameplay camera's look-at and fit the
	 * stage around that point. Returns false when there is no gameplay camera.
	 */
	private frameOrthographicView(id: string, view: ZylemCamera): boolean {
		const spec = EDITOR_VIEWS.find((candidate) => candidate.id === id);
		const game = this.gameCameraToRestore();
		if (!spec || !game) return false;

		const source = game.camera;
		source.updateMatrixWorld(true);
		const framing = captureFraming(source);
		const picture = pictureSize(source, framing.distance);
		const boxes = boxesWithinFitLimit(this._entityBounds?.() ?? [], picture);
		const distance = Math.max(framing.distance, 4);
		const position = spec.position(framing.lookAt, distance, source.position);
		view.camera.up.copy(spec.up(source.up));
		view.camera.position.copy(position);
		view.camera.lookAt(framing.lookAt);
		view.camera.updateMatrixWorld(true);

		const right = new Vector3().setFromMatrixColumn(view.camera.matrixWorld, 0);
		const up = new Vector3().setFromMatrixColumn(view.camera.matrixWorld, 1);
		const forward = new Vector3();
		view.camera.getWorldDirection(forward);
		const aspect = view.screenResolution.x / Math.max(view.screenResolution.y, 1);
		const height = frustumHeightForFit(framing.lookAt, right, up, boxes, picture, aspect);
		const clip = clipRangeForBoxes(view.camera.position, forward, boxes, {
			near: spec.near ?? 0.1,
			far: spec.far ?? 2000,
		});
		view.applyOrthographicFrame(height, clip.near, clip.far);
		view.replaceOrbitPose(position, framing.lookAt);
		return true;
	}

	/** Stop game-camera orbit controls from sharing the canvas with an editor view. */
	private suspendOtherOrbits(active: ZylemCamera): void {
		for (const camera of this.cameras.values()) {
			if (camera === active || this.isEditorCamera(camera)) continue;
			if (!camera.isOrbitActive) continue;
			camera.setOrbitInteractionEnabled(false);
			this._suspendedOrbits.add(camera);
		}
	}

	private restoreOrbitFor(camera: ZylemCamera): void {
		if (!this._suspendedOrbits.has(camera)) return;
		camera.setOrbitInteractionEnabled(true);
		this._suspendedOrbits.delete(camera);
	}

	private gameCameraToRestore(): ZylemCamera | null {
		if (this._rememberedGameCamera && this.cameraIsRegistered(this._rememberedGameCamera)) {
			return this._rememberedGameCamera;
		}
		for (const camera of this.cameras.values()) {
			if (!this.isEditorCamera(camera)) return camera;
		}
		return null;
	}

	private cameraIsRegistered(camera: ZylemCamera): boolean {
		for (const candidate of this.cameras.values()) {
			if (candidate === camera) return true;
		}
		return false;
	}

	private isEditorCamera(camera: ZylemCamera): boolean {
		for (const candidate of this._editorCameras.values()) {
			if (candidate === camera) return true;
		}
		return false;
	}

	/** Replace the primary camera and keep picture-in-picture viewports. */
	private commitActive(camera: ZylemCamera): boolean {
		const previous = this.primaryCamera;
		const pipCameras = this._activeCameras.filter((candidate) => {
			return candidate !== this._activeCameras[0] && candidate.viewport.width < 1;
		});
		this._activeCameras = [camera, ...pipCameras];
		if (previous !== camera) {
			this._rendererManager?.rebindPostProcessingCamera(camera.camera);
		}
		return true;
	}

	/**
	 * Resolve a camera from a name or reference.
	 */
	private resolveCamera(nameOrRef: string | ZylemCamera): ZylemCamera | null {
		if (typeof nameOrRef === 'string') {
			return this.cameras.get(nameOrRef) ?? null;
		}
		for (const cam of this.cameras.values()) {
			if (cam === nameOrRef) return cam;
		}
		return null;
	}
}
