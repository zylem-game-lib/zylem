import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { throttle, onPress, onRelease } from '@zylem/game-lib/actions';

const player = createSphere();

const fireCooldown = player.action(throttle({ duration: 400 }));
const jumpPress = player.action(onPress());
const landRelease = player.action(onRelease());

player.onUpdate(({ me, inputs, delta }) => {
	const { Horizontal, Vertical } = inputs.p1.axes;
	me.moveXY(Horizontal.value * 400 * delta, -Vertical.value * 400 * delta);

	jumpPress.check(inputs.p1.buttons.A.pressed);
	if (jumpPress.triggered) {
		me.moveY(8);
	}

	landRelease.check(inputs.p1.buttons.A.pressed);

	if (inputs.p1.buttons.X.pressed && fireCooldown.ready) {
		fireCooldown.consume();
		// spawn projectile, play sfx, etc.
	}
});

createGame(player).start();
