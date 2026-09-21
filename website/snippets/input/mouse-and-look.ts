import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { useMouseLook } from '@zylem/game-lib/input';

const player = createSphere();

player.onUpdate(({ inputs }) => {
	const lookX = inputs.p1.axes.SecondaryHorizontal.value;
	const lookY = inputs.p1.axes.SecondaryVertical.value;
	// Secondary axes carry mouse look when useMouseLook is configured.
	void lookX;
	void lookY;
});

createGame(player)
	.setInputConfiguration(useMouseLook('p1', { sensitivity: 0.003 }))
	.start();
