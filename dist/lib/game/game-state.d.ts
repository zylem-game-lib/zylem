import { BasicTypes, GlobalVariablesType } from './game-interfaces';
declare const state: {
    id: string;
    globals: GlobalVariablesType;
    time: number;
};
export declare function setGlobalState<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType, K extends keyof TGlobals = keyof TGlobals>(key: K, value: TGlobals[K]): void;
export declare function getGlobalState<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType>(): TGlobals;
export declare function getGlobalState<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType, K extends keyof TGlobals = keyof TGlobals>(key: K): TGlobals[K];
export { state };
