import { ZylemDebug } from './debug';
import { GameOptions, ZylemGame } from "./game";
import { ZylemStage } from './stage';
import { IGameEntity } from './game-entity';
import { SetupFunction, UpdateFunction } from '../interfaces/entity';
export declare class Game {
    gameRef: ZylemGame | null;
    options: GameOptionsWrapper;
    debugRef: ZylemDebug | null;
    updateOverride: UpdateFunction<any>;
    setupOverride: SetupFunction<any>;
    constructor(options: GameOptionsWrapper);
    log(message: string): void;
    start(): Promise<void>;
    setOverrides(): void;
    setup(setupFn: SetupFunction<any>): Promise<void>;
    update(updateFn: UpdateFunction<any>): Promise<void>;
    pause(): Promise<void>;
    reset(): Promise<void>;
    nextStage(): Promise<void>;
    previousStage(): Promise<void>;
    goToStage(): Promise<void>;
    end(): Promise<void>;
}
type GameOptionsWrapper = Array<Partial<GameOptions> | ZylemStage | Partial<IGameEntity>>;
export declare function game(...options: GameOptionsWrapper): Game;
export {};
