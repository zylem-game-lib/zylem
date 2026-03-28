import { UpdateFunction } from "../core/base-node-life-cycle";

export type BasicTypes = number | string | boolean;
export type BaseGlobals = Record<string, BasicTypes>;

export type KeyboardMapping = Record<string, string[]>;
export type MouseMapping = Record<string, string[]>;
export type VirtualTouchStyle = Partial<Record<string, string | number>>;

export interface VirtualTouchPosition {
	top?: string | number;
	right?: string | number;
	bottom?: string | number;
	left?: string | number;
	transform?: string;
}

export interface VirtualTouchButtonConfig {
	enabled?: boolean;
	className?: string;
	style?: VirtualTouchStyle;
	position?: VirtualTouchPosition;
	size?: number;
	label?: string;
	/** Trusted SVG markup injected into the control. */
	svg?: string;
}

export interface VirtualTouchJoystickConfig {
	enabled?: boolean;
	className?: string;
	style?: VirtualTouchStyle;
	position?: VirtualTouchPosition;
	size?: number;
	thumbSize?: number;
	maxDistance?: number;
	deadzone?: number;
	directionThreshold?: number;
	horizontalAxis?: 'Horizontal' | 'SecondaryHorizontal';
	verticalAxis?: 'Vertical' | 'SecondaryVertical';
	emitDirections?: boolean;
	svg?: {
		base?: string;
		thumb?: string;
	};
}

export type VirtualTouchButtonSlot =
	| 'A'
	| 'B'
	| 'X'
	| 'Y'
	| 'Start'
	| 'Select'
	| 'L'
	| 'R'
	| 'LTrigger'
	| 'RTrigger'
	| 'Up'
	| 'Down'
	| 'Left'
	| 'Right';

export type VirtualTouchButtonsConfig = Partial<Record<VirtualTouchButtonSlot, VirtualTouchButtonConfig | false>>;

export interface VirtualTouchJoysticksConfig {
	left?: VirtualTouchJoystickConfig | false;
	right?: VirtualTouchJoystickConfig | false;
}

export interface VirtualTouchConfig {
	enabled?: boolean | 'auto';
	className?: string;
	style?: VirtualTouchStyle;
	joysticks?: VirtualTouchJoysticksConfig | false;
	buttons?: VirtualTouchButtonsConfig | false;
}

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
	touch?: VirtualTouchConfig;
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
