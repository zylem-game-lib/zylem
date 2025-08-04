import { Color } from 'three';
import { game, stage } from '../../src/main';

/** Basic game with stages */
const aquaStage = { backgroundColor: new Color(Color.NAMES.aquamarine) };
const bisqueStage = { backgroundColor: new Color(Color.NAMES.bisque) };
const crimsonStage = { backgroundColor: new Color(Color.NAMES.crimson) };
const darkStage = { backgroundColor: new Color(Color.NAMES.darkblue) };

const myGame = game(
	{ id: 'zylem', debug: true },
	stage(aquaStage),
	stage(bisqueStage),
	stage(crimsonStage),
	stage(darkStage),
);

// TODO: should use "me/self" instead of "myGame"
myGame.update = ({ inputs }) => {
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
