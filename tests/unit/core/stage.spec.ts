import { describe, expect, it } from 'vitest';
import { stage } from '@zylem/game-lib';
import { Color } from 'three';
import { ZylemStageConfig } from '@lib/core';

describe('create a basic stage', () => {
	it('default configuration', () => {
		const result = stage();
		result.wrappedStage = null as any;
		expect(result).toMatchSnapshot();
	});
	it('should create a stage with a coral background', async () => {
		const coral = new Color(Color.NAMES.coral);
		const result = stage({ backgroundColor: coral });
		const options = result.options[0] as ZylemStageConfig;

		expect(options.backgroundColor).toBeInstanceOf(Color);
		expect(options.backgroundColor).toEqual(coral);
	});
});
