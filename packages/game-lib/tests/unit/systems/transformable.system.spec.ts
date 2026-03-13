import { addComponent, addEntity, createWorld } from 'bitecs';
import { Group } from 'three';
import { describe, expect, it } from 'vitest';

import {
	commitDirectBodyPoseHistoryStep,
	prepareDirectBodyPoseHistoryStep,
	registerDirectBodyPoseHistory,
} from '../../../src/lib/physics/physics-pose';
import createTransformSystem, {
	position,
	rotation,
} from '../../../src/lib/systems/transformable.system';

function createFakeBody() {
	return {
		_translation: { x: 2, y: 0, z: 0 },
		_rotation: { x: 0, y: 0, z: 0, w: 1 },
		translation() {
			return this._translation;
		},
		rotation() {
			return this._rotation;
		},
	};
}

describe('transformable system', () => {
	it('keeps ECS at the current pose while interpolating the rendered target', () => {
		const body = createFakeBody();
		registerDirectBodyPoseHistory(body);
		prepareDirectBodyPoseHistoryStep(body);

		body._translation = { x: 4, y: 0, z: 0 };
		body._rotation = { x: 0, y: 1, z: 0, w: 0 };
		commitDirectBodyPoseHistoryStep(body);

		const ecs = createWorld();
		const eid = addEntity(ecs);
		addComponent(ecs, position, eid);
		addComponent(ecs, rotation, eid);

		const target = new Group();
		const entity = {
			eid,
			body,
			group: target,
			mesh: undefined,
			markedForRemoval: false,
			controlledRotation: false,
		};
		const { system } = createTransformSystem({
			_childrenMap: new Map([[eid, entity as any]]),
			_world: { interpolationAlpha: 0.5 },
		} as any);

		system(ecs);

		expect(position.x[eid]).toBe(4);
		expect(rotation.y[eid]).toBe(1);
		expect(rotation.w[eid]).toBe(0);
		expect(target.position.x).toBeCloseTo(3, 5);
		expect(target.quaternion.y).toBeCloseTo(Math.SQRT1_2, 5);
		expect(target.quaternion.w).toBeCloseTo(Math.SQRT1_2, 5);
	});
});
