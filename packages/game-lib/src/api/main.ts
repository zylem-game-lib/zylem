// Core game functionality
export { createGame, Game } from '../lib/game/game';
export type { ZylemGameConfig } from '../lib/game/game-interfaces';
export { gameConfig } from '../lib/game/game-config';

export { createStage } from '../lib/stage/stage';
export { entitySpawner } from '../lib/stage/entity-spawner';
export type { StageOptions, LoadingEvent } from '../lib/stage/zylem-stage';

export { vessel } from '../lib/core/vessel';

// Camera
export { camera } from '../lib/camera/camera';
export type { PerspectiveType } from '../lib/camera/perspective';
export { Perspectives } from '../lib/camera/perspective';

// Utility types
export type { Vect3 } from '../lib/core/utility/vector';

// Entities
export { box } from '../lib/entities/box';
export { sphere } from '../lib/entities/sphere';
export { sprite } from '../lib/entities/sprite';
export { plane } from '../lib/entities/plane';
export { zone } from '../lib/entities/zone';
export { actor } from '../lib/entities/actor';
export { text } from '../lib/entities/text';
export { rect } from '../lib/entities/rect';
export { ZylemBox } from '../lib/entities/box';

// Behaviors
export type { Behavior } from '../lib/actions/behaviors/behavior';
export { ricochet2DInBounds } from '../lib/actions/behaviors/ricochet/ricochet-2d-in-bounds';
export { ricochet2DCollision } from '../lib/actions/behaviors/ricochet/ricochet-2d-collision';
export { boundary2d } from '../lib/actions/behaviors/boundaries/boundary';
export { movementSequence2D } from '../lib/actions/behaviors/movement/movement-sequence-2d';

// Capabilities
export { makeMoveable } from '../lib/actions/capabilities/moveable';
export { makeRotatable } from '../lib/actions/capabilities/rotatable';
export { makeTransformable } from '../lib/actions/capabilities/transformable';
export { rotatable } from '../lib/actions/capabilities/rotatable';
export { moveable } from '../lib/actions/capabilities/moveable';
export { rotateInDirection } from '../lib/actions/capabilities/rotatable';
export { move } from '../lib/actions/capabilities/moveable';
export { resetVelocity } from '../lib/actions/capabilities/moveable';


// Destruction utilities
// Destruction utilities
export { destroy } from '../lib/entities/destroy';

// Sounds
export { ricochetSound, pingPongBeep } from '../lib/sounds';

// External dependencies - these will be in separate vendor chunks
export { Howl } from 'howler';
export * as THREE from 'three';
export * as RAPIER from '@dimforge/rapier3d-compat';

// Update helpers
export { globalChange, globalChanges, variableChange, variableChanges } from '../lib/actions/global-change';

// State management - standalone functions
export { setGlobal, getGlobal, createGlobal, onGlobalChange, onGlobalChanges, getGlobals } from '../lib/game/game-state';
export { setVariable, getVariable, createVariable, onVariableChange, onVariableChanges } from '../lib/stage/stage-state';

// Web Components
export { ZylemGameElement } from '../web-components/zylem-game';
