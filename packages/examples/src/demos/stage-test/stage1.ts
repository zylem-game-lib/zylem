import { Color, Vector3 } from 'three';
import { createCamera, createStage } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';

export function createStageOne() {
  return createStage(
    {
      backgroundColor: new Color(Color.NAMES.skyblue),
    },
    createCamera({
      position: { x: 0, y: 10, z: 25 },
    }),
    () =>
      createSphere({
        radius: 10,
        material: { color: new Color(Color.NAMES.blue) },
      }),
  );
}
