import { createGame } from '@zylem/game-lib/core';
import { createSprite } from '@zylem/game-lib/entity';
import { ThrusterBehavior } from '@zylem/game-lib/behavior';

const ship = createSprite({ name: 'ship' });
ship.use(ThrusterBehavior, { linearThrust: 15, angularThrust: 8 });

ship.onUpdate(({ inputs }) => {
	const input = ship as typeof ship & { $thruster: { thrust: number; rotate: number } };
	input.$thruster.thrust = inputs.p1.buttons.A.held > 0 ? 1 : 0;
	input.$thruster.rotate = inputs.p1.axes.Horizontal.value;
});

createGame(ship).start();
