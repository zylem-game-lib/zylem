import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createPlanet } from '@zylem/game-lib/graphics';

const planet = createPlanet({
	radius: 20,
	surface: { oceanColor: '#075daf', landColor: '#454e89', oceanCoverage: 0.8 },
	atmosphere: { color: '#8edbff' },
	rings: { innerRadius: 25, outerRadius: 36, tilt: 26 },
	moons: 'crossed',
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
	planet
);

createGame({ id: 'ocean-planet' }, stage).start();
