import type { IWorld } from 'bitecs';
import { defineBehavior, type BehaviorRef } from '../behavior-descriptor';
import type { BehaviorEntityLink, BehaviorSystem } from '../behavior-system';
import type { Bounds3DPaddingInput } from '../shared/bounds-3d';
import {
	WorldBoundary3DFSM,
	type WorldBoundary3DBounds,
	type WorldBoundary3DHits,
	type WorldBoundary3DPosition,
} from './world-boundary-3d-fsm';

export interface WorldBoundary3DOptions {
	boundaries: WorldBoundary3DBounds;
	padding?: Bounds3DPaddingInput;
}

export interface WorldBoundary3DHandle {
	getLastHits(): WorldBoundary3DHits | null;
	getMovement(
		moveX: number,
		moveY: number,
		moveZ: number,
	): { moveX: number; moveY: number; moveZ: number };
	getLastClampedPosition(): WorldBoundary3DPosition | null;
}

const defaultOptions: WorldBoundary3DOptions = {
	boundaries: { top: 0, bottom: 0, left: 0, right: 0, back: 0, front: 0 },
	padding: 0,
};

const WORLD_BOUNDARY_3D_BEHAVIOR_KEY = Symbol.for(
	'zylem:behavior:world-boundary-3d',
);

function createWorldBoundary3DHandle(
	ref: BehaviorRef<WorldBoundary3DOptions>,
): WorldBoundary3DHandle {
	return {
		getLastHits: () => {
			const fsm = ref.fsm as WorldBoundary3DFSM | undefined;
			return fsm?.getLastHits() ?? null;
		},
		getMovement: (moveX: number, moveY: number, moveZ: number) => {
			const fsm = ref.fsm as WorldBoundary3DFSM | undefined;
			return fsm?.getMovement(moveX, moveY, moveZ) ?? { moveX, moveY, moveZ };
		},
		getLastClampedPosition: () => {
			const fsm = ref.fsm as WorldBoundary3DFSM | undefined;
			return fsm?.getLastClampedPosition() ?? null;
		},
	};
}

class WorldBoundary3DSystem implements BehaviorSystem {
	constructor(
		private world: any,
		private getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) {}

	update(_ecs: IWorld, _delta: number): void {
		const links = this.getBehaviorLinks?.(WORLD_BOUNDARY_3D_BEHAVIOR_KEY);
		if (!links) return;

		for (const link of links) {
			const gameEntity = link.entity as any;
			const boundaryRef = link.ref as any;
			if (!gameEntity.body) continue;

			const options = boundaryRef.options as WorldBoundary3DOptions;
			if (!boundaryRef.fsm) {
				boundaryRef.fsm = new WorldBoundary3DFSM();
			}

			const pos = gameEntity.body.translation();
			boundaryRef.fsm.update(
				{ x: pos.x, y: pos.y, z: pos.z },
				options.boundaries,
				options.padding,
			);
		}
	}

	destroy(_ecs: IWorld): void {}
}

export const WorldBoundary3DBehavior = defineBehavior({
	name: 'world-boundary-3d',
	defaultOptions,
	systemFactory: (ctx) =>
		new WorldBoundary3DSystem(ctx.world, ctx.getBehaviorLinks),
	createHandle: createWorldBoundary3DHandle,
});
