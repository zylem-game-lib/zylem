import { Vector3 } from 'three';
import { createGame, createStage, createSphere, createDisk, createCamera, Perspectives } from '@zylem/game-lib';
import { planetTSL } from './planet-demo/planet.tsl';
import { ringTSL } from './planet-demo/ring.tsl';
import { starfieldTSL } from './planet-demo/starfield.tsl';

// Planet with blue procedural shader
const planet = createSphere({
	radius: 20,
	material: { shader: planetTSL },
});

// Ring around planet with red procedural shader
const ring = createDisk({
  innerRadius: 25,
  outerRadius: 36,
  thetaSegments: 64,
  material: { shader: ringTSL },
}).onSetup(({ me }) => {
  me.setRotationDegreesZ(-23);
});

const camera = createCamera({
	perspective: Perspectives.ThirdPerson,
	position: new Vector3(0, 30, -80),
	target: new Vector3(0, 0, 0),
	rendererType: 'webgpu',
});

const stage = createStage({
	backgroundShader: starfieldTSL,
}, camera);

stage.add(planet);
stage.add(ring);

const game = createGame({
	id: 'zylem-planet-demo',
	debug: true,
}, stage);

export default game;