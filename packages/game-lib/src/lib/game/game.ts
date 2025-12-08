import { ZylemGame } from './zylem-game';
import { DestroyFunction, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';
import { IGame, LoadingEvent } from '../core/interfaces';
import { setPaused } from '../debug/debug-state';
import { BaseGlobals } from './game-interfaces';
import { convertNodes, GameOptions, hasStages, extractGlobalsFromOptions } from '../core/utility/nodes';
import { resolveGameConfig } from './game-config';
import { createStage } from '../stage/stage';
import { StageManager, stageState } from '../stage/stage-manager';
import { StageFactory } from '../stage/stage-factory';
import { initGlobals } from './game-state';

export class Game<TGlobals extends BaseGlobals> implements IGame<TGlobals> {
	private wrappedGame: ZylemGame<TGlobals> | null = null;

	options: GameOptions<TGlobals>;

	update: UpdateFunction<ZylemGame<TGlobals>, TGlobals> = () => { };
	setup: SetupFunction<ZylemGame<TGlobals>, TGlobals> = () => { };
	destroy: DestroyFunction<ZylemGame<TGlobals>, TGlobals> = () => { };

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

	async start(): Promise<this> {
		const game = await this.load();
		this.wrappedGame = game;
		this.setOverrides();
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
		await game.loadStage(options.stages[0]);
		return game;
	}

	setOverrides() {
		if (!this.wrappedGame) {
			console.error(this.refErrorMessage);
			return;
		}
		this.wrappedGame.customSetup = this.setup;
		this.wrappedGame.customUpdate = this.update;
		this.wrappedGame.customDestroy = this.destroy;
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

	async previousStage() {
		if (!this.wrappedGame) {
			console.error(this.refErrorMessage);
			return;
		}
		const currentStageId = this.wrappedGame.currentStageId;
		const currentIndex = this.wrappedGame.stages.findIndex((s) => s.wrappedStage!.uuid === currentStageId);
		const previousStage = this.wrappedGame.stages[currentIndex - 1];
		if (!previousStage) {
			console.error('previous stage called on first stage');
			return;
		}
		await this.wrappedGame.loadStage(previousStage);
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

	async nextStage() {
		if (!this.wrappedGame) {
			console.error(this.refErrorMessage);
			return;
		}
		
		// Try to use StageManager first if we have a next stage in state
		if (stageState.next) {
			const nextId = stageState.next.id;
			await StageManager.transitionForward(nextId);
			// After transition, current is the new stage
			if (stageState.current) {
				const stage = await StageFactory.createFromBlueprint(stageState.current);
				await this.wrappedGame.loadStage(stage);
				return;
			}
		}

		// Fallback to legacy array-based navigation
		const currentStageId = this.wrappedGame.currentStageId;
		const currentIndex = this.wrappedGame.stages.findIndex((s) => s.wrappedStage!.uuid === currentStageId);
		const nextStage = this.wrappedGame.stages[currentIndex + 1];
		if (!nextStage) {
			console.error('next stage called on last stage');
			return;
		}
		await this.wrappedGame.loadStage(nextStage);
	}

	async goToStage() { }

	async end() { }

	dispose() {
		if (this.wrappedGame) {
			this.wrappedGame.dispose();
		}
	}

	onLoading(callback: (event: LoadingEvent) => void) {
		
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