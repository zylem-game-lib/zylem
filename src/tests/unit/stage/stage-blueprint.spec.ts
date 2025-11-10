import { beforeEach, describe, expect, it } from 'vitest';
import {
	createStageBlueprint,
	upsertStageBlueprint,
	removeStageBlueprint,
	getStageBlueprint,
	listStageBlueprints,
	setCurrentStageBlueprint,
	getCurrentStageBlueprint,
	buildStageFromBlueprint,
	stageBlueprintsState,
	resetStageBlueprints,
} from '../../../lib/stage/stage-blueprint';
import {
	resetStageDefaults,
	setStageDefaults,
} from '../../../lib/stage/stage-default';

describe('stage blueprints', () => {
	beforeEach(() => {
		resetStageBlueprints();
		resetStageDefaults();
	});

	it('default configuration', () => {
		const result = createStageBlueprint({});
		expect(result.config).toEqual({});
		expect(result.id).toBeDefined();
		expect(result.name).toBeUndefined();
	});

	it('create with name and setCurrent', () => {
		const bp = createStageBlueprint({ variables: { score: 0 } }, { name: 'Start', setCurrent: true });
		expect(stageBlueprintsState.byId[bp.id]).toBeDefined();
		expect(stageBlueprintsState.order).toContain(bp.id);
		expect(stageBlueprintsState.currentId).toBe(bp.id);
		expect(bp.name).toBe('Start');
		expect(bp.config).toEqual({ variables: { score: 0 } });
	});

	it('upsert updates config and preserves order (no duplicates)', () => {
		const bp = createStageBlueprint({ variables: { a: 1 } }, { name: 'A' });
		const originalOrder = [...stageBlueprintsState.order];
		upsertStageBlueprint({ ...bp, name: 'A1', config: { variables: { b: 2 } } });
		const updated = getStageBlueprint(bp.id)!;
		expect(updated.name).toBe('A1');
		expect(updated.config).toEqual({ variables: { b: 2 } });
		expect(stageBlueprintsState.order).toEqual(originalOrder);
	});

	it('remove deletes from store and clears current if needed', () => {
		const a = createStageBlueprint({}, { setCurrent: true });
		const b = createStageBlueprint({});
		expect(stageBlueprintsState.order).toEqual([a.id, b.id]);
		removeStageBlueprint(a.id);
		expect(getStageBlueprint(a.id)).toBeUndefined();
		expect(stageBlueprintsState.order).toEqual([b.id]);
		expect(stageBlueprintsState.currentId).toBeNull();
	});

	it('get and list return expected values in insertion order', () => {
		const a = createStageBlueprint({});
		const b = createStageBlueprint({ backgroundImage: 'img' });
		expect(getStageBlueprint('missing')).toBeUndefined();
		expect(getStageBlueprint(a.id)?.id).toBe(a.id);
		const list = listStageBlueprints();
		expect(list.map((x) => x.id)).toEqual([a.id, b.id]);
	});

	it('current selection helpers', () => {
		const a = createStageBlueprint({});
		const b = createStageBlueprint({});
		setCurrentStageBlueprint(a.id);
		expect(getCurrentStageBlueprint()!.id).toBe(a.id);
		setCurrentStageBlueprint(b.id);
		expect(getCurrentStageBlueprint()!.id).toBe(b.id);
		setCurrentStageBlueprint(null);
		expect(getCurrentStageBlueprint()).toBeNull();
	});

	it('buildStageFromBlueprint returns a Stage with defaults + config', () => {
		setStageDefaults({ backgroundImage: 'bg.png' });
		const bp = createStageBlueprint({ variables: { lives: 3 } });
		const s1 = buildStageFromBlueprint(bp);
		expect((s1.options[0] as any)?.variables).toEqual(bp.config.variables);
	});
});
