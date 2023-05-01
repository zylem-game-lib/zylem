import { ZylemGame } from './game/ZylemGame';
import { GameOptions } from './interfaces/Game';
import { ZylemBox } from './stage/objects';

function helloWorld() {
	return 'Hello World!';
}

function create(options: GameOptions) {
	return new ZylemGame(options);
}

const Zylem = {
	helloWorld,
	create,
	ZylemBox,
};

export default Zylem;