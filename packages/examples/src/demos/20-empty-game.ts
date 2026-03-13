import { createGame } from '@zylem/game-lib';

export default function createDemo() {
  const game = createGame();

  game.onLoading((event) => {
    console.log('my loading event: ', event);
  });

  return game;
}
