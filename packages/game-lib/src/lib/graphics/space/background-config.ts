export interface StarOptions {
	/** Procedural stars in addition to the catalog's named stars. Default 3500. */
	count?: number;
	seed?: number;
	brightness?: number;
	/** Gaussian width in CSS pixels. Default 0.65. */
	size?: number;
}
export interface SpaceSunOptions {
	/** Direction toward the sun in world space. */
	direction?: [number, number, number];
	color?: string | number;
	intensity?: number;
	/** Low ambient fill for readable night-side silhouettes. Default 0.08. */
	ambient?: number;
}
/** Serializable, stage-owned backgrounds. Legacy backgroundShader remains supported. */
export type StageBackground =
	| { type: 'color'; color: string | number }
	| { type: 'gradient'; top: string | number; horizon: string | number; bottom?: string | number }
	| { type: 'space'; color?: string | number; stars?: false | StarOptions; sun?: SpaceSunOptions }
	| {
			type: 'sky';
			preset?: 'earth' | 'mars' | 'titan';
			quality?: 'low' | 'medium' | 'high';
			timeOfDay?: number;
			latitude?: number;
			exposure?: number;
			stars?: false | StarOptions /** Seconds per day; absent means a fixed time. */;
			cycleDuration?: number;
	  };

export const SPACE_SUN_DIRECTION: [number, number, number] = [1, 0.6, -0.8];
export function finiteRange(
	value: number | undefined,
	fallback: number,
	name: string,
	min: number,
	max = Infinity
): number {
	const n = value === undefined ? fallback : value;
	if (!Number.isFinite(n) || n < min || n > max)
		throw new Error(`${name} must be finite and in [${min}, ${max}].`);
	return n;
}
export function validateBackground(config?: StageBackground): void {
	if (!config) return;
	if (!['color', 'gradient', 'space', 'sky'].includes(config.type))
		throw new Error('Unknown stage background type.');
	if (config.type === 'space' || config.type === 'sky') {
		if (config.stars !== false) {
			const stars = config.stars ?? {};
			const count = finiteRange(stars.count, 3500, 'Star count', 0, 50000);
			if (!Number.isInteger(count)) throw new Error('Star count must be an integer.');
			finiteRange(stars.brightness, 1, 'Star brightness', 0, 100);
			finiteRange(stars.size, 0.65, 'Star size', 0.1, 8);
			finiteRange(stars.seed, 42, 'Star seed', 0, 4294967295);
		}
	}
	if (config.type === 'space' && config.sun) {
		const d = config.sun.direction ?? SPACE_SUN_DIRECTION;
		if (d.length !== 3 || !d.every(Number.isFinite) || Math.hypot(...d) < 1e-6)
			throw new Error('Sun direction must be a finite nonzero vector.');
		finiteRange(config.sun.intensity, 3, 'Sun intensity', 0);
		finiteRange(config.sun.ambient, 0.08, 'Ambient intensity', 0);
	}
	if (config.type === 'sky') {
		if (config.preset && !['earth', 'mars', 'titan'].includes(config.preset))
			throw new Error('Unknown sky preset.');
		if (config.quality && !['low', 'medium', 'high'].includes(config.quality))
			throw new Error('Unknown sky quality.');
		finiteRange(config.timeOfDay, 14, 'Time of day', 0, 24);
		finiteRange(config.latitude, 37, 'Latitude', -90, 90);
		finiteRange(config.exposure, 40, 'Sky exposure', 0, 1000);
		if (config.cycleDuration !== undefined)
			finiteRange(config.cycleDuration, 120, 'Day duration', 1);
	}
}
