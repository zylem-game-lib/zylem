import { createGame, gameConfig } from '@zylem/game-lib';
import { stageZero } from './stage-test/stage0';
import { stage1 } from './stage-test/stage1';
import { stage2 } from './stage-test/stage2';
import { stage3 } from './stage-test/stage3';

const myGameConfig = gameConfig({
	id: 'stage-test',
	debug: true,
	bodyBackground: '#000000',
});

const game = createGame(
	myGameConfig,
	stageZero,
	stage1,
	stage2,
	stage3,
).onUpdate(({ me, inputs }) => {
	const { p1 } = inputs;

	if (p1.buttons.A.pressed) {
		game.nextStage();
	}
	if (p1.buttons.B.pressed) {
		game.previousStage();
	}
	if (p1.buttons.Start.pressed) {
		game.reset();
	}
});

// TODO: stage transitions
export default game;
