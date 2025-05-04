import { game, stage, box, plane, sphere, sprite, actor, zone } from '../../src/main';
import { Vector3, Vector2 } from 'three';

const grassPath = 'playground/grass.jpg';
const woodPath = 'playground/wood-box.jpg';
const marsSurfacePath = 'playground/mars-surface.jpg';

const stage1 = stage({ gravity: new Vector3(0, -9.82, 0) });

const myBox = await box({
	size: new Vector3(4, 2, 1),
	position: { x: -3, y: 1, z: 4 },
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
	position: { x: 0, y: 2, z: 0 },
	collision: { static: false },
	material: { path: marsSurfacePath },
});

const mySprite = await sprite({
	position: { x: 5, y: 5, z: 0 },
	images: [
		{ name: 'rain-man', file: 'playground/rain-man.png' },
	],
});

const myActor = await actor({
	position: { x: 5, y: 5, z: 0 },
	models: ['playground/idle.fbx'],
	animations: ['playground/idle.fbx'],
});

const myZone = await zone({
	position: { x: 14, y: 3, z: 3 },
	size: new Vector3(5, 5, 10),
	onEnter: ({ self, visitor, globals }) => {
		console.log('entered', visitor, globals);
	},
	onExit: ({ self, visitor, globals }) => {
		console.log('exited', visitor, globals);
	},
});

const testGame = game(
	{ id: 'zylem', debug: true },
	stage1,
	myBox,
	myPlane,
	mySphere,
	mySprite,
	myActor,
	myZone,
);

testGame.start();
