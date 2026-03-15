import { Color, Vector2 } from 'three';
import { createStage, createText } from '@zylem/game-lib';

export function createStageZero() {
  return createStage(
    {
      backgroundColor: new Color(Color.NAMES.black),
    },
    () =>
      createText({
        name: 'startGameText',
        text: 'Press A ("z" on keyboard) to start the game',
        fontSize: 20,
        stickToViewport: true,
        screenPosition: { x: 0.5, y: 0.5 },
      }),
  );
}
