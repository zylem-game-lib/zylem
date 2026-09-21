import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { WorldBoundary2DBehavior } from '@zylem/game-lib/behavior';

const ship = createSphere({ name: 'ship' });

const boundary = ship.use(WorldBoundary2DBehavior, {
	boundaries: { top: 4, bottom: -4, left: -7, right: 7 },
});

ship.onUpdate(({ me, inputs, delta }) => {
	const speed = 500 * delta;
	let moveX = inputs.p1.axes.Horizontal.value * speed;
	let moveY = -inputs.p1.axes.Vertical.value * speed;
	const hits = boundary.getLastHits();
	if (hits?.left || hits?.right) moveX = 0;
	const clamped = boundary.getMovement(moveX, moveY);
	me.moveXY(clamped.moveX, clamped.moveY);
});

createGame(ship).start();
