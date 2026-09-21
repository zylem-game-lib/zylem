import { createGame } from '@zylem/game-lib/core';
import { createBox } from '@zylem/game-lib/entity';
import { moveBy } from '@zylem/game-lib/actions';
import { CooldownBehavior } from '@zylem/game-lib/behavior';

const hero = createBox({ name: 'hero' });

const cooldowns = hero.use(CooldownBehavior, {
	cooldowns: {
		attack: { duration: 1.5 },
		dash: { duration: 0.8, immediate: false },
	},
});

hero.onUpdate(({ me, inputs }) => {
	if (cooldowns.isReady('attack') && inputs.p1.buttons.A.pressed) {
		cooldowns.fire('attack');
	}
	if (cooldowns.isReady('dash') && inputs.p1.buttons.B.pressed) {
		cooldowns.fire('dash');
		me.runAction(moveBy({ x: 3, duration: 0.2 }));
	}
});

createGame(hero).start();
