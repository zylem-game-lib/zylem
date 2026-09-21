import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { defaultTouchControls } from '@zylem/game-lib/input-ui';
import { mergeInputConfigs, useWASDForAxes } from '@zylem/game-lib/input';

const player = createSphere();

player.onUpdate(({ me, inputs, delta }) => {
	const { Horizontal, Vertical } = inputs.p1.axes;
	me.moveXY(Horizontal.value * 400 * delta, -Vertical.value * 400 * delta);
});

const input = mergeInputConfigs(
	useWASDForAxes('p1'),
	defaultTouchControls('p1', {
		theme: 'lagoon',
		joysticks: 'left',
		buttons: ['A', 'B'],
	}),
);

createGame(player).setInputConfiguration(input).start();
