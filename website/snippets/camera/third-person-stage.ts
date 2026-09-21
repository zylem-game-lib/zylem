import {
	createCamera,
	createGame,
	createStage,
	Perspectives,
	stageConfig,
} from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';

const player = createSphere();

const camera = createCamera({
	perspective: Perspectives.ThirdPerson,
	damping: 0.15,
});

const mainStage = createStage(
	stageConfig({ gravity: { x: 0, y: -9.81, z: 0 } }),
	player,
	camera,
);

player.onSetup(({ me }) => {
	camera.addTarget(me as unknown as Parameters<typeof camera.addTarget>[0]);
});

createGame(mainStage).start();
