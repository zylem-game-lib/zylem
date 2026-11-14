import type { Vec3Input } from '../../core/vector';
import { finiteRange, SPACE_SUN_DIRECTION } from './background-config';
export interface MoonOrbitOptions {
	radius: number;
	/** Seconds per revolution. */
	period: number;
	/** Tilt in degrees about Z; the untilted orbit lies in the XZ plane. */
	inclination?: number;
	/** Rotation of the orbital plane about world/local Y in degrees. */
	ascendingNode?: number;
	phase?: number;
}
export interface PlanetMoonOptions {
	radius?: number;
	seed?: number;
	orbit: MoonOrbitOptions;
}
export interface PlanetOptions {
	name?: string;
	position?: Vec3Input;
	radius?: number;
	seed?: number;
	/** Seconds per surface revolution; 0 holds the planet still. */
	rotationPeriod?: number;
	sunDirection?: [number, number, number];
	surface?: {
		oceanColor?: string | number;
		landColor?: string | number /** Artistic ocean coverage, 0..1. Default 0.8. */;
		oceanCoverage?: number;
		clouds?: boolean;
	};
	atmosphere?:
		| false
		| {
				color?: string | number /** Fraction of planet radius. Default 0.035. */;
				thickness?: number;
				intensity?: number;
		  };
	rings?:
		| false
		| {
				innerRadius?: number;
				outerRadius?: number;
				tilt?: number;
				color?: string | number;
				opacity?: number;
		  };
	/** Two differently tilted orbits; the inner moon follows just outside the ring. */
	moons?: 'crossed' | PlanetMoonOptions[];
}
export function resolvePlanet(options: PlanetOptions = {}) {
	const radius = finiteRange(options.radius, 20, 'Planet radius', 0.01);
	const seed = finiteRange(options.seed, 83, 'Planet seed', 0, 4294967295);
	const rotationPeriod = finiteRange(options.rotationPeriod, 140, 'Rotation period', 0);
	const oceanCoverage = finiteRange(options.surface?.oceanCoverage, 0.8, 'Ocean coverage', 0, 1);
	const sunDirection = [...(options.sunDirection ?? SPACE_SUN_DIRECTION)] as [
		number,
		number,
		number,
	];
	if (
		sunDirection.length !== 3 ||
		!sunDirection.every(Number.isFinite) ||
		Math.hypot(...sunDirection) < 1e-6
	)
		throw new Error('Sun direction must be a nonzero finite vector.');
	const atmosphere =
		options.atmosphere === false
			? (false as const)
			: {
					color: options.atmosphere?.color ?? '#8edbff',
					thickness: finiteRange(
						options.atmosphere?.thickness,
						0.035,
						'Atmosphere thickness',
						0.001,
						0.25
					),
					intensity: finiteRange(options.atmosphere?.intensity, 1, 'Atmosphere intensity', 0, 10),
				};
	const rings =
		options.rings === false
			? (false as const)
			: {
					innerRadius: finiteRange(
						options.rings?.innerRadius,
						radius * 1.25,
						'Ring inner radius',
						radius * (1 + (atmosphere ? atmosphere.thickness : 0)) + 0.01
					),
					outerRadius: finiteRange(
						options.rings?.outerRadius,
						radius * 1.8,
						'Ring outer radius',
						radius
					),
					tilt: finiteRange(options.rings?.tilt, 26, 'Ring tilt', -180, 180),
					color: options.rings?.color ?? '#9cadd2',
					opacity: finiteRange(options.rings?.opacity, 0.72, 'Ring opacity', 0, 1),
				};
	if (rings && rings.outerRadius <= rings.innerRadius)
		throw new Error('Ring outer radius must exceed its inner radius.');
	const outer = rings ? rings.outerRadius : radius * 1.8;
	const moons: PlanetMoonOptions[] =
		options.moons === 'crossed'
			? [
					{
						radius: radius * 0.07,
						seed: (seed + 1) >>> 0,
						orbit: {
							radius: outer + radius * 0.18,
							period: 48,
							inclination: rings ? rings.tilt : 26,
							phase: 35,
						},
					},
					{
						radius: radius * 0.05,
						seed: (seed + 2) >>> 0,
						orbit: {
							radius: outer + radius * 0.6,
							period: 71,
							inclination: rings ? -rings.tilt : -26,
							phase: 210,
						},
					},
				]
			: (options.moons ?? []).map((m) => ({ ...m, orbit: { ...m.orbit } }));
	for (const moon of moons) {
		moon.radius = finiteRange(moon.radius, radius * 0.06, 'Moon radius', 0.01);
		finiteRange(moon.seed, seed + 1, 'Moon seed', 0, 4294967295);
		finiteRange(
			moon.orbit.radius,
			0,
			'Orbit radius',
			(rings ? rings.outerRadius : radius * (1 + (atmosphere ? atmosphere.thickness : 0))) +
				moon.radius +
				0.01
		);
		finiteRange(moon.orbit.period, 0, 'Orbit period', 0.01);
		finiteRange(moon.orbit.inclination, 0, 'Orbit inclination', -180, 180);
		finiteRange(moon.orbit.ascendingNode, 0, 'Ascending node', -360, 360);
		finiteRange(moon.orbit.phase, 0, 'Orbit phase', -360, 360);
	}
	return { radius, seed, rotationPeriod, oceanCoverage, sunDirection, atmosphere, rings, moons };
}
