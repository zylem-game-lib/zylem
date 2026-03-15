import { Color, Vector3 } from 'three';
import { createCamera, createStage, createBox } from '@zylem/game-lib';

export function createStageTwo() {
  return createStage(
    {
      backgroundColor: new Color(Color.NAMES.orange),
    },
    createCamera({
      position: { x: 0, y: 10, z: 25 },
    }),
    () =>
      createBox({
        size: { x: 10, y: 10, z: 10 },
        material: { color: new Color(Color.NAMES.red) },
      }),
  );
}
