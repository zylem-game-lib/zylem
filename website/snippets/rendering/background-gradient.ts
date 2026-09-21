import { createGame, createStage, stageConfig } from '@zylem/game-lib/core';
import { createBackgroundShader, Fn, vec4 } from '@zylem/game-lib/graphics';

const sky = createBackgroundShader(
	Fn(() => vec4(0.15, 0.35, 0.75, 1.0))(),
);

const stage = createStage(
	stageConfig({
		backgroundShader: sky,
	}),
);

createGame(stage).start();
