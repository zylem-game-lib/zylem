import { describe, expect, it, vi } from 'vitest';
import { Color, Vector2, Vector3 } from 'three';
import { defineBehavior, type BehaviorRef } from '../../../src/lib/behaviors/behavior-descriptor';
import { createEntityFactory } from '../../../src/lib/entities/entity-factory';
import { createBox } from '../../../src/lib/entities/box';
import {
	boxCollision,
	sphereCollision,
} from '../../../src/lib/entities/parts/collision-factories';
import {
	boxMesh,
	sphereMesh,
} from '../../../src/lib/entities/parts/mesh-factories';
import { createSphere } from '../../../src/lib/entities/sphere';
import { createText } from '../../../src/lib/entities/text';
import { create } from '../../../src/lib/entities/entity';

const CloneAwareBehavior = defineBehavior({
	name: 'clone-aware-test',
	defaultOptions: { nested: { speed: 1 } },
	systemFactory: () => ({ update: () => {} }),
	createHandle: (ref: BehaviorRef<{ nested: { speed: number } }>) => ({
		readSpeed: () => ref.options.nested.speed,
	}),
});

describe('GameEntity.clone', () => {
	it('clones prefab entities with fresh options, behaviors, lifecycle callbacks, and collision callbacks', () => {
		const updateValues: number[] = [];
		const collisionValues: number[] = [];
		const updateSpy = vi.fn();
		const collisionSpy = vi.fn();

		const source = createSphere({
			name: 'source-ball',
			radius: 0.45,
			position: new Vector3(1, 2, 3),
			custom: {
				label: 'source',
				nested: { count: 1 },
			},
		});
		const behavior = source.use(CloneAwareBehavior, {
			nested: { speed: 7 },
		});

		source.onUpdate(() => {
			updateSpy();
			updateValues.push(behavior.readSpeed());
		});
		source.onCollision(() => {
			collisionSpy();
			collisionValues.push(behavior.readSpeed());
		});

		const clone = source.clone({
			name: 'clone-ball',
			position: new Vector3(9, 8, 7),
			custom: {
				label: 'clone',
				nested: { count: 2 },
			},
		});

		expect(clone).toBeInstanceOf(source.constructor as any);
		expect(clone.uuid).not.toBe(source.uuid);
		expect(clone.options.name).toBe('clone-ball');
		expect(clone.getBehaviorRefs()).toHaveLength(1);
		expect(clone.getCollisionCallbacks()).toHaveLength(1);

		const clonePosition = clone.options.position as Vector3;
		const sourcePosition = source.options.position as Vector3;
		expect(clonePosition).not.toBe(sourcePosition);
		expect(clonePosition.toArray()).toEqual([9, 8, 7]);

		clonePosition.set(3, 2, 1);
		expect(sourcePosition.toArray()).toEqual([1, 2, 3]);

		const cloneCustom = clone.options.custom as { label: string; nested: { count: number } };
		const sourceCustom = source.options.custom as { label: string; nested: { count: number } };
		cloneCustom.nested.count = 99;
		expect(sourceCustom.nested.count).toBe(1);

		const cloneBehaviorRef = clone.getBehaviorRefs()[0] as BehaviorRef<{ nested: { speed: number } }>;
		const sourceBehaviorRef = source.getBehaviorRefs()[0] as BehaviorRef<{ nested: { speed: number } }>;
		cloneBehaviorRef.options.nested.speed = 99;
		expect(sourceBehaviorRef.options.nested.speed).toBe(7);

		clone.nodeUpdate({ me: clone, delta: 1 / 60, globals: {} } as any);
		clone._collision(createSphere({ name: 'other-ball' }), {});

		expect(updateSpy).toHaveBeenCalledTimes(1);
		expect(collisionSpy).toHaveBeenCalledTimes(1);
		expect(updateValues).toEqual([99]);
		expect(collisionValues).toEqual([99]);
	});

	it('clones builder-backed entities without duplicating built-in lifecycle hooks', () => {
		const source = createText({
			text: 'hello',
			screenPosition: new Vector2(12, 24),
		});
		const setupSpy = vi.fn();
		const prependSpy = vi.fn();
		const updateSpy = vi.fn();
		const cleanupSpy = vi.fn();

		source.onSetup(setupSpy);
		source.prependUpdate(prependSpy);
		source.onUpdate(updateSpy);
		source.onCleanup(cleanupSpy);

		const sourceCallbacks = (source as any).lifecycleCallbacks;
		const clone = source.clone({ text: 'world' });
		const cloneCallbacks = (clone as any).lifecycleCallbacks;

		expect(clone.options.text).toBe('world');
		expect(clone.options.screenPosition).not.toBe(source.options.screenPosition);
		expect(cloneCallbacks.setup).toHaveLength(sourceCallbacks.setup.length);
		expect(cloneCallbacks.update).toHaveLength(sourceCallbacks.update.length);
		expect(cloneCallbacks.cleanup).toHaveLength(sourceCallbacks.cleanup.length);

		clone.nodeSetup({ me: clone, globals: {}, camera: null } as any);
		clone.nodeUpdate({ me: clone, delta: 1 / 60, globals: {} } as any);
		clone.nodeCleanup({ me: clone, globals: {} } as any);

		expect(setupSpy).toHaveBeenCalledTimes(1);
		expect(prependSpy).toHaveBeenCalledTimes(1);
		expect(updateSpy).toHaveBeenCalledTimes(1);
		expect(cleanupSpy).toHaveBeenCalledTimes(1);
	});

	it('clones manual composition with distinct mesh and collision components', () => {
		const source = create({
			position: new Vector3(0, 0, 0),
			collision: { static: false },
		})
			.add(boxMesh({
				size: { x: 2, y: 2, z: 2 },
				color: new Color('#ff8844'),
			}))
			.add(boxCollision({ size: { x: 2, y: 2, z: 2 } }))
			.add(sphereMesh({ radius: 1, position: { x: 2, y: 0, z: 0 } }))
			.add(sphereCollision({ radius: 1, offset: { x: 2, y: 0, z: 0 } }));

		const clone = source.clone();

		expect(clone.mesh).toBeDefined();
		expect(clone.mesh).not.toBe(source.mesh);
		expect(clone.mesh?.geometry).not.toBe(source.mesh?.geometry);
		expect(clone.materials?.[0]).not.toBe(source.materials?.[0]);
		expect(clone.compoundMeshes).toHaveLength(source.compoundMeshes.length);
		expect(clone.compoundMeshes[0]).not.toBe(source.compoundMeshes[0]);
		expect(clone.colliderDescs).toHaveLength(source.colliderDescs.length);
		expect(clone.colliderDescs[0]).not.toBe(source.colliderDescs[0]);
		expect(clone.colliderDescs[1]).not.toBe(source.colliderDescs[1]);
	});

	it('clones child entities recursively', () => {
		const childValues: number[] = [];
		const parent = createBox({ name: 'parent-box' });
		const child = createSphere({ name: 'child-ball' });
		const childBehavior = child.use(CloneAwareBehavior, {
			nested: { speed: 4 },
		});

		child.onUpdate(() => {
			childValues.push(childBehavior.readSpeed());
		});
		parent.add(child);

		const cloneParent = parent.clone({ name: 'parent-box-clone' });
		const cloneChild = cloneParent.getChildren()[0] as ReturnType<typeof createSphere>;
		const cloneChildRef = cloneChild.getBehaviorRefs()[0] as BehaviorRef<{ nested: { speed: number } }>;

		expect(cloneParent.getChildren()).toHaveLength(1);
		expect(cloneChild).not.toBe(child);
		expect(cloneChild.options.name).toBe('child-ball');

		cloneChildRef.options.nested.speed = 77;
		cloneChild.nodeUpdate({ me: cloneChild, delta: 1 / 60, globals: {} } as any);

		expect(childValues).toEqual([77]);
	});

	it('createEntityFactory.generate uses template.clone()', () => {
		const factoryValues: number[] = [];
		const template = createSphere({ radius: 0.6 });
		const behavior = template.use(CloneAwareBehavior, {
			nested: { speed: 11 },
		});

		template.onUpdate(() => {
			factoryValues.push(behavior.readSpeed());
		});

		const factory = createEntityFactory(template);
		const [cloneA, cloneB] = factory.generate(2);
		const cloneARef = cloneA.getBehaviorRefs()[0] as BehaviorRef<{ nested: { speed: number } }>;

		expect(cloneA.mesh).toBeDefined();
		expect(cloneA.colliderDesc).toBeDefined();
		expect(cloneA.uuid).not.toBe(template.uuid);
		expect(cloneB.uuid).not.toBe(cloneA.uuid);

		cloneARef.options.nested.speed = 123;
		cloneA.nodeUpdate({ me: cloneA, delta: 1 / 60, globals: {} } as any);

		expect(factoryValues).toEqual([123]);
	});

	it('preserves collision registration options when cloning', () => {
		const source = createSphere({ name: 'source-ball' });
		const collisionSpy = vi.fn();
		const wall = createSphere({ name: 'wall-a' });

		source.onCollision(collisionSpy, {
			phase: 'enter',
			cooldownMs: 42,
		});

		const clone = source.clone({ name: 'clone-ball' });
		const registrations = clone.getCollisionRegistrations();
		expect(registrations).toHaveLength(1);
		expect(registrations[0]?.options).toEqual({
			phase: 'enter',
			cooldownMs: 42,
		});

		clone._collision(
			wall,
			{},
			{ phase: 'enter', nowMs: 100 },
		);
		clone._collision(
			wall,
			{},
			{ phase: 'enter', nowMs: 120 },
		);
		clone._collision(
			wall,
			{},
			{ phase: 'enter', nowMs: 200 },
		);

		expect(collisionSpy).toHaveBeenCalledTimes(2);
	});
});
