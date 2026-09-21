import { createGame, createCamera, Perspectives } from '@zylem/game-lib/core';
import type { FirstPersonPerspective } from '@zylem/game-lib/core';
import { createBox } from '@zylem/game-lib/entity';
import { FirstPersonBehavior } from '@zylem/game-lib/behavior';

const camera = createCamera({
	perspective: Perspectives.FirstPerson,
});
const fps = camera.getPerspective<FirstPersonPerspective>();

const player = createBox({ name: 'player', size: { x: 1, y: 1.8, z: 1 } });
player.use(FirstPersonBehavior, {
	perspective: fps,
	walkSpeed: 8,
	runSpeed: 16,
	lookSensitivity: 2,
});

player.onUpdate(({ inputs }) => {
	const input = player as typeof player & {
		$fps: {
			moveX: number;
			moveZ: number;
			lookX: number;
			lookY: number;
			sprint: boolean;
		};
	};
	input.$fps.moveX = inputs.p1.axes.Horizontal.value;
	input.$fps.moveZ = inputs.p1.axes.Vertical.value;
	input.$fps.lookX = inputs.p1.axes.SecondaryHorizontal.value;
	input.$fps.lookY = inputs.p1.axes.SecondaryVertical.value;
	input.$fps.sprint = inputs.p1.shoulders.LTrigger.held > 0;
});

createGame(player).start();
