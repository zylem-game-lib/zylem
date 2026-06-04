import { defineBehavior, type BehaviorRef } from '../behavior-descriptor';
import type { BehaviorEntityLink, BehaviorSystem } from '../behavior-system';
import {
	createTopDownMovementComponent,
	createTopDownMovementInputComponent,
	createTopDownMovementStateComponent,
} from './components';
import {
	TopDownMovementRuntimeBehavior,
	type TopDownMovementEntity,
} from './top-down-movement.behavior';
import {
	StageTopDownPlane,
	type WasmStageRuntime,
} from '../../runtime/wasm-stage-runtime';

export interface TopDownMovementBehaviorOptions {
	moveSpeed?: number;
}

export interface TopDownMovementHandle {
	getFacingAngle(): number;
}

const defaultOptions: TopDownMovementBehaviorOptions = {
	moveSpeed: 8,
};

const TOP_DOWN_MOVEMENT_BEHAVIOR_KEY = Symbol.for(
	'zylem:behavior:top-down-movement',
);

function createTopDownMovementHandle(
	ref: BehaviorRef<TopDownMovementBehaviorOptions>,
): TopDownMovementHandle {
	return {
		getFacingAngle: () =>
			(ref as any).__entity?.topDownMovementState?.facingAngle ?? 0,
	};
}

class TopDownMovementBehaviorSystem implements BehaviorSystem {
	private behavior = new TopDownMovementRuntimeBehavior();
	private attachedRuntimeSlots = new Set<number>();

	constructor(
		private wasmStage: WasmStageRuntime | null,
		private getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) {}

	update(_ecs: unknown, delta: number): void {
		const links = this.getBehaviorLinks?.(TOP_DOWN_MOVEMENT_BEHAVIOR_KEY);
		if (!links) return;

		for (const link of links) {
			const entity = link.entity as any;
			const ref = link.ref as any;

			if (!entity.topDownMovement) {
				entity.topDownMovement = createTopDownMovementComponent(ref.options);
			}
			if (!entity.$topDownMovement) {
				entity.$topDownMovement = createTopDownMovementInputComponent();
			}
			if (!entity.topDownMovementState) {
				entity.topDownMovementState = createTopDownMovementStateComponent();
			}

			ref.__entity = entity;

			const handle = (entity.runtimeHandle ?? -1) as number;
			if (this.wasmStage && handle >= 0) {
				this.ensureWasmAttached(handle, ref.options as TopDownMovementBehaviorOptions);
				const input = entity.$topDownMovement;
				if (input) {
					this.wasmStage.setTopDownInput(handle, input.moveX ?? 0, input.moveY ?? input.moveZ ?? 0);
				}
				continue;
			}

			if (!entity.body || !entity.transformStore) continue;
			this.behavior.updateEntity(entity, delta);
		}
	}

	private ensureWasmAttached(handle: number, options: TopDownMovementBehaviorOptions): void {
		if (!this.wasmStage || this.attachedRuntimeSlots.has(handle)) return;
		this.wasmStage.attachTopDown(handle, {
			plane: StageTopDownPlane.Xy,
			speed: options.moveSpeed ?? defaultOptions.moveSpeed!,
			faceMovement: true,
		});
		this.attachedRuntimeSlots.add(handle);
	}

	destroy(_ecs: unknown): void {
		this.attachedRuntimeSlots.clear();
	}
}

export const TopDownMovementBehavior = defineBehavior<
	TopDownMovementBehaviorOptions,
	TopDownMovementHandle,
	TopDownMovementEntity
>({
	name: 'top-down-movement',
	defaultOptions,
	systemFactory: (ctx) =>
		new TopDownMovementBehaviorSystem(ctx.wasmStage ?? null, ctx.getBehaviorLinks),
	createHandle: createTopDownMovementHandle,
});
