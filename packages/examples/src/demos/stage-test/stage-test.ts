import { createGame, gameConfig } from '@zylem/game-lib/core';
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

  const game = createGame(
    myGameConfig,
    createStageZero(),
    createStageOne(),
    createStageTwo(),
    createStageThree(),
  ).onUpdate(({ me, inputs }) => {
    const { p1 } = inputs;

    if (p1.buttons.A.pressed) {
      game.nextStage();
    }
    if (p1.buttons.B.pressed) {
      game.previousStage();
    }
    if (p1.buttons.Start.pressed) {
      game.reset();
    }
  });

  // TODO: stage transitions
  return game;
}
