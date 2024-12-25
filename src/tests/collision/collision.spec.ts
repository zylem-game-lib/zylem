import { describe, it, expect } from 'vitest';
import { BaseCollision } from '../../lib/collision/collision';
// import { Entity } from '~/lib/core/ecs';

describe('create base collision', () => {
	it('should create collision component', () => {
		const result = new BaseCollision({});
		expect(result).toMatchSnapshot();
	});
//   it('should create collision system', () => {
// 	const components = [new BaseCollision({})];
// 	const entity = {
// 		uuid: 1,
// 		components: components
// 	} as Entity;
// 	const entities = new Map();
// 	entities.set(entity.uuid, entity);
// 	const result = new CollisionSystem();
// 	result.setup(entities);
// 	result.update(entities);
//   });
});