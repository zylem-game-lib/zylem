import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';

const p1 = createSphere();
const p2 = createSphere();

p1.onUpdate(({ me, inputs, delta }) => {
	const pad = inputs.p1;
	me.moveXY(pad.axes.Horizontal.value * 400 * delta, -pad.axes.Vertical.value * 400 * delta);
});

p2.onUpdate(({ me, inputs, delta }) => {
	const pad = inputs.p2;
	me.moveXY(pad.axes.Horizontal.value * 400 * delta, -pad.axes.Vertical.value * 400 * delta);
});

// Gamepad providers attach automatically; player 1 uses gamepad index 0, player 2 index 1.
createGame(p1, p2).start();
