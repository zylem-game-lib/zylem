import { Color, Vector3 } from 'three';
import { game, stage, sphere, camera, Perspectives } from '../src/main';

// TODO: custom shader and texture for planet
const planet = await sphere({
	radius: 10,
	material: { color: new Color(Color.NAMES.blue) },
});

// TODO: ring entity for planet

// TODO: more options for camera
const camera1 = await camera({
	perspective: Perspectives.ThirdPerson,
	position: new Vector3(0, 0, -60),
	target: new Vector3(0, 0, 0),
});

// TODO: particle system for stage
const stage1 = stage({
	backgroundColor: new Color(Color.NAMES.black),
}, camera1);

stage1.add(planet);

const game1 = game({
	id: 'zylem-planet-demo',
	debug: true,
}, stage1);

game1.start();