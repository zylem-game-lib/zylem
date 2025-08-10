import { Vector3 } from 'three';
import { Inputs } from '../input/input';
export interface IGame {
    start: () => Promise<this>;
    nextStage: () => Promise<void>;
    previousStage: () => Promise<void>;
    reset: () => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    end: () => Promise<void>;
    goToStage: () => void;
    getGlobal: (key: string) => any;
    setGlobal: (key: string, value: any) => void;
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
export interface SetupContext<T> {
    me: T;
    globals: any;
    inputs?: Inputs;
    camera?: ICamera;
    stage?: IStage;
    game?: IGame;
}
export interface SetupFunction<T> {
    (context: SetupContext<T>): void;
}
export type UpdateContext<T> = {
    me: T;
    delta: number;
    inputs: Inputs;
    globals: any;
    camera: ICamera;
    stage?: IStage;
    game?: IGame;
};
export interface UpdateFunction<T> {
    (context: UpdateContext<T>): void;
}
export interface DestroyContext<T> {
    me: T;
    globals: any;
}
export interface DestroyFunction<T> {
    (context: DestroyContext<T>): void;
}
