import { LoadingEvent } from '../core/interfaces';
import { gameEventBus, StageLoadingPayload } from '../game/game-event-bus';

/**
 * Event name for stage loading events.
 * Dispatched via window for cross-application communication.
 */
export const STAGE_LOADING_EVENT = 'STAGE_LOADING_EVENT';

/**
 * Delegate for managing loading events and progress within a stage.
 * Handles subscription to loading events and broadcasting progress.
 * Emits to game event bus for game-level observation.
 */
export class StageLoadingDelegate {
	private loadingHandlers: Array<(event: LoadingEvent) => void> = [];
	private stageName?: string;
	private stageIndex?: number;

	/**
	 * Set stage context for event bus emissions.
	 */
	setStageContext(stageName: string, stageIndex: number): void {
		this.stageName = stageName;
		this.stageIndex = stageIndex;
	}

	/**
	 * Subscribe to loading events.
	 * 
	 * @param callback Invoked for each loading event (start, progress, complete)
	 * @returns Unsubscribe function
	 */
	onLoading(callback: (event: LoadingEvent) => void): () => void {
		this.loadingHandlers.push(callback);
		return () => {
			this.loadingHandlers = this.loadingHandlers.filter((h) => h !== callback);
		};
	}

	/**
	 * Emit a loading event to all subscribers and to the game event bus.
	 * 
	 * @param event The loading event to broadcast
	 */
	emit(event: LoadingEvent): void {
		// Dispatch to direct subscribers
		for (const handler of this.loadingHandlers) {
			try {
				handler(event);
			} catch (e) {
				console.error('Loading handler failed', e);
			}
		}
		
		// Emit to game event bus for game-level observation
		const payload: StageLoadingPayload = {
			...event,
			stageName: this.stageName,
			stageIndex: this.stageIndex,
		};
		
		if (event.type === 'start') {
			gameEventBus.emit('stage:loading:start', payload);
		} else if (event.type === 'progress') {
			gameEventBus.emit('stage:loading:progress', payload);
		} else if (event.type === 'complete') {
			gameEventBus.emit('stage:loading:complete', payload);
		}
	}

	/**
	 * Emit a start loading event.
	 */
	emitStart(message: string = 'Loading stage...'): void {
		this.emit({ type: 'start', message, progress: 0 });
	}

	/**
	 * Emit a progress loading event.
	 */
	emitProgress(message: string, current: number, total: number): void {
		const progress = total > 0 ? current / total : 0;
		this.emit({ type: 'progress', message, progress, current, total });
	}

	/**
	 * Emit a complete loading event.
	 */
	emitComplete(message: string = 'Stage loaded'): void {
		this.emit({ type: 'complete', message, progress: 1 });
	}

	/**
	 * Clear all loading handlers.
	 */
	dispose(): void {
		this.loadingHandlers = [];
	}
}
