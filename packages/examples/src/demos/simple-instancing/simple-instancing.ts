import { Color, Vector2, Vector3 } from 'three';
import { createGame, createStage, createCamera } from '@zylem/game-lib/core';
import { createBox, createSphere, createPlane, createText } from '@zylem/game-lib/entity';

import { demoAsset } from '../../assets/manifest';

const skybox = demoAsset('general/skybox-default.png');
const grassNormalPath = demoAsset('general/texture-grass-normal.png');

export default function createDemo() {
  // --------------------------------------------------
  // Simple Instancing Test
  // --------------------------------------------------

  // 1. Red Box Batch
  const box1 = createBox({
    position: { x: -2, y: 5, z: 0 },
    material: { color: new Color(0xff0000) },
    category: 'pack',
  });

  const box2 = createBox({
    position: { x: 2, y: 5, z: 0 },
    material: { color: new Color(0xff0000) }, // Same color -> Same batch
    category: 'pack',
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
    category: 'pack',
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
