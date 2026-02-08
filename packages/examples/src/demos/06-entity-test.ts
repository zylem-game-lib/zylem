import {
	createGame, createStage,
	createBox, createPlane, createSphere, createSprite, createZone,
	createCone, createPyramid, createCylinder, createPill,
} from '@zylem/game-lib';
import { Vector3, Vector2 } from 'three';
import { playgroundActor } from '../utils';

import grassPath from '@zylem/assets/3d/textures/grass.jpg';
import woodPath from '@zylem/assets/3d/textures/wood-box.jpg';
import marsSurfacePath from '@zylem/assets/3d/textures/mars-surface.jpg';
import rainManPath from '@zylem/assets/2d/rain-man.png';

const stage1 = createStage({ gravity: new Vector3(0, -9.82, 0) })
	.onSetup(({ camera }: any) => {
		(camera as any)?.camera.position.set(0, 10, 40);
		(camera as any)?.camera.lookAt(0, 0, 0);
	});

// ─── Existing entities ───────────────────────────────────────────────

const myBox = createBox({
	size: new Vector3(4, 2, 1),
	position: { x: -10, y: 4, z: 4 },
	collision: { static: false },
	material: { path: woodPath, repeat: new Vector2(2, 2) },
});

const myPlane = createPlane({
	tile: new Vector2(200, 200),
	position: { x: 0, y: 0, z: 0 },
	collision: { static: true },
	material: { path: grassPath, repeat: new Vector2(20, 20) },
});

const mySphere = createSphere({
	size: new Vector3(4, 4, 4),
	position: { x: -5, y: 4, z: 0 },
	collision: { static: false },
	material: { path: marsSurfacePath },
});

const mySprite = createSprite({
	position: { x: 5, y: 5, z: 0 },
	images: [
		{ name: 'rain-man', file: rainManPath },
	],
});

const myActor = playgroundActor('mascot');

const myZone = createZone({
	position: { x: 14, y: 3, z: 3 },
	size: new Vector3(5, 5, 10),
	onEnter: ({ self, visitor, globals }: any) => {
		console.log('entered', visitor, globals);
	},
	onExit: ({ self, visitor, globals }: any) => {
		console.log('exited', visitor, globals);
	},
});

// ─── New entities ────────────────────────────────────────────────────

const myCone = createCone({
	radius: 1.5,
	height: 3,
	position: { x: -15, y: 5, z: 0 },
	collision: { static: false },
});

const myPyramid = createPyramid({
	radius: 2,
	height: 3,
	position: { x: -20, y: 5, z: 0 },
	collision: { static: false },
});

const myCylinder = createCylinder({
	radiusTop: 1,
	radiusBottom: 1,
	height: 3,
	position: { x: 10, y: 5, z: 0 },
	collision: { static: false },
});

const myPill = createPill({
	radius: 0.75,
	length: 2,
	position: { x: 20, y: 5, z: 0 },
	collision: { static: false },
});

// ─── Compound entity ─────────────────────────────────────────────────
// A box with two sphere "bumpers" on either side, all sharing one rigid body.

const compoundEntity = createBox({
	size: new Vector3(2, 2, 2),
	position: { x: 0, y: 8, z: -8 },
	collision: { static: false },
	material: { path: woodPath },
	additionalColliders: [
		{ shape: 'sphere', radius: 1, offset: { x: 2, y: 0, z: 0 } },
		{ shape: 'sphere', radius: 1, offset: { x: -2, y: 0, z: 0 } },
	],
	additionalMeshes: [
		{ geometry: 'sphere', radius: 1, position: { x: 2, y: 0, z: 0 } },
		{ geometry: 'sphere', radius: 1, position: { x: -2, y: 0, z: 0 } },
	],
});

// ─── Game ────────────────────────────────────────────────────────────

const testGame = createGame(
	{ id: 'zylem', debug: true },
	stage1,
	myBox,
	myPlane,
	mySphere,
	mySprite,
	myActor,
	myZone,
	myCone,
	myPyramid,
	myCylinder,
	myPill,
	compoundEntity,
);

export default testGame;
