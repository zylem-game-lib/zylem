import { GameBlueprint } from '../interfaces/game';
declare const state$: import("@simplyianm/legend-state").ObservableObject<GameBlueprint>;
declare const setGlobalState: (value: any) => void;
declare const getGlobalState: () => Record<string, any>;
export { setGlobalState, getGlobalState, state$ };
