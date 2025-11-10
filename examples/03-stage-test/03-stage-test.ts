import { createGame, gameConfig } from '../../src/api/main';
import { stage0 } from './stage0';
import { stage1 } from './stage1';
import { stage2 } from './stage2';
import { stage3 } from './stage3';

const myGameConfig = gameConfig({
	id: 'stage-test',
	debug: true,
	bodyBackground: '#000000',
});

const game = createGame(
	myGameConfig,
	stage0,
	stage1,
	stage2,
	stage3,
);

game.update = ({ me, inputs }) => {
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
}

// TODO: stage transitions
game.start();
