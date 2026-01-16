import { createGame, createRect, createStage } from '@zylem/game-lib';
import { Color, Vector2 } from 'three';

const rect1 = createRect({
	width: 300,
	height: 30,
	fillColor: 'red',
	strokeColor: 'black',
	strokeWidth: 2,
	radius: 10,
	padding: 10,
	stickToViewport: true,
	screenPosition: new Vector2(1, 1),
});

let width = 300;
rect1.onUpdate(({ me, delta }) => {
	width += delta * 10;
	me.updateRect({
		width: width,
		height: 30,
		fillColor: 'red',
		strokeColor: 'black',
		strokeWidth: 2,
		radius: 10,
	});
});

const stage1 = await createStage({
	backgroundColor: new Color(Color.NAMES.cornsilk),
});

stage1.add(rect1);

const myGame = createGame({
	id: 'rect-test',
	debug: true,
}, stage1);

export default myGame;