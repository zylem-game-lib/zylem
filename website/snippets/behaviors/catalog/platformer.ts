import { createGame } from '@zylem/game-lib/core';
import { createBox } from '@zylem/game-lib/entity';
import { Platformer2DBehavior } from '@zylem/game-lib/behavior';

const player = createBox({ name: 'hero', size: { x: 1, y: 1, z: 1 } });
const platformer = player.use(Platformer2DBehavior, {
	walkSpeed: 8,
	runSpeed: 14,
	jumpForce: 12,
	maxJumps: 2,
});

player.onUpdate(({ inputs }) => {
	const input = player as typeof player & {
		$platformer2D: { moveX: number; jump: boolean; run: boolean };
	};
	input.$platformer2D.moveX = inputs.p1.axes.Horizontal.value;
	input.$platformer2D.jump = inputs.p1.buttons.A.held > 0;
	input.$platformer2D.run = inputs.p1.shoulders.LTrigger.held > 0;
	void platformer.getState();
	void platformer.isGrounded();
});

createGame(player).start();
