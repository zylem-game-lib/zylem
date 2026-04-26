import type { InputPlayer } from '../input/input';
import { useVirtualControls } from '../input/input-presets';
import type {
	GameInputConfig,
	VirtualTouchButtonConfig,
	VirtualTouchButtonSlot,
	VirtualTouchButtonsConfig,
	VirtualTouchConfig,
	VirtualTouchJoystickConfig,
	VirtualTouchJoysticksConfig,
} from '../game/game-interfaces';
import { joystickBaseSvg, joystickThumbSvg, touchButtonSvg } from './svg-assets';
import {
	resolveButtonAccent,
	resolveTouchTheme,
	type TouchTheme,
	type TouchThemeName,
} from './touch-themes';

const ALL_BUTTON_SLOTS: VirtualTouchButtonSlot[] = [
	'A',
	'B',
	'X',
	'Y',
	'Start',
	'Select',
	'L',
	'R',
	'LTrigger',
	'RTrigger',
	'Up',
	'Down',
	'Left',
	'Right',
];

export type JoystickSelection = 'left' | 'right' | 'both' | 'none';

export interface DefaultTouchControlsOptions {
	/**
	 * Controls whether the touch UI mounts. `'auto'` (default) lets the
	 * provider show controls only on touch/mobile devices. `true` forces it
	 * on (useful for testing on desktop), `false` disables the UI entirely.
	 */
	enabled?: boolean | 'auto';
	/** Theme name (`'default'` / `'lagoon'`) or a custom {@link TouchTheme}. */
	theme?: TouchTheme | TouchThemeName;
	/**
	 * Buttons to render. Default `['A', 'B']`. Buttons not listed here are
	 * disabled. Pass `[]` to render no buttons.
	 */
	buttons?: VirtualTouchButtonSlot[];
	/** Per-button accent color overrides (override theme `buttonAccents`). */
	buttonAccents?: Partial<Record<VirtualTouchButtonSlot, string>>;
	/** Custom labels for buttons (default uses the slot name, e.g. `'A'`). */
	buttonLabels?: Partial<Record<VirtualTouchButtonSlot, string>>;
	/**
	 * Which joysticks to render. Default `'left'`.
	 *  - `'left'`  : analog left only
	 *  - `'right'` : analog right only
	 *  - `'both'`  : both sticks
	 *  - `'none'`  : disable all joysticks
	 */
	joysticks?: JoystickSelection;
	/**
	 * Escape hatch — a raw {@link VirtualTouchConfig} merged on top of the
	 * generated config. Use this when you need fine-grained tweaks
	 * (custom positions, sizes, raw SVG) without reaching for the lower-level
	 * `useVirtualControls(...)` preset.
	 */
	override?: VirtualTouchConfig;
}

/**
 * Builds a ready-to-use {@link GameInputConfig} that wires up themed
 * virtual touch controls for a player. Internally composes
 * {@link useVirtualControls} with theme-aware SVGs from `svg-assets.ts`.
 *
 * On desktop runtimes the provider stays dormant (with the default
 * `enabled: 'auto'`), so it's safe to add this to any game's input
 * configuration unconditionally.
 *
 * @example
 * stage.setInputConfiguration(
 *   defaultTouchControls('p1', {
 *     theme: 'lagoon',
 *     joysticks: 'left',
 *     buttons: ['A', 'B'],
 *   }),
 * );
 */
export function defaultTouchControls(
	player: InputPlayer = 'p1',
	options: DefaultTouchControlsOptions = {},
): GameInputConfig {
	const theme = resolveTouchTheme(options.theme);
	const generated = buildVirtualTouchConfig(theme, options);
	const merged = options.override ? mergeOverride(generated, options.override) : generated;
	return useVirtualControls(player, merged);
}

function buildVirtualTouchConfig(
	theme: TouchTheme,
	options: DefaultTouchControlsOptions,
): VirtualTouchConfig {
	return {
		enabled: options.enabled ?? 'auto',
		joysticks: buildJoysticks(theme, options.joysticks ?? 'left'),
		buttons: buildButtons(theme, options),
	};
}

