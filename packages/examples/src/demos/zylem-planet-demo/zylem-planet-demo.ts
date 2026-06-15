import { createGame, createStage, createCamera, Perspectives } from '@zylem/game-lib/core';
import { createSphere, createDisk } from '@zylem/game-lib/entity';
import { planetTSL } from './planet.tsl';
import { ringTSL } from './ring.tsl';
import { starfieldTSL } from '../_shared/starfield.tsl';

export default function createDemo() {
  // Planet with blue procedural TSL shader
  const planet = createSphere({
    radius: 20,
    material: { shader: planetTSL },
  });

  let rotation = 180;
  planet.onUpdate(({ me, delta }) => {
    rotation += delta * 5;
    me.setRotationDegreesY(rotation);
  });

  // Ring around planet with red procedural TSL shader
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
      id: 'zylem-planet-demo',
      debug: true,
    },
    stage,
  );

  return game;
}
