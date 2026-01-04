import { LoadingEvent } from '../core/interfaces';

/**
 * Event name for game loading events.
 * Dispatched via window for cross-application communication.
 */
export const GAME_LOADING_EVENT = 'GAME_LOADING_EVENT';

/**
 * Game-level loading event that includes stage context.
 */
export interface GameLoadingEvent {
	type: 'start' | 'progress' | 'complete';
	stageName?: string;
	stageIndex?: number;
	message: string;
	progress: number;
	current?: number;
	total?: number;
}

/**
 * Delegate for managing game-level loading events.
 * Aggregates loading events from stages and includes stage context.
 * Also dispatches window custom events for cross-application communication.
 */
export class GameLoadingDelegate {
	private loadingHandlers: Array<(event: GameLoadingEvent) => void> = [];
	private stageLoadingUnsubscribes: (() => void)[] = [];

	/**
	 * Subscribe to loading events from the game.
	 * Events include stage context (stageName, stageIndex).
	 * 
	 * @param callback Invoked for each loading event
	 * @returns Unsubscribe function
	 */
	onLoading(callback: (event: GameLoadingEvent) => void): () => void {
		this.loadingHandlers.push(callback);
		return () => {
			this.loadingHandlers = this.loadingHandlers.filter((h) => h !== callback);
		};
	}

	/**
	 * Emit a loading event to all subscribers and dispatch to window.
	 */
	emit(event: GameLoadingEvent): void {
		// Dispatch to direct subscribers
		for (const handler of this.loadingHandlers) {
            console.log('Game loading event', event);
			try {
				handler(event);
			} catch (e) {
				console.error('Game loading handler failed', e);
			}
		}
		
		// Also dispatch as window event for cross-application communication
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent(GAME_LOADING_EVENT, { detail: event }));
		}
	}

	/**
	 * Wire up a stage's loading events to this delegate.
	 * 
	 * @param stage The stage to wire up
	 * @param stageIndex The index of the stage
	 */
	wireStageLoading(stage: { uuid?: string; onLoading: (cb: (event: LoadingEvent) => void) => () => void | void }, stageIndex: number): void {
        const unsub = stage.onLoading((event: LoadingEvent) => {
			this.emit({
				type: event.type,
				message: event.message ?? '',
				progress: event.progress ?? 0,
				current: event.current,
				total: event.total,
				stageName: stage.uuid ?? `Stage ${stageIndex}`,
				stageIndex,
			});
		});
		if (typeof unsub === 'function') {
			this.stageLoadingUnsubscribes.push(unsub);
		}
	}

	/**
	 * Unsubscribe from all stage loading events.
	 */
	unwireAllStages(): void {
		for (const unsub of this.stageLoadingUnsubscribes) {
			try {
				unsub();
			} catch { /* noop */ }
		}
		this.stageLoadingUnsubscribes = [];
	}

	/**
	 * Clean up all handlers.
	 */
	dispose(): void {
		this.unwireAllStages();
		this.loadingHandlers = [];
	}
}
