import { Vector3 } from 'three';
import type { CameraAction } from './types';

export interface ScreenShakeOptions {
	/** Seconds the shake lasts. Defaults to 0.35. */
	duration?: number;
	/** Peak offset per axis in world units. Defaults to 0.3. */
	amplitude?: number;
	/** Oscillations per second. Defaults to 22. */
	frequency?: number;
}

/** A short camera offset that decays to zero. Create a new action for each shake. */
export function createScreenShake(options: ScreenShakeOptions = {}): CameraAction {
	const { duration = 0.35, amplitude = 0.3, frequency = 22 } = options;
	if ([duration, amplitude, frequency].some(value => !Number.isFinite(value) || value < 0)) {
		throw new RangeError('Screen shake options must be finite and nonnegative.');
	}
	let elapsed = 0;
	const position = new Vector3();
	return {
		update({ dt }) {
			elapsed += Math.max(0, dt);
			if (elapsed >= duration) return { position: position.set(0, 0, 0) };
			const angle = 2 * Math.PI * frequency * elapsed;
			const strength = amplitude * (1 - elapsed / duration) ** 2;
			return { position: position.set(Math.sin(angle), Math.sin(angle * 1.31), 0).multiplyScalar(strength) };
		},
		isDone: () => elapsed >= duration,
	};
}
