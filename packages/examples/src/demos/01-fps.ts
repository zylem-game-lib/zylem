/// <reference types="@zylem/assets" />

import { Vector3 } from 'three';
import { 
	createGame, 
	createStage, 
	gameConfig,
} from '@zylem/game-lib';

import { createFloor, createArenaLevel } from './01-fps/level';

import skybox from '@zylem/assets/3d/skybox/default.png';

const stage = createStage({
	gravity: new Vector3(0, -20, 0),
	backgroundImage: skybox,
});

// Create game entities
const floor = createFloor();
const walls = createArenaLevel();

// Create game configuration
const myGameConfig = gameConfig({
	id: 'fps-demo',
	debug: true,
	bodyBackground: '#1a1a1a',
});

// Create the game
const game = createGame(
	myGameConfig,
	stage,
	floor,
	...walls,
);

export default game;
