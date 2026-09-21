import { createGame } from '@zylem/game-lib/core';
import { createLine, createParticleSystem } from '@zylem/game-lib/entity';
import { particlePresets } from '@zylem/game-lib/behavior';

const trail = createLine({
	name: 'path',
	points: [
		{ x: -4, y: 0.1, z: 0 },
		{ x: 0, y: 0.1, z: 2 },
		{ x: 4, y: 0.1, z: 0 },
	],
	linewidth: 2,
});

const sparks = createParticleSystem({
	name: 'sparks',
	preset: particlePresets.burst(),
	position: { x: 0, y: 1, z: 0 },
	autoplay: true,
	followPosition: true,
});

sparks.onUpdate(({ me }) => {
	if (!me.isPlaying()) {
		me.play();
	}
});

createGame(trail, sparks).start();
