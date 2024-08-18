import { Clock } from 'three';
import GamePad from '../input/game-pad';
import { GameRatio } from '../interfaces/game';
import { PerspectiveType } from "../interfaces/perspective";
import { ZylemStage } from './stage';
import { Entity, System } from './ecs';
import { SetupFunction, UpdateFunction } from '../interfaces/entity';
import { DebugConfiguration } from './debug';
import { Game } from './game-wrapper';
export interface GameOptions {
    id: string;
    ratio?: GameRatio;
    globals: Record<string, any>;
    stages: ZylemStage[];
    update?: UpdateFunction<this>;
    debug?: boolean;
    debugConfiguration?: DebugConfiguration;
    time?: number;
}
type Timeout = any;
export declare class ZylemGame {
    id: string;
    ratio: GameRatio;
    perspective: PerspectiveType;
    globals: any;
    stages: ZylemStage[];
    blueprintOptions: GameOptions;
    currentStageId: string;
    clock: Clock;
    gamePad: GamePad;
    customSetup: SetupFunction<any> | null;
    customUpdate: UpdateFunction<any> | null;
    wrapperRef: Game;
    _targetRatio: number;
    _initialGlobals: any;
    _stageMap: Record<string, ZylemStage>;
    totalTime: number;
    timeoutId: Timeout | number;
    static logcount: number;
    constructor(options: GameOptions, wrapperRef: Game);
    loadStage(stage: ZylemStage): Promise<void>;
    /**
     * Main game loop
     * process user input
     * update physics
     * render scene
     */
    previousTimeStamp: number;
    static FRAME_LIMIT: number;
    static FRAME_DURATION: number;
    loop: (timeStamp: number) => void;
    runLoop(): void;
    start(): void;
    reset(resetGlobals?: boolean): Promise<void>;
    getStage(id: string): ZylemStage;
    createStage(id: string): void;
    getCurrentStage(): ZylemStage;
}
export default ZylemGame;
export declare class GameSystem implements System {
    stages: Map<any, any>;
    currentStageId: string;
    previousTimeStamp: number;
    totalTime: number;
    clock: Clock;
    gamePad: GamePad;
    static FRAME_LIMIT: number;
    static FRAME_DURATION: number;
    entities: Map<number, Entity>;
    constructor();
    setup(entities: Map<number, Entity>): void;
    filter(entity: Entity): boolean;
    update(entities: Map<number, Entity>): void;
    loop(timestamp: number): void;
    getStage(id: string): any;
    currentStage(): any;
}
