// Core game functionality
export { game } from './lib/game/game';
export type { ZylemGameConfig } from './lib/game/game-interfaces';
export { gameConfig } from './lib/game/game-config';

export { stage } from './lib/stage/stage';
export { entitySpawner } from './lib/stage/entity-spawner';
export type { StageOptions } from './lib/stage/zylem-stage';

export { vessel } from './lib/core/vessel';

// Camera
export { camera } from './lib/camera/camera';
export type { PerspectiveType } from './lib/camera/perspective';
export { Perspectives } from './lib/camera/perspective';

// Utility types
export type { Vect3 } from './lib/core/utility/vector';

// Entities
export { box } from './lib/entities/box';
export { sphere } from './lib/entities/sphere';
export { sprite } from './lib/entities/sprite';
export { plane } from './lib/entities/plane';
export { zone } from './lib/entities/zone';
export { actor } from './lib/entities/actor';
export { text } from './lib/entities/text';
export { rect } from './lib/entities/rect';
export { ZylemBox } from './lib/entities/box';
export { makeMoveable } from './lib/actions/capabilities/moveable';
export { makeRotatable } from './lib/actions/capabilities/rotatable';
export { makeTransformable } from './lib/actions/capabilities/transformable';

// Behaviors
export { ricochet2DInBounds } from './lib/actions/behaviors/ricochet/ricochet-2d-in-bounds';
export { ricochet2DCollision } from './lib/actions/behaviors/ricochet/ricochet-2d-collision';
export { boundary2d } from './lib/actions/behaviors/boundaries/boundary';

// Destruction utilities
export { destroy } from './lib/entities/destroy';

// External dependencies - these will be in separate vendor chunks
export { Howl } from 'howler';
export * as THREE from 'three';
export * as RAPIER from '@dimforge/rapier3d-compat';

// Update helpers
export { globalChange, globalChanges, variableChange, variableChanges } from './lib/actions/global-change';

