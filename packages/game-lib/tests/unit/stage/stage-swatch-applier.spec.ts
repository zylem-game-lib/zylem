import { MeshStandardMaterial } from 'three';
import { color } from 'three/tsl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineBehavior, type BehaviorRef } from '@zylem/behaviors/core';
import type { SceneOperationPayload } from '@zylem/bridge';

import { createBox } from '../../../src/lib/entities/box';
import { createZone } from '../../../src/lib/entities/zone';
import type { GameEntity } from '../../../src/lib/entities/entity';
import {
	clearSwatchRegistry,
	registerSwatchSource,
} from '../../../src/lib/entities/swatch-registry';
import {
	MAX_SWATCH_SNAPSHOTS,
	StageSwatchApplier,
	type SwatchApplierStage,
} from '../../../src/lib/stage/stage-swatch-applier';

const Thruster = defineBehavior({
	name: 'applier-thruster',
	defaultOptions: { thrust: 1 },
	systemFactory: () => ({ update() {} }),
});
const Wrap = defineBehavior({
	name: 'applier-wrap',
	defaultOptions: { width: 10 },
	systemFactory: () => ({ update() {} }),
});

/** Stage fake: uuid lookup plus a record of every link attach/detach. */
function fakeStage(entities: GameEntity<any>[]) {
	const byUuid = new Map(entities.map((entity) => [entity.uuid, entity]));
	const linked = new Map<GameEntity<any>, Set<BehaviorRef>>();
	const stage: SwatchApplierStage & {
		linkedRefs(entity: GameEntity<any>): BehaviorRef[];
		attach: ReturnType<typeof vi.fn>;
		detach: ReturnType<typeof vi.fn>;
	} = {
		resolveEntity: (uuid) => byUuid.get(uuid) ?? null,
		attach: vi.fn(),
		detach: vi.fn(),
		attachBehaviorLink(entity, ref) {
			stage.attach(entity, ref);
			const set = linked.get(entity) ?? new Set();
			set.add(ref);
			linked.set(entity, set);
			return true;
		},
		detachBehaviorLink(entity, ref) {
			stage.detach(entity, ref);
			return linked.get(entity)?.delete(ref) ?? false;
		},
		linkedRefs: (entity) => [...(linked.get(entity) ?? [])],
	};
	return stage;
}

const lava = { kind: 'shader' as const, source: 'createLava', props: { speed: 2 } };
const water = { kind: 'shader' as const, source: 'createWater', props: {} };
const thruster = { kind: 'behavior' as const, source: 'Thruster', props: { thrust: 9 } };

