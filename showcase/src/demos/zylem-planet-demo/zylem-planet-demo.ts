/** Blue ocean world using the reusable Zylem graphics API. */
import { createOrbitPath, OrbitBehavior } from '@zylem/game-lib/behavior';
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createCelestialBody } from '@zylem/game-lib/graphics';
import type { ShowcaseDemo } from '../../demo-types';

export default function createDemo(): ShowcaseDemo {
	const planet = createCelestialBody({
		name: 'Zylem',
		radius: 20,
		surface: {
			type: 'ocean',
			oceanColor: '#0864c1',
			landColor: '#155bb1',
			oceanCoverage: 0.8,
		},
		atmosphere: { color: '#5aafff', thickness: 0.035 },
		rings: { innerRadius: 25, outerRadius: 36, tilt: -26, color: '#ef493b' },
		gravity: { surfaceAcceleration: 2.5 },
	});

	const redPlanet = {
		type: 'ocean' as const,
		oceanColor: '#6f2a1c',
		landColor: '#c85a32',
		oceanCoverage: 0.42,
		clouds: false,
	};
	const innerMoon = createCelestialBody({
		name: 'Inner moon',
		radius: 1.4,
		seed: 84,
		rotationPeriod: 48,
		surface: redPlanet,
	});
	const outerMoon = createCelestialBody({
		name: 'Outer moon',
		radius: 1,
		seed: 85,
		rotationPeriod: 71,
		surface: redPlanet,
	});
	// A bit quicker than the period implied by the planet's gravity.
	const orbitRate = 4.04;
	innerMoon.use(OrbitBehavior, {
		around: planet,
		path: createOrbitPath({ semiMajorAxis: 39.6, inclination: -26, phase: 35 }),
	}).setTimeScale(orbitRate);
	outerMoon.use(OrbitBehavior, {
		around: planet,
		path: createOrbitPath({
			semiMajorAxis: 48,
			eccentricity: 0.04,
			inclination: 26,
			phase: 210,
		}),
	}).setTimeScale(orbitRate);

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 25, z: -115 },
		target: { x: 0, y: 0, z: 0 },
	});
	const stage = createStage(
		{
			defaultLighting: false,
			background: {
				type: 'space',
				color: '#02040c',
				stars: { count: 4500, seed: 42, brightness: 1.5 },
				sun: {},
			},
		},
		camera,
		planet,
		innerMoon,
		outerMoon,
	);

	return {
		game: createGame({ id: 'zylem-planet-demo' }, stage),
		description:
			'A blue ocean planet with subtly darker blue-purple land, soft blue clouds, a light-blue atmosphere, and red rings tilted upward to the right. Two rust-colored moons follow crossed orbits; the inner moon travels just outside the ring.',
	};
}
