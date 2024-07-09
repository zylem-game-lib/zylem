import { Clock } from 'three';
import GamePad from '../input/game-pad';
import { GameBlueprint, GameRatio } from '../interfaces/game';
import { PerspectiveType } from "../interfaces/perspective";
import { ZylemStage } from './stage';
type Timeout = any;
export declare class ZylemGame implements GameBlueprint {
    id: string;
    ratio: GameRatio;
    perspective: PerspectiveType;
    globals: any;
    stages: ZylemStage[];
    blueprintOptions: GameBlueprint;
    currentStageId: string;
    clock: Clock;
    gamePad: GamePad;
    _targetRatio: number;
    _initialGlobals: any;
    _stageMap: Record<string, ZylemStage>;
    totalTime: number;
    timeoutId: Timeout | number;
    static logcount: number;
    constructor(options: GameBlueprint, loadedStage: ZylemStage);
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
