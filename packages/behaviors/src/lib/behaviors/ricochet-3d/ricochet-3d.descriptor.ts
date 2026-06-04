import { defineBehavior, type BehaviorRef } from '../behavior-descriptor';
import type { BehaviorEntityLink, BehaviorSystem } from '../behavior-system';
import {
	Ricochet3DFSM,
	type Ricochet3DResult,
	type Ricochet3DCollisionContext,
	type Ricochet3DCallback,
} from './ricochet-3d-fsm';
import {
	StageRicochetDim,
	StageRicochetReflection,
	type WasmStageRuntime,
} from '../../runtime/wasm-stage-runtime';

export type { Ricochet3DResult };

export interface Ricochet3DOptions {
	minSpeed: number;
	maxSpeed: number;
	speedMultiplier: number;
	reflectionMode: 'simple' | 'angled';
	maxAngleDeg: number;
}

export interface Ricochet3DHandle {
	getRicochet(ctx: Ricochet3DCollisionContext): Ricochet3DResult | null;
	applyRicochet(ctx: Ricochet3DCollisionContext): boolean;
	getLastResult(): Ricochet3DResult | null;
	onRicochet(callback: Ricochet3DCallback): () => void;
}

const defaultOptions: Ricochet3DOptions = {
	minSpeed: 2,
	maxSpeed: 20,
	speedMultiplier: 1.05,
	reflectionMode: 'angled',
	maxAngleDeg: 45,
};

const RICOCHET_3D_BEHAVIOR_KEY = Symbol.for('zylem:behavior:ricochet-3d');

function createRicochet3DHandle(
	ref: BehaviorRef<Ricochet3DOptions>,
): Ricochet3DHandle {
	return {
		getRicochet: (ctx: Ricochet3DCollisionContext) => {
			const fsm = ref.fsm as Ricochet3DFSM | undefined;
			if (!fsm) return null;
			return fsm.computeRicochet(ctx, ref.options);
		},
		applyRicochet: (ctx: Ricochet3DCollisionContext): boolean => {
			const fsm = ref.fsm as Ricochet3DFSM | undefined;
			if (!fsm || fsm.isOnCooldown()) return false;

			const result = fsm.computeRicochet(ctx, ref.options);
			if (!result) return false;

			const entity = ctx.entity as any;
			if (entity?.transformStore) {
				entity.transformStore.velocity.x = result.velocity.x;
				entity.transformStore.velocity.y = result.velocity.y;
				entity.transformStore.velocity.z = result.velocity.z;
				entity.transformStore.dirty.velocity = true;
			}

			return true;
		},
		getLastResult: () => {
			const fsm = ref.fsm as Ricochet3DFSM | undefined;
			return fsm?.getLastResult() ?? null;
		},
		onRicochet: (callback: Ricochet3DCallback) => {
			const fsm = ref.fsm as Ricochet3DFSM | undefined;
			if (!fsm) {
				if (!(ref as any).pendingListeners) {
					(ref as any).pendingListeners = [];
				}
				(ref as any).pendingListeners.push(callback);
				return () => {
					const pending = (ref as any).pendingListeners as Ricochet3DCallback[];
					const index = pending.indexOf(callback);
					if (index >= 0) pending.splice(index, 1);
				};
			}
			return fsm.addListener(callback);
		},
	};
}

class Ricochet3DSystem implements BehaviorSystem {
	private elapsedMs = 0;
	private attachedRuntimeSlots = new Set<number>();

	constructor(
		private world: any,
		private wasmStage: WasmStageRuntime | null,
		private getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) {}

	update(_ecs: unknown, delta: number): void {
		this.elapsedMs += delta * 1000;

		const links = this.getBehaviorLinks?.(RICOCHET_3D_BEHAVIOR_KEY);
		if (!links) return;

		for (const link of links) {
			const ref = link.ref as any;
			const gameEntity = link.entity as any;
			if (!ref.fsm) {
				ref.fsm = new Ricochet3DFSM();
				const pending = ref.pendingListeners as Ricochet3DCallback[] | undefined;
				if (pending) {
					for (const callback of pending) {
						ref.fsm.addListener(callback);
					}
					ref.pendingListeners = [];
				}
			}

			ref.fsm.setCurrentTimeMs(this.elapsedMs);

			const handle = (gameEntity?.runtimeHandle ?? -1) as number;
			if (this.wasmStage && handle >= 0) {
				this.ensureWasmAttached(handle, ref.options as Ricochet3DOptions);
			}
		}
	}

	private ensureWasmAttached(handle: number, options: Ricochet3DOptions): void {
		if (!this.wasmStage || this.attachedRuntimeSlots.has(handle)) return;
		const reflectionMode = options.reflectionMode === 'simple'
			? StageRicochetReflection.Mirror
			: StageRicochetReflection.Angled;
		this.wasmStage.attachRicochet(handle, StageRicochetDim.Three, {
			minSpeed: options.minSpeed,
			maxSpeed: options.maxSpeed,
			speedMultiplier: options.speedMultiplier,
			maxAngleDeg: options.maxAngleDeg,
			reflectionMode,
		});
		this.attachedRuntimeSlots.add(handle);
	}

	destroy(_ecs: unknown): void {
		const links = this.getBehaviorLinks?.(RICOCHET_3D_BEHAVIOR_KEY);
		if (links) {
			for (const link of links) {
				const ref = link.ref as any;
				ref.fsm?.resetCooldown();
			}
		}
		this.attachedRuntimeSlots.clear();
	}
}

export const Ricochet3DBehavior = defineBehavior({
	name: 'ricochet-3d',
	defaultOptions,
	systemFactory: (ctx) =>
		new Ricochet3DSystem(ctx.world, ctx.wasmStage ?? null, ctx.getBehaviorLinks),
	createHandle: createRicochet3DHandle,
});
