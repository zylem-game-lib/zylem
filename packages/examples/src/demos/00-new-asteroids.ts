import { createGame, createSprite, createStage, ThrusterBehavior, ScreenWrapBehavior, makeMoveable, makeRotatable, useBehavior } from "@zylem/game-lib";
import playerShipImg from '@zylem/assets/2d/space/player-ship.png';

const baseShip = makeRotatable(makeMoveable(createSprite({
    images: [{ name: 'player-ship', file: playerShipImg }],
})));

const playerShip = useBehavior(
    baseShip,
    ThrusterBehavior,
    {
        linearThrust: 3,
        angularThrust: 3,
    }
);

playerShip.use(
    ScreenWrapBehavior,
    {
        width: 30,
        height: 20,
    }
);

playerShip.onUpdate(({ me, inputs }) => {
    const { Horizontal, Vertical } = inputs.p1.axes;

    if (me.$thruster) {
        me.$thruster.thrust = -Vertical.value;
        me.$thruster.rotate = Horizontal.value;
    }
});

const stage = createStage();
stage.add(playerShip);

const game = createGame(stage);

export default game;