import { BaseNode } from '../core/base-node';
import { ZylemGame } from './zylem-game';
import { Stage } from '../stage/stage';
import { DestroyFunction, IGame, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';
import { GameEntityLifeCycle } from '../entities/entity';
import { BasicTypes, GlobalVariablesType, ZylemGameConfig } from './game-interfaces';
export declare class Game<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType> implements IGame<TGlobals> {
    gameRef: ZylemGame<TGlobals> | null;
    options: GameOptions<TGlobals>;
    private pendingGlobalChangeHandlers;
    update: UpdateFunction<ZylemGame<TGlobals>, TGlobals>;
    setup: SetupFunction<ZylemGame<TGlobals>, TGlobals>;
    destroy: DestroyFunction<ZylemGame<TGlobals>, TGlobals>;
    refErrorMessage: string;
    constructor(options: GameOptions<TGlobals>);
    start(): Promise<this>;
    load(): Promise<ZylemGame<TGlobals>>;
    setOverrides(): void;
    pause(): Promise<void>;
    resume(): Promise<void>;
    reset(): Promise<void>;
    nextStage(): Promise<void>;
    previousStage(): Promise<void>;
    goToStage(): Promise<void>;
    end(): Promise<void>;
    add(...inputs: Array<Stage | Promise<any> | (() => Stage | Promise<any>)>): this;
    getGlobal<K extends keyof TGlobals>(key: K): TGlobals[K];
    setGlobal<K extends keyof TGlobals>(key: K, value: TGlobals[K]): void;
    onGlobalChange<K extends keyof TGlobals>(key: K, callback: (value: TGlobals[K]) => void): void;
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
export declare function game<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType>(...options: GameOptions<TGlobals>): Game<TGlobals>;
export {};
