// Core game functionality - these will be in the main chunk
export { game } from './lib/core/game/game';
export type { ZylemGameConfig } from './lib/core/game/zylem-game';
export { stage } from './lib/core/stage/stage';
export type { StageOptions } from './lib/core/stage/zylem-stage';
export { vessel } from './lib/core/vessel';

// Camera system - separate chunk
export { camera } from './lib/camera/camera';
export type { PerspectiveType } from './lib/camera/perspective';
export { Perspectives } from './lib/camera/perspective';

// Utility types
export type { Vect3 } from './lib/core/utility';

// Entities - these will be tree-shakable
export { box } from './lib/entities/box';
export { sphere } from './lib/entities/sphere';
export { sprite } from './lib/entities/sprite';
export { plane } from './lib/entities/plane';
export { zone } from './lib/entities/zone';
export { actor } from './lib/entities/actor';
export { ZylemBox } from './lib/entities/box';

// Behaviors and actions - tree-shakable
export * as actions from './lib/behaviors/actions';

// Destruction utilities
export { destroy } from './lib/entities/destroy';

// External dependencies - these will be in separate vendor chunks
export { Howl } from 'howler';
export * as THREE from 'three';
export * as RAPIER from '@dimforge/rapier3d-compat';

// Legacy namespace for backward compatibility (will bundle everything together)
// Consider deprecating this in favor of named exports
import * as actions from './lib/behaviors/actions';

const Util = {
	...actions
};

const Zylem = {
	Util
};

export { Zylem };
