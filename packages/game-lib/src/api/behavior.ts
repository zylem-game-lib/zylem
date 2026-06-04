// Aggregate behavior barrel.
// `lib/behaviors/index.ts` covers the FSM-based behaviors (thruster,
// shooter-2d, world-boundary, ricochet, jumper, platformer, particle
// emitter, destructible-3d, cooldown, ...). The two runtime-pong/runtime-2d
// descriptor modules (used by the wasm runtime adapter) are NOT re-exported
// from there, so we list them explicitly below.
export * from '../lib/behaviors';

// Runtime descriptors (canonical pong-derived names).
export {
	RuntimeGoalZone2DBehavior,
	RuntimePaddleInput2DBehavior,
	RuntimePongBallBehavior,
	RuntimeRicochet2DBehavior,
	RuntimeTriggerRegion2DBehavior,
	RuntimeWorldBoundary2DBehavior,
	RUNTIME_GOAL_ZONE_2D_BEHAVIOR_KEY,
	RUNTIME_PADDLE_INPUT_2D_BEHAVIOR_KEY,
	RUNTIME_PONG_BALL_BEHAVIOR_KEY,
	RUNTIME_RICOCHET_2D_BEHAVIOR_KEY,
	RUNTIME_TRIGGER_REGION_2D_BEHAVIOR_KEY,
	RUNTIME_WORLD_BOUNDARY_2D_BEHAVIOR_KEY,
	bindRuntimePongBallHandle,
	emitRuntimeGoal,
	emitRuntimeRicochet,
	emitRuntimeTriggerRegionEnter,
} from '@zylem/behaviors/runtime-pong';
export type {
	RuntimeGoalZone2DEvent,
	RuntimeGoalZone2DHandle,
	RuntimeGoalZone2DOptions,
	RuntimePaddleInput2DOptions,
	RuntimePongBallHandle,
	RuntimePongBallOptions,
	RuntimeRicochet2DEvent,
	RuntimeRicochet2DHandle,
	RuntimeRicochet2DOptions,
	RuntimeTriggerRegion2DEvent,
	RuntimeTriggerRegion2DHandle,
	RuntimeTriggerRegion2DOptions,
	RuntimeWorldBoundary2DOptions,
} from '@zylem/behaviors/runtime-pong';

// Runtime 2D aliased descriptors (the names new examples like pong.ts use).
// `RuntimeRicochet2DBehavior` and `RuntimeTriggerRegion2DBehavior` collide
// with the canonical names above (they're the same symbols), so we re-export
// those two under the suffixed `*Descriptor` aliases — matching how the old
// main barrel exposed them. The remaining three are unique.
export {
	RuntimeBoundary2DBehavior,
	RuntimeDynamicCircleBody2DBehavior,
	RuntimePlayerInput2DBehavior,
	RuntimeRicochet2DBehavior as RuntimeRicochet2DDescriptor,
	RuntimeTriggerRegion2DBehavior as RuntimeTriggerRegion2DDescriptor,
	RUNTIME_BOUNDARY_2D_BEHAVIOR_KEY,
	RUNTIME_DYNAMIC_CIRCLE_BODY_2D_BEHAVIOR_KEY,
	RUNTIME_PLAYER_INPUT_2D_BEHAVIOR_KEY,
	bindRuntimeDynamicCircleBody2DHandle,
} from '@zylem/behaviors/runtime-2d';
export type {
	RuntimeBoundary2DOptions,
	RuntimeDynamicCircleBody2DHandle,
	RuntimeDynamicCircleBody2DOptions,
	RuntimePlayerInput2DOptions,
} from '@zylem/behaviors/runtime-2d';
