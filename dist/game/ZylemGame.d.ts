import GamePad from '../input/ZylemGamePad';
import { ZylemStage } from '../stage/ZylemStage';
import { Clock } from 'three';
import { GameOptions, GameRatio, StageOptions } from '../interfaces/Game';
import { PerspectiveType } from "../interfaces/Perspective";
export declare class ZylemGame implements GameOptions {
    id: string;
    ratio: GameRatio;
    perspective: PerspectiveType;
    globals: any;
    stage?: StageOptions;
    stages: StageOptions[];
    blueprintOptions: GameOptions;
    currentStage: string;
    clock: Clock;
    gamePad: GamePad;
    _targetRatio: number;
    _initialGlobals: any;
    _stageMap: Record<string, ZylemStage>;
    _canvasWrapper: Element | null;
    previousTimeStamp: number;
    startTimeStamp: number;
    constructor(options: GameOptions);
    loadStage(options: StageOptions): Promise<void>;
    /**
     * Main game loop
     * process user input
     * update physics
     * render scene
     */
    gameLoop(_timeStamp: number): Promise<void>;
    start(): void;
    reset(resetGlobals?: boolean): void;
    getStage(id: string): ZylemStage;
    createStage(id: string): void;
    delayedResize(): void;
    handleResize(): void;
    setCanvasSize(width: number, height: number): void;
    createInitialStyles(): void;
    createCanvas(): void;
}
export default ZylemGame;
