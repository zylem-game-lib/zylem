import { Inputs } from '../input/input';
import { IGame, IStage, ICamera } from './interfaces';
type GlobalRecord = Record<string, unknown>;
/** Setup */
export interface SetupContext<T, TGlobals extends GlobalRecord = any> {
    me: T;
    globals: TGlobals;
    inputs?: Inputs;
    camera?: ICamera;
    stage?: IStage;
    game?: IGame<TGlobals>;
}
export interface SetupFunction<T, TGlobals extends GlobalRecord = any> {
    (context: SetupContext<T, TGlobals>): void;
}
/** Loaded */
export interface LoadedContext<T, TGlobals extends GlobalRecord = any> {
    me: T;
    globals: TGlobals;
}
export interface LoadedFunction<T, TGlobals extends GlobalRecord = any> {
    (context: LoadedContext<T, TGlobals>): void;
}
/** Update */
export type UpdateContext<T, TGlobals extends GlobalRecord = any> = {
    me: T;
    delta: number;
    inputs: Inputs;
    globals: TGlobals;
    camera: ICamera;
    stage?: IStage;
    game?: IGame<TGlobals>;
};
export interface UpdateFunction<T, TGlobals extends GlobalRecord = any> {
    (context: UpdateContext<T, TGlobals>): void;
}
/** Destroy */
export interface DestroyContext<T, TGlobals extends GlobalRecord = any> {
    me: T;
    globals: TGlobals;
}
export interface DestroyFunction<T, TGlobals extends GlobalRecord = any> {
    (context: DestroyContext<T, TGlobals>): void;
}
/** Cleanup */
export interface CleanupContext<T, TGlobals extends GlobalRecord = any> {
    me: T;
    globals: TGlobals;
}
export interface CleanupFunction<T, TGlobals extends GlobalRecord = any> {
    (context: CleanupContext<T, TGlobals>): void;
}
export {};
//# sourceMappingURL=base-node-life-cycle.d.ts.map