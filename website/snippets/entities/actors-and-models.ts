import { createGame } from '@zylem/game-lib/core';
import { createActor } from '@zylem/game-lib/entity';

const hero = createActor({
	name: 'hero',
	models: ['/assets/models/hero.fbx'],
	animations: [{ key: 'idle', path: '/assets/animations/hero-idle.fbx' }],
	collisionShape: 'capsule',
	scale: { x: 1, y: 1, z: 1 },
	position: { x: 0, y: 0, z: 0 },
});

hero.onSetup(({ me }) => {
	me.playAnimation({ key: 'idle' });
});

createGame(hero).start();
