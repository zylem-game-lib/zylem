import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { WorldBoundary2DBehavior } from '@zylem/game-lib/behavior';
import { ZylemGameElement } from '@zylem/game-lib/web-components';

const ball = createSphere();

ball.use(WorldBoundary2DBehavior, {
	boundaries: { top: 3, bottom: -3, left: -6, right: 6 },
});

ball.onUpdate(({ me, inputs, delta }) => {
	const { Horizontal, Vertical } = inputs.p1.axes;
	const speed = 600 * delta;
	me.moveXY(Horizontal.value * speed, -Vertical.value * speed);
});

const host = document.querySelector('zylem-game');
if (!(host instanceof ZylemGameElement)) {
	throw new Error('Expected a <zylem-game> element in the document');
}
host.game = createGame(ball);
