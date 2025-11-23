import { ZylemGame } from './zylem-game';
import { DestroyFunction, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';
import { IGame } from '../core/interfaces';
import { BaseGlobals } from './game-interfaces';
import { GameOptions } from '../core/utility/nodes';
export declare class Game<TGlobals extends BaseGlobals> implements IGame<TGlobals> {
    private wrappedGame;
    private pendingGlobalChangeHandlers;
    options: GameOptions<TGlobals>;
    update: UpdateFunction<ZylemGame<TGlobals>, TGlobals>;
    setup: SetupFunction<ZylemGame<TGlobals>, TGlobals>;
    destroy: DestroyFunction<ZylemGame<TGlobals>, TGlobals>;
    refErrorMessage: string;
    constructor(options: GameOptions<TGlobals>);
    start(): Promise<this>;
    private load;
    setOverrides(): void;
    pause(): Promise<void>;
    resume(): Promise<void>;
    reset(): Promise<void>;
    previousStage(): Promise<void>;
    loadStageFromId(stageId: string): Promise<void>;
    nextStage(): Promise<void>;
    goToStage(): Promise<void>;
    end(): Promise<void>;
    getGlobal<K extends keyof TGlobals>(key: K): TGlobals[K];
    setGlobal<K extends keyof TGlobals>(key: K, value: TGlobals[K]): void;
    onGlobalChange<K extends keyof TGlobals>(key: K, callback: (value: TGlobals[K]) => void): void;
}
/**
 * create a new game
 * @param options GameOptions - Array of IGameOptions, Stage, GameEntity, or BaseNode objects
 * @param options.id Game name string (when using IGameOptions)
 * @param options.globals Game globals object (when using IGameOptions)
 * @param options.stages Array of stage objects (when using IGameOptions)
 * @returns Game
 */
export declare function createGame<TGlobals extends BaseGlobals>(...options: GameOptions<TGlobals>): Game<TGlobals>;
//# sourceMappingURL=game.d.ts.map