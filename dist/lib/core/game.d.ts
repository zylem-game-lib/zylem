import { Clock } from 'three';
import { DebugConfiguration } from './debug';
import GamePad from '../input/game-pad';
import { ZylemStage } from './stage';
import { EntityParameters } from './entity';
import { SetupFunction, UpdateFunction } from '../interfaces/entity';
import { Game } from './game-wrapper';
export interface GameOptions {
    id: string;
    globals: Record<string, any>;
    stages: ZylemStage[];
    update?: UpdateFunction<this>;
    debug?: boolean;
    debugConfiguration?: DebugConfiguration;
    time?: number;
}
export declare class ZylemGame {
    id: string;
    initialGlobals: {};
    customSetup: SetupFunction<any> | null;
    customUpdate: UpdateFunction<any> | null;
    stages: ZylemStage[];
    stageMap: Map<string, ZylemStage>;
    currentStageId: string;
    previousTimeStamp: number;
    totalTime: number;
    clock: Clock;
    gamePad: GamePad;
    wrapperRef: Game;
    statsRef: Stats | null;
    static FRAME_LIMIT: number;
    static FRAME_DURATION: number;
    constructor(options: GameOptions, wrapperRef: Game);
    loadStage(stage: ZylemStage): Promise<void>;
    setGlobals(options: GameOptions): void;
    params(): EntityParameters<ZylemStage>;
    start(): void;
    loop(timestamp: number): void;
    getStage(id: string): ZylemStage | undefined;
    currentStage(): ZylemStage | undefined;
}
export default ZylemGame;
