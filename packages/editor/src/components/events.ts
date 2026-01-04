/**
 * Editor Event Bus
 * 
 * Allows external code (e.g., game-lib) to dispatch state updates to the editor.
 * The editor subscribes to these events and updates its local state accordingly.
 */

export type EditorEventType = 'debug' | 'game' | 'stage' | 'entities';

export interface EditorEvent<T = unknown> {
	type: EditorEventType;
	payload: T;
}

type EventHandler<T = unknown> = (event: EditorEvent<T>) => void;

class EditorEventBus {
	private listeners = new Map<EditorEventType, Set<EventHandler>>();

	/**
	 * Emit an event to all registered listeners of that type.
	 */
	emit<T>(event: EditorEvent<T>): void {
		const handlers = this.listeners.get(event.type);
		if (handlers) {
			for (const handler of handlers) {
				handler(event);
			}
		}
	}

	/**
	 * Subscribe to events of a specific type.
	 * Returns an unsubscribe function.
	 */
	on<T>(type: EditorEventType, handler: EventHandler<T>): () => void {
		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Set());
		}
		this.listeners.get(type)!.add(handler as EventHandler);
		
		return () => {
			this.listeners.get(type)?.delete(handler as EventHandler);
		};
	}

	/**
	 * Remove all listeners (useful for cleanup).
	 */
	clear(): void {
		this.listeners.clear();
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
export const editorEvents = new EditorEventBus();
