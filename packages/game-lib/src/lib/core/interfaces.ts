import { Vector3 } from 'three';
import { UpdateFunction, SetupFunction, DestroyFunction } from './base-node-life-cycle';

export type LoadingEvent = {
	type: 'start' | 'progress' | 'complete';
	message?: string;
	progress?: number; // 0 to 1
	total?: number;
	current?: number;
};

export interface IGame<TGlobals extends Record<string, unknown> = any> {
    start: () => Promise<this>;
    nextStage: () => Promise<void>;
    previousStage: () => Promise<void>;
    reset: () => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    onLoading: (callback: (event: LoadingEvent) => void) => void;
    loadStageFromId: (stageId: string) => Promise<void>;

    ////////////////////////////////////////////////////
    end: () => Promise<void>; // TODO: need implementation
    goToStage: () => void; // TODO: need implementation
    ////////////////////////////////////////////////////

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
