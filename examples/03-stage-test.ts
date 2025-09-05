import { Color } from 'three';
import { game, stage } from '../src/main';


/** Basic game with stages */
const aquaStage = stage({ backgroundColor: new Color(Color.NAMES.aquamarine) });
const bisqueStage = stage({ backgroundColor: new Color(Color.NAMES.bisque) });
const crimsonStage = stage({ backgroundColor: new Color(Color.NAMES.crimson) });
const darkStage = stage({ backgroundColor: new Color(Color.NAMES.darkblue) });

const myGame = game(
	{ id: 'stage-test', debug: true },
	aquaStage,
	bisqueStage,
	crimsonStage,
	darkStage,
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
