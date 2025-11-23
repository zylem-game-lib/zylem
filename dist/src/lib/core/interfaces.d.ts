import { Vector3 } from 'three';
import { UpdateFunction, SetupFunction, DestroyFunction } from './base-node-life-cycle';
export interface IGame<TGlobals extends Record<string, unknown> = any> {
    start: () => Promise<this>;
    nextStage: () => Promise<void>;
    previousStage: () => Promise<void>;
    reset: () => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    loadStageFromId: (stageId: string) => Promise<void>;
    end: () => Promise<void>;
    goToStage: () => void;
    getGlobal: <K extends keyof TGlobals>(key: K) => TGlobals[K];
    setGlobal: <K extends keyof TGlobals>(key: K, value: TGlobals[K]) => void;
}
export interface IStage {
    onUpdate: (callback: UpdateFunction<IStage>) => void;
    onSetup: (callback: SetupFunction<IStage>) => void;
    onDestroy: (callback: DestroyFunction<IStage>) => void;
}
export interface ICamera {
    move: (position: Vector3) => void;
    rotate: (pitch: number, yaw: number, roll: number) => void;
}
//# sourceMappingURL=interfaces.d.ts.map