/**
 * Test Harness for Behavior Tests
 * 
 * Provides reusable utilities for testing behaviors with entities and stages.
 * Uses standard Zylem APIs (createStage, createSprite, etc.) for consistency.
 */

import { createStage } from '../../../src/lib/stage/stage';
import { createGame } from '../../../src/lib/game/game';
import { createBox } from '../../../src/lib/entities/box';
import type { Stage } from '../../../src/lib/stage/stage';
import type { Game } from '../../../src/lib/game/game';
import type { GameEntity } from '../../../src/lib/entities/entity';

export interface BehaviorTestHarness {
  stage: Stage;
  game: Game<any>;
  entity: GameEntity<any>;
}

/**
 * Create a new test harness
 */
export function createTestHarness(): BehaviorTestHarness {
  const testStage = createStage();
  const testBox = createBox({
    name: 'test-box',
  });
  testStage.add(testBox);
  const harness = createGame(testStage);
  
  return {
    stage: testStage,
    game: harness,
    entity: testBox,
  };
}
