import { InputPlayer } from './input';
import { GameInputConfig, GameInputPlayerConfig, KeyboardMapping, MouseConfig } from '../game/game-interfaces';

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
			result[player] = {
				key: { ...target.key, ...source.key },
				mouse: mergedMouse,
				includeDefaults: source.includeDefaults ?? target.includeDefaults,
			};
		}
	}

	return result;
}
