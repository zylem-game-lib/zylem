import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { WorldBoundary2DBehavior } from '@zylem/game-lib/behavior';

const ball = createSphere();

const boundary = ball.use(WorldBoundary2DBehavior, {
	boundaries: { top: 3, bottom: -3, left: -6, right: 6 },
});

ball.onUpdate(({ me, inputs, delta }) => {
	const { Horizontal, Vertical } = inputs.p1.axes;
	let moveX = Horizontal.value * 600 * delta;
	let moveY = -Vertical.value * 600 * delta;
	const clamped = boundary.getMovement(moveX, moveY);
	me.moveXY(clamped.moveX, clamped.moveY);
});

createGame(ball).start();
