import { Group, Object3D } from 'three';
import { describe, expect, it } from 'vitest';

import {
	commitDirectBodyPoseHistoryStep,
	prepareDirectBodyPoseHistoryStep,
	registerDirectBodyPoseHistory,
} from '../../../src/lib/physics/physics-pose';
import { syncRenderPoses } from '../../../src/lib/systems/transformable.system';

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

describe('syncRenderPoses', () => {
	it('interpolates the rendered target between physics steps', () => {
		const body = createFakeBody();
		registerDirectBodyPoseHistory(body);
		prepareDirectBodyPoseHistoryStep(body);

		body._translation = { x: 4, y: 0, z: 0 };
		body._rotation = { x: 0, y: 1, z: 0, w: 0 };
		commitDirectBodyPoseHistoryStep(body);

		const key = 'test-entity-uuid';
		const target = new Group();
		const entity = {
			uuid: key,
			body,
			group: target,
			mesh: undefined,
			markedForRemoval: false,
			controlledRotation: false,
		};
		syncRenderPoses({
			_childrenMap: new Map([[key, entity as any]]),
			_world: { interpolationAlpha: 0.5 },
		} as any);

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

		const key = 'test-entity-uuid-2';
		const target = new Group();
		const child = new Object3D();
		child.position.set(5, 2, 1);
		target.add(child);

		const entity = {
			uuid: key,
			body,
			group: target,
			mesh: undefined,
			markedForRemoval: false,
			controlledRotation: false,
		};
		syncRenderPoses({
			_childrenMap: new Map([[key, entity as any]]),
			_world: { interpolationAlpha: 1 },
		} as any);

		expect(target.position.x).toBe(-3);
		expect(target.position.y).toBe(7);
		expect(target.position.z).toBe(11);
		expect(child.position.x).toBe(5);
		expect(child.position.y).toBe(2);
		expect(child.position.z).toBe(1);
	});

	it('skips instanced entities so InstanceManager owns their transforms', () => {
		const body = createFakeBody();
		registerDirectBodyPoseHistory(body);
		prepareDirectBodyPoseHistoryStep(body);
		body._translation = { x: 9, y: 9, z: 9 };
		commitDirectBodyPoseHistoryStep(body);

		const key = 'instanced-entity';
		const target = new Group();
		target.position.set(0, 0, 0);
		const entity = {
			uuid: key,
			body,
			group: target,
			mesh: undefined,
			isInstanced: true,
			markedForRemoval: false,
			controlledRotation: false,
		};

		syncRenderPoses({
			_childrenMap: new Map([[key, entity as any]]),
			_world: { interpolationAlpha: 1 },
		} as any);

		expect(target.position.x).toBe(0);
		expect(target.position.y).toBe(0);
		expect(target.position.z).toBe(0);
	});

	it('skips bundled entities so RenderBundleManager owns their transforms', () => {
		const body = createFakeBody();
		registerDirectBodyPoseHistory(body);
		prepareDirectBodyPoseHistoryStep(body);
		body._translation = { x: 9, y: 9, z: 9 };
		commitDirectBodyPoseHistoryStep(body);

		const key = 'bundled-entity';
		const target = new Group();
		target.position.set(0, 0, 0);
		const entity = {
			uuid: key,
			body,
			group: target,
			mesh: undefined,
			isBundled: true,
			markedForRemoval: false,
			controlledRotation: false,
		};

		syncRenderPoses({
			_childrenMap: new Map([[key, entity as any]]),
			_world: { interpolationAlpha: 1 },
		} as any);

		expect(target.position.x).toBe(0);
		expect(target.position.y).toBe(0);
		expect(target.position.z).toBe(0);
	});

	it('skips entities with skipRenderPoseSync so camera-parented viewmodels keep local transforms', () => {
		const body = createFakeBody();
		registerDirectBodyPoseHistory(body);
		prepareDirectBodyPoseHistoryStep(body);
		body._translation = { x: 9, y: 9, z: 9 };
		commitDirectBodyPoseHistoryStep(body);

		const key = 'viewmodel-entity';
		const target = new Group();
		target.position.set(0.28, -0.28, -0.5);
		const entity = {
			uuid: key,
			body,
			group: target,
			mesh: undefined,
			skipRenderPoseSync: true,
			markedForRemoval: false,
			controlledRotation: false,
		};

		syncRenderPoses({
			_childrenMap: new Map([[key, entity as any]]),
			_world: { interpolationAlpha: 1 },
		} as any);

		expect(target.position.x).toBeCloseTo(0.28);
		expect(target.position.y).toBeCloseTo(-0.28);
		expect(target.position.z).toBeCloseTo(-0.5);
	});
});
