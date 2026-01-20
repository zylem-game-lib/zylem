import { describe, it, expect, beforeEach } from 'vitest';
import { createTestHarness, type BehaviorTestHarness } from './_test-harness';
import { Ricochet2DBehavior } from '../../../src/lib/behaviors/ricochet-2d/ricochet-2d.descriptor';

describe.skip('Ricochet2DBehavior', () => {
  let harness: BehaviorTestHarness;

  beforeEach(() => {
    harness = createTestHarness();
  });

  describe('Simple Reflection Mode', () => {
    it('should reflect horizontally when hitting vertical wall', () => {
      const ricochetHandle = harness.entity.use(Ricochet2DBehavior, {
        reflectionMode: 'simple',
        speedMultiplier: 1.0,
      });

      harness.game.start();

      const result = ricochetHandle.getRicochet({
        selfVelocity: { x: 5, y: 3 },
        contact: { normal: { x: 1, y: 0 } }, // Vertical wall (normal pointing right)
      });

      expect(result).toBeDefined();
      expect(result?.velocity.x).toBeLessThan(0); // X velocity reversed
      expect(result?.velocity.y).toBe(3); // Y velocity unchanged
    });

    it('should reflect vertically when hitting horizontal surface', () => {
      const ricochetHandle = harness.entity.use(Ricochet2DBehavior, {
        reflectionMode: 'simple',
        speedMultiplier: 1.0,
      });

      harness.game.start();

      const result = ricochetHandle.getRicochet({
        selfVelocity: { x: 3, y: 5 },
        contact: { normal: { x: 0, y: 1 } }, // Horizontal surface (normal pointing up)
      });

      expect(result).toBeDefined();
      expect(result?.velocity.x).toBe(3); // X velocity unchanged
      expect(result?.velocity.y).toBeLessThan(0); // Y velocity reversed
    });

    it('should reflect diagonally when hitting angled surface', () => {
      const ricochetHandle = harness.entity.use(Ricochet2DBehavior, {
        reflectionMode: 'simple',
        speedMultiplier: 1.0,
      });

      harness.game.start();

      const result = ricochetHandle.getRicochet({
        selfVelocity: { x: 5, y: 5 },
        contact: { normal: { x: 0.707, y: 0.707 } }, // 45-degree surface
      });

      expect(result).toBeDefined();
      // Both components should be affected
      expect(result?.velocity.x).not.toBe(5);
      expect(result?.velocity.y).not.toBe(5);
    });
  });

  describe('Angled Reflection Mode', () => {
    it('should compute angled reflection with contact point', () => {
      const ricochetHandle = harness.entity.use(Ricochet2DBehavior, {
        reflectionMode: 'angled',
        speedMultiplier: 1.05,
        maxAngleDeg: 60,
      });

      harness.game.start();

      const result = ricochetHandle.getRicochet({
        selfVelocity: { x: 5, y: -5 },
        selfPosition: { x: 0.5, y: 0 }, // Hit right side
        otherPosition: { x: 0, y: 0 }, // Center of other
        contact: {
          normal: { x: 0, y: 1 },
        },
      });

      expect(result).toBeDefined();
      // Angled mode should modify the reflection angle
      expect(result?.velocity.y).toBeGreaterThan(0); // Should bounce up
    });

    it('should apply speed multiplier', () => {
      const ricochetHandle = harness.entity.use(Ricochet2DBehavior, {
        reflectionMode: 'angled',
        speedMultiplier: 1.05,
      });

      harness.game.start();

      const initialSpeed = Math.sqrt(5 * 5 + 5 * 5);
      
      const result = ricochetHandle.getRicochet({
        selfVelocity: { x: 5, y: 5 },
        contact: { normal: { x: 0, y: 1 } },
      });

      expect(result).toBeDefined();
      const x = result?.velocity.x ?? 0;
      const y = result?.velocity.y ?? 0;
      const finalSpeed = Math.sqrt(x ** 2 + y ** 2);
      
      // Speed should be increased by multiplier
      expect(finalSpeed).toBeGreaterThan(initialSpeed);
    });

    it('should clamp speed to min and max bounds', () => {
      const ricochetHandle = harness.entity.use(Ricochet2DBehavior, {
        reflectionMode: 'angled',
        minSpeed: 2,
        maxSpeed: 20,
        speedMultiplier: 1.05,
      });

      harness.game.start();

      // Test min speed clamping
      const slowResult = ricochetHandle.getRicochet({
        selfVelocity: { x: 0.5, y: 0.5 }, // Very slow
        contact: { normal: { x: 0, y: 1 } },
      });

      expect(slowResult).toBeDefined();
      const slowX = slowResult?.velocity.x ?? 0;
      const slowY = slowResult?.velocity.y ?? 0;
      const slowSpeed = Math.sqrt(slowX ** 2 + slowY ** 2);
      expect(slowSpeed).toBeGreaterThanOrEqual(2);

      // Test max speed clamping
      const fastResult = ricochetHandle.getRicochet({
        selfVelocity: { x: 50, y: 50 }, // Very fast
        contact: { normal: { x: 0, y: 1 } },
      });

      expect(fastResult).toBeDefined();
      const fastX = fastResult?.velocity.x ?? 0;
      const fastY = fastResult?.velocity.y ?? 0;
      const fastSpeed = Math.sqrt(fastX ** 2 + fastY ** 2);
      expect(fastSpeed).toBeLessThanOrEqual(20);
    });
  });
});
