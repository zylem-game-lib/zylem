import {
	StageBodyKind,
	buildBoxCollider,
	buildRuntimeBody,
	bundleRuntimeCollision,
	packCollisionGroups,
} from '@zylem/game-lib/runtime';

const body = buildRuntimeBody({ kind: StageBodyKind.Dynamic });
const collider = buildBoxCollider(
	{ x: 1, y: 1, z: 1 },
	{
		collisionType: 'player',
		collisionFilter: ['world', 'pickup'],
		friction: 0.4,
	},
);

const bundle = bundleRuntimeCollision(body, [collider]);
const groups = packCollisionGroups('player', ['world']);

export { bundle, groups };
