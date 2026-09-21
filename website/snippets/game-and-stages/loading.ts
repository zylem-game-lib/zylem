import { createGame, createStage } from '@zylem/game-lib/core';
import { zylemEventBus } from '@zylem/game-lib/events';
import { createSphere } from '@zylem/game-lib/entity';

const hero = createSphere({ name: 'hero' });

const stage = createStage({}, hero);
stage.onLoading((event) => {
	if (event.type === 'progress') {
		console.log(event.message, event.current, event.total);
	}
});

const game = createGame(stage);
game.onLoading((event) => {
	console.log(event.stageName, event.type, event.progress);
});

const busUnsub = zylemEventBus.on('loading:complete', (payload) => {
	console.log('done', payload.message);
});

void game.start();
void busUnsub;
