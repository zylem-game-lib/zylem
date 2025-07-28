// Core exports only - entities moved to separate exports to prevent circular dependencies
export * from '../game/game';
export * from '../game/zylem-game';
export * from '../stage/stage';
export * from './vessel';
export type { StageOptions } from '../stage/zylem-stage';

// Export shared types
export * from '../types';