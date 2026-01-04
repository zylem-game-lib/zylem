/**
 * Editor Event Bus
 * 
 * Wraps the shared zylemEventBus to provide backward-compatible API
 * for the editor package. This allows external code to dispatch state
 * updates to the editor using the familiar editorEvents API.
 */

import { zylemEventBus, type ZylemEvents } from '@zylem/game-lib';

export type EditorEventType = 'debug' | 'game' | 'stage' | 'entities';

export interface EditorEvent<T = unknown> {
	type: EditorEventType;
	payload: T;
}

// Map legacy editor event types to zylemEventBus event types
const eventTypeMap: Record<EditorEventType, keyof ZylemEvents> = {
	debug: 'debug',
	game: 'loading:start', // or could be mapped differently based on needs
	stage: 'stage:loaded',
	entities: 'entity:spawned',
};

type EventHandler<T = unknown> = (event: EditorEvent<T>) => void;

/**
 * Backward-compatible wrapper around zylemEventBus.
 * Maintains the existing editorEvents.emit({ type, payload }) API
 * while internally using the shared Mitt-based event bus.
 */
class EditorEventBusWrapper {
	private legacyListeners = new Map<EditorEventType, Set<EventHandler>>();

	/**
	 * Emit an event to all registered listeners of that type.
	 * Also emits to the global zylemEventBus for cross-package communication.
	 */
	emit<T>(event: EditorEvent<T>): void {
		// Emit to legacy listeners (backward compatibility)
		const handlers = this.legacyListeners.get(event.type);
		if (handlers) {
			for (const handler of handlers) {
				handler(event);
			}
		}

		// Also emit to zylemEventBus for cross-package communication
		const mappedEvent = eventTypeMap[event.type];
		if (mappedEvent) {
			(zylemEventBus as any).emit(mappedEvent, event.payload);
		}
	}

	/**
	 * Subscribe to events of a specific type.
	 * Returns an unsubscribe function.
	 */
	on<T>(type: EditorEventType, handler: EventHandler<T>): () => void {
		if (!this.legacyListeners.has(type)) {
			this.legacyListeners.set(type, new Set());
		}
		this.legacyListeners.get(type)!.add(handler as EventHandler);
		
		return () => {
			this.legacyListeners.get(type)?.delete(handler as EventHandler);
		};
	}

	/**
	 * Remove all listeners (useful for cleanup).
	 */
	clear(): void {
		this.legacyListeners.clear();
	}
}

/**
 * Global editor event bus instance.
 * 
 * Usage from game-lib:
 * ```ts
 * import { editorEvents } from '@zylem/editor';
 * editorEvents.emit({ type: 'debug', payload: { enabled: true } });
 * ```
 * 
 * Usage from editor components:
 * ```ts
 * editorEvents.on('debug', (e) => setDebugState(e.payload));
 * ```
 */
export const editorEvents = new EditorEventBusWrapper();

/**
 * Re-export zylemEventBus for direct access when needed.
 */
export { zylemEventBus };
