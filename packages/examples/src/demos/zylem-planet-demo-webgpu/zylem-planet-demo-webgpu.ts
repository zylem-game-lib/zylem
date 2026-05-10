import { Vector3 } from 'three';
import { createGame, createStage, createCamera, Perspectives } from '@zylem/game-lib/core';
import { createSphere, createDisk } from '@zylem/game-lib/entity';
import { planetTSL } from './planet.tsl';
import { ringTSL } from './ring.tsl';
import { starfieldTSL } from '../_shared/starfield.tsl';

export default function createDemo() {
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
    position: { x: 0, y: 30, z: -80 },
    target: { x: 0, y: 0, z: 0 },
    rendererType: 'webgpu',
  });

  const stage = createStage(
    {
      backgroundShader: starfieldTSL,
    },
    camera,
  );

  stage.add(planet);
  stage.add(ring);

  const game = createGame(
    {
      id: 'zylem-planet-demo-webgpu',
      debug: true,
    },
    stage,
  );

  return game;
}
