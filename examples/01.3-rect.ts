import { game } from '../src/main';
import { rect } from '../src/lib/entities';
import { Vector2 } from 'three';

const rect1 = await rect({
	width: 300,
	height: 30,
	fillColor: 'red',
	strokeColor: 'black',
	strokeWidth: 2,
	radius: 10,
	padding: 10,
	stickToViewport: true,
	screenPosition: new Vector2(20, 20),
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

const myGame = game({
	id: 'rect-test',
	debug: true,
}, rect1);

myGame.start();