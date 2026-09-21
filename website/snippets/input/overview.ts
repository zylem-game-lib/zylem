import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { useWASDForAxes } from '@zylem/game-lib/input';

const player = createSphere();

player.onUpdate(({ me, inputs, delta }) => {
	const pad = inputs.p1;
	const speed = 450 * delta;
	me.moveXY(pad.axes.Horizontal.value * speed, -pad.axes.Vertical.value * speed);

	if (pad.buttons.A.pressed) {
		me.moveY(6);
	}
});

createGame(player).setInputConfiguration(useWASDForAxes('p1')).start();
