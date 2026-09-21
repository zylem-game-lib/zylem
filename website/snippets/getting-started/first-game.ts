import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { WorldBoundary2DBehavior } from '@zylem/game-lib/behavior';

const ball = createSphere();

ball.use(WorldBoundary2DBehavior, {
	boundaries: { top: 3, bottom: -3, left: -6, right: 6 },
});

ball.onUpdate(({ me, inputs, delta }) => {
	const { Horizontal, Vertical } = inputs.p1.axes;
	const speed = 600 * delta;
	me.moveXY(Horizontal.value * speed, -Vertical.value * speed);
});

createGame(ball).start();
