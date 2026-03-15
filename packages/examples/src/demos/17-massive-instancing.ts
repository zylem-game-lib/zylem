/// <reference types="@zylem/assets" />
import { Color, Vector2, Vector3 } from 'three';
import {
  createGame,
  createStage,
  createBox,
  createCamera,
  createPlane,
} from '@zylem/game-lib';

import skybox from '@zylem/assets/3d/skybox/default.png';
import grassNormalPath from '@zylem/assets/3d/textures/grass-normal.png';

export default function createDemo() {
  // --------------------------------------------------
  // Massive Instancing Test
  // --------------------------------------------------

  const entities = [];

  // 1. Ground
  const ground = createPlane({
    collision: { static: true },
    tile: { x: 50, y: 50 },
    size: { x: 50, y: 50, z: 1 },
    position: { x: 0, y: 0, z: 0 },
    randomizeHeight: true,
    color: new Color(0x333333),
  });
  entities.push(ground);

  // 2. create 2000 falling boxes
  const COUNT = 2500;
  const SPREAD = 30;
  const HEIGHT = 30;

  // Use a few distinct colors to demonstrate batch splitting by material if needed,
  // though here we'll use a single color to maximize batching into one draw call.
  const color = new Color(0x3388ff);

  for (let i = 0; i < COUNT; i++) {
    const x = (Math.random() - 0.5) * SPREAD;
    const y = 5 + Math.random() * HEIGHT;
    const z = (Math.random() - 0.5) * SPREAD;

    const box = createBox({
      position: { x: x, y: y, z: z },
      size: { x: 0.5, y: 0.5, z: 0.5 },
      material: { color },
      name: `box-${i}`,
      // Enable instancing
      batched: true,
    });
    entities.push(box);
  }

  const game = createGame(
    { id: 'massive-instancing', debug: true },
    createStage(
      { gravity: { x: 0, y: -9.81, z: 0 }, backgroundImage: skybox },
      createCamera({ position: { x: 0, y: 14, z: 23 } }),
    ),
    ...entities,
  );

  return game;
}
