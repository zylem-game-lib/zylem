import { createGame } from '@zylem/game-lib/core';
import {
	createBox,
	createSphere,
	createPlane,
	createCone,
	createCylinder,
	createDisk,
} from '@zylem/game-lib/entity';

const floor = createPlane({
	name: 'floor',
	tile: { x: 20, y: 20 },
	position: { x: 0, y: 0, z: 0 },
	collision: { static: true },
});

const pillar = createCylinder({
	name: 'pillar',
	radiusTop: 0.4,
	radiusBottom: 0.4,
	height: 3,
	position: { x: -2, y: 1.5, z: 0 },
});

const marker = createCone({
	name: 'marker',
	radius: 0.6,
	height: 2,
	position: { x: 2, y: 1, z: 0 },
});

const pad = createDisk({
	name: 'pad',
	outerRadius: 1.2,
	position: { x: 0, y: 0.05, z: 3 },
});

const ball = createSphere({
	name: 'ball',
	size: { x: 0.6, y: 0.6, z: 0.6 },
	position: { x: 0, y: 2, z: 0 },
});

const ramp = createBox({
	name: 'ramp',
	size: { x: 4, y: 0.2, z: 2 },
	position: { x: 0, y: 0.5, z: -3 },
});

createGame(floor, pillar, marker, pad, ball, ramp).start();
