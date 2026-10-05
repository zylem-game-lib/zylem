/**
 * Matches `GAME_CAMERA_ID` / `EDITOR_CAMERAS` in `@zylem/bridge`.
 * Declared here so game-lib can compile against a published bridge that has
 * not picked up `camera:activate` yet.
 */
export const GAME_CAMERA_ID = 'game';

export const EDITOR_CAMERAS = {
	side: 'editor:side',
	top: 'editor:top',
	isometric: 'editor:isometric',
	free: 'editor:free',
} as const;

/**
 * Editor-view cameras exist only while an editor is attached.
 *
 * `GameBridge.connect()` runs for every game, so it is not the signal. The
 * bridge marks the session attached when an editor subscribes, and every live
 * camera manager creates or destroys its four view cameras from that flag.
 */

export interface EditorCameraHost {
	ensureEditorCameras(): Promise<void>;
	destroyEditorCameras(): void;
	activateCameraById(id: string): boolean;
}

let attached = false;
const hosts = new Set<EditorCameraHost>();

/** Whether an editor is currently attached. */
export function editorCamerasAreAttached(): boolean {
	return attached;
}

/**
 * Register a stage camera manager. If an editor is already attached, its
 * view cameras are created immediately.
 *
 * @returns An unregister function.
 */
export function registerEditorCameraHost(host: EditorCameraHost): () => void {
	hosts.add(host);
	if (attached) void host.ensureEditorCameras();
	return () => {
		hosts.delete(host);
	};
}

/**
 * Create or destroy editor view cameras on every live stage.
 *
 * Attaching again while already attached still ensures cameras, so a stage
 * that registered between calls is not missed. Detaching is a no-op when
 * nothing was attached.
 */
export function setEditorCamerasAttached(next: boolean): Promise<void> {
	if (!next && !attached) return Promise.resolve();
	attached = next;
	if (!next) {
		for (const host of hosts) host.destroyEditorCameras();
		return Promise.resolve();
	}
	return Promise.all(
		[...hosts].map((host) => host.ensureEditorCameras()),
	).then(() => undefined);
}

/** Activate `id` on every live stage. `game` releases to the game camera. */
export function activateAttachedCamera(id: string): boolean {
	let activated = false;
	for (const host of hosts) {
		if (host.activateCameraById(id)) activated = true;
	}
	return activated;
}

/** Drop the session flag and host list. Used by tests. */
export function resetEditorCameraSession(): void {
	attached = false;
	hosts.clear();
}