function buildJoysticks(
	theme: TouchTheme,
	selection: JoystickSelection,
): VirtualTouchJoysticksConfig | false {
	if (selection === 'none') return false;

	const stick: VirtualTouchJoystickConfig = {
		svg: {
			base: joystickBaseSvg(theme),
			thumb: joystickThumbSvg(theme),
		},
	};

	const config: VirtualTouchJoysticksConfig = {};
	if (selection === 'left' || selection === 'both') {
		config.left = { ...stick };
	} else {
		config.left = false;
	}
	if (selection === 'right' || selection === 'both') {
		config.right = { ...stick };
	} else {
		config.right = false;
	}
	return config;
}

function buildButtons(
	theme: TouchTheme,
	options: DefaultTouchControlsOptions,
): VirtualTouchButtonsConfig {
	const requested = options.buttons ?? ['A', 'B'];
	const enabled = new Set(requested);
	const accents = options.buttonAccents;
	const labels = options.buttonLabels;
	const config: VirtualTouchButtonsConfig = {};

	for (const slot of ALL_BUTTON_SLOTS) {
		if (!enabled.has(slot)) {
			config[slot] = false;
			continue;
		}

		const label = labels?.[slot] ?? slot;
		const accent = resolveButtonAccent(theme, slot, accents?.[slot]);
		const button: VirtualTouchButtonConfig = {
			label,
			svg: touchButtonSvg(label, { accent, theme }),
		};
		config[slot] = button;
	}

	return config;
}

function mergeOverride(
	base: VirtualTouchConfig,
	override: VirtualTouchConfig,
): VirtualTouchConfig {
	const result: VirtualTouchConfig = { ...base, ...override };

	if (base.style || override.style) {
		result.style = { ...base.style, ...override.style };
	}

	const joysticks = mergeJoysticks(base.joysticks, override.joysticks);
	if (joysticks !== undefined) result.joysticks = joysticks;
	else delete result.joysticks;

	const buttons = mergeButtons(base.buttons, override.buttons);
	if (buttons !== undefined) result.buttons = buttons;
	else delete result.buttons;

	return result;
}

function mergeJoysticks(
	base: VirtualTouchJoysticksConfig | false | undefined,
	override: VirtualTouchJoysticksConfig | false | undefined,
): VirtualTouchJoysticksConfig | false | undefined {
	if (override === undefined) return base;
	if (override === false) return false;
	if (!base) return override;

	const result: VirtualTouchJoysticksConfig = {};
	const left = mergeJoystickConfig(base.left, override.left);
	if (left !== undefined) result.left = left;
	const right = mergeJoystickConfig(base.right, override.right);
	if (right !== undefined) result.right = right;
	return result;
}

function mergeJoystickConfig(
	base: VirtualTouchJoystickConfig | false | undefined,
	override: VirtualTouchJoystickConfig | false | undefined,
): VirtualTouchJoystickConfig | false | undefined {
	if (override === undefined) return base;
	if (override === false) return false;
	if (!base) return override;
	const merged: VirtualTouchJoystickConfig = { ...base, ...override };
	if (base.style || override.style) {
		merged.style = { ...base.style, ...override.style };
	}
	if (base.position || override.position) {
		merged.position = { ...base.position, ...override.position };
	}
	if (base.svg || override.svg) {
		merged.svg = { ...base.svg, ...override.svg };
	}
	return merged;
}

function mergeButtons(
	base: VirtualTouchButtonsConfig | false | undefined,
	override: VirtualTouchButtonsConfig | false | undefined,
): VirtualTouchButtonsConfig | false | undefined {
	if (override === undefined) return base;
	if (override === false) return false;
	if (!base) return override;

	const result: VirtualTouchButtonsConfig = { ...base };
	for (const [key, value] of Object.entries(override) as [
		VirtualTouchButtonSlot,
		VirtualTouchButtonConfig | false | undefined,
	][]) {
		if (value === undefined) continue;
		const current = result[key];
		if (value === false || !current) {
			result[key] = value;
			continue;
		}
		const merged: VirtualTouchButtonConfig = { ...current, ...value };
		if (current.style || value.style) {
			merged.style = { ...current.style, ...value.style };
		}
		if (current.position || value.position) {
			merged.position = { ...current.position, ...value.position };
		}
		result[key] = merged;
	}
	return result;
}
