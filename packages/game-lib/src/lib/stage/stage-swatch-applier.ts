/**
 * Applies swatches (configured shaders / behaviors) to live entities and
 * inverts those applications for undo.
 *
 * One `entity:apply-swatch` message is a batch: every swatch is applied to
 * every uuid, in order, under a single operation id. Each pair reports its own
 * result so a multi-select apply can partially succeed (a light in the
 * selection has no material) while the rest still land.
 *
 * Undo follows the stage's "editor holds the history, game holds the
 * instances" rule. The original material and any displaced behavior refs are
 * kept here per operation, so undo puts back the exact objects rather than a
 * reconstruction — the pre-swatch material (texture, tint, standard shader) is
 * usually not describable as a swatch at all.
 */

import type { Material } from 'three';
import type { BehaviorRef } from '@zylem/behaviors/core';
import type {
	EntityApplySwatchPayload,
	SceneOperationEntry,
	SceneOperationPayload,
	SwatchApplyResult,
	SwatchSpec,
} from '@zylem/bridge';
import type { GameEntity } from '../entities/entity';
import { getSwatchSource } from '../entities/swatch-registry';
import { isGLSLShader, isTSLShader, type ZylemShader } from '../graphics/material';

/**
 * Upper bound on remembered operations. Each holds at most one material set
 * and a few refs per entity, so this is generous for an editing session while
 * still bounding a game that spams applies.
 */
export const MAX_SWATCH_SNAPSHOTS = 200;

/** Per-entity record of what one operation displaced and what it installed. */
interface EntitySwatchSnapshot {
	/** Materials on the entity before this op touched it (first shader wins). */
	previousMaterials?: Material[];
	/**
	 * Materials the op installed, recorded when undo swaps them off the mesh so
	 * redo can put the same instances back.
	 */
	redoMaterials?: Material[];
	/** Refs displaced by this op, by behavior key (first removal per key wins). */
	previousRefs: Map<symbol, BehaviorRef>;
	/** Refs this op installed, by behavior key (last per key wins). */
	appliedRefs: Map<symbol, BehaviorRef>;
}

type OperationSnapshot = Map<string, EntitySwatchSnapshot>;

/** Stage hooks the applier needs; kept narrow so tests can pass fakes. */
export interface SwatchApplierStage {
	resolveEntity(uuid: string): GameEntity<any> | null;
	attachBehaviorLink(entity: GameEntity<any>, ref: BehaviorRef): boolean;
	detachBehaviorLink(entity: GameEntity<any>, ref: BehaviorRef): boolean;
}

