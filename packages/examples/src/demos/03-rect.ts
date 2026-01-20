import { createGame, createRect, createStage } from '@zylem/game-lib';
import { Color, Vector2 } from 'three';

const position = new Vector2(650, 400);

const foregroundRect = createRect({
	width: 0,
	height: 30,
	fillColor: 'red',
	strokeColor: 'black',
	strokeWidth: 2,
	radius: 10,
	padding: 10,
	stickToViewport: true,
	screenPosition: position,
});

const backgroundRect = createRect({
	width: 300,
	height: 30,
	fillColor: 'transparent',
	strokeColor: 'blue',
	strokeWidth: 2,
	radius: 10,
	padding: 10,
	stickToViewport: true,
	screenPosition: position,
});

let width = 0;
foregroundRect.onUpdate(({ me, delta }) => {
	width += delta * 50;
	me.updateRect({
		width: Math.min(300, width),
	});
}).onSetup(({ me }) => {
	width = 0;
	me.updateRect({
		width: 0,
	});
});

const stage1 = createStage({
	backgroundColor: new Color(Color.NAMES.cornsilk),
});

stage1.add(foregroundRect);
stage1.add(backgroundRect);

const myGame = createGame({
	id: 'rect-test',
	debug: true,
}, stage1);

export default myGame;