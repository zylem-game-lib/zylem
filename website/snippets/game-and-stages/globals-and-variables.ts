import { createGame, createStage, gameConfig } from '@zylem/game-lib/core';
import {
	setGlobal,
	getGlobal,
	createGlobal,
	setVariable,
	getVariable,
} from '@zylem/game-lib/globals';

const stage = createStage({ variables: { coins: 0 } });

const game = createGame(
	gameConfig({ globals: { score: 0, lives: 3 } }),
	stage,
).onGlobalChange('score', (value) => {
	console.log('score', value);
});

void game.start().then(() => {
	setGlobal('score', 100);
	createGlobal('highScore', 0);

	const currentStage = game.getCurrentStage();
	if (currentStage) {
		setVariable(currentStage, 'coins', getVariable<number>(currentStage, 'coins') ?? 0);
		console.log(getGlobal<number>('score'));
	}
});
