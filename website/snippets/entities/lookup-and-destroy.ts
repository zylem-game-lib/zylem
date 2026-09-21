import { createGame, createStage } from '@zylem/game-lib/core';
import { createSphere, createText, destroy } from '@zylem/game-lib/entity';

const enemy = createSphere({
	name: 'enemy',
	size: { x: 1, y: 1, z: 1 },
	position: { x: 3, y: 1, z: 0 },
});

const status = createText({
	name: 'status',
	text: 'Enemy alive',
	stickToViewport: true,
	screenPosition: { x: 16, y: 48 },
});

const mainStage = createStage({}, enemy, status);

mainStage.onSetup(() => {
	status.updateText('Enemy spawned');
});

let elapsed = 0;

mainStage.onUpdate(({ globals, delta }) => {
	elapsed += delta;
	if (elapsed < 2) {
		return;
	}
	destroy(enemy, globals);
});

createGame(mainStage).start();
