import { createGame, createSprite, createStage } from "@zylem/game-lib";
import playerShipImg from '@zylem/assets/2d/space/player-ship.png';

const playerShip = createSprite({
    images: [{ name: 'player-ship', file: playerShipImg }],
});

const stage = createStage();
stage.add(playerShip);

const game = createGame(stage);

game.start();