import { createGame, createStage, gameConfig } from '@zylem/game-lib/core';

const menu = createStage({ backgroundColor: '#111111' });
const level = createStage({ backgroundColor: '#222222' });

const game = createGame(gameConfig({ id: 'nav-demo' }), menu, level);

void game.start().then(() => {
	game.nextStage({
		transition: {
			duration: 0.8,
			easing: 'easeInOut',
		},
	});
});
