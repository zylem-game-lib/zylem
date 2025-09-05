import { describe, it, expect } from 'vitest';
import { BaseCollision } from '../../lib/collision/collision';

describe('create base collision', () => {
	it('should create collision component', () => {
		const result = new BaseCollision({});
		expect(result).toMatchSnapshot();
	});
});