import { addComponent, addEntity, createWorld } from 'bitecs';
import { Group, Object3D } from 'three';
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

	it('applies the rigid-body render pose directly to the target transform', () => {
		const body = createFakeBody();
		registerDirectBodyPoseHistory(body);
		prepareDirectBodyPoseHistoryStep(body);

		body._translation = { x: -3, y: 7, z: 11 };
		commitDirectBodyPoseHistoryStep(body);

		const ecs = createWorld();
		const eid = addEntity(ecs);
		addComponent(ecs, position, eid);
		addComponent(ecs, rotation, eid);

		const target = new Group();
		const child = new Object3D();
		child.position.set(5, 2, 1);
		target.add(child);

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
			_world: { interpolationAlpha: 1 },
		} as any);

		system(ecs);

		expect(target.position.x).toBe(-3);
		expect(target.position.y).toBe(7);
		expect(target.position.z).toBe(11);
		expect(child.position.x).toBe(5);
		expect(child.position.y).toBe(2);
		expect(child.position.z).toBe(1);
	});
});
