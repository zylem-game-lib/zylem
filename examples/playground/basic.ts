/** Basic game
*/
import { game } from '../../src/main';

const myGame = game();
myGame.start();


/** Basic game with stages

import { game, stage, wait } from '../../src/main';

const myGame = game(stage(), stage());
myGame.start();

wait(2000, myGame.nextStage())

*/