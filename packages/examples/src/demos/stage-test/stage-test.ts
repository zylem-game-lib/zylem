import { createGame, gameConfig } from '@zylem/game-lib/core';
import { createStageTransition } from '@zylem/shaders';
import { createStageZero } from './stage0';
import { createStageOne } from './stage1';
import { createStageTwo } from './stage2';
import { createStageThree } from './stage3';

export default function createDemo() {
  const myGameConfig = gameConfig({
    id: 'stage-test',
    debug: true,
    bodyBackground: '#000000',
  });

  // Stage transitions: noise dissolve going forward, a right-to-left wipe
  // going back, and a plain crossfade on reset.
  const noiseDissolve = createStageTransition({ pattern: 'noise', scale: 6 });
  const wipeLeft = createStageTransition({
    pattern: 'wipe',
    direction: { x: -1, y: 0 },
  });

  const game = createGame(
    myGameConfig,
    createStageZero(),
    createStageOne(),
    createStageTwo(),
    createStageThree(),
  ).onUpdate(({ me, inputs }) => {
    const { p1 } = inputs;

    if (p1.buttons.A.pressed) {
      game.nextStage({
        transition: { duration: 1.2, shader: noiseDissolve },
      });
    }
    if (p1.buttons.B.pressed) {
      game.previousStage({
        transition: { duration: 0.8, shader: wipeLeft },
      });
    }
    if (p1.buttons.Start.pressed) {
      game.reset({
        transition: { duration: 0.6 },
      });
    }
  });

  return game;
}
