import {
	createCamera,
	createStage,
	Perspectives,
	setCameraFeed,
	stageConfig,
} from '@zylem/game-lib/core';
import { createBox } from '@zylem/game-lib/entity';

const feedCamera = createCamera({
	perspective: Perspectives.ThirdPerson,
	position: { x: 0, y: 20, z: 40 },
	target: { x: 0, y: 0, z: 0 },
	renderToTexture: { width: 1024, height: 576 },
});

const monitor = createBox({ size: { x: 16, y: 9, z: 0.2 } });

monitor.onSetup(({ me }) => {
	setCameraFeed(
		me as unknown as Parameters<typeof setCameraFeed>[0],
		feedCamera,
	);
});

export const stageWithMonitor = createStage(stageConfig({}), monitor, feedCamera);
