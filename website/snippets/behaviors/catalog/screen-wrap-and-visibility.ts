import { createGame } from '@zylem/game-lib/core';
import { createSprite } from '@zylem/game-lib/entity';
import { ScreenVisibilityBehavior, ScreenWrapBehavior } from '@zylem/game-lib/behavior';

const ship = createSprite({ name: 'ship' });

const wrap = ship.use(ScreenWrapBehavior, {
	width: 20,
	height: 15,
	centerX: 0,
	centerY: 0,
	edgeThreshold: 2,
});

const visibility = ship.use(ScreenVisibilityBehavior, {
	cameraName: null,
	requireFullyVisible: false,
	padding: 0,
	fallbackSize: null,
	onEnter: ({ entity }) => {
		entity.reveal();
	},
});

ship.onUpdate(() => {
	const wrapFsm = wrap.getFSM();
	void wrapFsm?.getState();
	void visibility.isVisible();
});

createGame(ship).start();
