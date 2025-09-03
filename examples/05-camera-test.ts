import { Color, Vector3 } from 'three';
import { box, Perspectives, game, stage, camera } from '../src/main';

const boxes = [
	await box({
		position: { x: 0, y: 0, z: 0 },
		material: { color: new Color(Color.NAMES.lightgreen) }
	}),
	await box({
		position: { x: 1, y: -1, z: 0 },
		material: { color: new Color(Color.NAMES.red) }
	}),
	await box({
		position: { x: 0, y: -1, z: 1 },
		material: { color: new Color(Color.NAMES.blue) }
	}),
];

const myStage = await stage(
	{ backgroundColor: new Color(Color.NAMES.gainsboro) },
	camera({
		position: new Vector3(0, 5, 10),
		target: new Vector3(0, 0, 0),
		zoom: 1,
		perspective: Perspectives.ThirdPerson,
	})
);

const cameraTest = await game(
	{ id: 'camera-test', debug: true },
	myStage,
	...boxes,
);

// Third person camera (camera with target that is controlled by the player)
// First person camera (camera that is in the target controlled by the player)
// Top down camera (camera with a window that is controlled by the player)

cameraTest.start();