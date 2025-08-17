import { Vector3 } from 'three';
import { Inputs } from '../input/input';
export interface IGame<TGlobals extends Record<string, unknown> = any> {
    start: () => Promise<this>;
    nextStage: () => Promise<void>;
    previousStage: () => Promise<void>;
    reset: () => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
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
export interface SetupContext<T, TGlobals extends Record<string, unknown> = any> {
    me: T;
    globals: TGlobals;
    inputs?: Inputs;
    camera?: ICamera;
    stage?: IStage;
    game?: IGame<TGlobals>;
}
export interface SetupFunction<T, TGlobals extends Record<string, unknown> = any> {
    (context: SetupContext<T, TGlobals>): void;
}
export type UpdateContext<T, TGlobals extends Record<string, unknown> = any> = {
    me: T;
    delta: number;
    inputs: Inputs;
    globals: TGlobals;
    camera: ICamera;
    stage?: IStage;
    game?: IGame<TGlobals>;
};
export interface UpdateFunction<T, TGlobals extends Record<string, unknown> = any> {
    (context: UpdateContext<T, TGlobals>): void;
}
export interface DestroyContext<T, TGlobals extends Record<string, unknown> = any> {
    me: T;
    globals: TGlobals;
}
export interface DestroyFunction<T, TGlobals extends Record<string, unknown> = any> {
    (context: DestroyContext<T, TGlobals>): void;
}
