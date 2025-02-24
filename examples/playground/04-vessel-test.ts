import { game, vessel, box, plane, stage } from '../../src/main';
import { Vector2, Vector3 } from 'three';

const grassPath = 'playground/grass.jpg';
// const test = vessel();
// const test2 = vessel(vessel(), vessel());
// const test3 = vessel({ test: 'test' }, vessel({ test1: 'test' }), vessel({ test2: 'test' }));
const myBox = await box({
	size: new Vector3(4, 2, 1),
	position: { x: 0, y: 3, z: 0 },
	collision: { static: false },
	material: { path: grassPath, repeat: new Vector2(2, 2) },
});
const myPlane = await plane({
	tile: new Vector2(200, 200),
	position: { x: 0, y: 0, z: 0 },
	collision: { static: true },
	material: { path: grassPath, repeat: new Vector2(20, 20) },
});

const stage1 = stage({ gravity: new Vector3(0, -9.82, 0) });
const testGame = game(
	{ id: 'zylem', debug: true },
	stage1,
	// test, test2, test3,
	myBox,
	myPlane
);

testGame.start();


