import type { Vec3Input } from '../../core/vector';
import type { GravitySourceOptions } from '@zylem/behaviors/celestial';
import { finiteRange, SPACE_SUN_DIRECTION } from './background-config';
export interface CelestialBodyOptions {
	/** Fixed sources stay still; dynamic bodies respond to gravity and collisions. */
	motion?: 'fixed' | 'dynamic';
	/** Omit to receive gravity without generating it. Radius comes from the body. */
	gravity?: Omit<GravitySourceOptions, 'radius'>;
	name?: string;
	position?: Vec3Input;
	radius?: number;
	seed?: number;
	/** Seconds per surface revolution; 0 holds the planet still. */
	rotationPeriod?: number;
	sunDirection?: [number, number, number];
	surface?: {
		type?: 'ocean' | 'rock';
		color?: string | number;
		roughness?: number;
		bumpScale?: number;
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
}
export function resolveCelestialBody(options: CelestialBodyOptions = {}) {
	const radius = finiteRange(options.radius, 1, 'Body radius', 0.01);
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
	const atmosphere = !options.atmosphere
		? (false as const)
		: {
				color: options.atmosphere?.color ?? '#5aafff',
				thickness: finiteRange(
					options.atmosphere?.thickness,
					0.035,
					'Atmosphere thickness',
					0.001,
					0.25
				),
				intensity: finiteRange(options.atmosphere?.intensity, 1, 'Atmosphere intensity', 0, 10),
			};
	const rings = !options.rings
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
				tilt: finiteRange(options.rings?.tilt, -26, 'Ring tilt', -180, 180),
				color: options.rings?.color ?? '#ef493b',
				opacity: finiteRange(options.rings?.opacity, 0.72, 'Ring opacity', 0, 1),
			};
	if (rings && rings.outerRadius <= rings.innerRadius)
		throw new Error('Ring outer radius must exceed its inner radius.');
	if (options.motion && !['fixed', 'dynamic'].includes(options.motion))
		throw new Error('Invalid body motion.');
	if (options.surface?.type && !['rock', 'ocean'].includes(options.surface.type))
		throw new Error('Invalid surface type.');
	const roughness = finiteRange(options.surface?.roughness, 0.9, 'Surface roughness', 0, 1);
	const bumpScale = finiteRange(
		options.surface?.bumpScale,
		radius * 0.025,
		'Surface bump scale',
		0
	);
	return {
		radius,
		seed,
		rotationPeriod,
		oceanCoverage,
		sunDirection,
		atmosphere,
		rings,
		roughness,
		bumpScale,
	};
}
