import { createGame, createStage, stageConfig, entitySpawner } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';

const bulletFactory = (x: number, y: number) =>
	createSphere({ name: 'bullet', position: { x, y, z: 0 } });

const spawner = entitySpawner(bulletFactory);

const level = createStage(
	stageConfig({
		gravity: { x: 0, y: -9.8, z: 0 },
		variables: { wave: 1 },
	}),
	createSphere({ name: 'player' }),
)
	.onSetup(async () => {
		await spawner.spawn(level, 0, 2);
	})
	.onUpdate(() => {
		const bullet = level.getEntityByName('bullet');
		if (bullet) {
			// per-frame stage logic
		}
	});

void createGame(level).start();
