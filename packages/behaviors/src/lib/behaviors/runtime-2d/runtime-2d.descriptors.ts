export {
	RuntimePaddleInput2DBehavior as RuntimePlayerInput2DBehavior,
	RuntimePongBallBehavior as RuntimeDynamicCircleBody2DBehavior,
	RuntimeRicochet2DBehavior as RuntimeRicochet2DBehavior,
	RuntimeTriggerRegion2DBehavior,
	RuntimeWorldBoundary2DBehavior as RuntimeBoundary2DBehavior,
	RUNTIME_PADDLE_INPUT_2D_BEHAVIOR_KEY as RUNTIME_PLAYER_INPUT_2D_BEHAVIOR_KEY,
	RUNTIME_PONG_BALL_BEHAVIOR_KEY as RUNTIME_DYNAMIC_CIRCLE_BODY_2D_BEHAVIOR_KEY,
	RUNTIME_RICOCHET_2D_BEHAVIOR_KEY as RUNTIME_RICOCHET_2D_BEHAVIOR_KEY,
	RUNTIME_TRIGGER_REGION_2D_BEHAVIOR_KEY,
	RUNTIME_WORLD_BOUNDARY_2D_BEHAVIOR_KEY as RUNTIME_BOUNDARY_2D_BEHAVIOR_KEY,
	bindRuntimePongBallHandle as bindRuntimeDynamicCircleBody2DHandle,
	emitRuntimeRicochet,
	emitRuntimeTriggerRegionEnter,
} from '../runtime-pong/runtime-pong.descriptors';

export type {
	RuntimePaddleInput2DOptions as RuntimePlayerInput2DOptions,
	RuntimePongBallHandle as RuntimeDynamicCircleBody2DHandle,
	RuntimePongBallOptions as RuntimeDynamicCircleBody2DOptions,
	RuntimeRicochet2DEvent,
	RuntimeRicochet2DHandle,
	RuntimeRicochet2DOptions,
	RuntimeTriggerRegion2DEvent,
	RuntimeTriggerRegion2DHandle,
	RuntimeTriggerRegion2DOptions,
	RuntimeWorldBoundary2DOptions as RuntimeBoundary2DOptions,
} from '../runtime-pong/runtime-pong.descriptors';
