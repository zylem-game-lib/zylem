export { createGame } from '../lib/game/game';
export type { ZylemGameConfig } from '../lib/game/game-interfaces';

export { vessel } from '../lib/core/vessel';

export type { Vect3 } from '../lib/core/utility/vector';
export type {
	Vec2,
	Vec2Components,
	Vec2Input,
	Vec3,
	Vec3Components,
	Vec3Input,
} from '../lib/core/vector';
export {
	VEC2_ONE,
	VEC2_ZERO,
	VEC3_ONE,
	VEC3_ZERO,
	normalizeVec2,
	normalizeVec3,
	toRapierVector3,
	toThreeVector2,
	toThreeVector3,
} from '../lib/core/vector';

export { globalChange, globalChanges, variableChange, variableChanges } from '../lib/actions/global-change';
