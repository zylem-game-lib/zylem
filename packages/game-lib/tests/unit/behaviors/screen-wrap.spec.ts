import { describe, it, expect, beforeEach } from 'vitest';
import { createTestHarness, type BehaviorTestHarness } from './_test-harness';
import { ScreenWrapBehavior } from '../../../src/lib/behaviors/screen-wrap/screen-wrap.descriptor';

describe.skip('ScreenWrapBehavior', () => {
  let harness: BehaviorTestHarness;

  beforeEach(() => {
    harness = createTestHarness();
  });

  describe('Wrapping', () => {
    it('should wrap from right to left', () => {
      harness.entity.use(ScreenWrapBehavior, {
        width: 20,
        height: 15,
        centerX: 0,
        centerY: 0,
      });

      harness.game.start();

      const physics = (harness.entity as any).physics;
      physics.body.setTranslation({ x: 11, y: 0, z: 0 }, true);
      
      harness.game.step(1/60);

      const pos = physics.body.translation();
      expect(pos.x).toBeLessThan(0);
    });

    it('should wrap from left to right', () => {
      harness.entity.use(ScreenWrapBehavior, {
        width: 20,
        height: 15,
        centerX: 0,
        centerY: 0,
      });

      harness.game.start();

      const physics = (harness.entity as any).physics;
      physics.body.setTranslation({ x: -11, y: 0, z: 0 }, true);
      
      harness.game.step(1/60);

      const pos = physics.body.translation();
      expect(pos.x).toBeGreaterThan(0);
    });

    it('should wrap from top to bottom', () => {
      harness.entity.use(ScreenWrapBehavior, {
        width: 20,
        height: 15,
        centerX: 0,
        centerY: 0,
      });

      harness.game.start();

      const physics = (harness.entity as any).physics;
      physics.body.setTranslation({ x: 0, y: 8, z: 0 }, true);
      
      harness.game.step(1/60);

      const pos = physics.body.translation();
      expect(pos.y).toBeLessThan(0);
    });

    it('should wrap from bottom to top', () => {
      harness.entity.use(ScreenWrapBehavior, {
        width: 20,
        height: 15,
        centerX: 0,
        centerY: 0,
      });

      harness.game.start();

      const physics = (harness.entity as any).physics;
      physics.body.setTranslation({ x: 0, y: -8, z: 0 }, true);
      
      harness.game.step(1/60);

      const pos = physics.body.translation();
      expect(pos.y).toBeGreaterThan(0);
    });
  });
});
