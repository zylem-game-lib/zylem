import { createGame } from '@zylem/game-lib/core';
import { createBox } from '@zylem/game-lib/entity';
import { Jumper2DBehavior } from '@zylem/game-lib/behavior';

const hero = createBox({ name: 'hero', size: { x: 1, y: 1, z: 0.2 } });
const jumper = hero.use(Jumper2DBehavior, {
	jumpHeight: 3,
	maxJumps: 2,
	coyoteTimeMs: 120,
	jumpBufferMs: 100,
});

hero.onUpdate(({ inputs }) => {
	const input = hero as typeof hero & {
		$jumper2d: { jumpPressed: boolean; jumpHeld: boolean; jumpReleased: boolean };
	};
	input.$jumper2d.jumpPressed = inputs.p1.buttons.A.pressed;
	input.$jumper2d.jumpHeld = inputs.p1.buttons.A.held > 0;
	input.$jumper2d.jumpReleased = inputs.p1.buttons.A.released;
	void jumper.getJumpsRemaining();
});

createGame(hero).start();
