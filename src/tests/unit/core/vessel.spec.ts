import { describe, expect, it } from 'vitest';
import { vessel } from '../../../lib/core/vessel';

describe('Base vessel functionality', () => {
	it('Initialize a base vessel', () => {
		const test = vessel();
		expect(test.setup).toBeDefined();
		expect(test.update).toBeDefined();
		expect(test.destroy).toBeDefined();
	});
});