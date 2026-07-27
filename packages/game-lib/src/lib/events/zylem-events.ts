import mitt from 'mitt';
import type { LoadingEvent } from '../core/interfaces';

/**
 * Payload for game loading events with stage context.
 */
export interface GameLoadingPayload extends LoadingEvent {
	stageName?: string;
	stageIndex?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Game Events
// ─────────────────────────────────────────────────────────────────────────────
//
// NOTE: Editor-facing state dispatches (`state:dispatch` with config, stage
// config, and entity payloads) moved to the typed `@zylem/bridge` channel.
// This bus keeps gameplay events only.

export type GameEvents = {
	'loading:start': GameLoadingPayload;
	'loading:progress': GameLoadingPayload;
	'loading:complete': GameLoadingPayload;
	'paused': { paused: boolean };
	'debug': { enabled: boolean };
};

// ─────────────────────────────────────────────────────────────────────────────
// Stage Events
// ─────────────────────────────────────────────────────────────────────────────

export type StageEvents = {
	'stage:loaded': { stageId: string };
	'stage:unloaded': { stageId: string };
	'stage:variable:changed': { key: string; value: unknown };
};

// ─────────────────────────────────────────────────────────────────────────────
// Entity Events
// ─────────────────────────────────────────────────────────────────────────────

export type EntityEvents = {
	'entity:spawned': { entityId: string; name: string };
	'entity:destroyed': { entityId: string };
	'entity:collision': { entityId: string; otherId: string };
	'entity:model:loading': { entityId: string; files: string[] };
	'entity:model:loaded': {
		entityId: string;
		success: boolean;
		meshCount?: number;
		errorMessage?: string;
	};
	'entity:animation:loaded': { entityId: string; animationCount: number };
};

// ─────────────────────────────────────────────────────────────────────────────
// Combined Event Map
// ─────────────────────────────────────────────────────────────────────────────

export type ZylemEvents = GameEvents & StageEvents & EntityEvents;

/**
 * Global event bus for cross-package communication.
 * 
 * Usage:
 * ```ts
 * import { zylemEventBus } from '@zylem/game-lib/events';
 * 
 * // Subscribe
 * const unsub = zylemEventBus.on('loading:progress', (e) => console.log(e));
 * 
 * // Emit
 * zylemEventBus.emit('loading:progress', { type: 'progress', progress: 0.5 });
 * 
 * // Cleanup
 * unsub();
 * ```
 */
export const zylemEventBus = mitt<ZylemEvents>();
