import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { moveXY } from '@zylem/game-lib/actions';

const ship = createSphere();

ship.onSetup(({ me }) => {
	me.setPosition(0, 0, 0);
});

ship.onUpdate(({ me, inputs, delta }) => {
	const { Horizontal, Vertical } = inputs.p1.axes;
	const dx = Horizontal.value * 500 * delta;
	const dy = -Vertical.value * 500 * delta;
	me.moveXY(dx, dy);
	me.wrapAroundXY(8, 4);
});

createGame(ship).start();
