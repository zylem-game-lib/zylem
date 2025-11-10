import { createGame } from '../src/api/main';

/* Basic game */
const game = createGame({
	id: 'basic-game',
	debug: true
});

game.start();
