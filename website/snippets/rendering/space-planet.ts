import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createOrbitPath, OrbitBehavior } from '@zylem/game-lib/behavior';
import { createCelestialBody } from '@zylem/game-lib/graphics';

const planet = createCelestialBody({
	radius: 20,
	surface: { type: 'ocean', oceanColor: '#0864c1', landColor: '#155bb1', oceanCoverage: 0.8 },
	atmosphere: { color: '#5aafff' },
	rings: { innerRadius: 25, outerRadius: 36, tilt: -26, color: '#ef493b' },
	gravity: { surfaceAcceleration: 2.5 },
});

const innerMoon = createCelestialBody({ radius: 1.4, seed: 84 });
innerMoon.use(OrbitBehavior, {
	around: planet,
	path: createOrbitPath({ semiMajorAxis: 39.6, inclination: -26, phase: 35 }),
});
const outerMoon = createCelestialBody({ radius: 1, seed: 85 });
outerMoon.use(OrbitBehavior, {
	around: planet,
	path: createOrbitPath({ semiMajorAxis: 48, eccentricity: 0.04, inclination: 26, phase: 210 }),
});

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
			stars: { count: 4500, brightness: 1.5 },
			sun: {},
		},
	},
	camera,
	planet,
	innerMoon,
	outerMoon
);

createGame({ id: 'ocean-planet' }, stage).start();
