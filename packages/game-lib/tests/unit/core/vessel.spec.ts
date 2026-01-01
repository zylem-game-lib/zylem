import { describe, expect, it } from 'vitest';
import { vessel } from '../../../src/lib/core/vessel';

describe('Base vessel functionality', () => {
	it('Initialize a base vessel', () => {
		const test = vessel();
		expect(test.onSetup).toBeDefined();
		expect(test.onUpdate).toBeDefined();
		expect(test.onDestroy).toBeDefined();
	});
});