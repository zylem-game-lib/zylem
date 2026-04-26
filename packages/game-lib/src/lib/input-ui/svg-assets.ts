import { resolveTouchTheme, type TouchTheme, type TouchThemeName } from './touch-themes';

export type TouchThemeInput = TouchTheme | TouchThemeName;

export interface TouchButtonSvgOptions {
	/** Stroke + text accent color. Overrides any theme-resolved accent. */
	accent?: string;
	/** Theme name or full theme object (defaults to `'default'`). */
	theme?: TouchThemeInput;
}

/**
 * Stylized joystick base SVG: outer ring, subtle inner ring, and four
 * directional tabs. Designed to scale to any size; consumes only theme
 * color tokens so a single `theme` argument re-skins the whole control.
 */
export function joystickBaseSvg(theme?: TouchThemeInput): string {
	const t = resolveTouchTheme(theme);
	return `
		<svg viewBox="0 0 140 140" width="100%" height="100%" aria-hidden="true">
			<circle cx="70" cy="70" r="62" fill="${t.baseFill}" stroke="${t.joystickStroke}" stroke-width="4" />
			<circle cx="70" cy="70" r="42" fill="${t.joystickAccentFill}" stroke="${t.joystickInnerStroke}" stroke-width="2" />
			<path d="M70 24 L78 40 L62 40 Z" fill="${t.joystickTabFill}" />
			<path d="M116 70 L100 78 L100 62 Z" fill="${t.joystickTabFill}" />
			<path d="M70 116 L62 100 L78 100 Z" fill="${t.joystickTabFill}" />
			<path d="M24 70 L40 62 L40 78 Z" fill="${t.joystickTabFill}" />
		</svg>
	`;
}

/**
 * Stylized joystick thumb SVG: filled disc with a subtle inner highlight ring.
 */
export function joystickThumbSvg(theme?: TouchThemeInput): string {
	const t = resolveTouchTheme(theme);
	return `
		<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
			<circle cx="32" cy="32" r="28" fill="${t.thumbFill}" stroke="${t.thumbStroke}" stroke-width="3.5" />
			<circle cx="32" cy="32" r="15" fill="${t.thumbInnerFill}" stroke="${t.thumbStroke}" stroke-width="1.5" />
		</svg>
	`;
}

/**
 * Stylized button SVG with a centered label. The accent color drives the
 * outer stroke, the inner translucent fill, and the label text color, so
 * each button can have its own visual identity within a shared theme.
 *
 * @param label   Display text (length affects font size, like the engine default).
 * @param options `accent` overrides the theme accent; `theme` selects the palette.
 */
export function touchButtonSvg(label: string, options: TouchButtonSvgOptions = {}): string {
	const theme = resolveTouchTheme(options.theme);
	const accent = options.accent ?? theme.defaultButtonAccent;
	const safeLabel = escapeSvgText(label);
	const fontSize = safeLabel.length > 2 ? 24 : 34;
	return `
		<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
			<circle cx="50" cy="50" r="45" fill="${theme.baseFill}" stroke="${accent}" stroke-width="4.5" />
			<circle cx="50" cy="50" r="33" fill="${accent}" opacity="0.18" />
			<text
				x="50"
				y="60"
				text-anchor="middle"
				font-family="ui-sans-serif, system-ui, sans-serif"
				font-size="${fontSize}"
				font-weight="700"
				fill="${accent}"
			>${safeLabel}</text>
		</svg>
	`;
}

function escapeSvgText(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
