
import { createGame } from "@zylem/game-lib";

const game = createGame();

game.onLoading((event) => {
    console.log('my loading event: ', event);
});

export default game;