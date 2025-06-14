import { Color, Vector3 } from 'three';
import { box, game, Perspectives, stage } from '../../src/main';

const myGame = game(
	{ debug: true, id: 'camera-test' },
	stage({
		backgroundColor: new Color(Color.NAMES.gainsboro),
		camera: {
			position: new Vector3(0, 0, 10),
			target: new Vector3(0, 0, 0),
			zoom: 1,
			perspective: Perspectives.ThirdPerson,
		},
	}),
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
);

// Third person camera (camera with target that is controlled by the player)
// First person camera (camera that is in the target controlled by the player)
// Top down camera (camera with a window that is controlled by the player)

myGame.start();