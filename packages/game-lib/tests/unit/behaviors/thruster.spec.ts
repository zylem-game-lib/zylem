import { describe, it, expect, beforeEach } from 'vitest';
import { createTestHarness, type BehaviorTestHarness } from './_test-harness';
import { ThrusterBehavior } from '../../../src/lib/behaviors/thruster/thruster.descriptor';
import type { ThrusterInputComponent } from '../../../src/lib/behaviors/thruster/components';

describe.skip('ThrusterBehavior', () => {
  let harness: BehaviorTestHarness;

  beforeEach(() => {
    harness = createTestHarness();
  });

  describe('Linear Thrust', () => {
    it('should apply forward thrust when input.thrust > 0', () => {
      harness.entity.use(ThrusterBehavior, {
        linearThrust: 10,
        angularThrust: 5,
      });

      harness.game.start();

      const entity = harness.entity as any;
      const physics = entity.physics;
      
      // Set forward thrust
      (entity.input as ThrusterInputComponent).thrust = 1;

      // Run several frames
      for (let i = 0; i < 10; i++) {
        harness.game.step(1/60);
      }

      const velocity = physics.body.linvel();

      // Entity should have velocity
      expect(velocity.x).not.toBe(0);
      expect(velocity.y).not.toBe(0);
    });

    it('should apply braking when input.thrust < 0', () => {
      harness.entity.use(ThrusterBehavior, {
        linearThrust: 10,
        angularThrust: 5,
      });

      harness.game.start();

      const entity = harness.entity as any;
      const physics = entity.physics;

      // First, give entity some velocity
      (entity.input as ThrusterInputComponent).thrust = 1;
      for (let i = 0; i < 10; i++) {
        harness.game.step(1/60);
      }

      const velocityWithThrust = physics.body.linvel();
      const speed1 = Math.sqrt(velocityWithThrust.x ** 2 + velocityWithThrust.y ** 2);

      // Now apply braking
      (entity.input as ThrusterInputComponent).thrust = -1;
      for (let i = 0; i < 5; i++) {
        harness.game.step(1/60);
      }

      const velocityWithBrake = physics.body.linvel();
      const speed2 = Math.sqrt(velocityWithBrake.x ** 2 + velocityWithBrake.y ** 2);

      // Speed should decrease
      expect(speed2).toBeLessThan(speed1);
    });
  });

  describe('Angular Thrust', () => {
    it('should rotate when input.rotate != 0', () => {
      harness.entity.use(ThrusterBehavior, {
        linearThrust: 10,
        angularThrust: 5,
      });

      harness.game.start();

      const entity = harness.entity as any;
      const physics = entity.physics;
      
      // Set rotation input
      (entity.input as ThrusterInputComponent).rotate = 1;

      // Run several frames
      for (let i = 0; i < 10; i++) {
        harness.game.step(1/60);
      }

      const angVel = physics.body.angvel();

      // Entity should have angular velocity
      expect(angVel.z).not.toBe(0);
    });

    it('should rotate in opposite directions for positive/negative input', () => {
      harness.entity.use(ThrusterBehavior, {
        linearThrust: 10,
        angularThrust: 5,
      });

      harness.game.start();

      const entity = harness.entity as any;
      const physics = entity.physics;

      // Rotate right
      (entity.input as ThrusterInputComponent).rotate = 1;
      for (let i = 0; i < 5; i++) {
        harness.game.step(1/60);
      }
      const angVelRight = physics.body.angvel();

      // Reset
      physics.body.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // Rotate left
      (entity.input as ThrusterInputComponent).rotate = -1;
      for (let i = 0; i < 5; i++) {
        harness.game.step(1/60);
      }
      const angVelLeft = physics.body.angvel();

      // Angular velocities should have opposite signs
      expect(Math.sign(angVelRight.z)).not.toBe(Math.sign(angVelLeft.z));
    });
  });

  describe('FSM Integration', () => {
    it('should update FSM state based on input', () => {
      harness.entity.use(ThrusterBehavior);

      harness.game.start();

      const entity = harness.entity as any;
      const refs = entity.getBehaviorRefs();
      const thrusterRef = refs.find((r: any) => 
        r.descriptor.key === Symbol.for('zylem:behavior:thruster')
      );

      // Initially idle
      expect(thrusterRef?.fsm?.getState()).toBe('idle');

      // Activate thrust
      (entity.input as ThrusterInputComponent).thrust = 1;
      harness.game.step(1/60);

      // FSM should transition to active
      expect(thrusterRef?.fsm?.getState()).toBe('active');

      // Deactivate
      (entity.input as ThrusterInputComponent).thrust = 0;
      harness.game.step(1/60);

      // FSM should transition back to idle
      expect(thrusterRef?.fsm?.getState()).toBe('idle');
    });
  });
});
