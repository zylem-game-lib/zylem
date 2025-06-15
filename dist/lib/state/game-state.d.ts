import { ZylemGameConfig } from '../core/';
declare const state$: import("@simplyianm/legend-state").ObservableObject<ZylemGameConfig>;
declare const setGlobalState: (value: any) => void;
declare const getGlobalState: () => Record<string, any>;
export { setGlobalState, getGlobalState, state$ };
