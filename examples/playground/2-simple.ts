import { Vector3 } from 'three';
import { game, stage, box } from '../../src/main';

const testBox = await box({ texture: 'playground/rain-man.png', shader: 'fire' });

const example = game(
	{ debug: true },
	stage({
		// gravity: new Vector3(0, -9, 0)
	}),
	testBox
);

example.start();
