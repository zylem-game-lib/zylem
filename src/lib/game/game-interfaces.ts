import { UpdateFunction } from "../core/base-node-life-cycle";

export type BasicTypes = number | string | boolean;
export type GlobalVariablesType = Record<string, BasicTypes>;

export type KeyboardMapping = Record<string, string[]>;
export type MouseMapping = Record<string, string[]>;

export interface GameInputPlayerConfig {
	key?: KeyboardMapping;
	mouse?: MouseMapping;
}

export interface GameInputConfig {
	p1?: GameInputPlayerConfig;
	p2?: GameInputPlayerConfig;
	p3?: GameInputPlayerConfig;
	p4?: GameInputPlayerConfig;
	p5?: GameInputPlayerConfig;
	p6?: GameInputPlayerConfig;
	p7?: GameInputPlayerConfig;
	p8?: GameInputPlayerConfig;
}

export interface ZylemGameConfig<StageInterface, GameInterface, TGlobals extends Record<string, BasicTypes> = GlobalVariablesType> {
	id: string;
	globals?: TGlobals;
	stages?: StageInterface[];
	update?: UpdateFunction<GameInterface>;
	debug?: boolean;
	time?: number;
	input?: GameInputConfig;
}
