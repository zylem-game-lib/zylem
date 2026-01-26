/// <reference types="@zylem/assets" />
import { Color, Vector2, Vector3 } from 'three';
import { createGame, createStage, createBox, createSphere, createCamera, createPlane, createText } from '@zylem/game-lib';

import skybox from '@zylem/assets/3d/skybox/default.png';
import grassNormalPath from '@zylem/assets/3d/textures/grass-normal.png';

// --------------------------------------------------
// Simple Instancing Test
// --------------------------------------------------

// 1. Red Box Batch
const box1 = createBox({
	position: new Vector3(-2, 5, 0),
	material: { color: new Color(0xff0000) },
    batched: true
});

const box2 = createBox({
	position: new Vector3(2, 5, 0),
	material: { color: new Color(0xff0000) }, // Same color -> Same batch
    batched: true
});

// 2. Ground
const ground = createPlane({
	collision: { static: true },
	tile: new Vector2(20, 20),
	position: new Vector3(0, 0, 0),
	material: { path: grassNormalPath, color: new Color(0x666666) },
});

const game = createGame(
	{ id: 'simple-instancing', debug: true },
	createStage(
		{ gravity: new Vector3(0, -9.81, 0), backgroundImage: skybox },
		createCamera({ position: new Vector3(0, 5, 20) })
	),
	ground,
	box1,
	box2
);

export default game;
