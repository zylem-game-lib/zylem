import { Group } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { createActor } from '../../../src/lib/entities/actor';
import { StageEntityModelDelegate } from '../../../src/lib/stage/stage-entity-model-delegate';

describe('StageEntityModelDelegate', () => {
	it('attaches entities immediately when observation starts after the model already exists', () => {
		const delegate = new StageEntityModelDelegate();
		const addEntityGroup = vi.fn();
		const onEntityReady = vi.fn();
		const actor = createActor({
			models: [],
		});

		actor.group = new Group();

		delegate.attach(
			{
				addEntityGroup,
			} as any,
			onEntityReady,
		);

		delegate.observe(actor);

		expect(addEntityGroup).toHaveBeenCalledWith(actor);
		expect(onEntityReady).toHaveBeenCalledWith(actor);
	});
});
