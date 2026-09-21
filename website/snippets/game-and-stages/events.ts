import { createGame, createStage } from '@zylem/game-lib/core';
import { zylemEventBus } from '@zylem/game-lib/events';
import { createSphere } from '@zylem/game-lib/entity';

const busUnsub = zylemEventBus.on('loading:progress', (payload) => {
	console.log(payload.message, payload.progress);
});

const ball = createSphere({ name: 'ball' });
ball.listen('entity:model:loaded', (payload) => {
	console.log(payload.entityId, payload.success);
});

const game = createGame(createStage(), ball);
const gameUnsub = game.listen('loading:start', (payload) => {
	console.log(payload.stageName, payload.stageIndex);
});

void game.start();

void busUnsub;
void gameUnsub;
