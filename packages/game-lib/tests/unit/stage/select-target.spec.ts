import { describe, expect, it } from 'vitest';

import { chooseSelectTarget } from '../../../src/lib/stage/select-target';

const entity = (distance: number) => ({ uuid: 'crate', distance });

describe('chooseSelectTarget', () => {
	it('picks nothing over empty space', () => {
		expect(chooseSelectTarget({ hud: null, entity: null, level: null })).toBeNull();
	});

	it('picks the HUD element over anything behind it', () => {
		expect(chooseSelectTarget({ hud: 'score', entity: entity(2), level: 1 })).toEqual({
			kind: 'hud',
			uuid: 'score',
		});
	});

	it('picks whichever of the level and an entity is nearer', () => {
		expect(chooseSelectTarget({ hud: null, entity: entity(4), level: 6 })).toEqual({
			kind: 'entity',
			uuid: 'crate',
			distance: 4,
		});
		expect(chooseSelectTarget({ hud: null, entity: entity(6), level: 4 })).toEqual({
			kind: 'level',
			distance: 4,
		});
	});

	it('picks the level when an entity is exactly as far', () => {
		expect(chooseSelectTarget({ hud: null, entity: entity(4), level: 4 })).toEqual({
			kind: 'level',
			distance: 4,
		});
	});

	it('picks the only thing there', () => {
		expect(chooseSelectTarget({ hud: null, entity: entity(4), level: null })?.kind).toBe('entity');
		expect(chooseSelectTarget({ hud: null, entity: null, level: 4 })?.kind).toBe('level');
	});
});
