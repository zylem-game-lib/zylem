import { createGame } from '@zylem/game-lib/core';
import { createBox } from '@zylem/game-lib/entity';
import { TopDownMovementBehavior } from '@zylem/game-lib/behavior';

const mover = createBox({ name: 'mover' });
const topDown = mover.use(TopDownMovementBehavior, {
	moveSpeed: 8,
	faceMovement: true,
});

mover.onUpdate(({ inputs }) => {
	const input = mover as typeof mover & {
		$topDownMovement: { moveX: number; moveY: number; faceX: number; faceY: number };
	};
	input.$topDownMovement.moveX = inputs.p1.axes.Horizontal.value;
	input.$topDownMovement.moveY = inputs.p1.axes.Vertical.value;
	input.$topDownMovement.faceX = inputs.p1.axes.SecondaryHorizontal.value;
	input.$topDownMovement.faceY = inputs.p1.axes.SecondaryVertical.value;
	void topDown.getFacingAngle();
});

createGame(mover).start();
