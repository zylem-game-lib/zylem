import { createStage, box, plane, sphere, sprite, zone, camera } from '@zylem/game-lib';
import { Vector3, Vector2, Color } from 'three';
import { playgroundActor } from '../../utils';

import grassPath from '@zylem/assets/3d/textures/grass.jpg';
import woodPath from '@zylem/assets/3d/textures/wood-box.jpg';
import marsSurfacePath from '@zylem/assets/3d/textures/mars-surface.jpg';
import rainManPath from '@zylem/assets/2d/rain-man.png';

const myBox = await box({
	size: new Vector3(4, 2, 1),
	position: { x: -10, y: 4, z: 4 },
	collision: { static: false },
	material: { path: woodPath, repeat: new Vector2(2, 2) },
});

let counter = 0;

myBox.onUpdate(({ delta }) => {
	counter += delta;
	// console.log('counter', counter);
	if (counter > 3) {
		// destroy(myBox);
	}
}).onDestroy(() => {
	console.log('box has been destroyed');
});

const myPlane = await plane({
	tile: new Vector2(200, 200),
	position: { x: 0, y: 0, z: 0 },
	collision: { static: true },
	material: { path: grassPath, repeat: new Vector2(20, 20) },
});

const mySphere = await sphere({
	size: new Vector3(4, 4, 4),
	position: { x: -5, y: 4, z: 0 },
	collision: { static: false },
	material: { path: marsSurfacePath },
});

const mySprite = await sprite({
	position: { x: 5, y: 5, z: 0 },
	images: [
		{ name: 'rain-man', file: rainManPath },
	],
	name: 'rain-man',
});

const myActor = await playgroundActor('mascot');

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

export const stage3 = createStage({
	backgroundColor: new Color(Color.NAMES.green),
	gravity: new Vector3(0, -9.82, 0),
}, camera({
	position: new Vector3(0, 10, 30),
}), myBox, myPlane, mySphere, mySprite, myActor, myZone);
