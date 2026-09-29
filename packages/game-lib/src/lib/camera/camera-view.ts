/**
 * Editor view latch shared by the bridge and every debug orbit controller.
 *
 * The preset survives a controller that does not exist yet: a later controller
 * applies whatever was last requested.
 */

/**
 * Matches `CameraViewPreset` in `@zylem/bridge`. Declared here so game-lib can
 * compile against a bridge build that has not picked up the message yet.
 */
export type CameraViewPreset = 'top' | 'side' | 'isometric' | 'custom';

let preset: CameraViewPreset = 'custom';
const listeners = new Set<(preset: CameraViewPreset) => void>();

export function getCameraViewPreset(): CameraViewPreset {
	return preset;
}

export function setCameraViewPreset(next: CameraViewPreset): void {
	if (next === preset) return;
	preset = next;
	for (const listener of listeners) listener(preset);
}

/** Subscribe, and receive the current preset immediately. */
export function subscribeCameraView(listener: (preset: CameraViewPreset) => void): () => void {
	listeners.add(listener);
	listener(preset);
	return () => {
		listeners.delete(listener);
	};
}

/** Restore the unlocked default. Used by tests. */
export function resetCameraViewPreset(): void {
	setCameraViewPreset('custom');
}
