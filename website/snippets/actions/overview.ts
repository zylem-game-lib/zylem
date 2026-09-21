import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { moveBy, delay, sequence, onPress } from '@zylem/game-lib/actions';

const coin = createSphere();

coin.runAction(
	sequence(
		moveBy({ y: 2, duration: 600 }),
		delay(200),
		moveBy({ y: -2, duration: 600 }),
	),
);

const press = coin.action(onPress());
coin.onUpdate(({ inputs }) => {
	press.check(inputs.p1.buttons.A.pressed);
	if (press.triggered) {
		coin.runAction(moveBy({ x: 1, duration: 300 }));
	}
});

createGame(coin).start();
