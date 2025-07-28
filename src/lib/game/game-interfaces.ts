import { UpdateFunction } from "../core/base-node-life-cycle";

export type BasicTypes = number | string | boolean;
export type GlobalVariablesType = Record<string, BasicTypes>;

export interface ZylemGameConfig<StageInterface, GameInterface> {
	id: string;
	globals?: GlobalVariablesType;
	stages?: StageInterface[];
	update?: UpdateFunction<GameInterface>;
	debug?: boolean;
	time?: number;
}
