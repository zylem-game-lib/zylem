import { createGame, createStage, gameConfig } from '@zylem/game-lib/core';
import { useArrowsForAxes } from '@zylem/game-lib/input';

void createGame(
	gameConfig({
		id: 'retro-demo',
		preset: 'NES',
		resolution: '256x240',
		fullscreen: true,
		input: useArrowsForAxes('p1'),
		mobile: {
			controls: true,
			resolution: 'native',
		},
	}),
	createStage(),
).start();
