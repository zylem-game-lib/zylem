import { Color } from 'three';
import { game, stage } from '../../src/main';

/** Basic game with stages */
const aquaStage = { backgroundColor: new Color(Color.NAMES.aquamarine) };
const bisqueStage = { backgroundColor: new Color(Color.NAMES.bisque) };
const crimsonStage = { backgroundColor: new Color(Color.NAMES.crimson) };
const darkStage = { backgroundColor: new Color(Color.NAMES.darkblue) };

const myGame = game(
	stage(aquaStage),
	stage(bisqueStage),
	stage(crimsonStage),
	stage(darkStage),
);

myGame.update = ({ inputs, game }) => {
	const { p1 } = inputs;

	if (p1.buttons.A.pressed) {
		game && game.nextStage();
	}
	if (p1.buttons.B.pressed) {
		game && game.previousStage();
	}
	if (p1.buttons.Start.pressed) {
		game && game.reset();
	}
}

// TODO: stage transitions

myGame.start();
