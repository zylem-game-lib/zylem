import {
  createStage,
  createBox,
  createPlane,
  createSphere,
  createSprite,
  createZone,
  createCamera,
} from '@zylem/game-lib';
import { Vector3, Vector2, Color } from 'three';
import { playgroundActorFactory } from '../../utils';

import grassPath from '@zylem/assets/3d/textures/grass.jpg';
import woodPath from '@zylem/assets/3d/textures/wood-box.jpg';
import marsSurfacePath from '@zylem/assets/3d/textures/mars-surface.jpg';
import rainManPath from '@zylem/assets/2d/rain-man.png';

export function createStageThree() {
  const actorFactory = playgroundActorFactory('mascot');

  return createStage(
    {
      backgroundColor: new Color(Color.NAMES.green),
      gravity: { x: 0, y: -9.82, z: 0 },
    },
    createCamera({
      position: { x: 0, y: 10, z: 30 },
    }),
    () => {
      const myBox = createBox({
        size: { x: 4, y: 2, z: 1 },
        position: { x: -10, y: 4, z: 4 },
        collision: { static: false },
        material: { path: woodPath, repeat: { x: 2, y: 2 } },
      });

      let counter = 0;

      myBox
        .onUpdate(({ delta }) => {
          counter += delta;
          if (counter > 3) {
            // destroy(myBox);
          }
        })
        .onDestroy(() => {
          console.log('box has been destroyed');
        });

      return myBox;
    },
    () =>
      createPlane({
        tile: { x: 200, y: 200 },
        position: { x: 0, y: 0, z: 0 },
        collision: { static: true },
        material: { path: grassPath, repeat: { x: 20, y: 20 } },
      }),
    () =>
      createSphere({
        size: { x: 4, y: 4, z: 4 },
        position: { x: -5, y: 4, z: 0 },
        collision: { static: false },
        material: { path: marsSurfacePath },
      }),
    () =>
      createSprite({
        position: { x: 5, y: 5, z: 0 },
        images: [{ name: 'rain-man', file: rainManPath }],
        name: 'rain-man',
      }),
    actorFactory,
    () =>
      createZone({
        position: { x: 14, y: 3, z: 3 },
        size: { x: 5, y: 5, z: 10 },
        onEnter: ({ self, visitor, globals }) => {
          console.log('entered', visitor, globals);
        },
        onExit: ({ self, visitor, globals }) => {
          console.log('exited', visitor, globals);
        },
      }),
  );
}
