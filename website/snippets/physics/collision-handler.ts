import { createGame, createStage } from '@zylem/game-lib/core';
import { createBox, createSphere } from '@zylem/game-lib/entity';

const floor = createBox({
	size: { x: 20, y: 1, z: 20 },
	collision: { static: true },
});

const ball = createSphere();

ball.onCollision(({ other }) => {
	if (other === floor) {
		// React to floor contact (enter phase by default).
	}
}, { phase: 'enter' });

createGame(createStage({}, floor, ball)).start();
