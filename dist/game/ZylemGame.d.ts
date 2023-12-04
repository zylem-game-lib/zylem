import GamePad from '../input/ZylemGamePad';
import { ZylemStage } from '../stage/ZylemStage';
import { Clock } from 'three';
import { GameOptions, StageOptions } from '../interfaces/Game';
import { PerspectiveType } from "../interfaces/Perspective";
export declare class ZylemGame implements GameOptions {
    id: string;
    perspective: PerspectiveType;
    globals: any;
    _initialGlobals: any;
    stage: StageOptions;
    stages: Record<string, ZylemStage>;
    blueprintOptions: GameOptions;
    currentStage: string;
    clock: Clock;
    gamePad: GamePad;
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
    createStage(id: string): void;
    handleResize(): void;
    delayedResize(): void;
    createCanvas(): HTMLElement | undefined;
}
export default ZylemGame;
