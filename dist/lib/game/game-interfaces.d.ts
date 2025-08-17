import { UpdateFunction } from "../core/base-node-life-cycle";
export type BasicTypes = number | string | boolean;
export type GlobalVariablesType = Record<string, BasicTypes>;
export interface ZylemGameConfig<StageInterface, GameInterface, TGlobals extends Record<string, BasicTypes> = GlobalVariablesType> {
    id: string;
    globals?: TGlobals;
    stages?: StageInterface[];
    update?: UpdateFunction<GameInterface>;
    debug?: boolean;
    time?: number;
}
