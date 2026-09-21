import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import {
	RuntimeBoundary2DBehavior,
	RuntimeDynamicCircleBody2DBehavior,
	RuntimePlayerInput2DBehavior,
} from '@zylem/game-lib/behavior';

const paddle = createSphere({ name: 'paddle' });
paddle.use(RuntimeDynamicCircleBody2DBehavior, {
	initialVelocity: [0, 0],
});
paddle.use(RuntimePlayerInput2DBehavior, { player: 'p1', speed: 12 });

const arena = createSphere({ name: 'arena-marker' });
arena.use(RuntimeBoundary2DBehavior, {
	boundaries: { left: -8, right: 8, bottom: -4.5, top: 4.5 },
});

createGame(paddle, arena).start();
