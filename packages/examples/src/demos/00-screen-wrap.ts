import {
	createGame,
	createSprite,
	createStage,
	ThrusterBehavior,
	ScreenWrapBehavior,
	useBehavior,
	useArrowsForAxes
} from "@zylem/game-lib";
import playerShipImg from '@zylem/assets/2d/space/player-ship.png';

function playerFactory() {
	const baseShip = createSprite({
		images: [{ name: 'player-ship', file: playerShipImg }],
	});

	const playerShip = useBehavior(
		baseShip,
		ThrusterBehavior,
		{
			linearThrust: 5,
			angularThrust: 8,
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

	return playerShip;
}


const players = [];
for (let i = 0; i < 10; i++) {
	for (let j = 0; j < 10; j++) {
		const player = playerFactory();
		player.onSetup(({ me }) => {
			me.setPosition((i * 1 + Math.random() * 4) - 5, (j * 1 + Math.random() * 4) - 5, 0);
		});
		players.push(player);
	}
}

const stage = createStage();
stage.add(...players);
stage.setInputConfiguration(useArrowsForAxes('p1'));

const game = createGame(stage);

export default game;