import { createGame } from '@zylem/game-lib/core';
import { createBox, createFog, createLight } from '@zylem/game-lib/entity';

const ground = createBox({
	name: 'ground',
	size: { x: 30, y: 0.2, z: 30 },
	position: { x: 0, y: -0.1, z: 0 },
	collision: { static: true },
});

const sun = createLight({
	type: 'directional',
	intensity: 1.2,
	position: { x: 10, y: 20, z: 10 },
	target: { x: 0, y: 0, z: 0 },
	castShadow: true,
});

const fill = createLight({
	type: 'hemisphere',
	skyColor: '#cceeff',
	groundColor: '#223344',
	intensity: 0.4,
});

const mist = createFog({
	type: 'linear',
	color: '#9aa3ad',
	start: 15,
	end: 80,
	height: { enabled: true, level: 4, falloff: 0.25 },
});

createGame(ground, sun, fill, mist).start();
