import { describe, expect, it } from 'vitest';
import { stage } from '../../main';
import { Color } from 'three';
import { ZylemStageConfig } from '~/lib/core';

describe('create a basic stage', () => {
	it('default configuration', () => {
		const result = stage();
		result.stageRef = null as any;
		expect(result).toMatchSnapshot();
	});
	it('should create a stage with a blue background', async () => {
		const result = stage({ backgroundColor: new Color(Color.NAMES.blue) });
		const options = result.options[0] as ZylemStageConfig;
		expect(options.backgroundColor).toEqual(new Color(Color.NAMES.blue));
	});
});
