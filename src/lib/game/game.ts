import { BaseNode } from '../core/base-node';
import { ZylemGame } from './zylem-game';
import { Stage, stage } from '../stage/stage';
import { DestroyFunction, IGame, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';
import { setPaused } from '../debug/debug-state';
import { GameEntity, GameEntityLifeCycle } from '../entities/entity';
import { BasicTypes, GlobalVariablesType, ZylemGameConfig } from './game-interfaces';
import { getGlobalState, setGlobalState } from './game-state';

const defaultGameOptions = {
	id: 'zylem',
	globals: {} as GlobalVariablesType,
	stages: [
		stage()
	]
};

function convertNodes<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType>(_options: GameOptions<TGlobals>): { id: string, globals: TGlobals, stages: Stage[] } {
	let converted = { ...defaultGameOptions };
	const configurations: ZylemGameConfig<Stage, Game<TGlobals>, TGlobals>[] = [];
	const stages: Stage[] = [];
	const entities: (BaseNode | GameEntity<any>)[] = [];
	Object.values(_options).forEach((node) => {
		if (node instanceof Stage) {
			stages.push(node);
		} else if (node instanceof GameEntity) {
			entities.push(node);
		} else if (node instanceof BaseNode) {
			entities.push(node);
		} else if (node.constructor.name === 'Object' && typeof node === 'object') {
			const configuration = Object.assign(defaultGameOptions, { ...node });
			configurations.push(configuration as ZylemGameConfig<Stage, Game<TGlobals>, TGlobals>);
		}
	});
	configurations.forEach((configuration) => {
		converted = Object.assign(converted, { ...configuration });
	});
	stages.forEach((stage) => {
		stage.addEntities(entities as BaseNode[]);
	});
	if (stages.length) {
		converted.stages = stages;
	} else {
		converted.stages[0].addEntities(entities as BaseNode[]);
	}
	return converted as unknown as { id: string, globals: TGlobals, stages: Stage[] };
}

export class Game<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType> implements IGame<TGlobals> {
	gameRef: ZylemGame<TGlobals> | null = null;
	options: GameOptions<TGlobals>;
	private pendingGlobalChangeHandlers: Array<{ key: keyof TGlobals; callback: (value: any) => void }> = [];

	update: UpdateFunction<ZylemGame<TGlobals>, TGlobals> = () => { };
	setup: SetupFunction<ZylemGame<TGlobals>, TGlobals> = () => { };
	destroy: DestroyFunction<ZylemGame<TGlobals>, TGlobals> = () => { };

	refErrorMessage = 'lost reference to game';

	constructor(options: GameOptions<TGlobals>) {
		this.options = options;
	}

	async start(): Promise<this> {
		const game = await this.load();
		this.gameRef = game;
		this.setOverrides();
		game.start();
		return this;
	}

	async load(): Promise<ZylemGame<TGlobals>> {
		console.log('loading game', this.options);
		const options = convertNodes<TGlobals>(this.options);
		const game = new ZylemGame<TGlobals>(options as any, this);
		await game.loadStage(options.stages[0]);
		return game;
	}

	setOverrides() {
		if (!this.gameRef) {
			console.error(this.refErrorMessage);
			return;
		}
		this.gameRef.customSetup = this.setup;
		this.gameRef.customUpdate = this.update;
		this.gameRef.customDestroy = this.destroy;
		if (this.pendingGlobalChangeHandlers.length) {
			for (const { key, callback } of this.pendingGlobalChangeHandlers) {
				this.gameRef.onGlobalChange(key as keyof TGlobals, callback as (value: TGlobals[keyof TGlobals]) => void);
			}
			this.pendingGlobalChangeHandlers = [];
		}
	}

	async pause() {
		setPaused(true);
	}

	async resume() {
		setPaused(false);
		if (this.gameRef) {
			this.gameRef.previousTimeStamp = 0;
			this.gameRef.timer.reset();
		}
	}

	async reset() {
		if (!this.gameRef) {
			console.error(this.refErrorMessage);
			return;
		}
		await this.gameRef.loadStage(this.gameRef.stages[0]);
	}

	async nextStage() {
		if (!this.gameRef) {
			console.error(this.refErrorMessage);
			return;
		}
		const currentStageId = this.gameRef.currentStageId;
		const currentIndex = this.gameRef.stages.findIndex((s) => s.stageRef!.uuid === currentStageId);
		const nextStage = this.gameRef.stages[currentIndex + 1];
		if (!nextStage) {
			console.error('next stage called on last stage');
			return;
		}
		await this.gameRef.loadStage(nextStage);
	}

	async previousStage() {
		if (!this.gameRef) {
			console.error(this.refErrorMessage);
			return;
		}
		const currentStageId = this.gameRef.currentStageId;
		const currentIndex = this.gameRef.stages.findIndex((s) => s.stageRef!.uuid === currentStageId);
		const previousStage = this.gameRef.stages[currentIndex - 1];
		if (!previousStage) {
			console.error('previous stage called on first stage');
			return;
		}
		await this.gameRef.loadStage(previousStage);
	}

	async goToStage() { }

	async end() { }

	add(...inputs: Array<Stage | Promise<any> | (() => Stage | Promise<any>)>) {
		for (const input of inputs) {
			if (!input) continue;
			if (input instanceof Stage) {
				if (this.gameRef) {
					this.gameRef.stages.push(input);
					this.gameRef.stageMap.set(input.stageRef!.uuid, input);
				} else {
					this.options.push(input as any);
				}
				continue;
			}
			if (typeof input === 'function') {
				try {
					const result = (input as (() => Stage | Promise<any>))();
					if (result instanceof Stage) {
						if (this.gameRef) {
							this.gameRef.stages.push(result);
							this.gameRef.stageMap.set(result.stageRef!.uuid, result);
						} else {
							this.options.push(result as any);
						}
					} else if (result && typeof (result as any).then === 'function') {
						(result as Promise<any>)
							.then((stage) => {
								if (!(stage instanceof Stage)) return;
								if (this.gameRef) {
									this.gameRef.stages.push(stage);
									this.gameRef.stageMap.set(stage.stageRef!.uuid, stage);
								} else {
									this.options.push(stage as any);
								}
							})
							.catch((e) => console.error('Failed to add async stage', e));
					}
				} catch (e) {
					console.error('Error executing stage factory', e);
				}
				continue;
			}
			if ((input as any) && typeof (input as any).then === 'function') {
				(input as Promise<any>)
					.then((stage) => {
						if (!(stage instanceof Stage)) return;
						if (this.gameRef) {
							this.gameRef.stages.push(stage);
							this.gameRef.stageMap.set(stage.stageRef!.uuid, stage);
						} else {
							this.options.push(stage as any);
						}
					})
					.catch((e) => console.error('Failed to add async stage', e));
			}
		}
		return this;
	}

	getGlobal<K extends keyof TGlobals>(key: K) {
		if (this.gameRef) {
			return this.gameRef.getGlobal(key);
		}
		return getGlobalState<TGlobals, K>(key);
	}

	setGlobal<K extends keyof TGlobals>(key: K, value: TGlobals[K]) {
		if (this.gameRef) {
			this.gameRef.setGlobal(key, value);
			return;
		}
		setGlobalState<TGlobals, K>(key, value);
	}

	onGlobalChange<K extends keyof TGlobals>(key: K, callback: (value: TGlobals[K]) => void) {
		if (this.gameRef) {
			this.gameRef.onGlobalChange(key, callback);
			return;
		}
		this.pendingGlobalChangeHandlers.push({ key, callback: callback as unknown as (value: any) => void });
	}
}

type GameOptions<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType> = Array<ZylemGameConfig<Stage, Game<TGlobals>, TGlobals> | Stage | GameEntityLifeCycle | BaseNode>;

/**
 * create a new game
 * @param options GameOptions - Array of IGameOptions, Stage, GameEntity, or BaseNode objects
 * @param options.id Game name string (when using IGameOptions)
 * @param options.globals Game globals object (when using IGameOptions)
 * @param options.stages Array of stage objects (when using IGameOptions)
 * @returns Game
 */
export function game<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType>(...options: GameOptions<TGlobals>): Game<TGlobals> {
	return new Game<TGlobals>(options);
}