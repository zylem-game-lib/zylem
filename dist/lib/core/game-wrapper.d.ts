import { GameOptions, ZylemGame } from "./game";
import { ZylemStage } from './stage';
import { GameEntity } from './game-entity';
import { SetupFunction, UpdateFunction } from '../interfaces/entity';
export declare class Game {
    gameRef: ZylemGame | null;
    options: GameOptionsWrapper;
    updateOverride: UpdateFunction<any>;
    setupOverride: SetupFunction<any>;
    constructor(options: GameOptionsWrapper);
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
type GameOptionsWrapper = Array<Partial<GameOptions> | ZylemStage | GameEntity<any>>;
export declare function game(...options: GameOptionsWrapper): Game;
export {};
