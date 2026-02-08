import { Vector3 } from 'three';
import { createGame, createStage, createSphere, createDisk, createCamera, Perspectives } from '@zylem/game-lib';
import { planetShader } from './planet-demo/planet.shader';
import { ringShader } from './planet-demo/ring.shader';
import { starfieldShader } from './planet-demo/starfield.shader';
import zylemPlanetNormalOptimized from '../assets/zylem-planet-normal-optimized.png';

// Planet with blue procedural shader
const planet = createSphere({
	radius: 20,
	material: { shader: planetShader, normalMap: zylemPlanetNormalOptimized },
});


let rotation = 180;
planet.onUpdate(({ me, delta }) => {
	rotation += delta * 5;
	me.setRotationDegreesY(rotation);
});

// Ring around planet with red procedural shader
const ring = createDisk({
  innerRadius: 25,
  outerRadius: 36,
  thetaSegments: 64,
  material: { shader: ringShader },
}).onSetup(({ me }) => {
  me.setRotationDegreesZ(-23);
})

const camera = createCamera({
	perspective: Perspectives.ThirdPerson,
	position: new Vector3(0, 30, -80),
	target: new Vector3(0, 0, 0),
});

const stage = createStage({
	backgroundShader: starfieldShader,
}, camera);

stage.add(planet);
stage.add(ring);

const game = createGame({
	id: 'zylem-planet-demo',
	debug: true,
}, stage);

export default game;