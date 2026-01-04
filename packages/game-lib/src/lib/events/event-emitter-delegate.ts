import mitt, { Emitter } from 'mitt';

/**
 * Event scope identifier for routing events.
 */
export type EventScope = 'game' | 'stage' | 'entity';

/**
 * Reusable delegate for event emission and subscription.
 * Use via composition in Game, Stage, and Entity classes.
 * 
 * @example
 * class Game {
 *   private eventDelegate = new EventEmitterDelegate<GameEvents>();
 *   
 *   dispatch<K extends keyof GameEvents>(event: K, payload: GameEvents[K]) {
 *     this.eventDelegate.dispatch(event, payload);
 *   }
 * }
 */
export class EventEmitterDelegate<TEvents extends Record<string, unknown>> {
	private emitter: Emitter<TEvents>;
	private unsubscribes: (() => void)[] = [];

	constructor() {
		this.emitter = mitt<TEvents>();
	}

	/**
	 * Dispatch an event to all listeners.
	 */
	dispatch<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
		this.emitter.emit(event, payload);
	}

	/**
	 * Subscribe to an event. Returns an unsubscribe function.
	 */
	listen<K extends keyof TEvents>(
		event: K,
		handler: (payload: TEvents[K]) => void
	): () => void {
		this.emitter.on(event, handler);
		const unsub = () => this.emitter.off(event, handler);
		this.unsubscribes.push(unsub);
		return unsub;
	}

	/**
	 * Subscribe to all events.
	 */
	listenAll(handler: (type: keyof TEvents, payload: TEvents[keyof TEvents]) => void): () => void {
		this.emitter.on('*', handler as any);
		const unsub = () => this.emitter.off('*', handler as any);
		this.unsubscribes.push(unsub);
		return unsub;
	}

	/**
	 * Clean up all subscriptions.
	 */
	dispose(): void {
		this.unsubscribes.forEach(fn => fn());
		this.unsubscribes = [];
		this.emitter.all.clear();
	}
}
