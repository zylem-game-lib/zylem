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

/** Payload for stage configuration sent to editor. */
export interface StageConfigPayload {
	id: string;
	backgroundColor: string;
	backgroundImage: string | null;
	gravity: { x: number; y: number; z: number };
	inputs: Record<string, string[]>;
	variables: Record<string, unknown>;
}

/** Payload for entity configuration sent to editor. */
export interface EntityConfigPayload {
	uuid: string;
	name: string;
	type: string;
	position: { x: number; y: number; z: number };
	rotation: { x: number; y: number; z: number };
	scale: { x: number; y: number; z: number };
}

/** Payload for state dispatch events from game to editor. */
export interface StateDispatchPayload {
	scope: 'game' | 'stage' | 'entity';
	path: string;
	value: unknown;
	previousValue?: unknown;
	config?: {
		id: string;
		aspectRatio: number;
		fullscreen: boolean;
		bodyBackground: string | undefined;
		internalResolution: { width: number; height: number } | undefined;
		debug: boolean;
	} | null;
	stageConfig?: StageConfigPayload | null;
	entities?: EntityConfigPayload[] | null;
}

export type GameEvents = {
	'loading:start': GameLoadingPayload;
	'loading:progress': GameLoadingPayload;
	'loading:complete': GameLoadingPayload;
	'paused': { paused: boolean };
	'debug': { enabled: boolean };
	'state:dispatch': StateDispatchPayload;
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
	'entity:model:loaded': { entityId: string; success: boolean; meshCount?: number };
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
 * import { zylemEventBus } from '@zylem/game-lib';
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
