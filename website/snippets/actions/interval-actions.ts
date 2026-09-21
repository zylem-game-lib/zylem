import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import {
	moveBy,
	moveTo,
	rotateBy,
	delay,
	callFunc,
	fadeOpacity,
	sequence,
} from '@zylem/game-lib/actions';

const actor = createSphere();

actor.runAction(
	sequence(
		moveBy({ x: 4, duration: 800 }),
		delay(300),
		rotateBy({ y: 180, duration: 500 }),
		callFunc(() => {
			actor.runAction(fadeOpacity({ from: 1, to: 0.3, duration: 400 }));
		}),
		moveTo({ x: 0, y: 0, z: 0, duration: 1000 }),
	),
);

createGame(actor).start();
