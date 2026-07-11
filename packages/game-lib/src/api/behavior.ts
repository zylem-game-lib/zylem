/**
 * `@zylem/game-lib/behavior` public API.
 * @public
 */
// Aggregate behavior barrel.
// `lib/behaviors/index.ts` covers the FSM-based behaviors (thruster,
// shooter-2d, world-boundary, ricochet, jumper, platformer, particle
// emitter, destructible-3d, cooldown, ...). The runtime-2d descriptor
// module (used by the wasm runtime adapter) is NOT re-exported from
// there, so we list it explicitly below.
export * from '../lib/behaviors';

// Runtime-managed 2D descriptors (attach markers consumed by the wasm
// Stage adapter — no TS-side systems).
export {
	RuntimeBoundary2DBehavior,
	RuntimeDynamicCircleBody2DBehavior,
	RuntimeGoalZone2DBehavior,
	RuntimePlayerInput2DBehavior,
	RuntimeRicochet2DBehavior,
	RuntimeTriggerRegion2DBehavior,
	RUNTIME_BOUNDARY_2D_BEHAVIOR_KEY,
	RUNTIME_DYNAMIC_CIRCLE_BODY_2D_BEHAVIOR_KEY,
	RUNTIME_GOAL_ZONE_2D_BEHAVIOR_KEY,
	RUNTIME_PLAYER_INPUT_2D_BEHAVIOR_KEY,
	RUNTIME_RICOCHET_2D_BEHAVIOR_KEY,
	RUNTIME_TRIGGER_REGION_2D_BEHAVIOR_KEY,
	bindRuntimeDynamicCircleBody2DHandle,
	emitRuntimeGoal,
	emitRuntimeRicochet,
	emitRuntimeTriggerRegionEnter,
} from '@zylem/behaviors/runtime-2d';
export type {
	RuntimeBoundary2DOptions,
	RuntimeDynamicCircleBody2DHandle,
	RuntimeDynamicCircleBody2DOptions,
	RuntimeGoalZone2DEvent,
	RuntimeGoalZone2DHandle,
	RuntimeGoalZone2DOptions,
	RuntimePlayerInput2DOptions,
	RuntimeRicochet2DEvent,
	RuntimeRicochet2DHandle,
	RuntimeRicochet2DOptions,
	RuntimeTriggerRegion2DEvent,
	RuntimeTriggerRegion2DHandle,
	RuntimeTriggerRegion2DOptions,
} from '@zylem/behaviors/runtime-2d';
