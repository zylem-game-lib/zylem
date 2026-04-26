import type { VirtualTouchButtonSlot } from '../game/game-interfaces';

/**
 * Color tokens consumed by the SVG factories in `svg-assets.ts` and the
 * `defaultTouchControls(...)` preset. All fields are CSS color strings; the
 * factories compose them into static SVG markup.
 */
export interface TouchTheme {
	/** Inner fill of joystick base & button bodies (usually translucent dark). */
	baseFill: string;
	/** Outer ring stroke on joystick base. */
	joystickStroke: string;
	/** Inner ring stroke on joystick base (subtle highlight). */
	joystickInnerStroke: string;
	/** Inner ring fill on joystick base (translucent accent). */
	joystickAccentFill: string;
	/** Direction tab fill on the joystick base (the four arrows). */
	joystickTabFill: string;
	/** Filled joystick thumb color. */
	thumbFill: string;
	/** Joystick thumb border. */
	thumbStroke: string;
	/** Inner highlight ring on the thumb. */
	thumbInnerFill: string;
	/** Stroke/text accent for buttons when no per-slot accent is provided. */
	defaultButtonAccent: string;
	/** Optional per-button accent overrides. */
	buttonAccents?: Partial<Record<VirtualTouchButtonSlot, string>>;
}

const defaultTheme: TouchTheme = {
	baseFill: 'rgba(12,18,24,0.72)',
	joystickStroke: 'rgba(245,247,255,0.72)',
	joystickInnerStroke: 'rgba(255,255,255,0.18)',
	joystickAccentFill: 'rgba(255,255,255,0.04)',
	joystickTabFill: 'rgba(245,247,255,0.45)',
	thumbFill: 'rgba(22,30,38,0.92)',
	thumbStroke: 'rgba(245,247,255,0.85)',
	thumbInnerFill: 'rgba(255,255,255,0.08)',
	defaultButtonAccent: 'rgba(245,247,255,0.92)',
};

const lagoonTheme: TouchTheme = {
	baseFill: 'rgba(8,14,24,0.70)',
	joystickStroke: 'rgba(207,250,254,0.85)',
	joystickInnerStroke: 'rgba(45,212,191,0.35)',
	joystickAccentFill: 'rgba(20,184,166,0.08)',
	joystickTabFill: 'rgba(207,250,254,0.55)',
	thumbFill: 'rgba(13,148,136,0.88)',
	thumbStroke: 'rgba(240,253,250,0.95)',
	thumbInnerFill: 'rgba(240,253,250,0.16)',
	defaultButtonAccent: '#67e8f9',
	buttonAccents: {
		A: '#8b5cf6',
		B: '#fb7185',
		X: '#22d3ee',
		Y: '#facc15',
	},
};

/**
 * Built-in named themes. Pass a key (e.g. `'lagoon'`) anywhere a `TouchTheme`
 * is accepted. Use {@link resolveTouchTheme} to turn a key or partial input
 * into a fully-populated theme.
 */
export const touchThemes = {
	default: defaultTheme,
	lagoon: lagoonTheme,
} as const;

export type TouchThemeName = keyof typeof touchThemes;

/**
 * Normalize a theme input to a fully populated {@link TouchTheme}.
 *
 * @param input  Either a built-in theme name (e.g. `'lagoon'`) or a
 *               full `TouchTheme` object. When omitted, returns the
 *               `'default'` theme.
 */
export function resolveTouchTheme(input?: TouchTheme | TouchThemeName): TouchTheme {
	if (!input) return defaultTheme;
	if (typeof input === 'string') return touchThemes[input] ?? defaultTheme;
	return input;
}

/**
 * Returns the theme accent for a given button slot. Per-slot overrides win
 * over `theme.defaultButtonAccent`; a caller-provided `accentOverride`
 * trumps everything.
 */
export function resolveButtonAccent(
	theme: TouchTheme,
	slot: VirtualTouchButtonSlot,
	accentOverride?: string,
): string {
	if (accentOverride) return accentOverride;
	return theme.buttonAccents?.[slot] ?? theme.defaultButtonAccent;
}
