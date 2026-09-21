import { createGame, createStage, gameConfig } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';

const player = createSphere({ name: 'player' });

const mainStage = createStage({ backgroundColor: '#1a1a2e' }, player);

const game = createGame(
	gameConfig({ id: 'demo', globals: { score: 0 } }),
	mainStage,
)
	.onSetup(({ globals }) => {
		globals.score = 0;
	})
	.onUpdate(() => {
		// Runs once per frame at game scope (after the active stage updates).
	});

void game.start();
