import {
  createGame,
  createStage,
  createCamera,
  createActor,
  createPlane,
  createBox,
} from '@zylem/game-lib';
import { Vector2, Vector3 } from 'three';
import floor from './baileys-world/floor.png';
import wall from './baileys-world/wall.png';
import bailey from './baileys-world/bailey-samba.fbx';
import purpleBed from './baileys-world/purple-bed.gltf';
import cozyBed from './baileys-world/cozy-bed.gltf';
import avocado from './baileys-world/avocado.gltf';
import banana from './baileys-world/banana.gltf';
import playRope from './baileys-world/play-rope.gltf';
import redBone from './baileys-world/red-bone.gltf';
import spikeyBall from './baileys-world/spikey-ball.gltf';
import starby from './baileys-world/starby.gltf';

export default function createDemo() {
  const camera = createCamera({
    position: { x: 2, y: 2, z: 1 },
    target: { x: 0, y: 0, z: 0 },
  });

  const stage = createStage(
    {
      gravity: { x: 0, y: -20, z: 0 },
    },
    camera,
  );

  const floorEntity = createPlane({
    tile: { x: 10, y: 10 },
    position: { x: 0, y: -1, z: 0 },
    collision: { static: true },
    material: {
      path: floor,
      repeat: { x: 4, y: 4 },
    },
  });

  const purpleBedEntity = createActor({
    name: 'purple-bed',
    scale: { x: 4, y: 4, z: 4 },
    models: [purpleBed],
    collision: {
      static: true,
      size: { x: 3, y: 0.5, z: 3 },
      position: { x: 0, y: 0, z: 0 },
    },
    collisionShape: 'model',
    position: { x: 0, y: 0, z: 0 },
  });

  // Cozy bed placed next to the purple bed
  const cozyBedEntity = createActor({
    name: 'cozy-bed',
    scale: { x: 1, y: 1, z: 1 },
    models: [cozyBed],
    collision: {
      size: { x: 1, y: 0.25, z: 1 },
      position: { x: 0, y: 0, z: 0 },
    },
    collisionShape: 'model',
    position: { x: 2.75, y: 0, z: -2 },
  });

  // Toys scattered on the floor
  const avocadoEntity = createActor({
    name: 'avocado',
    scale: { x: 0.5, y: 0.5, z: 0.5 },
    models: [avocado],
    collisionShape: 'model',
    position: { x: 2, y: 1, z: -2.5 },
  });

  const starbyEntity = createActor({
    name: 'starby',
    scale: { x: 0.5, y: 0.5, z: 0.5 },
    models: [starby],
    collisionShape: 'model',
    position: { x: 2.75, y: 1, z: -1.5 },
  });

  const bananaEntity = createActor({
    name: 'banana',
    scale: { x: 0.5, y: 0.5, z: 0.5 },
    models: [banana],
    collisionShape: 'model',
    position: { x: 3.5, y: 1, z: -1 },
  });

  const playRopeEntity = createActor({
    name: 'play-rope',
    scale: { x: 0.6, y: 0.6, z: 0.6 },
    models: [playRope],
    collisionShape: 'model',
    position: { x: 2.5, y: 4, z: -1 },
  });

  const redBoneEntity = createActor({
    name: 'red-bone',
    scale: { x: 0.4, y: 0.4, z: 0.4 },
    models: [redBone],
    collisionShape: 'model',
    position: { x: 1, y: 1, z: -1 },
  });

  const spikeyBallEntity = createActor({
    name: 'spikey-ball',
    scale: { x: 0.5, y: 0.5, z: 0.5 },
    models: [spikeyBall],
    collisionShape: 'model',
    position: { x: 3, y: 1, z: -0.5 },
  });

  const wallEntity = createBox({
    position: { x: 0, y: 1.5, z: -3 },
    size: { x: 10, y: 5, z: 1 },
    collision: { static: true },
    material: {
      path: wall,
      repeat: { x: 1, y: 1 },
    },
  });
  const wall2Entity = createBox({
    position: { x: -5, y: 1.5, z: 0 },
    size: { x: 1, y: 5, z: 10 },
    collision: { static: true },
    material: {
      path: wall,
      repeat: { x: 1, y: 1 },
    },
  });

  const player = createActor({
    name: 'player',
    size: { x: 1, y: 1, z: 1 },
    models: [bailey],
    animations: [
      {
        key: 'samba',
        path: bailey,
      },
    ],
    position: { x: 0, y: 9, z: 0 },
  });

  player.onSetup(({ me }) => {
    me.playAnimation({
      key: 'samba',
    });
  });

  const game = createGame(
    stage,
    purpleBedEntity,
    cozyBedEntity,
    avocadoEntity,
    bananaEntity,
    playRopeEntity,
    redBoneEntity,
    spikeyBallEntity,
    starbyEntity,
    player,
    floorEntity,
    wallEntity,
    wall2Entity,
  );

  return game;
}
