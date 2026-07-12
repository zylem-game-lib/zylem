import { createGame, type GameLoadingEvent } from '@zylem/game-lib/core';

export default function createDemo() {
	const game = createGame();

	game.onLoading((event: GameLoadingEvent) => {
		console.log('my loading event: ', event);
	});

	return game;
}