describe('StageSwatchApplier', () => {
	const createLava = vi.fn((props: Record<string, unknown>) => ({ colorNode: color(0xff4400), props }));
	const createWater = vi.fn(() => ({ colorNode: color(0x0044ff) }));

	beforeEach(() => {
		registerSwatchSource({ kind: 'shader', id: 'createLava', create: createLava as never });
		registerSwatchSource({ kind: 'shader', id: 'createWater', create: createWater as never });
		registerSwatchSource({ kind: 'behavior', id: 'Thruster', descriptor: Thruster });
		registerSwatchSource({ kind: 'behavior', id: 'Wrap', descriptor: Wrap });
	});

	afterEach(() => {
		clearSwatchRegistry();
		vi.clearAllMocks();
	});

	it('applies a shader through the entity material pipeline and records one entry', () => {
		const box = createBox({ name: 'box' });
		const original = box.mesh!.material;
		const applier = new StageSwatchApplier(fakeStage([box]));

		const outcome = applier.applySwatches({ opId: 'op-1', uuids: [box.uuid], swatches: [lava] });

		expect(createLava).toHaveBeenCalledWith({ speed: 2 });
		expect(box.mesh!.material).not.toBe(original);
		expect(outcome.results).toEqual([
			{ uuid: box.uuid, kind: 'shader', source: 'createLava', ok: true, replaced: false },
		]);
		expect(outcome.entries).toEqual([{ uuid: box.uuid, swatch: lava }]);
		expect(applier.hasSnapshot('op-1')).toBe(true);
	});

	it('attaches a behavior and links it to the stage', () => {
		const box = createBox({ name: 'box' });
		const stage = fakeStage([box]);
		const applier = new StageSwatchApplier(stage);

		const outcome = applier.applySwatches({ opId: 'op-1', uuids: [box.uuid], swatches: [thruster] });

		expect(outcome.results[0]).toMatchObject({ ok: true, replaced: false });
		expect(box.getBehaviorRef(Thruster)?.options).toEqual({ thrust: 9 });
		expect(stage.linkedRefs(box)).toEqual([box.getBehaviorRef(Thruster)]);
	});

	it('replaces a behavior with the same key instead of stacking a duplicate', () => {
		const box = createBox({ name: 'box' });
		const existing = box.use(Thruster, { thrust: 3 }).ref;
		const stage = fakeStage([box]);
		stage.attachBehaviorLink(box, existing);
		const applier = new StageSwatchApplier(stage);

		const outcome = applier.applySwatches({ opId: 'op-1', uuids: [box.uuid], swatches: [thruster] });

		expect(outcome.results[0]).toMatchObject({ ok: true, replaced: true });
		expect(outcome.entries[0]?.replaced).toEqual({ source: 'Thruster', props: { thrust: 3 } });
		expect(box.getBehaviorRefs().filter((ref) => ref.descriptor.key === Thruster.key)).toHaveLength(1);
		expect(box.getBehaviorRef(Thruster)?.options).toEqual({ thrust: 9 });
		expect(stage.detach).toHaveBeenCalledWith(box, existing);
		expect(stage.linkedRefs(box)).toEqual([box.getBehaviorRef(Thruster)]);
	});

	describe('failure reporting', () => {
		it('reports an unknown uuid', () => {
			const applier = new StageSwatchApplier(fakeStage([]));
			const { results, entries } = applier.applySwatches({
				opId: 'op',
				uuids: ['ghost'],
				swatches: [lava],
			});
			expect(results[0]).toMatchObject({ ok: false, reason: 'entity-not-found' });
			expect(entries).toEqual([]);
		});

		it('reports an unregistered source for both kinds', () => {
			const box = createBox({});
			const applier = new StageSwatchApplier(fakeStage([box]));
			const { results } = applier.applySwatches({
				opId: 'op',
				uuids: [box.uuid],
				swatches: [
					{ kind: 'shader', source: 'createNope', props: {} },
					{ kind: 'behavior', source: 'Nope', props: {} },
				],
			});
			expect(results.map((result) => result.reason)).toEqual(['unknown-source', 'unknown-source']);
		});

		it('reports no-material for a mesh-less entity', () => {
			const zone = createZone({});
			const applier = new StageSwatchApplier(fakeStage([zone]));
			const { results } = applier.applySwatches({ opId: 'op', uuids: [zone.uuid], swatches: [lava] });
			expect(results[0]).toMatchObject({ ok: false, reason: 'no-material' });
		});

		it('reports invalid-props when the factory throws or returns a non-shader', () => {
			const box = createBox({});
			registerSwatchSource({
				kind: 'shader',
				id: 'createBroken',
				create: () => {
					throw new Error('bad props');
				},
			});
			registerSwatchSource({ kind: 'shader', id: 'createJunk', create: () => 42 as never });
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const applier = new StageSwatchApplier(fakeStage([box]));

			const { results } = applier.applySwatches({
				opId: 'op',
				uuids: [box.uuid],
				swatches: [
					{ kind: 'shader', source: 'createBroken', props: {} },
					{ kind: 'shader', source: 'createJunk', props: {} },
					{ kind: 'shader', source: 'createLava', props: null as never },
				],
			});
			expect(results.map((result) => result.reason)).toEqual([
				'invalid-props',
				'invalid-props',
				'invalid-props',
			]);
		});
	});

	describe('batches', () => {
		it('applies every swatch to every uuid and reports uuids x swatches results', () => {
			const a = createBox({ name: 'a' });
			const b = createBox({ name: 'b' });
			const applier = new StageSwatchApplier(fakeStage([a, b]));

			const { results, entries } = applier.applySwatches({
				opId: 'op',
				uuids: [a.uuid, b.uuid],
				swatches: [lava, thruster],
			});

			expect(results).toHaveLength(4);
			expect(results.every((result) => result.ok)).toBe(true);
			expect(entries.map((entry) => [entry.uuid, entry.swatch?.source])).toEqual([
				[a.uuid, 'createLava'],
				[a.uuid, 'Thruster'],
				[b.uuid, 'createLava'],
				[b.uuid, 'Thruster'],
			]);
			expect(a.hasBehavior(Thruster)).toBe(true);
			expect(b.hasBehavior(Thruster)).toBe(true);
		});

		it('still applies to the targets that can accept when one cannot', () => {
			const box = createBox({});
			const zone = createZone({});
			const applier = new StageSwatchApplier(fakeStage([box, zone]));

			const { results, entries } = applier.applySwatches({
				opId: 'op',
				uuids: [box.uuid, zone.uuid],
				swatches: [lava],
			});

			expect(results.map((result) => result.ok)).toEqual([true, false]);
			expect(results[1]?.reason).toBe('no-material');
			expect(entries.map((entry) => entry.uuid)).toEqual([box.uuid]);
		});

		it('leaves the last shader and a single behavior per key on an entity', () => {
			const box = createBox({});
			const applier = new StageSwatchApplier(fakeStage([box]));

			const { results } = applier.applySwatches({
				opId: 'op',
				uuids: [box.uuid],
				swatches: [lava, thruster, water, { ...thruster, props: { thrust: 1 } }],
			});

			expect(results.every((result) => result.ok)).toBe(true);
			// Re-applying the same behavior inside one batch replaces our own
			// install, so it is not reported as displacing prior state.
			expect(results[3]?.replaced).toBe(false);
			expect(createWater).toHaveBeenCalledTimes(1);
			expect(box.getBehaviorRefs().filter((ref) => ref.descriptor.key === Thruster.key)).toHaveLength(1);
			expect(box.getBehaviorRef(Thruster)?.options).toEqual({ thrust: 1 });
		});
	});

	describe('undo / redo', () => {
		function operation(opId: string, entries: SceneOperationPayload['entries']): SceneOperationPayload {
			return { opId, kind: 'swatch', label: 'Apply', entries };
		}

		it('restores the original material instance on undo and the swatch material on redo', () => {
			const box = createBox({});
			const original = box.mesh!.material as MeshStandardMaterial;
			const disposeOriginal = vi.spyOn(original, 'dispose');
			const applier = new StageSwatchApplier(fakeStage([box]));

			const { entries } = applier.applySwatches({ opId: 'op', uuids: [box.uuid], swatches: [lava] });
			const swatched = box.mesh!.material;
			expect(swatched).not.toBe(original);

			applier.applySceneOperation(operation('op', entries), 'undo');
			expect(box.mesh!.material).toBe(original);
			expect(box.getMaterials()).toEqual([original]);

			applier.applySceneOperation(operation('op', entries), 'redo');
			expect(box.mesh!.material).toBe(swatched);
			expect(disposeOriginal).not.toHaveBeenCalled();
		});

		it('keeps the very first material when a batch applied two shaders', () => {
			const box = createBox({});
			const original = box.mesh!.material;
			const applier = new StageSwatchApplier(fakeStage([box]));

			const { entries } = applier.applySwatches({
				opId: 'op',
				uuids: [box.uuid],
				swatches: [lava, water],
			});
			applier.applySceneOperation(operation('op', entries), 'undo');

			expect(box.mesh!.material).toBe(original);
		});

		it('puts a displaced behavior ref back on undo, same object, and re-removes it on redo', () => {
			const box = createBox({});
			const existing = box.use(Thruster, { thrust: 3 }).ref;
			const stage = fakeStage([box]);
			stage.attachBehaviorLink(box, existing);
			const applier = new StageSwatchApplier(stage);

			const { entries } = applier.applySwatches({ opId: 'op', uuids: [box.uuid], swatches: [thruster] });
			const applied = box.getBehaviorRef(Thruster)!;

			applier.applySceneOperation(operation('op', entries), 'undo');
			expect(box.getBehaviorRef(Thruster)).toBe(existing);
			expect(box.getBehaviorRefs()).toHaveLength(1);
			expect(stage.linkedRefs(box)).toEqual([existing]);

			applier.applySceneOperation(operation('op', entries), 'redo');
			expect(box.getBehaviorRef(Thruster)).toBe(applied);
			expect(stage.linkedRefs(box)).toEqual([applied]);
		});

		it('removes a freshly added behavior on undo', () => {
			const box = createBox({});
			const stage = fakeStage([box]);
			const applier = new StageSwatchApplier(stage);

			const { entries } = applier.applySwatches({ opId: 'op', uuids: [box.uuid], swatches: [thruster] });
			applier.applySceneOperation(operation('op', entries), 'undo');

			expect(box.hasBehavior(Thruster)).toBe(false);
			expect(stage.linkedRefs(box)).toEqual([]);
		});

		it('restores every entity of a multi-entity operation', () => {
			const a = createBox({});
			const b = createBox({});
			const originals = [a.mesh!.material, b.mesh!.material];
			const applier = new StageSwatchApplier(fakeStage([a, b]));

			const { entries } = applier.applySwatches({
				opId: 'op',
				uuids: [a.uuid, b.uuid],
				swatches: [lava, thruster],
			});
			applier.applySceneOperation(operation('op', entries), 'undo');

			expect([a.mesh!.material, b.mesh!.material]).toEqual(originals);
			expect(a.hasBehavior(Thruster)).toBe(false);
			expect(b.hasBehavior(Thruster)).toBe(false);
		});

		it('re-applies from the entry payload on redo when the snapshot is gone', () => {
			const box = createBox({});
			const applier = new StageSwatchApplier(fakeStage([box]));

			applier.applySceneOperation(
				operation('never-seen', [{ uuid: box.uuid, swatch: thruster }]),
				'redo',
			);

			expect(box.getBehaviorRef(Thruster)?.options).toEqual({ thrust: 9 });
			expect(applier.hasSnapshot('never-seen')).toBe(true);
		});

		it('falls back to removing by key and restoring the recorded previous options on a snapshot-less undo', () => {
			const box = createBox({});
			box.use(Thruster, { thrust: 9 });
			const applier = new StageSwatchApplier(fakeStage([box]));

			applier.applySceneOperation(
				operation('never-seen', [
					{ uuid: box.uuid, swatch: thruster, replaced: { source: 'Thruster', props: { thrust: 3 } } },
				]),
				'undo',
			);

			expect(box.getBehaviorRef(Thruster)?.options).toEqual({ thrust: 3 });
		});

		it('evicts the oldest snapshots past the cap and frees their off-mesh materials', () => {
			const box = createBox({});
			const original = box.mesh!.material as MeshStandardMaterial;
			const disposeOriginal = vi.spyOn(original, 'dispose');
			const applier = new StageSwatchApplier(fakeStage([box]));

			for (let i = 0; i <= MAX_SWATCH_SNAPSHOTS; i += 1) {
				applier.applySwatches({ opId: `op-${i}`, uuids: [box.uuid], swatches: [lava] });
			}

			expect(applier.hasSnapshot('op-0')).toBe(false);
			expect(applier.hasSnapshot(`op-${MAX_SWATCH_SNAPSHOTS}`)).toBe(true);
			expect(disposeOriginal).toHaveBeenCalledTimes(1);
		});

		it('disposes off-mesh materials but never the live one on dispose()', () => {
			const box = createBox({});
			const original = box.mesh!.material as MeshStandardMaterial;
			const disposeOriginal = vi.spyOn(original, 'dispose');
			const applier = new StageSwatchApplier(fakeStage([box]));
			applier.applySwatches({ opId: 'op', uuids: [box.uuid], swatches: [lava] });
			const live = box.mesh!.material as MeshStandardMaterial;
			const disposeLive = vi.spyOn(live, 'dispose');

			applier.dispose();

			expect(disposeOriginal).toHaveBeenCalledTimes(1);
			expect(disposeLive).not.toHaveBeenCalled();
			expect(applier.hasSnapshot('op')).toBe(false);
		});
	});
});
