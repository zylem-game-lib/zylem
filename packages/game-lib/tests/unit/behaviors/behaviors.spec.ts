import { describe, expect, it, beforeEach } from 'vitest';
import { defineBehavior, type BehaviorRef } from '../../../src/lib/behaviors/behavior-descriptor';
import { type BehaviorSystem } from '../../../src/lib/behaviors/behavior-system';
import { createPhysicsBodyComponent, createTransformComponent } from '../../../src/lib/behaviors/components';
import type { IWorld } from 'bitecs';
import RAPIER from '@dimforge/rapier3d-compat';
import { Vector3, Quaternion } from 'three';

describe('Behavior System', () => {
  describe('defineBehavior', () => {
    it('should create a behavior descriptor with default options', () => {
      const TestBehavior = defineBehavior({
        name: 'test-behavior',
        defaultOptions: { speed: 10, enabled: true },
        systemFactory: () => ({
          update: () => {},
        }),
      });

      expect(TestBehavior.key).toBe(Symbol.for('zylem:behavior:test-behavior'));
      expect(TestBehavior.defaultOptions).toEqual({ speed: 10, enabled: true });
      expect(TestBehavior.systemFactory).toBeDefined();
    });

    it('should create unique symbols for different behaviors', () => {
      const Behavior1 = defineBehavior({
        name: 'behavior-1',
        defaultOptions: {},
        systemFactory: () => ({ update: () => {} }),
      });

      const Behavior2 = defineBehavior({
        name: 'behavior-2',
        defaultOptions: {},
        systemFactory: () => ({ update: () => {} }),
      });

      expect(Behavior1.key).not.toBe(Behavior2.key);
      expect(Behavior1.key).toBe(Symbol.for('zylem:behavior:behavior-1'));
      expect(Behavior2.key).toBe(Symbol.for('zylem:behavior:behavior-2'));
    });

    it('should support custom handle methods', () => {
      interface TestOptions {
        value: number;
      }

      const TestBehavior = defineBehavior({
        name: 'test-with-handle',
        defaultOptions: { value: 42 },
        systemFactory: () => ({ update: () => {} }),
        createHandle: (ref: BehaviorRef<TestOptions>) => ({
          getValue: () => ref.options.value,
          doubleValue: () => ref.options.value * 2,
        }),
      });

      expect(TestBehavior.createHandle).toBeDefined();

      // Test the handle methods
      const mockRef: BehaviorRef<TestOptions> = {
        descriptor: TestBehavior,
        options: { value: 42 },
      };

      const handle = TestBehavior.createHandle!(mockRef);
      expect(handle.getValue()).toBe(42);
      expect(handle.doubleValue()).toBe(84);
    });
  });

  describe('BehaviorSystem', () => {
    let mockECS: IWorld;

    beforeEach(() => {
      // Create a minimal mock ECS world
      mockECS = {} as IWorld;
    });

    it('should implement update method', () => {
      const system: BehaviorSystem = {
        update: (ecs: IWorld, delta: number) => {
          expect(ecs).toBe(mockECS);
          expect(delta).toBeGreaterThan(0);
        },
      };

      system.update(mockECS, 1 / 60);
    });

    it('should support optional destroy method', () => {
      let destroyed = false;

      const system: BehaviorSystem = {
        update: () => {},
        destroy: (ecs: IWorld) => {
          destroyed = true;
          expect(ecs).toBe(mockECS);
        },
      };

      expect(system.destroy).toBeDefined();
      system.destroy!(mockECS);
      expect(destroyed).toBe(true);
    });

    it('should be created by systemFactory', () => {
      const TestBehavior = defineBehavior({
        name: 'factory-test',
        defaultOptions: {},
        systemFactory: (ctx) => {
          expect(ctx.world).toBeDefined();
          expect(ctx.ecs).toBeDefined();
          
          return {
            update: (ecs: IWorld, delta: number) => {
              // System logic here
            },
          };
        },
      });

      const mockContext = {
        world: { test: 'world' },
        ecs: mockECS,
      };

      const system = TestBehavior.systemFactory(mockContext);
      expect(system).toBeDefined();
      expect(system.update).toBeDefined();
    });
  });

  describe('Core Components', () => {
    it('should create TransformComponent with default values', () => {
      const transform = createTransformComponent();

      expect(transform.position).toBeInstanceOf(Vector3);
      expect(transform.rotation).toBeInstanceOf(Quaternion);
      expect(transform.position.x).toBe(0);
      expect(transform.position.y).toBe(0);
      expect(transform.position.z).toBe(0);
    });

    it('should create PhysicsBodyComponent with Rapier body', async () => {
      await RAPIER.init();
      
      const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
      const bodyDesc = RAPIER.RigidBodyDesc.dynamic();
      const body = world.createRigidBody(bodyDesc);

      const physics = createPhysicsBodyComponent(body);

      expect(physics.body).toBe(body);
      expect(physics.body).toBeInstanceOf(RAPIER.RigidBody);
    });
  });

  describe('BehaviorRef', () => {
    it('should store descriptor and options', () => {
      const TestBehavior = defineBehavior({
        name: 'ref-test',
        defaultOptions: { speed: 5 },
        systemFactory: () => ({ update: () => {} }),
      });

      const ref: BehaviorRef<{ speed: number }> = {
        descriptor: TestBehavior,
        options: { speed: 10 },
      };

      expect(ref.descriptor).toBe(TestBehavior);
      expect(ref.options.speed).toBe(10);
      expect(ref.fsm).toBeUndefined();
    });

    it('should support optional FSM instance', () => {
      const TestBehavior = defineBehavior({
        name: 'fsm-test',
        defaultOptions: {},
        systemFactory: () => ({ update: () => {} }),
      });

      const mockFSM = {
        getState: () => 'idle',
        transition: () => {},
      };

      const ref: BehaviorRef = {
        descriptor: TestBehavior,
        options: {},
        fsm: mockFSM,
      };

      expect(ref.fsm).toBe(mockFSM);
      expect(ref.fsm.getState()).toBe('idle');
    });
  });
});
