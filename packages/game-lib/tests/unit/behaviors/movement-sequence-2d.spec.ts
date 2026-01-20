import { describe, it, expect, beforeEach } from 'vitest';
import { createTestHarness, type BehaviorTestHarness } from './_test-harness';
import { MovementSequence2DBehavior } from '../../../src/lib/behaviors/movement-sequence-2d/movement-sequence-2d.descriptor';

describe.skip('MovementSequence2DBehavior', () => {
  let harness: BehaviorTestHarness;

  beforeEach(() => {
    harness = createTestHarness();
  });

  describe('Non-Looping Sequence', () => {
    it('should play through sequence and stop', () => {
      const sequenceHandle = harness.entity.use(MovementSequence2DBehavior, {
        sequence: [
          { name: 'right', moveX: 3, moveY: 0, timeInSeconds: 1 },
          { name: 'up', moveX: 0, moveY: 2, timeInSeconds: 1 },
          { name: 'left', moveX: -3, moveY: 0, timeInSeconds: 1 },
        ],
        loop: false,
      });

      harness.game.start();

      // Should start with first step
      let movement = sequenceHandle.getMovement();
      expect(movement.moveX).toBe(3);
      expect(movement.moveY).toBe(0);

      let step = sequenceHandle.getCurrentStep();
      expect(step?.name).toBe('right');

      // Run for 1 second - should advance to second step
      for (let i = 0; i < 60; i++) {
        harness.game.step(1/60);
      }

      movement = sequenceHandle.getMovement();
      expect(movement.moveX).toBe(0);
      expect(movement.moveY).toBe(2);

      step = sequenceHandle.getCurrentStep();
      expect(step?.name).toBe('up');

      // Run for 2 more seconds - should advance to third step then complete
      for (let i = 0; i < 120; i++) {
        harness.game.step(1/60);
      }

      // Should be done
      const progress = sequenceHandle.getProgress();
      expect(progress.done).toBe(true);

      // Movement should be zero when done
      movement = sequenceHandle.getMovement();
      expect(movement.moveX).toBe(0);
      expect(movement.moveY).toBe(0);
    });
  });

  describe('Looping Sequence', () => {
    it('should loop back to first step continuously', () => {
      const sequenceHandle = harness.entity.use(MovementSequence2DBehavior, {
        sequence: [
          { name: 'right', moveX: 3, moveY: 0, timeInSeconds: 0.5 },
          { name: 'left', moveX: -3, moveY: 0, timeInSeconds: 0.5 },
        ],
        loop: true,
      });

      harness.game.start();

      // Should start with first step
      let step = sequenceHandle.getCurrentStep();
      expect(step?.name).toBe('right');

      // Run for 0.5 seconds - should advance to second step
      for (let i = 0; i < 30; i++) {
        harness.game.step(1/60);
      }

      step = sequenceHandle.getCurrentStep();
      expect(step?.name).toBe('left');

      // Run for another 0.5 seconds - should loop back to first step
      for (let i = 0; i < 30; i++) {
        harness.game.step(1/60);
      }

      step = sequenceHandle.getCurrentStep();
      expect(step?.name).toBe('right');

      // Should never be done when looping
      const progress = sequenceHandle.getProgress();
      expect(progress.done).toBe(false);

      // Run for a long time - should still not be done
      for (let i = 0; i < 200; i++) {
        harness.game.step(1/60);
      }

      const finalProgress = sequenceHandle.getProgress();
      expect(finalProgress.done).toBe(false);
    });
  });
});
