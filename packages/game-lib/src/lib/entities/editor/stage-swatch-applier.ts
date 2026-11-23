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
 * instances" rule. The original material is kept here per operation, so undo
 * puts back the exact object rather than a reconstruction — the pre-swatch
 * material (texture, tint, standard shader) is usually not describable as a
 * swatch at all.
 *
 * Behaviors need no kept objects. An entity holds one slot per behavior for
 * its whole life, so an operation records each behavior's options and whether
 * it was enabled, and undo and redo write those back through the handle.
 */

import type { Material } from 'three';
import type { BehaviorDescriptor, BehaviorHandle } from '@zylem/behaviors/core';
import type {
	EntityApplySwatchPayload,
	SceneOperationEntry,
	SceneOperationPayload,
	SwatchApplyResult,
	SwatchSpec,
} from '@zylem/bridge';
import { deepCloneValue } from '../../core/clone-utils';
import type { GameEntity } from '../entity';
import { getSwatchSource } from './swatch-registry';
import { isGLSLShader, isTSLShader, type ZylemShader } from '../../graphics/material';

/**
 * Upper bound on remembered operations. Each holds at most one material set
 * and a few option copies per entity, so this is generous for an editing session while
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
	/** Behaviors this op changed, by behavior key. */
	behaviors: Map<symbol, BehaviorSwatchSnapshot>;
}

type BehaviorOptions = Record<string, unknown>;

/** One behavior's state on either side of an operation. */
interface BehaviorSwatchSnapshot {
	descriptor: BehaviorDescriptor<any, any>;
	/**
	 * The behavior before the op (the first swatch per key wins). Null when
	 * the entity did not have it.
	 */
	previous: { options: BehaviorOptions; enabled: boolean } | null;
	/** The options the op left it with (the last swatch per key wins). */
	applied: BehaviorOptions;
}

type OperationSnapshot = Map<string, EntitySwatchSnapshot>;

/** Stage hooks the applier needs; kept narrow so tests can pass fakes. */
export interface SwatchApplierStage {
	resolveEntity(uuid: string): GameEntity<any> | null;
}

export interface SwatchApplyOutcome {
	results: SwatchApplyResult[];
	/** One entry per successful pair, ready for a `scene:operation`. */
	entries: SceneOperationEntry[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Leave a behavior with exactly `options`, switched on or off.
 *
 * The behavior is stopped while its options change, so a running one restarts
 * once with the final set.
 *
 * @throws On a spawned entity when the behavior is running and cannot be
 * removed at runtime. Nothing has changed when it throws.
 */
function writeBehaviorState(
	handle: BehaviorHandle<any, any>,
	options: BehaviorOptions,
	enabled: boolean,
): void {
	if (handle.enabled) handle.disable();

	const current = handle.getOptions() as BehaviorOptions;
	for (const key of Object.keys(current)) {
		if (!(key in options)) delete current[key];
	}
	handle.setOptions(deepCloneValue(options));

	if (enabled) handle.enable();
}

/** Whether a behavior still has the options (compared one level deep) and enabled state recorded for it. */
function behaviorStateMatches(
	handle: BehaviorHandle<any, any>,
	state: { options: BehaviorOptions; enabled: boolean },
): boolean {
	if (handle.enabled !== state.enabled) return false;
	const current = handle.getOptions() as BehaviorOptions;
	const keys = Object.keys(current);
	return (
		keys.length === Object.keys(state.options).length
		&& keys.every((key) => JSON.stringify(current[key]) === JSON.stringify(state.options[key]))
	);
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
	 * With a snapshot the exact prior material and behavior state come back.
	 * Without one (the op predates a stage reload, or was evicted) redo
	 * re-applies from the entry payload and undo does its best: behaviors are
	 * disabled by key, shaders fall back to a plain default material.
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

		const entitySnapshot: EntitySwatchSnapshot = snapshot.get(uuid) ?? {
			behaviors: new Map(),
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

		const recorded = snapshot.behaviors.get(key);
		const handle = entity.getBehaviorHandle(descriptor);
		const before = handle
			? { options: deepCloneValue(handle.getOptions()) as BehaviorOptions, enabled: handle.enabled }
			: null;

		try {
			if (handle) {
				// A swatch is a whole configuration: keys it leaves out go back
				// to the behavior's defaults.
				writeBehaviorState(handle, { ...descriptor.defaultOptions, ...spec.props }, true);
			} else {
				entity.use(descriptor, spec.props as Partial<Record<string, unknown>>);
			}
		} catch (error) {
			console.warn(`[zylem] swatch behavior "${spec.source}" failed to attach`, error);
			this.rollBackBehavior(entity, descriptor, before);
			return { ok: false, reason: 'invalid-props' };
		}

		const applied = deepCloneValue(
			entity.getBehaviorHandle(descriptor)!.getOptions(),
		) as BehaviorOptions;
		if (recorded) {
			// A second swatch for this behavior in the same batch replaced our
			// own install; what the op displaced is already recorded.
			recorded.applied = applied;
			return { ok: true, replaced: false };
		}

		snapshot.behaviors.set(key, { descriptor, previous: before, applied });
		// Only a behavior that was running counts as replaced. One that was
		// switched off goes back to off on undo, which needs no record.
		if (before?.enabled) {
			return {
				ok: true,
				replaced: true,
				replacedSpec: { source: spec.source, props: { ...before.options } },
			};
		}
		return { ok: true, replaced: false };
	}

	/** Put a behavior back the way a failed apply found it. */
	private rollBackBehavior(
		entity: GameEntity<any>,
		descriptor: BehaviorDescriptor<any, any>,
		before: BehaviorSwatchSnapshot['previous'],
	): void {
		try {
			if (before) {
				const handle = entity.getBehaviorHandle(descriptor);
				if (handle && !behaviorStateMatches(handle, before)) {
					writeBehaviorState(handle, before.options, before.enabled);
				}
			} else {
				entity.unuse(descriptor);
			}
		} catch (error) {
			console.warn('[zylem] could not roll back a failed swatch behavior', error);
		}
	}

	/**
	 * Write one side of a behavior snapshot back to the entity. Never throws:
	 * a behavior that cannot be removed at runtime stays as it is, with a
	 * warning.
	 */
	private restoreBehavior(
		entity: GameEntity<any>,
		behavior: BehaviorSwatchSnapshot,
		direction: 'undo' | 'redo',
	): void {
		const handle = entity.getBehaviorHandle(behavior.descriptor);
		try {
			if (direction === 'redo') {
				if (handle) writeBehaviorState(handle, behavior.applied, true);
				else entity.use(behavior.descriptor, deepCloneValue(behavior.applied));
			} else if (!handle) {
				return;
			} else if (behavior.previous) {
				writeBehaviorState(handle, behavior.previous.options, behavior.previous.enabled);
			} else {
				handle.disable();
			}
		} catch (error) {
			console.warn(`[zylem] could not ${direction} a swatch behavior`, error);
		}
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

			for (const behavior of [...entitySnapshot.behaviors.values()].reverse()) {
				this.restoreBehavior(entity, behavior, 'undo');
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

			for (const behavior of entitySnapshot.behaviors.values()) {
				this.restoreBehavior(entity, behavior, 'redo');
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
				const { descriptor } = source;
				this.restoreBehavior(
					entity,
					{
						descriptor,
						previous: entry.replaced
							? {
								options: { ...descriptor.defaultOptions, ...entry.replaced.props },
								enabled: true,
							}
							: null,
						applied: entry.swatch.props,
					},
					'undo',
				);
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
