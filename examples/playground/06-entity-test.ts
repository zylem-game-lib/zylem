import { game, stage, box, plane, sphere } from '../../src/main';
import { Vector3, Vector2 } from 'three';

const grassPath = 'playground/grass.jpg';
const woodPath = 'playground/wood-box.jpg';
const marsSurfacePath = 'playground/mars-surface.jpg';

const stage1 = stage({ gravity: new Vector3(0, -9.82, 0) });

const myBox = await box({
	size: new Vector3(4, 2, 1),
	position: { x: 3, y: 1, z: 0 },
	collision: { static: false },
	material: { path: woodPath, repeat: new Vector2(2, 2) },
});

const myPlane = await plane({
	tile: new Vector2(200, 200),
	position: { x: 0, y: 0, z: 0 },
	collision: { static: true },
	material: { path: grassPath, repeat: new Vector2(20, 20) },
});

const mySphere = await sphere({
	size: new Vector3(4, 4, 4),
	position: { x: 0, y: 3, z: 0 },
	collision: { static: false },
	material: { path: marsSurfacePath },
});


const testGame = game(
	{ id: 'zylem', debug: true },
	stage1,
	myBox,
	myPlane,
	mySphere,
);

testGame.start();
