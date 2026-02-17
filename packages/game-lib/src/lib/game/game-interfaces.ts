import { UpdateFunction } from "../core/base-node-life-cycle";

export type BasicTypes = number | string | boolean;
export type BaseGlobals = Record<string, BasicTypes>;

export type KeyboardMapping = Record<string, string[]>;
export type MouseMapping = Record<string, string[]>;

export interface MouseConfig {
	/** Custom mapping from mouse actions to input properties. */
	mapping?: MouseMapping;
	/** Whether to capture the cursor via Pointer Lock API. */
	pointerLock?: boolean;
	/** Sensitivity multiplier for mouse movement (default 0.002). */
	sensitivity?: number;
}

export interface GameInputPlayerConfig {
	key?: KeyboardMapping;
	mouse?: MouseConfig;
	includeDefaults?: boolean;
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

export interface ZylemGameConfig<StageInterface, GameInterface, TGlobals extends BaseGlobals> {
	id: string;
	globals?: TGlobals;
	stages?: StageInterface[];
	update?: UpdateFunction<GameInterface>;
	debug?: boolean;
	time?: number;
	input?: GameInputConfig;
}
