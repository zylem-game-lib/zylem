/**
 * `@zylem/game-lib/runtime` public API.
 *
 * The simulation layer is owned by `@zylem/behaviors`; game-lib re-exports the
 * pieces hosts need for advanced/diagnostic use (the same types surfaced by
 * `game.experimental.getRuntime()`), plus the plain-data collider builders.
 * @public
 */
export type {
	BehaviorRuntime,
	EntityDefinition,
	EntityHandle,
	Simulation,
	SimulationBodyDefinition,
	SimulationColliderDefinition,
	SimulationEvent,
	SimulationFrame,
	SimulationOptions,
	StageBodyConfig,
	StageBodyInfo,
	StageBodyKindValue,
	StageColliderConfig,
	StageColliderShape,
	StageDebugRender,
	StageEvent,
	StagePose,
	StageRaycastHit,
	StageRenderSlot,
} from '@zylem/behaviors/core';
export {
	StageBodyKind,
	StageBoundaryDim,
	StageEventType,
	StageRicochetDim,
	StageRicochetReflection,
	StageTopDownPlane,
	createSimulation,
} from '@zylem/behaviors/core';

export type { SimulationStepClock } from '../lib/collision/simulation-body';
export { SimulationBody } from '../lib/collision/simulation-body';

export type {
	RuntimeBodyOptions,
	RuntimeColliderOptions,
	RuntimeCollisionBundle,
} from '../lib/collision/runtime-collision-builder';
export {
	buildBoxCollider,
	buildCapsuleCollider,
	buildConvexHullCollider,
	buildCylinderCollider,
	buildHeightfieldCollider,
	buildRuntimeBody,
	buildSphereCollider,
	buildTrimeshCollider,
	bundleRuntimeCollision,
	packCollisionGroups,
} from '../lib/collision/runtime-collision-builder';
