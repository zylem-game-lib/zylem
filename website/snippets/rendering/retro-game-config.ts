import { AspectRatio, createGame, createStage } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';

const ball = createSphere();

createGame(
	{
		aspectRatio: AspectRatio.FourByThree,
		preset: 'NES',
		resolution: '256x240',
	},
	createStage({}, ball),
).start();
