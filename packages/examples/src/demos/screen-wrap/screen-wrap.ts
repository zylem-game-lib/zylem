import { createGame, createStage } from '@zylem/game-lib/core';
import { createSprite } from '@zylem/game-lib/entity';
import { ThrusterBehavior, ScreenWrapBehavior, useBehavior } from '@zylem/game-lib/behavior';
import { useArrowsForAxes } from '@zylem/game-lib/input';
import { demoAsset } from '../../assets/manifest';

const playerShipImg = demoAsset('general/space/player-ship.png');

export default function createDemo() {
	function playerFactory() {
		const baseShip = createSprite({
			images: [{ name: 'player-ship', file: playerShipImg }],
		});

		const playerShip = useBehavior(baseShip, ThrusterBehavior, {
			linearThrust: 5,
			angularThrust: 8,
		});

		playerShip.use(ScreenWrapBehavior, {
			width: 30,
			height: 20,
		});

		const BRAKE_STRENGTH = 3;
		playerShip.onUpdate(({ me, inputs }) => {
			const { Horizontal, Vertical } = inputs.p1.axes;

			if (!me.$thruster) return;

			const forward = Math.max(-Vertical.value, 0);
			const braking = Math.max(Vertical.value, 0);

			me.$thruster.thrust = forward;
			me.$thruster.rotate = Horizontal.value;

			if (me.thruster) {
				me.thruster.linearDamping = braking * BRAKE_STRENGTH;
			}
		});

		return playerShip;
	}

	const players = [];
	for (let i = 0; i < 10; i++) {
		for (let j = 0; j < 10; j++) {
			const player = playerFactory();
			player.onSetup(({ me }) => {
				me.setPosition(
					i * 1 + Math.random() * 4 - 5,
					j * 1 + Math.random() * 4 - 5,
					0,
				);
			});
			players.push(player);
		}
	}

	const stage = createStage();
	stage.add(...players);
	stage.setInputConfiguration(useArrowsForAxes('p1'));

	const game = createGame(stage);

	return game;
}
