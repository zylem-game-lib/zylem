import { Vector3 } from 'three';
import type { MoonOrbitOptions } from './planet-config';
/** Analytic circular orbit. Sampling at the same elapsed time is independent of frame rate. */
export function sampleMoonOrbit(
	orbit: MoonOrbitOptions,
	elapsed: number,
	target = new Vector3()
): Vector3 {
	const angle = (elapsed * 2 * Math.PI) / orbit.period + ((orbit.phase ?? 0) * Math.PI) / 180;
	const inclination = ((orbit.inclination ?? 0) * Math.PI) / 180;
	const node = ((orbit.ascendingNode ?? 0) * Math.PI) / 180;
	const x = orbit.radius * Math.cos(angle),
		z = orbit.radius * Math.sin(angle);
	const tiltedX = x * Math.cos(inclination),
		y = x * Math.sin(inclination);
	return target.set(
		tiltedX * Math.cos(node) + z * Math.sin(node),
		y,
		z * Math.cos(node) - tiltedX * Math.sin(node)
	);
}
