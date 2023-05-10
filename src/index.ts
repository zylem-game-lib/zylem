import { ZylemGame } from './game/ZylemGame';
import { GameOptions } from './interfaces/Game';
import { ZylemBox } from './stage/objects';
import { ZylemDebug } from './game/ZylemDebug';

const debug = new ZylemDebug();

function helloWorld() {
	return 'Hello World!';
}

function create(options: GameOptions) {
	debug.appendToDOM();
	options.debug = debug;
	return new ZylemGame(options);
}

const Zylem = {
	helloWorld,
	create,
	ZylemBox,
};

export default Zylem;