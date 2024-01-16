import GamePad from '../input/GamePad';
import { ZylemStage } from './Stage';
import { Clock } from 'three';
import { GameBlueprint, GameRatio, StageBlueprint } from '../interfaces/game';
import { PerspectiveType } from "../interfaces/Perspective";
export declare class ZylemGame implements GameBlueprint {
    id: string;
    ratio: GameRatio;
    perspective: PerspectiveType;
    globals: any;
    stage?: StageBlueprint;
    stages: StageBlueprint[];
    blueprintOptions: GameBlueprint;
    currentStage: string;
    clock: Clock;
    gamePad: GamePad;
    _targetRatio: number;
    _initialGlobals: any;
    _stageMap: Record<string, ZylemStage>;
    _canvasWrapper: Element | null;
    previousTimeStamp: number;
    startTimeStamp: number;
    constructor(options: GameBlueprint);
    loadStage(options: StageBlueprint): Promise<void>;
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
