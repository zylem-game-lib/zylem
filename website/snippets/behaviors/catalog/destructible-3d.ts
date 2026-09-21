import { createBox } from '@zylem/game-lib/entity';
import { Destructible3DBehavior } from '@zylem/game-lib/behavior';

const crate = createBox({
	name: 'crate',
	size: { x: 2, y: 2, z: 2 },
});

const destructible = crate.use(Destructible3DBehavior, {
	fragmentPhysics: {
		mode: 'independent',
		outwardVelocity: 4,
	},
});

crate.onCollision(() => {
	if (!destructible.isFractured()) {
		destructible.fracture();
	}
});
