import { BaseNode } from '../core/base-node';
import { ZylemGame } from './zylem-game';
import { ZylemStage } from '../stage/zylem-stage';
import { Stage } from '../stage/stage';
import { DestroyFunction, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';
import { GameEntityLifeCycle } from '../entities/entity';
import { GlobalVariablesType, ZylemGameConfig } from './game-interfaces';
export declare class Game {
    gameRef: ZylemGame | null;
    options: GameOptions;
    update: UpdateFunction<ZylemStage>;
    setup: SetupFunction<ZylemStage>;
    destroy: DestroyFunction<ZylemStage>;
    refErrorMessage: string;
    constructor(options: GameOptions);
    start(): Promise<ZylemGame>;
    load(): Promise<ZylemGame>;
    setOverrides(): void;
    pause(): Promise<void>;
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
