import { Color, Vector3 } from 'three';
import { createBox, Perspectives, createGame, createStage, createCamera } from '@zylem/game-lib';

const boxes = [
	createBox({
		position: { x: 0, y: 0, z: 0 },
		material: { color: new Color(Color.NAMES.lightgreen) }
	}),
	createBox({
		position: { x: 1, y: -1, z: 0 },
		material: { color: new Color(Color.NAMES.red) }
	}),
	createBox({
		position: { x: 0, y: -1, z: 1 },
		material: { color: new Color(Color.NAMES.blue) }
	}),
];

const myStage = createStage(
	{ backgroundColor: new Color(Color.NAMES.gainsboro) },
	createCamera({
		position: new Vector3(0, 5, 10),
		target: new Vector3(0, 0, 0),
		zoom: 1,
		perspective: Perspectives.ThirdPerson,
	})
);

const cameraTest = createGame(
	{ id: 'camera-test', debug: true },
	myStage,
	...boxes,
);

// Third person camera (camera with target that is controlled by the player)
// First person camera (camera that is in the target controlled by the player)
// Top down camera (camera with a window that is controlled by the player)

export default cameraTest;