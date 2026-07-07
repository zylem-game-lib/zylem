import { Vector3 } from 'three';
import { UpdateFunction, SetupFunction, DestroyFunction } from './base-node-life-cycle';
import type { StageTransitionConfig } from '../graphics/stage-transition';

export type LoadingEvent = {
	type: 'start' | 'progress' | 'complete';
	message?: string;
	progress?: number; // 0 to 1
	total?: number;
	current?: number;
};

/**
 * Options for stage navigation (`nextStage` / `previousStage` / `reset`).
 */
export interface StageNavigationOptions {
	/** Visual transition to blend from the outgoing stage to the incoming one. */
	transition?: StageTransitionConfig;
}

export interface IGame<TGlobals extends Record<string, unknown> = any> {
    start: () => Promise<this>;
    nextStage: (options?: StageNavigationOptions) => void;
    previousStage: (options?: StageNavigationOptions) => void;
    reset: (options?: StageNavigationOptions) => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    onLoading: (callback: (event: LoadingEvent) => void) => void;
    loadStageFromId: (stageId: string) => Promise<void>;

    ////////////////////////////////////////////////////
    end: () => Promise<void>; // TODO: need implementation
    goToStage: () => void; // TODO: need implementation
    ////////////////////////////////////////////////////
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
