import { createGame } from '@zylem/game-lib/core';
import { createSphere, createZone } from '@zylem/game-lib/entity';

const player = createSphere({
	name: 'player',
	size: { x: 0.8, y: 0.8, z: 0.8 },
	position: { x: 0, y: 1, z: 0 },
});

const goal = createZone({
	name: 'goal-zone',
	size: { x: 4, y: 2, z: 4 },
	position: { x: 0, y: 1, z: 5 },
});

goal
	.onEnter(({ visitor, globals }) => {
		(globals as { inGoal?: boolean }).inGoal = true;
		console.log('entered', visitor.options.name);
	})
	.onHeld(({ heldTime, visitor }) => {
		if (heldTime > 2 && visitor.options.name === 'player') {
			console.log('hold complete');
		}
	})
	.onExit(({ visitor, globals }) => {
		(globals as { inGoal?: boolean }).inGoal = false;
		console.log('exited', visitor.options.name);
	});

createGame(player, goal).start();
