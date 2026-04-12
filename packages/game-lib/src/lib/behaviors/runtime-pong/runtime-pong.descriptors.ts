import type { IWorld } from 'bitecs';

import {
	defineBehavior,
	type BehaviorRef,
} from '../behavior-descriptor';
import type { BehaviorSystem } from '../behavior-system';

export interface RuntimePongBallOptions {
	initialVelocity: readonly [number, number];
}

export interface RuntimePongBallHandle {
	setRuntimePosition(x: number, y: number, z?: number): void;
	setRuntimeVelocity(x: number, y: number): void;
	getRuntimePosition(): { x: number; y: number; z: number } | null;
}

export interface RuntimePaddleInput2DOptions {
	player: 'p1' | 'p2';
	speed: number;
}

export interface RuntimeWorldBoundary2DOptions {
	boundaries: {
		left: number;
		right: number;
		bottom: number;
		top: number;
	};
}

export interface RuntimeRicochet2DOptions {
	minSpeed: number;
	maxSpeed: number;
	speedMultiplier: number;
	reflectionMode: 'simple' | 'angled';
	maxAngleDeg: number;
}

export interface RuntimeRicochet2DEvent {
	kind: 'wall' | 'paddle';
}

export interface RuntimeRicochet2DHandle {
	onRicochet(callback: (event: RuntimeRicochet2DEvent) => void): () => void;
}

/** Registers a gameplay2d trigger AABB (sensor); wasm reports overlap via {@link emitRuntimeTriggerRegionEnter}. */
export interface RuntimeTriggerRegion2DOptions {
	triggerId: number;
	halfExtents: readonly [number, number];
}

export interface RuntimeTriggerRegion2DEvent {
	triggerId: number;
}

export interface RuntimeTriggerRegion2DHandle {
	onRegionEnter(callback: (event: RuntimeTriggerRegion2DEvent) => void): () => void;
}

export interface RuntimeGoalZone2DOptions {
	scorer: 'p1' | 'p2';
}

export interface RuntimeGoalZone2DEvent {
	scorer: 'p1' | 'p2';
}

export interface RuntimeGoalZone2DHandle {
	onGoal(callback: (event: RuntimeGoalZone2DEvent) => void): () => void;
}

const runtimeNoopSystemFactory = (): BehaviorSystem => ({
	update(_ecs: IWorld, _delta: number) {},
});

export const RUNTIME_PONG_BALL_BEHAVIOR_KEY = Symbol.for('zylem:behavior:runtime-pong-ball');
export const RUNTIME_PADDLE_INPUT_2D_BEHAVIOR_KEY = Symbol.for('zylem:behavior:runtime-paddle-input-2d');
export const RUNTIME_WORLD_BOUNDARY_2D_BEHAVIOR_KEY = Symbol.for('zylem:behavior:runtime-world-boundary-2d');
export const RUNTIME_RICOCHET_2D_BEHAVIOR_KEY = Symbol.for('zylem:behavior:runtime-ricochet-2d');
export const RUNTIME_TRIGGER_REGION_2D_BEHAVIOR_KEY = Symbol.for('zylem:behavior:runtime-trigger-region-2d');
export const RUNTIME_GOAL_ZONE_2D_BEHAVIOR_KEY = Symbol.for('zylem:behavior:runtime-goal-zone-2d');

const RICOCHET_LISTENERS = Symbol('runtime-ricochet-listeners');
const TRIGGER_REGION_LISTENERS = Symbol('runtime-trigger-region-listeners');
const GOAL_LISTENERS = Symbol('runtime-goal-listeners');
const RUNTIME_BALL_SET_POSITION = Symbol('runtime-ball-set-position');
const RUNTIME_BALL_SET_VELOCITY = Symbol('runtime-ball-set-velocity');
const RUNTIME_BALL_GET_POSITION = Symbol('runtime-ball-get-position');

export const RuntimePongBallBehavior = defineBehavior<
	RuntimePongBallOptions,
	RuntimePongBallHandle
>({
	name: 'runtime-pong-ball',
	defaultOptions: {
		initialVelocity: [0, 0] as [number, number],
	},
	systemFactory: runtimeNoopSystemFactory,
	createHandle: (ref: BehaviorRef<RuntimePongBallOptions>) => ({
		setRuntimePosition(x: number, y: number, z: number = 0): void {
			const callback = (ref as any)[RUNTIME_BALL_SET_POSITION] as
				| ((x: number, y: number, z: number) => void)
				| undefined;
			callback?.(x, y, z);
		},
		setRuntimeVelocity(x: number, y: number): void {
			const callback = (ref as any)[RUNTIME_BALL_SET_VELOCITY] as
				| ((x: number, y: number) => void)
				| undefined;
			callback?.(x, y);
		},
		getRuntimePosition(): { x: number; y: number; z: number } | null {
			const callback = (ref as any)[RUNTIME_BALL_GET_POSITION] as
				| (() => { x: number; y: number; z: number } | null)
				| undefined;
			return callback?.() ?? null;
		},
	}),
});

export const RuntimePaddleInput2DBehavior = defineBehavior<RuntimePaddleInput2DOptions>({
	name: 'runtime-paddle-input-2d',
	defaultOptions: {
		player: 'p1',
		speed: 5,
	} as RuntimePaddleInput2DOptions,
	systemFactory: runtimeNoopSystemFactory,
});

