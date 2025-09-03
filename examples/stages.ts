import { Color } from 'three';
import { game, stage, actions } from '../src/main';
const { wait } = actions;

/** Basic game with stages */
const aquaStage = {
	backgroundColor: new Color(Color.NAMES.aquamarine),
};

const bisqueStage = {
	backgroundColor: new Color(Color.NAMES.bisque),
};

const crimsonStage = {
	backgroundColor: new Color(Color.NAMES.crimson),
};

const myGame = game(
	stage(aquaStage),
	stage(bisqueStage),
	stage(crimsonStage),
);

myGame.setup(({ game }) => {
	wait(3000, () => {
		game.nextStage();
	});
	wait(6000, () => {
		game.nextStage();
	});
});
myGame.start();
