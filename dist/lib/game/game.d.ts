import { BaseNode } from '../core/base-node';
import { ZylemGame } from './zylem-game';
import { Stage } from '../stage/stage';
import { DestroyFunction, IGame, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';
import { GameEntityLifeCycle } from '../entities/entity';
import { GlobalVariablesType, ZylemGameConfig } from './game-interfaces';
export declare class Game implements IGame {
    gameRef: ZylemGame | null;
    options: GameOptions;
    update: UpdateFunction<ZylemGame>;
    setup: SetupFunction<ZylemGame>;
    destroy: DestroyFunction<ZylemGame>;
    refErrorMessage: string;
    constructor(options: GameOptions);
    start(): Promise<this>;
    load(): Promise<ZylemGame>;
    setOverrides(): void;
    pause(): Promise<void>;
    resume(): Promise<void>;
    reset(): Promise<void>;
    nextStage(): Promise<void>;
    previousStage(): Promise<void>;
    goToStage(): Promise<void>;
    end(): Promise<void>;
    getGlobal(key: string): import("./game-interfaces").BasicTypes | GlobalVariablesType | undefined;
    setGlobal(key: string, value: number): void;
}
type GameOptions = Array<ZylemGameConfig<Stage, Game> | Stage | GameEntityLifeCycle | BaseNode>;
/**
 * create a new game
 * @param options GameOptions - Array of IGameOptions, Stage, GameEntity, or BaseNode objects
 * @param options.id Game name string (when using IGameOptions)
 * @param options.globals Game globals object (when using IGameOptions)
 * @param options.stages Array of stage objects (when using IGameOptions)
 * @returns Game
 */
export declare function game(...options: GameOptions): Game;
export {};
