import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import {
	moveBy,
	rotateBy,
	sequence,
	parallel,
	repeat,
	repeatForever,
	delay,
} from '@zylem/game-lib/actions';

const patrol = createSphere();

patrol.runAction(
	repeat(
		sequence(
			parallel(
				moveBy({ x: 3, duration: 1500 }),
				rotateBy({ y: 90, duration: 1500 }),
			),
			delay(250),
			moveBy({ x: -3, duration: 1500 }),
		),
		3,
	),
);

const spinner = createSphere();
spinner.runAction(repeatForever(rotateBy({ y: 360, duration: 2000 })));

createGame(patrol, spinner).start();
