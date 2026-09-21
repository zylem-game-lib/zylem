import { createGame } from '@zylem/game-lib/core';
import { createSprite, createText } from '@zylem/game-lib/entity';

const ship = createSprite({
	name: 'ship',
	size: { x: 2, y: 2, z: 1 },
	images: [{ name: 'ship', file: '/assets/sprites/ship.png' }],
	animations: [
		{
			name: 'thrust',
			frames: ['ship'],
			speed: 8,
			loop: true,
		},
	],
	position: { x: 0, y: 0, z: 0 },
});

const scoreLabel = createText({
	name: 'score',
	text: 'Score: 0',
	stickToViewport: true,
	screenPosition: { x: 16, y: 16 },
});

scoreLabel.onUpdate(({ me, globals }) => {
	const score = (globals.score as number | undefined) ?? 0;
	me.updateText(`Score: ${score}`);
});

createGame(ship, scoreLabel).start();
