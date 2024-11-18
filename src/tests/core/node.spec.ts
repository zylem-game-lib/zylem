import { describe, expect, it } from 'vitest';
import { node } from '@/lib/entities';

describe('Base node functionality', () => {
	it('Initialize a base node', () => {
		const test = node();
		expect(test.setup).toBeDefined();
		expect(test.update).toBeDefined();
		expect(test.destroy).toBeDefined();
	});
})