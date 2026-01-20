import { describe, it, expect, beforeEach } from 'vitest';
import { createTestHarness, type BehaviorTestHarness } from './_test-harness';
import { WorldBoundary2DBehavior } from '../../../src/lib/behaviors/world-boundary-2d/world-boundary-2d.descriptor';

describe.skip('WorldBoundary2DBehavior', () => {
  let harness: BehaviorTestHarness;

  beforeEach(() => {
    harness = createTestHarness();
  });

  describe('Boundary Detection', () => {
    it('should detect left boundary hit', () => {
      const boundaryHandle = harness.entity.use(WorldBoundary2DBehavior, {
        boundaries: { left: -10, right: 10, bottom: -7.5, top: 7.5 },
      });

      // Start game to initialize systems
      harness.game.start();

      // Move entity to left boundary
      const physics = (harness.entity as any).physics;
      if (physics?.body) {
        physics.body.setTranslation({ x: -10, y: 0, z: 0 }, true);
      }

      // Update game
      harness.game.step(1/60);

      const hits = boundaryHandle.getLastHits();
      expect(hits?.left).toBe(true);
      expect(hits?.right).toBe(false);
    });

    it('should detect right boundary hit', () => {
      const boundaryHandle = harness.entity.use(WorldBoundary2DBehavior, {
        boundaries: { left: -10, right: 10, bottom: -7.5, top: 7.5 },
      });

      harness.game.start();

      const physics = (harness.entity as any).physics;
      if (physics?.body) {
        physics.body.setTranslation({ x: 10, y: 0, z: 0 }, true);
      }

      harness.game.step(1/60);

      const hits = boundaryHandle.getLastHits();
      expect(hits?.right).toBe(true);
      expect(hits?.left).toBe(false);
    });

    it('should detect top boundary hit', () => {
      const boundaryHandle = harness.entity.use(WorldBoundary2DBehavior, {
        boundaries: { left: -10, right: 10, bottom: -7.5, top: 7.5 },
      });

      harness.game.start();

      const physics = (harness.entity as any).physics;
      if (physics?.body) {
        physics.body.setTranslation({ x: 0, y: 7.5, z: 0 }, true);
      }

      harness.game.step(1/60);

      const hits = boundaryHandle.getLastHits();
      expect(hits?.top).toBe(true);
      expect(hits?.bottom).toBe(false);
    });

    it('should detect bottom boundary hit', () => {
      const boundaryHandle = harness.entity.use(WorldBoundary2DBehavior, {
        boundaries: { left: -10, right: 10, bottom: -7.5, top: 7.5 },
      });

      harness.game.start();

      const physics = (harness.entity as any).physics;
      if (physics?.body) {
        physics.body.setTranslation({ x: 0, y: -7.5, z: 0 }, true);
      }

      harness.game.step(1/60);

      const hits = boundaryHandle.getLastHits();
      expect(hits?.bottom).toBe(true);
      expect(hits?.top).toBe(false);
    });

    it('should not detect hits when inside boundaries', () => {
      const boundaryHandle = harness.entity.use(WorldBoundary2DBehavior, {
        boundaries: { left: -10, right: 10, bottom: -7.5, top: 7.5 },
      });

      harness.game.start();

      const physics = (harness.entity as any).physics;
      if (physics?.body) {
        physics.body.setTranslation({ x: 0, y: 0, z: 0 }, true);
      }

      harness.game.step(1/60);

      const hits = boundaryHandle.getLastHits();
      expect(hits?.left).toBe(false);
      expect(hits?.right).toBe(false);
      expect(hits?.top).toBe(false);
      expect(hits?.bottom).toBe(false);
    });
  });
});
