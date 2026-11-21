import { createGame } from '@zylem/game-lib/core';
import { createSprite } from '@zylem/game-lib/entity';
import { callFunc, delay, repeatForever, sequence } from '@zylem/game-lib/actions';
import {
	ScreenWrapBehavior,
	ThrusterBehavior,
	TopDownMovementBehavior,
	WorldBoundary2DBehavior,
} from '@zylem/game-lib/behavior';

const ship = createSprite({ name: 'ship' });

// Attach each behavior once and keep its handle.
const thruster = ship.use(ThrusterBehavior, { linearThrust: 10, angularThrust: 4 });
const topDown = ship.use(TopDownMovementBehavior, { moveSpeed: 8 });
const wrap = ship.use(ScreenWrapBehavior, { width: 24, height: 14 });
const boundary = ship.use(WorldBoundary2DBehavior, {
	boundaries: { left: -12, right: 12, bottom: -7, top: 7 },
});

// A behavior that should not run yet starts switched off.
topDown.disable();
boundary.disable();

// Input: swap how the ship moves.
ship.onUpdate(({ inputs }) => {
	if (!inputs.p1.buttons.A.pressed) return;
	if (thruster.enabled) {
		thruster.disable();
		topDown.enable();
	} else {
		topDown.disable();
		thruster.enable();
	}
});

// Timer: swap what happens at the edge every four seconds.
ship.runAction(
	repeatForever(
		sequence(
			delay(4000),
			callFunc(() => {
				if (wrap.enabled) {
					wrap.disable();
					boundary.enable();
				} else {
					boundary.disable();
					wrap.enable();
				}
			}),
		),
	),
);

// Change options later. A running behavior restarts with the merged options.
thruster.setOptions({ linearThrust: 16 });

createGame(ship).start();
