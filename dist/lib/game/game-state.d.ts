import { BaseGlobals } from './game-interfaces';
declare const state: {
    id: string;
    globals: BaseGlobals;
    time: number;
};
export declare function setGlobalState<TGlobals extends BaseGlobals, K extends keyof TGlobals = keyof TGlobals>(key: K, value: TGlobals[K]): void;
export declare function getGlobalState<TGlobals extends BaseGlobals>(): TGlobals;
export declare function getGlobalState<TGlobals extends BaseGlobals, K extends keyof TGlobals = keyof TGlobals>(key: K): TGlobals[K];
export { state };
//# sourceMappingURL=game-state.d.ts.map