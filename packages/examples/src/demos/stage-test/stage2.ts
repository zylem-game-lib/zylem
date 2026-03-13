import { Color, Vector3 } from 'three';
import { createCamera, createStage, createBox } from '@zylem/game-lib';

export function createStageTwo() {
  return createStage(
    {
      backgroundColor: new Color(Color.NAMES.orange),
    },
    createCamera({
      position: new Vector3(0, 10, 25),
    }),
    () =>
      createBox({
        size: new Vector3(10, 10, 10),
        material: { color: new Color(Color.NAMES.red) },
      }),
  );
}
