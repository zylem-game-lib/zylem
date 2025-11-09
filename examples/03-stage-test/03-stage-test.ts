import { game, gameConfig } from '../../src/main';
import { stage0 } from './stage0';
import { stage1 } from './stage1';
import { stage2 } from './stage2';
import { stage3 } from './stage3';

const myGameConfig = gameConfig({
	id: 'stage-test',
	debug: true,
	bodyBackground: '#000000',
});

const myGame = game(
	myGameConfig,
	stage0,
	stage1,
	stage2,
	stage3,
);

myGame.update = ({ me, inputs }) => {
	const { p1 } = inputs;

	if (p1.buttons.A.pressed) {
		myGame.nextStage();
	}
	if (p1.buttons.B.pressed) {
		myGame.previousStage();
	}
	if (p1.buttons.Start.pressed) {
		myGame.reset();
	}
}

// TODO: stage transitions
myGame.start();
