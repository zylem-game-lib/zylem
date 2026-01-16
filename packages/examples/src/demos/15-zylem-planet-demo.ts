import { Color, Vector3 } from 'three';
import { createGame, createStage, createSphere, createCamera, Perspectives } from '@zylem/game-lib';

// TODO: custom shader and texture for planet
const planet = createSphere({
	radius: 10,
	material: { color: new Color(Color.NAMES.blue) },
});

// TODO: ring entity for planet

// TODO: more options for camera
const camera = createCamera({
	perspective: Perspectives.ThirdPerson,
	position: new Vector3(0, 0, -60),
	target: new Vector3(0, 0, 0),
});

// TODO: particle system for stage
const stage1 = createStage({
	backgroundColor: new Color(Color.NAMES.black),
}, camera);

stage1.add(planet);

const game = createGame({
	id: 'zylem-planet-demo',
	debug: true,
}, stage1);

export default game;