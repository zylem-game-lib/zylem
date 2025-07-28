import { GlobalVariablesType } from './game-interfaces';
declare const state: {
    id: string;
    globals: GlobalVariablesType;
    time: number;
};
declare const setGlobalState: (key: string, value: any) => void;
declare const getGlobalState: (key?: string) => import("./game-interfaces").BasicTypes | GlobalVariablesType;
export { setGlobalState, getGlobalState, state };
