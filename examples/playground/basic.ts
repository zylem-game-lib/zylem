import { Color } from 'three';
import { game, stage, actions } from '../../src/main';
const { wait } = actions;

/** Basic game */
// const basicGame = game();
// basicGame.start();


/** Basic game with stages */
const aquaStage = {
	backgroundColor: new Color(Color.NAMES.aquamarine),
	update: () => {
		wait(3000, () => {
			basicGameWithStages.nextStage();
		});
	}
};

const biqueStage = {
	backgroundColor: new Color(Color.NAMES.bisque),
};

const basicGameWithStages = game(
	stage(aquaStage),
	stage(biqueStage)
);

basicGameWithStages.start();

// basicGameWithStages.update = ({ game }) => {
// 	const { wait } = actions;
// 	wait(2000, () => {
// 		game.nextStage();
// 	});
// };