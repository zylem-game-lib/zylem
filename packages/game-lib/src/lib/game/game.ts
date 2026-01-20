import { ZylemGame, GameLoadingEvent } from './zylem-game';
import { DestroyFunction, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';
import { IGame } from '../core/interfaces';
import { setPaused } from '../debug/debug-state';
import { BaseGlobals } from './game-interfaces';
import { convertNodes, GameOptions, hasStages, extractGlobalsFromOptions } from '../core/utility/nodes';
import { resolveGameConfig } from './game-config';
import { createStage, Stage } from '../stage/stage';
import { StageManager, stageState } from '../stage/stage-manager';
import { StageFactory } from '../stage/stage-factory';
import { initGlobals, clearGlobalSubscriptions, resetGlobals, onGlobalChange as onGlobalChangeInternal, onGlobalChanges as onGlobalChangesInternal } from './game-state';
import { EventEmitterDelegate, zylemEventBus, type GameEvents } from '../events';

export class Game<TGlobals extends BaseGlobals> implements IGame<TGlobals> {
	private wrappedGame: ZylemGame<TGlobals> | null = null;

	options: GameOptions<TGlobals>;

	// Lifecycle callback arrays
	private setupCallbacks: Array<SetupFunction<ZylemGame<TGlobals>, TGlobals>> = [];
	private updateCallbacks: Array<UpdateFunction<ZylemGame<TGlobals>, TGlobals>> = [];
	private destroyCallbacks: Array<DestroyFunction<ZylemGame<TGlobals>, TGlobals>> = [];
	private pendingLoadingCallbacks: Array<(event: GameLoadingEvent) => void> = [];

	// Game-scoped global change subscriptions
	private globalChangeCallbacks: Array<{ path: string; callback: (value: unknown, stage: Stage | null) => void }> = [];
	private globalChangesCallbacks: Array<{ paths: string[]; callback: (values: unknown[], stage: Stage | null) => void }> = [];
	private activeGlobalSubscriptions: Array<() => void> = [];

	// Event delegate for dispatch/listen API
	private eventDelegate = new EventEmitterDelegate<GameEvents>();

	refErrorMessage = 'lost reference to game';

	constructor(options: GameOptions<TGlobals>) {
		this.options = options;
		if (!hasStages(options)) {
			this.options.push(createStage());
		}
		// Initialize globals immediately so onGlobalChange subscriptions work
		const globals = extractGlobalsFromOptions(options);
		if (globals) {
			initGlobals(globals as Record<string, unknown>);
		}
	}

	// Fluent API for adding lifecycle callbacks
	onSetup(...callbacks: Array<SetupFunction<ZylemGame<TGlobals>, TGlobals>>): this {
		this.setupCallbacks.push(...callbacks);
		return this;
	}

	onUpdate(...callbacks: Array<UpdateFunction<ZylemGame<TGlobals>, TGlobals>>): this {
		this.updateCallbacks.push(...callbacks);
		return this;
	}

	onDestroy(...callbacks: Array<DestroyFunction<ZylemGame<TGlobals>, TGlobals>>): this {
		this.destroyCallbacks.push(...callbacks);
		return this;
	}

	async start(): Promise<this> {
		// Re-initialize globals for this game
		resetGlobals();
		const globals = extractGlobalsFromOptions(this.options);
		if (globals) {
			initGlobals(globals as Record<string, unknown>);
		}
		
		const game = await this.load();
		this.wrappedGame = game;
		this.setOverrides();
		this.registerGlobalSubscriptions();
		game.start();
		return this;
	}

	private async load(): Promise<ZylemGame<TGlobals>> {
		const options = await convertNodes<TGlobals>(this.options);
		const resolved = resolveGameConfig(options as any);
		const game = new ZylemGame<TGlobals>({
			...options as any,
			...resolved as any,
		} as any, this);
		
		// Apply pending loading callbacks BEFORE loadStage so events are captured
		for (const callback of this.pendingLoadingCallbacks) {
			game.onLoading(callback);
		}
		
		await game.loadStage(options.stages[0]);
		return game;
	}

	private setOverrides() {
		if (!this.wrappedGame) {
			console.error(this.refErrorMessage);
			return;
		}
		// Pass callback arrays to wrapped game
		this.wrappedGame.customSetup = (params) => {
			this.setupCallbacks.forEach(cb => cb(params));
		};
		this.wrappedGame.customUpdate = (params) => {
			this.updateCallbacks.forEach(cb => cb(params));
		};
		this.wrappedGame.customDestroy = (params) => {
			this.destroyCallbacks.forEach(cb => cb(params));
		};
	}

	/**
	 * Subscribe to changes on a global value. Subscriptions are registered
	 * when the game starts and cleaned up when disposed.
	 * The callback receives the value and the current stage.
	 * @example game.onGlobalChange('score', (val, stage) => console.log(val));
	 */
	onGlobalChange<T = unknown>(path: string, callback: (value: T, stage: Stage | null) => void): this {
		this.globalChangeCallbacks.push({ path, callback: callback as (value: unknown, stage: Stage | null) => void });
		return this;
	}

	/**
	 * Subscribe to changes on multiple global paths. Subscriptions are registered
	 * when the game starts and cleaned up when disposed.
	 * The callback receives the values and the current stage.
	 * @example game.onGlobalChanges(['score', 'lives'], ([score, lives], stage) => console.log(score, lives));
	 */
	onGlobalChanges<T extends unknown[] = unknown[]>(paths: string[], callback: (values: T, stage: Stage | null) => void): this {
		this.globalChangesCallbacks.push({ paths, callback: callback as (values: unknown[], stage: Stage | null) => void });
		return this;
	}

	/**
	 * Register all stored global change callbacks.
	 * Called internally during start().
	 */
	private registerGlobalSubscriptions() {
		for (const { path, callback } of this.globalChangeCallbacks) {
			const unsub = onGlobalChangeInternal(path, (value) => {
				callback(value, this.getCurrentStage());
			});
			this.activeGlobalSubscriptions.push(unsub);
		}
		for (const { paths, callback } of this.globalChangesCallbacks) {
			const unsub = onGlobalChangesInternal(paths, (values) => {
				callback(values, this.getCurrentStage());
			});
			this.activeGlobalSubscriptions.push(unsub);
		}
	}

	/**
	 * Get the current stage wrapper.
	 */
	getCurrentStage(): Stage | null {
		return this.wrappedGame?.currentStage() ?? null;
	}

	async pause() {
		setPaused(true);
	}

	async resume() {
		setPaused(false);
		if (this.wrappedGame) {
			this.wrappedGame.previousTimeStamp = 0;
			this.wrappedGame.timer.reset();
		}
	}

	async reset() {
		if (!this.wrappedGame) {
			console.error(this.refErrorMessage);
			return;
		}
		await this.wrappedGame.loadStage(this.wrappedGame.stages[0]);
	}

	previousStage() {
		if (!this.wrappedGame) {
			console.error(this.refErrorMessage);
			return;
		}
		const currentStageId = this.wrappedGame.currentStageId;
		const currentIndex = this.wrappedGame.stages.findIndex((s) => s.wrappedStage?.uuid === currentStageId);
		const previousStage = this.wrappedGame.stages[currentIndex - 1];
		if (!previousStage) {
			console.error('previous stage called on first stage');
			return;
		}
		this.wrappedGame.loadStage(previousStage);
	}

	async loadStageFromId(stageId: string) {
		if (!this.wrappedGame) {
			console.error(this.refErrorMessage);
			return;
		}
		try {
			const blueprint = await StageManager.loadStageData(stageId);
			const stage = await StageFactory.createFromBlueprint(blueprint);
			await this.wrappedGame.loadStage(stage);
			
			// Update StageManager state
			stageState.current = blueprint;
		} catch (e) {
			console.error(`Failed to load stage ${stageId}`, e);
		}
	}

	nextStage() {
		if (!this.wrappedGame) {
			console.error(this.refErrorMessage);
			return;
		}
		
		// Try to use StageManager first if we have a next stage in state
		if (stageState.next) {
			console.log('next stage called');
			const nextId = stageState.next.id;
			StageManager.transitionForward(nextId);
			// After transition, current is the new stage
			if (stageState.current) {
				StageFactory.createFromBlueprint(stageState.current).then((stage) => {
					this.wrappedGame?.loadStage(stage);
				});
				return;
			}
		}

		// Fallback to legacy array-based navigation
		const currentStageId = this.wrappedGame.currentStageId;
		const currentIndex = this.wrappedGame.stages.findIndex((s) => s.wrappedStage?.uuid === currentStageId);
		const nextStage = this.wrappedGame.stages[currentIndex + 1];
		if (!nextStage) {
			console.error('next stage called on last stage');
			return;
		}
		this.wrappedGame.loadStage(nextStage);
	}

	async goToStage() { }

	async end() { }

	dispose() {
		// Clear event delegate subscriptions
		this.eventDelegate.dispose();

		// Clear game-specific subscriptions
		for (const unsub of this.activeGlobalSubscriptions) {
			unsub();
		}
		this.activeGlobalSubscriptions = [];
		
		if (this.wrappedGame) {
			this.wrappedGame.dispose();
		}
		// Clear all remaining global subscriptions and reset globals
		clearGlobalSubscriptions();
		resetGlobals();
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// Events API
	// ─────────────────────────────────────────────────────────────────────────────

	/**
	 * Dispatch an event from the game.
	 * Events are emitted both locally and to the global event bus.
	 */
	dispatch<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
		this.eventDelegate.dispatch(event, payload);
		// Emit to global bus for cross-package communication
		(zylemEventBus as any).emit(event, payload);
	}

	/**
	 * Listen for events on this game instance.
	 * @returns Unsubscribe function
	 */
	listen<K extends keyof GameEvents>(event: K, handler: (payload: GameEvents[K]) => void): () => void {
		return this.eventDelegate.listen(event, handler);
	}

	/**
	 * Subscribe to loading events from the game.
	 * Events include stage context (stageName, stageIndex).
	 * @param callback Invoked for each loading event
	 * @returns Unsubscribe function
	 */
	onLoading(callback: (event: GameLoadingEvent) => void): () => void {
		if (this.wrappedGame) {
			return this.wrappedGame.onLoading(callback);
		}
		// Store callback to be applied when game is created
		this.pendingLoadingCallbacks.push(callback);
		return () => {
			this.pendingLoadingCallbacks = this.pendingLoadingCallbacks.filter(c => c !== callback);
			if (this.wrappedGame) {
				// If already started, also unsubscribe from wrapped game
				// Note: this won't perfectly track existing subscriptions, but prevents future calls
			}
		};
	}
}

/**
 * create a new game
 * @param options GameOptions - Array of IGameOptions, Stage, GameEntity, or BaseNode objects
 * @param options.id Game name string (when using IGameOptions)
 * @param options.globals Game globals object (when using IGameOptions)
 * @param options.stages Array of stage objects (when using IGameOptions)
 * @returns Game
 */
export function createGame<TGlobals extends BaseGlobals>(...options: GameOptions<TGlobals>): Game<TGlobals> {
	return new Game<TGlobals>(options);
}