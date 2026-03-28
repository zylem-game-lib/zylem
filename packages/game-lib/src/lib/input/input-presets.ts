import { InputPlayer } from './input';
import {
	GameInputConfig,
	GameInputPlayerConfig,
	KeyboardMapping,
	MouseConfig,
	VirtualTouchButtonConfig,
	VirtualTouchButtonsConfig,
	VirtualTouchConfig,
	VirtualTouchJoystickConfig,
	VirtualTouchJoysticksConfig,
} from '../game/game-interfaces';

/**
 * Creates a GameInputConfig scoped to a single player.
 */
function playerKeyMapping(player: InputPlayer, keyMapping: KeyboardMapping): GameInputConfig {
	return { [player]: { key: keyMapping } } as GameInputConfig;
}

/**
 * Maps arrow keys to axes (Horizontal/Vertical) for the given player.
 * @example stage.setInputConfiguration(useArrowsForAxes('p1'));
 */
export function useArrowsForAxes(player: InputPlayer): GameInputConfig {
	return playerKeyMapping(player, {
		'ArrowLeft': ['axes.Left'],
		'ArrowRight': ['axes.Right'],
		'ArrowUp': ['axes.Up'],
		'ArrowDown': ['axes.Down'],
	});
}

/**
 * Maps arrow keys to secondary axes for the given player.
 * @example stage.setInputConfiguration(useArrowsForSecondaryAxes('p1'));
 */
export function useArrowsForSecondaryAxes(player: InputPlayer): GameInputConfig {
	return playerKeyMapping(player, {
		'ArrowLeft': ['axes.SecondaryLeft'],
		'ArrowRight': ['axes.SecondaryRight'],
		'ArrowUp': ['axes.SecondaryUp'],
		'ArrowDown': ['axes.SecondaryDown'],
	});
}

/**
 * Maps arrow keys to directions (Up/Down/Left/Right) for the given player.
 * Useful when `includeDefaults` is false and you still want arrow-key directions.
 * @example stage.setInputConfiguration(useArrowsForDirections('p1'));
 */
export function useArrowsForDirections(player: InputPlayer): GameInputConfig {
	return playerKeyMapping(player, {
		'ArrowLeft': ['directions.Left'],
		'ArrowRight': ['directions.Right'],
		'ArrowUp': ['directions.Up'],
		'ArrowDown': ['directions.Down'],
	});
}

/**
 * Maps W/A/S/D keys to directions (Up/Down/Left/Right) for the given player.
 * @example stage.setInputConfiguration(useWASDForDirections('p1'));
 */
export function useWASDForDirections(player: InputPlayer): GameInputConfig {
	return playerKeyMapping(player, {
		'w': ['directions.Up'],
		's': ['directions.Down'],
		'a': ['directions.Left'],
		'd': ['directions.Right'],
	});
}

/**
 * Maps W/A/S/D keys to axes (Horizontal/Vertical) for the given player.
 * @example stage.setInputConfiguration(useWASDForAxes('p1'));
 */
export function useWASDForAxes(player: InputPlayer): GameInputConfig {
	return playerKeyMapping(player, {
		'a': ['axes.Left'],
		'd': ['axes.Right'],
		'w': ['axes.Up'],
		's': ['axes.Down'],
	});
}

/**
 * Maps I/J/K/L keys to axes (Horizontal/Vertical) for the given player.
 * @example stage.setInputConfiguration(useIJKLForAxes('p1'));
 */
export function useIJKLForAxes(player: InputPlayer): GameInputConfig {
	return playerKeyMapping(player, {
		'j': ['axes.Left'],
		'l': ['axes.Right'],
		'i': ['axes.Up'],
		'k': ['axes.Down'],
	});
}

/**
 * Maps I/J/K/L keys to directions (Up/Down/Left/Right) for the given player.
 * @example stage.setInputConfiguration(useIJKLForDirections('p1'));
 */
