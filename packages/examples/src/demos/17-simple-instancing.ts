/// <reference types="@zylem/assets" />
import { Color, Vector2, Vector3 } from 'three';
import {
  createGame,
  createStage,
  createBox,
  createSphere,
  createCamera,
  createPlane,
  createText,
} from '@zylem/game-lib';

import skybox from '@zylem/assets/3d/skybox/default.png';
import grassNormalPath from '@zylem/assets/3d/textures/grass-normal.png';

export default function createDemo() {
  // --------------------------------------------------
  // Simple Instancing Test
  // --------------------------------------------------

  // 1. Red Box Batch
  const box1 = createBox({
    position: { x: -2, y: 5, z: 0 },
    material: { color: new Color(0xff0000) },
    batched: true,
  });

  const box2 = createBox({
    position: { x: 2, y: 5, z: 0 },
    material: { color: new Color(0xff0000) }, // Same color -> Same batch
    batched: true,
  });

  // 2. Ground
  const ground = createPlane({
    collision: { static: true },
    tile: { x: 20, y: 20 },
    position: { x: 0, y: 0, z: 0 },
    material: { path: grassNormalPath },
  });

  const box3 = createBox({
    position: { x: 2, y: 5, z: 5 },
    material: { color: new Color(0xff0000) }, // Same color -> Same batch
    batched: true,
  });

  const game = createGame(
    { id: 'simple-instancing', debug: true },
    createStage(
      { gravity: { x: 0, y: -9.81, z: 0 }, backgroundImage: skybox },
      createCamera({ position: { x: 0, y: 5, z: 20 } }),
    ),
    ground,
    box1,
    box2,
    box3,
  );

  return game;
}