export interface SwatchApplyOutcome {
	results: SwatchApplyResult[];
	/** One entry per successful pair, ready for a `scene:operation`. */
	entries: SceneOperationEntry[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isShader(value: unknown): value is ZylemShader {
	return isPlainObject(value) && (isTSLShader(value as ZylemShader) || isGLSLShader(value as ZylemShader));
}

export class StageSwatchApplier {
	private readonly stage: SwatchApplierStage;
	/** Insertion-ordered so the oldest op is the first key. */
	private readonly snapshots = new Map<string, OperationSnapshot>();

	constructor(stage: SwatchApplierStage) {
		this.stage = stage;
	}

	/**
	 * Apply every swatch to every uuid. Never throws: each pair either succeeds
	 * or reports why it did not.
	 */
	applySwatches(payload: EntityApplySwatchPayload & { opId: string }): SwatchApplyOutcome {
		const snapshot: OperationSnapshot = new Map();
		const results: SwatchApplyResult[] = [];
		const entries: SceneOperationEntry[] = [];

		for (const uuid of payload.uuids) {
			for (const spec of payload.swatches) {
				const { result, entry } = this.applyPair(uuid, spec, snapshot);
				results.push(result);
				if (entry) entries.push(entry);
			}
		}

		if (snapshot.size > 0) {
			this.remember(payload.opId, snapshot);
		}
		return { results, entries };
	}

	/**
	 * Undo or redo a `swatch` operation.
	 *
	 * With a snapshot the exact prior objects come back. Without one (the op
	 * predates a stage reload, or was evicted) redo re-applies from the entry
	 * payload and undo does its best: behaviors are removed by key, shaders fall
	 * back to a plain default material.
	 */
	applySceneOperation(op: SceneOperationPayload, direction: 'undo' | 'redo'): void {
		if (op.kind !== 'swatch') return;
		const snapshot = this.snapshots.get(op.opId);
		if (snapshot) {
			if (direction === 'undo') this.undoFromSnapshot(snapshot);
			else this.redoFromSnapshot(snapshot);
			return;
		}
		if (direction === 'redo') {
			const fresh: OperationSnapshot = new Map();
			for (const entry of op.entries) {
				if (entry.swatch) this.applyPair(entry.uuid, entry.swatch, fresh);
			}
			if (fresh.size > 0) this.remember(op.opId, fresh);
			return;
		}
		this.undoWithoutSnapshot(op);
	}

	/** Whether an operation can be inverted exactly. */
	hasSnapshot(opId: string): boolean {
		return this.snapshots.has(opId);
	}

	/** Drop every snapshot, freeing the materials that are no longer on a mesh. */
	dispose(): void {
		for (const [opId] of this.snapshots) {
			this.forget(opId);
		}
	}

	// ── Per-pair application ─────────────────────────────────────────────────

	private applyPair(
		uuid: string,
		spec: SwatchSpec,
		snapshot: OperationSnapshot,
	): { result: SwatchApplyResult; entry?: SceneOperationEntry } {
		const base = { uuid, kind: spec.kind, source: spec.source };
		const entity = this.stage.resolveEntity(uuid);
		if (!entity) {
			return { result: { ...base, ok: false, reason: 'entity-not-found' } };
		}
		if (!isPlainObject(spec.props)) {
			return { result: { ...base, ok: false, reason: 'invalid-props' } };
		}

		const entitySnapshot = snapshot.get(uuid) ?? {
			previousRefs: new Map<symbol, BehaviorRef>(),
			appliedRefs: new Map<symbol, BehaviorRef>(),
		};

		const outcome =
			spec.kind === 'shader'
				? this.applyShader(entity, spec, entitySnapshot)
				: this.applyBehavior(entity, spec, entitySnapshot);

		if (!outcome.ok) {
			return { result: { ...base, ok: false, reason: outcome.reason } };
		}

		snapshot.set(uuid, entitySnapshot);
		return {
			result: { ...base, ok: true, replaced: outcome.replaced },
			entry: {
				uuid,
				swatch: spec,
				...(outcome.replacedSpec ? { replaced: outcome.replacedSpec } : {}),
			},
		};
	}

	private applyShader(
		entity: GameEntity<any>,
		spec: SwatchSpec,
		snapshot: EntitySwatchSnapshot,
	):
		| { ok: true; replaced: boolean; replacedSpec?: undefined }
		| { ok: false; reason: SwatchApplyResult['reason'] } {
		const source = getSwatchSource('shader', spec.source);
		if (!source) return { ok: false, reason: 'unknown-source' };
		if (!entity.hasMaterial()) return { ok: false, reason: 'no-material' };

		let shader: unknown;
		try {
			shader = source.create(spec.props);
		} catch (error) {
			console.warn(`[zylem] swatch shader "${spec.source}" threw`, error);
			return { ok: false, reason: 'invalid-props' };
		}
		if (!isShader(shader)) return { ok: false, reason: 'invalid-props' };

		const previous = entity.setMaterial({ shader }, { disposePrevious: false });
		if (!previous) return { ok: false, reason: 'no-material' };

		if (snapshot.previousMaterials) {
			// A second shader in the same batch displaced our own intermediate
			// material; the original is already safe, so free the intermediate.
			disposeAll(previous, snapshot.previousMaterials);
		} else {
			snapshot.previousMaterials = previous;
		}
		return { ok: true, replaced: false };
	}

	private applyBehavior(
		entity: GameEntity<any>,
		spec: SwatchSpec,
		snapshot: EntitySwatchSnapshot,
	):
		| { ok: true; replaced: boolean; replacedSpec?: { source: string; props: Record<string, unknown> } }
		| { ok: false; reason: SwatchApplyResult['reason'] } {
		const source = getSwatchSource('behavior', spec.source);
		if (!source) return { ok: false, reason: 'unknown-source' };
		const { descriptor } = source;
		const key = descriptor.key;

		let replaced = false;
		let replacedSpec: { source: string; props: Record<string, unknown> } | undefined;
		const existing = entity.getBehaviorRef(descriptor);
		if (existing) {
			entity.removeBehavior(existing);
			this.stage.detachBehaviorLink(entity, existing);
			const installedByThisOp = snapshot.appliedRefs.get(key) === existing;
			if (!installedByThisOp) {
				replaced = true;
				replacedSpec = { source: spec.source, props: { ...existing.options } };
				if (!snapshot.previousRefs.has(key)) {
					snapshot.previousRefs.set(key, existing);
				}
			}
		}

		let ref: BehaviorRef | undefined;
		try {
			entity.use(descriptor, spec.props as Partial<Record<string, unknown>>);
			ref = entity.getBehaviorRefs().at(-1);
		} catch (error) {
			console.warn(`[zylem] swatch behavior "${spec.source}" failed to attach`, error);
		}
		if (!ref || ref.descriptor.key !== key) {
			// Put the displaced ref back so a failed apply is not also a removal.
			if (existing) {
				entity.restoreBehaviorRef(existing);
				this.stage.attachBehaviorLink(entity, existing);
				if (snapshot.previousRefs.get(key) === existing) snapshot.previousRefs.delete(key);
			}
			return { ok: false, reason: 'invalid-props' };
		}

		this.stage.attachBehaviorLink(entity, ref);
		snapshot.appliedRefs.set(key, ref);
		return { ok: true, replaced, replacedSpec };
	}

	// ── Undo / redo ──────────────────────────────────────────────────────────

	private undoFromSnapshot(snapshot: OperationSnapshot): void {
		for (const [uuid, entitySnapshot] of [...snapshot].reverse()) {
			const entity = this.stage.resolveEntity(uuid);
			if (!entity) continue;

			if (entitySnapshot.previousMaterials) {
				const current = entity.replaceMaterials(entitySnapshot.previousMaterials, {
					disposePrevious: false,
				});
				if (current) entitySnapshot.redoMaterials = current;
			}

			for (const ref of entitySnapshot.appliedRefs.values()) {
				if (entity.removeBehavior(ref)) {
					this.stage.detachBehaviorLink(entity, ref);
				}
			}
			for (const ref of entitySnapshot.previousRefs.values()) {
				entity.restoreBehaviorRef(ref);
				this.stage.attachBehaviorLink(entity, ref);
			}
		}
	}

	private redoFromSnapshot(snapshot: OperationSnapshot): void {
		for (const [uuid, entitySnapshot] of snapshot) {
			const entity = this.stage.resolveEntity(uuid);
			if (!entity) continue;

			if (entitySnapshot.redoMaterials) {
				entity.replaceMaterials(entitySnapshot.redoMaterials, { disposePrevious: false });
			}

			for (const ref of entitySnapshot.previousRefs.values()) {
				if (entity.removeBehavior(ref)) {
					this.stage.detachBehaviorLink(entity, ref);
				}
			}
			for (const ref of entitySnapshot.appliedRefs.values()) {
				entity.restoreBehaviorRef(ref);
				this.stage.attachBehaviorLink(entity, ref);
			}
		}
	}

	private undoWithoutSnapshot(op: SceneOperationPayload): void {
		for (const entry of [...op.entries].reverse()) {
			const entity = this.stage.resolveEntity(entry.uuid);
			if (!entity || !entry.swatch) continue;

			if (entry.swatch.kind === 'behavior') {
				const source = getSwatchSource('behavior', entry.swatch.source);
				if (!source) continue;
				const removed = entity.removeBehavior(source.descriptor);
				if (removed) this.stage.detachBehaviorLink(entity, removed);
				if (entry.replaced) {
					entity.use(source.descriptor, entry.replaced.props);
					const restored = entity.getBehaviorRefs().at(-1);
					if (restored) this.stage.attachBehaviorLink(entity, restored);
				}
				continue;
			}

			// The original material is gone with the snapshot; a plain default is
			// the honest fallback.
			entity.setMaterial({});
		}
	}

	// ── Snapshot bookkeeping ─────────────────────────────────────────────────

	private remember(opId: string, snapshot: OperationSnapshot): void {
		if (this.snapshots.has(opId)) this.forget(opId);
		this.snapshots.set(opId, snapshot);
		while (this.snapshots.size > MAX_SWATCH_SNAPSHOTS) {
			const oldest = this.snapshots.keys().next().value;
			if (oldest === undefined) break;
			this.forget(oldest);
		}
	}

	/** Drop one snapshot, disposing whichever material set is off the mesh. */
	private forget(opId: string): void {
		const snapshot = this.snapshots.get(opId);
		this.snapshots.delete(opId);
		if (!snapshot) return;
		for (const [uuid, entitySnapshot] of snapshot) {
			const live = this.stage.resolveEntity(uuid)?.getMaterials() ?? [];
			disposeAll(entitySnapshot.previousMaterials ?? [], live);
			disposeAll(entitySnapshot.redoMaterials ?? [], live);
		}
	}
}

/** Dispose every material in `materials` that is not also in `keep`. */
function disposeAll(materials: Material[], keep: Material[]): void {
	for (const material of materials) {
		if (!keep.includes(material)) material.dispose();
	}
}
