import { SyncStateMachine, t } from '../../core/utility/sync-state-machine';
import {
	clampPointToBounds3D,
	computeBounds3DHits,
	constrainMovementToBounds3D,
	hasAnyBounds3DHit,
	insetBounds3D,
	type Bounds3DPaddingInput,
	type Bounds3DPoint,
} from '../shared/bounds-3d';

export type WorldBoundary3DHit =
	| 'top'
	| 'bottom'
	| 'left'
	| 'right'
	| 'back'
	| 'front';

export type WorldBoundary3DHits = Record<WorldBoundary3DHit, boolean>;

export interface WorldBoundary3DPosition extends Bounds3DPoint {}

export interface WorldBoundary3DBounds {
	top: number;
	bottom: number;
	left: number;
	right: number;
	back: number;
	front: number;
}

export enum WorldBoundary3DState {
	Inside = 'inside',
	Touching = 'touching',
}

export enum WorldBoundary3DEvent {
	EnterInside = 'enter-inside',
	TouchBoundary = 'touch-boundary',
}

export function computeWorldBoundary3DHits(
	position: WorldBoundary3DPosition,
	bounds: WorldBoundary3DBounds,
	padding?: Bounds3DPaddingInput,
): WorldBoundary3DHits {
	return computeBounds3DHits(position, insetBounds3D({
		minX: bounds.left,
		maxX: bounds.right,
		minY: bounds.bottom,
		maxY: bounds.top,
		minZ: bounds.back,
		maxZ: bounds.front,
	}, padding));
}

export function hasAnyWorldBoundary3DHit(hits: WorldBoundary3DHits): boolean {
	return hasAnyBounds3DHit(hits);
}

export class WorldBoundary3DFSM {
	public readonly machine: SyncStateMachine<WorldBoundary3DState, WorldBoundary3DEvent, never>;

	private lastHits: WorldBoundary3DHits = {
		top: false,
		bottom: false,
		left: false,
		right: false,
		back: false,
		front: false,
	};
	private lastPosition: WorldBoundary3DPosition | null = null;
	private lastClampedPosition: WorldBoundary3DPosition | null = null;
	private lastUpdatedAtMs: number | null = null;

	constructor() {
		this.machine = new SyncStateMachine<WorldBoundary3DState, WorldBoundary3DEvent, never>(
			WorldBoundary3DState.Inside,
			[
				t(WorldBoundary3DState.Inside, WorldBoundary3DEvent.TouchBoundary, WorldBoundary3DState.Touching),
				t(WorldBoundary3DState.Touching, WorldBoundary3DEvent.EnterInside, WorldBoundary3DState.Inside),
				t(WorldBoundary3DState.Inside, WorldBoundary3DEvent.EnterInside, WorldBoundary3DState.Inside),
				t(WorldBoundary3DState.Touching, WorldBoundary3DEvent.TouchBoundary, WorldBoundary3DState.Touching),
			],
		);
	}

	getState(): WorldBoundary3DState {
		return this.machine.getState();
	}

	getLastHits(): WorldBoundary3DHits {
		return this.lastHits;
	}

	getMovement(
		moveX: number,
		moveY: number,
		moveZ: number,
	): { moveX: number; moveY: number; moveZ: number } {
		return constrainMovementToBounds3D(this.lastHits, moveX, moveY, moveZ);
	}

	getLastPosition(): WorldBoundary3DPosition | null {
		return this.lastPosition;
	}

	getLastClampedPosition(): WorldBoundary3DPosition | null {
		return this.lastClampedPosition;
	}

	getLastUpdatedAtMs(): number | null {
		return this.lastUpdatedAtMs;
	}

	update(
		position: WorldBoundary3DPosition,
		bounds: WorldBoundary3DBounds,
		padding?: Bounds3DPaddingInput,
	): WorldBoundary3DHits {
		const effectiveBounds = insetBounds3D({
			minX: bounds.left,
			maxX: bounds.right,
			minY: bounds.bottom,
			maxY: bounds.top,
			minZ: bounds.back,
			maxZ: bounds.front,
		}, padding);

		const hits = computeBounds3DHits(position, effectiveBounds);
		this.lastHits = hits;
		this.lastPosition = { x: position.x, y: position.y, z: position.z };
		this.lastClampedPosition = clampPointToBounds3D(position, effectiveBounds);
		this.lastUpdatedAtMs = Date.now();

		if (hasAnyWorldBoundary3DHit(hits)) {
			this.dispatch(WorldBoundary3DEvent.TouchBoundary);
		} else {
			this.dispatch(WorldBoundary3DEvent.EnterInside);
		}

		return hits;
	}

	private dispatch(event: WorldBoundary3DEvent): void {
		if (this.machine.can(event)) {
			this.machine.syncDispatch(event);
		}
	}
}
