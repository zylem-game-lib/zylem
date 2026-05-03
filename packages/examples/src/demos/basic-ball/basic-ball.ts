import { createGame, createSphere, useArrowsForAxes } from '@zylem/game-lib';
import { Color } from 'three';

export default function createDemo() {
  const ball = createSphere({ color: new Color(Color.NAMES.aqua) });
  ball.onUpdate(({ me, inputs }) => {
    const { Horizontal, Vertical } = inputs.p1.axes;
    me.moveXY(Horizontal.value * 5, -Vertical.value * 5);
  });

  const game = createGame(
    {
      debug: true,
      id: 'basic-ball',
      globals: {
        gameNumber: 0,
      },
    },
    ball,
  );
  game.setInputConfiguration(useArrowsForAxes('p1'));

  return game;
}