export function useIJKLForDirections(player: InputPlayer): GameInputConfig {
	return playerKeyMapping(player, {
		'j': ['directions.Left'],
		'l': ['directions.Right'],
		'i': ['directions.Up'],
		'k': ['directions.Down'],
	});
}

/**
 * Enables mouse-look with pointer lock for the given player.
 * Mouse movement maps to SecondaryHorizontal/SecondaryVertical axes;
 * left click maps to LTrigger, right click to RTrigger.
 * @example stage.setInputConfiguration(useMouseLook('p1'));
 */
export function useMouseLook(player: InputPlayer, options?: { sensitivity?: number }): GameInputConfig {
	return {
		[player]: {
			mouse: {
				pointerLock: true,
				sensitivity: options?.sensitivity,
			} satisfies MouseConfig,
		},
	} as GameInputConfig;
}

/**
 * Enables basic mouse input (no pointer lock) for the given player.
 * @example stage.setInputConfiguration(useMouse('p1'));
 */
export function useMouse(player: InputPlayer, options?: { sensitivity?: number }): GameInputConfig {
	return {
		[player]: {
			mouse: {
				pointerLock: false,
				sensitivity: options?.sensitivity,
			} satisfies MouseConfig,
		},
	} as GameInputConfig;
}

/**
 * Enables virtual touch controls for the given player.
 * By default the provider auto-enables itself on mobile/touch devices.
 * @example stage.setInputConfiguration(useVirtualControls('p1'));
 */
export function useVirtualControls(player: InputPlayer, options?: VirtualTouchConfig): GameInputConfig {
	return {
		[player]: {
			touch: {
				enabled: options?.enabled ?? 'auto',
				...options,
			} satisfies VirtualTouchConfig,
		},
	} as GameInputConfig;
}

const INPUT_PLAYERS: (keyof GameInputConfig)[] = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];

/**
 * Deep-merges multiple GameInputConfig objects into one.
 * At the player level, configs are merged (both apply).
 * At the key level, later configs win on conflict.
 * @example mergeInputConfigs(useArrowsForAxes('p1'), useWASDForDirections('p1'));
 */
export function mergeInputConfigs(...configs: GameInputConfig[]): GameInputConfig {
	const result: GameInputConfig = {};

	for (const config of configs) {
		for (const player of INPUT_PLAYERS) {
			const source = config[player];
			if (!source) continue;

			const target: GameInputPlayerConfig = result[player] ?? {};
			const mergedMouse: MouseConfig | undefined =
				(target.mouse || source.mouse)
					? {
						...target.mouse,
						...source.mouse,
						mapping: { ...target.mouse?.mapping, ...source.mouse?.mapping },
					}
					: undefined;
			const mergedTouch = mergeTouchConfigs(target.touch, source.touch);
			result[player] = {
				key: { ...target.key, ...source.key },
				mouse: mergedMouse,
				touch: mergedTouch,
				includeDefaults: source.includeDefaults ?? target.includeDefaults,
			};
		}
	}

	return result;
}

function mergeTouchConfigs(
	target?: VirtualTouchConfig,
	source?: VirtualTouchConfig,
): VirtualTouchConfig | undefined {
	if (!target && !source) return undefined;
	if (!target) return cloneTouchConfig(source);
	if (!source) return cloneTouchConfig(target);

	return {
		...target,
		...source,
		style: mergePlainObject(target.style, source.style),
		joysticks: mergeTouchJoysticks(target.joysticks, source.joysticks),
		buttons: mergeTouchButtons(target.buttons, source.buttons),
	};
}

function mergeTouchJoysticks(
	target?: VirtualTouchJoysticksConfig | false,
	source?: VirtualTouchJoysticksConfig | false,
): VirtualTouchJoysticksConfig | false | undefined {
	if (source === undefined) return cloneTouchJoysticks(target);
	if (source === false) return false;

	const base = target ? target : undefined;
	return {
		left: mergeTouchJoystickConfig(base?.left, source.left),
		right: mergeTouchJoystickConfig(base?.right, source.right),
	};
}

