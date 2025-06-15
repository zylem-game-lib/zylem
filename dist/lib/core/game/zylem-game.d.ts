import { ZylemStage } from '../stage/zylem-stage';
import { Game } from './game';
import { UpdateContext, SetupContext, UpdateFunction, DestroyContext } from '../base-node-life-cycle';
import { InputManager } from '../../input/input-manager';
import { Timer } from '../three-addons/Timer';
import { Stage } from '../stage/stage';
export interface ZylemGameConfig {
    id: string;
    globals?: Record<string, any>;
    stages?: Stage[];
    update?: UpdateFunction<ZylemGame>;
    debug?: boolean;
    time?: number;
}
export declare class ZylemGame {
    id: string;
    initialGlobals: {};
    customSetup: ((params: SetupContext<ZylemStage>) => void) | null;
    customUpdate: ((params: UpdateContext<ZylemStage>) => void) | null;
    customDestroy: ((params: DestroyContext<ZylemStage>) => void) | null;
    stages: Stage[];
    stageMap: Map<string, Stage>;
    currentStageId: string;
    previousTimeStamp: number;
    totalTime: number;
    timer: Timer;
    inputManager: InputManager;
    wrapperRef: Game;
    static FRAME_LIMIT: number;
    static FRAME_DURATION: number;
    constructor(options: ZylemGameConfig, wrapperRef: Game);
    loadStage(stage: Stage): Promise<void>;
    setGlobals(options: ZylemGameConfig): void;
    params(): UpdateContext<ZylemStage>;
    start(): void;
    loop(timestamp: number): void;
    getStage(id: string): Stage | undefined;
    currentStage(): Stage | undefined;
}
export default ZylemGame;
