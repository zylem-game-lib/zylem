/// <reference types="@zylem/assets" />

// TODO: need to use instancing for entities to improve performance
// TODO: need to create a material map for reused materials

import { Color, Vector2, Vector3 } from 'three';
import {
  createGame,
  createStage,
  createBox,
  createSphere,
  createCamera,
  createPlane,
  fireShader,
  starShader,
} from '@zylem/game-lib';

import rainManPath from '@zylem/assets/2d/rain-man.png';
import grassNormalPath from '@zylem/assets/3d/textures/grass-normal.png';
import skybox from '@zylem/assets/3d/skybox/default.png';

export default function createDemo() {
  const rainMan = rainManPath;
  const grassNormal = grassNormalPath;

  const testBox = createBox(
    { position: { x: 2, y: 3, z: 5 }, material: { path: rainMan } },
    createBox({ position: { x: 1, y: 1, z: 1 }, material: { path: rainMan } }),
  );
  const testBox1 = createBox({
    position: { x: 0, y: 5, z: 5 },
    material: { path: rainMan },
  });
  const testBox2 = createBox({
    position: { x: 4, y: 5, z: 5 },
    material: { path: rainMan },
  });

  let testBoxes: any[] = [];

  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 5; j++) {
      const nextBox = createBox({
        size: {
          x: 1 + Math.random() * 1,
          y: 1 + Math.random() * 1,
          z: 1 + Math.random() * 1,
        },
        position: { x: i - 10, y: j + 2, z: 5 },
        material: { shader: starShader },
        custom: {
          superProp: 1,
        },
      });
      testBoxes.push(nextBox);
      const nextBox2 = createSphere({
        radius: 0.25 + Math.random() * 0.5,
        position: { x: i - 10, y: 10 + j, z: 3 },
        material: { shader: fireShader },
      });
      testBoxes.push(nextBox2);
    }
  }

  const testground = createPlane({
    collision: {
      static: true,
    },
    tile: { x: 400, y: 400 },
    position: { x: -10, y: -1, z: 0 },
    material: { path: grassNormal, repeat: { x: 50, y: 50 } },
  });

  const testSphere = createSphere({
    position: { x: 0, y: 3, z: 10 },
    material: {
      shader: starShader,
    },
  });

  const spheres: any[] = [];
  const colorKeys = Object.keys(Color.NAMES);
  const totalColors = colorKeys.length - 1;
  for (let k = 0; k < 6; k++) {
    for (let j = 0; j < 6; j++) {
      for (let i = 0; i < 6; i++) {
        const useShader = Math.random() < 0.2;
        const key = colorKeys.at(Math.floor(Math.random() * totalColors)) ?? '';
        const s = createSphere({
          collision: { static: false },
          material: {
            color: useShader
              ? undefined
              : new Color(Color.NAMES[key as keyof typeof Color.NAMES]),
            shader: useShader ? starShader : undefined,
          },
          radius: 0.2 + Math.random() * 1.5,
          position: { x: j * 2 - 2, y: i + 2 + i * 2, z: 10 + k * 2 },
        });
        spheres.push(s);
      }
    }
  }

  const example = createGame(
    { id: 'stress-test', debug: true },
    createStage(
      { gravity: { x: 0, y: -9.81, z: 0 }, backgroundImage: skybox },
      createCamera({
        position: { x: 0, y: 10, z: 25 },
      }),
    ),
    ...testBoxes,
    testBox,
    testBox1,
    testBox2,
    testSphere,
    testground,
    ...spheres,
  );

  console.log('Total objects: ' + (testBoxes.length + spheres.length + 5));

  return example;
}
