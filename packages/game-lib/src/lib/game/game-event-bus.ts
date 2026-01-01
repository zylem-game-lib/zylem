import { LoadingEvent } from '../core/interfaces';

/**
 * Event types for the game event bus.
 */
export type GameEventType = 
	| 'stage:loading:start'
	| 'stage:loading:progress'
	| 'stage:loading:complete'
	| 'game:state:updated';

/**
 * Payload for stage loading events.
 */
export interface StageLoadingPayload extends LoadingEvent {
	stageName?: string;
	stageIndex?: number;
}

/**
 * Payload for game state update events.
 */
export interface GameStateUpdatedPayload {
	path: string;
	value: unknown;
	previousValue?: unknown;
}

/**
 * Event map for typed event handling.
 */
export interface GameEventMap {
	'stage:loading:start': StageLoadingPayload;
	'stage:loading:progress': StageLoadingPayload;
	'stage:loading:complete': StageLoadingPayload;
	'game:state:updated': GameStateUpdatedPayload;
}

type EventCallback<T> = (payload: T) => void;

/**
 * Simple event bus for game-stage communication.
 * Used to decouple stage loading events from direct coupling.
 */
export class GameEventBus {
	private listeners: Map<GameEventType, Set<EventCallback<any>>> = new Map();

	/**
	 * Subscribe to an event type.
	 */
	on<K extends GameEventType>(event: K, callback: EventCallback<GameEventMap[K]>): () => void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(callback);
		return () => this.off(event, callback);
	}

	/**
	 * Unsubscribe from an event type.
	 */
	off<K extends GameEventType>(event: K, callback: EventCallback<GameEventMap[K]>): void {
		this.listeners.get(event)?.delete(callback);
	}

	/**
	 * Emit an event to all subscribers.
	 */
	emit<K extends GameEventType>(event: K, payload: GameEventMap[K]): void {
		const callbacks = this.listeners.get(event);
		if (!callbacks) return;
		for (const cb of callbacks) {
			try {
				cb(payload);
			} catch (e) {
				console.error(`Error in event handler for ${event}`, e);
			}
		}
	}

	/**
	 * Clear all listeners.
	 */
	dispose(): void {
		this.listeners.clear();
	}
}

/**
 * Singleton event bus instance for global game events.
 */
export const gameEventBus = new GameEventBus();
