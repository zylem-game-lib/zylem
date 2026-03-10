import type { IWorld } from 'bitecs';
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

	constructor(
		private getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) {}

	update(_ecs: IWorld, delta: number): void {
		const links = this.getBehaviorLinks?.(TOP_DOWN_MOVEMENT_BEHAVIOR_KEY);
		if (!links) return;

		for (const link of links) {
			const entity = link.entity as any;
			const ref = link.ref as any;
			if (!entity.body || !entity.transformStore) continue;

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
			this.behavior.updateEntity(entity, delta);
		}
	}

	destroy(_ecs: IWorld): void {}
}

export const TopDownMovementBehavior = defineBehavior<
	TopDownMovementBehaviorOptions,
	TopDownMovementHandle,
	TopDownMovementEntity
>({
	name: 'top-down-movement',
	defaultOptions,
	systemFactory: (ctx) =>
		new TopDownMovementBehaviorSystem(ctx.getBehaviorLinks),
	createHandle: createTopDownMovementHandle,
});
