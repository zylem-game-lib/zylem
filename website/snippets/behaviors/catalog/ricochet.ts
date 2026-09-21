import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { Ricochet2DBehavior, WorldBoundary2DBehavior } from '@zylem/game-lib/behavior';

const ball = createSphere({ name: 'ball' });
ball.use(WorldBoundary2DBehavior, {
	boundaries: { top: 4, bottom: -4, left: -8, right: 8 },
});
ball.use(Ricochet2DBehavior, {
	minSpeed: 3,
	maxSpeed: 18,
	reflectionMode: 'simple',
});

ball.onUpdate(({ me, delta }) => {
	me.moveXY(200 * delta, 120 * delta);
});

createGame(ball).start();
