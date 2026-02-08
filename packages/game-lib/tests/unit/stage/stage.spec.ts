import { describe, expect, it } from 'vitest';
import { createStage } from '@zylem/game-lib';
import { Color } from 'three';
import { ZylemStageConfig } from '../../../src/lib/stage/zylem-stage';

describe('create a basic stage', () => {
	it('default configuration', () => {
		const result = createStage();
		result.wrappedStage = null as any;
		expect(result).toMatchSnapshot();
	});
	it('should create a stage with a coral background', async () => {
		const coral = new Color(Color.NAMES.coral);
		const result = createStage({ backgroundColor: coral });
		const options = result.options[0] as unknown as ZylemStageConfig;

		expect(options.backgroundColor).toBeInstanceOf(Color);
		expect(options.backgroundColor).toEqual(coral);
	});
});