export const RuntimeWorldBoundary2DBehavior = defineBehavior({
	name: 'runtime-world-boundary-2d',
	defaultOptions: {
		boundaries: {
			left: 0,
			right: 0,
			bottom: 0,
			top: 0,
		},
	},
	systemFactory: runtimeNoopSystemFactory,
});

export const RuntimeRicochet2DBehavior = defineBehavior<
	RuntimeRicochet2DOptions,
	RuntimeRicochet2DHandle
>({
	name: 'runtime-ricochet-2d',
	defaultOptions: {
		minSpeed: 2,
		maxSpeed: 20,
		speedMultiplier: 1.05,
		reflectionMode: 'angled' as const,
		maxAngleDeg: 60,
	},
	systemFactory: runtimeNoopSystemFactory,
	createHandle: (ref: BehaviorRef<RuntimeRicochet2DOptions>) => ({
		onRicochet(callback: (event: RuntimeRicochet2DEvent) => void): () => void {
			const listeners =
				((ref as any)[RICOCHET_LISTENERS] as Array<(event: RuntimeRicochet2DEvent) => void> | undefined)
				?? [];
			if (!(ref as any)[RICOCHET_LISTENERS]) {
				(ref as any)[RICOCHET_LISTENERS] = listeners;
			}
			listeners.push(callback);
			return () => {
				const index = listeners.indexOf(callback);
				if (index >= 0) {
					listeners.splice(index, 1);
				}
			};
		},
	}),
});

export const RuntimeTriggerRegion2DBehavior = defineBehavior<
	RuntimeTriggerRegion2DOptions,
	RuntimeTriggerRegion2DHandle
>({
	name: 'runtime-trigger-region-2d',
	defaultOptions: {
		triggerId: 0,
		halfExtents: [0.5, 2.5] as [number, number],
	},
	systemFactory: runtimeNoopSystemFactory,
	createHandle: (ref: BehaviorRef<RuntimeTriggerRegion2DOptions>) => ({
		onRegionEnter(callback: (event: RuntimeTriggerRegion2DEvent) => void): () => void {
			const listeners =
				((ref as any)[TRIGGER_REGION_LISTENERS] as
					| Array<(event: RuntimeTriggerRegion2DEvent) => void>
					| undefined) ?? [];
			if (!(ref as any)[TRIGGER_REGION_LISTENERS]) {
				(ref as any)[TRIGGER_REGION_LISTENERS] = listeners;
			}
			listeners.push(callback);
			return () => {
				const index = listeners.indexOf(callback);
				if (index >= 0) {
					listeners.splice(index, 1);
				}
			};
		},
	}),
});

export const RuntimeGoalZone2DBehavior = defineBehavior<
	RuntimeGoalZone2DOptions,
	RuntimeGoalZone2DHandle
>({
	name: 'runtime-goal-zone-2d',
	defaultOptions: {
		scorer: 'p1',
	} as RuntimeGoalZone2DOptions,
	systemFactory: runtimeNoopSystemFactory,
	createHandle: (ref: BehaviorRef<RuntimeGoalZone2DOptions>) => ({
		onGoal(callback: (event: RuntimeGoalZone2DEvent) => void): () => void {
			const listeners =
				((ref as any)[GOAL_LISTENERS] as Array<(event: RuntimeGoalZone2DEvent) => void> | undefined)
				?? [];
			if (!(ref as any)[GOAL_LISTENERS]) {
				(ref as any)[GOAL_LISTENERS] = listeners;
			}
			listeners.push(callback);
			return () => {
				const index = listeners.indexOf(callback);
				if (index >= 0) {
					listeners.splice(index, 1);
				}
			};
		},
	}),
});

export function emitRuntimeRicochet(
	ref: BehaviorRef<RuntimeRicochet2DOptions>,
	event: RuntimeRicochet2DEvent,
): void {
	const listeners = (ref as any)[RICOCHET_LISTENERS] as
		| Array<(event: RuntimeRicochet2DEvent) => void>
		| undefined;
	for (const listener of listeners ?? []) {
		listener(event);
	}
}

export function emitRuntimeTriggerRegionEnter(
	ref: BehaviorRef<RuntimeTriggerRegion2DOptions>,
	event: RuntimeTriggerRegion2DEvent,
): void {
	const listeners = (ref as any)[TRIGGER_REGION_LISTENERS] as
		| Array<(event: RuntimeTriggerRegion2DEvent) => void>
		| undefined;
	for (const listener of listeners ?? []) {
		listener(event);
	}
}

export function emitRuntimeGoal(
	ref: BehaviorRef<RuntimeGoalZone2DOptions>,
	event: RuntimeGoalZone2DEvent,
): void {
	const listeners = (ref as any)[GOAL_LISTENERS] as
		| Array<(event: RuntimeGoalZone2DEvent) => void>
		| undefined;
	for (const listener of listeners ?? []) {
		listener(event);
	}
}

export function bindRuntimePongBallHandle(
	ref: BehaviorRef<RuntimePongBallOptions>,
	controls: {
		setPosition: (x: number, y: number, z: number) => void;
		setVelocity: (x: number, y: number) => void;
		getPosition: () => { x: number; y: number; z: number } | null;
	},
): void {
	(ref as any)[RUNTIME_BALL_SET_POSITION] = controls.setPosition;
	(ref as any)[RUNTIME_BALL_SET_VELOCITY] = controls.setVelocity;
	(ref as any)[RUNTIME_BALL_GET_POSITION] = controls.getPosition;
}
