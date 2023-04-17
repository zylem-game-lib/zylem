import { ZylemGame } from './game/ZylemGame';
import { Options } from './interfaces/Options';

function helloWorld() {
	return 'Hello World!';
}

function create(options: Options) {
	return new ZylemGame(options);
}

const Zylem = {
	helloWorld,
	create,
};

export default Zylem;