function mergeTouchJoystickConfig(
	target?: VirtualTouchJoystickConfig | false,
	source?: VirtualTouchJoystickConfig | false,
): VirtualTouchJoystickConfig | false | undefined {
	if (source === undefined) return cloneTouchJoystickConfig(target);
	if (source === false) return false;
	if (!target) {
		return cloneTouchJoystickConfig(source);
	}

	return {
		...target,
		...source,
		style: mergePlainObject(target.style, source.style),
		position: mergePlainObject(target.position, source.position),
		svg: mergePlainObject(target.svg, source.svg),
	};
}

function mergeTouchButtons(
	target?: VirtualTouchButtonsConfig | false,
	source?: VirtualTouchButtonsConfig | false,
): VirtualTouchButtonsConfig | false | undefined {
	if (source === undefined) return cloneTouchButtons(target);
	if (source === false) return false;

	const base = target ? target : undefined;
	const result: VirtualTouchButtonsConfig = base ? cloneTouchButtonsRecord(base) : {};

	for (const [slot, config] of Object.entries(source)) {
		const key = slot as keyof VirtualTouchButtonsConfig;
		const current = result[key];
		if (config === false) {
			result[key] = false;
			continue;
		}

		if (!current) {
			result[key] = cloneTouchButtonConfig(config);
			continue;
		}

		result[key] = {
			...current,
			...config,
			style: mergePlainObject(current.style, config.style),
			position: mergePlainObject(current.position, config.position),
		};
	}

	return result;
}

function cloneTouchConfig(config?: VirtualTouchConfig): VirtualTouchConfig | undefined {
	if (!config) return undefined;

	return {
		...config,
		style: mergePlainObject(undefined, config.style),
		joysticks: cloneTouchJoysticks(config.joysticks),
		buttons: cloneTouchButtons(config.buttons),
	};
}

function cloneTouchJoysticks(
	config?: VirtualTouchJoysticksConfig | false,
): VirtualTouchJoysticksConfig | false | undefined {
	if (config === undefined) return undefined;
	if (config === false) return false;

	return cloneTouchJoysticksRecord(config);
}

function cloneTouchJoystickConfig(
	config?: VirtualTouchJoystickConfig | false,
): VirtualTouchJoystickConfig | false | undefined {
	if (config === undefined) return undefined;
	if (config === false) return false;

	return {
		...config,
		style: mergePlainObject(undefined, config.style),
		position: mergePlainObject(undefined, config.position),
		svg: mergePlainObject(undefined, config.svg),
	};
}

function cloneTouchButtons(
	config?: VirtualTouchButtonsConfig | false,
): VirtualTouchButtonsConfig | false | undefined {
	if (config === undefined) return undefined;
	if (config === false) return false;

	return cloneTouchButtonsRecord(config);
}

function cloneTouchButtonConfig(config: VirtualTouchButtonConfig): VirtualTouchButtonConfig {
	return {
		...config,
		style: mergePlainObject(undefined, config.style),
		position: mergePlainObject(undefined, config.position),
	};
}

function cloneTouchJoysticksRecord(config: VirtualTouchJoysticksConfig): VirtualTouchJoysticksConfig {
	return {
		left: cloneTouchJoystickConfig(config.left),
		right: cloneTouchJoystickConfig(config.right),
	};
}

function cloneTouchButtonsRecord(config: VirtualTouchButtonsConfig): VirtualTouchButtonsConfig {
	const result: VirtualTouchButtonsConfig = {};
	for (const [slot, value] of Object.entries(config)) {
		result[slot as keyof VirtualTouchButtonsConfig] = value === false
			? false
			: cloneTouchButtonConfig(value);
	}
	return result;
}

function mergePlainObject<T extends object>(
	target?: T,
	source?: Partial<T>,
): T | undefined {
	if (!target && !source) return undefined;
	return {
		...(target ?? {}),
		...(source ?? {}),
	} as T;
}
