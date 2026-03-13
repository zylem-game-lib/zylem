import { Color, Vector3 } from 'three';
import { createCamera, createStage, createSphere } from '@zylem/game-lib';

export function createStageOne() {
  return createStage(
    {
      backgroundColor: new Color(Color.NAMES.skyblue),
    },
    createCamera({
      position: new Vector3(0, 10, 25),
    }),
    () =>
      createSphere({
        radius: 10,
        material: { color: new Color(Color.NAMES.blue) },
      }),
  );
}
