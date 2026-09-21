import { createGame } from '@zylem/game-lib/core';
import {
	create,
	boxMesh,
	boxCollision,
	sphereMesh,
	sphereCollision,
} from '@zylem/game-lib/entity';

const customBlock = create({
	name: 'custom-block',
	position: { x: -1, y: 1, z: 0 },
})
	.add(
		boxMesh({
			size: { x: 2, y: 2, z: 2 },
		}),
	)
	.add(
		boxCollision({
			size: { x: 2, y: 2, z: 2 },
			static: true,
		}),
	);

const rollingOrb = create({ name: 'orb', position: { x: 2, y: 1, z: 0 } })
	.add(sphereMesh({ radius: 0.5 }))
	.add(sphereCollision({ radius: 0.5 }));

createGame(customBlock, rollingOrb).start();
