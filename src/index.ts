import { ZylemGame } from './game/ZylemGame';
import { GameOptions } from './interfaces/Game';
import { GameEntityType } from './interfaces/Entity';
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
	GameEntityType,
};

export default Zylem;