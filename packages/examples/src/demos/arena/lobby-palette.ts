/**
 * Player tint palette offered in the arena lobby. Every entry's
 * `value` is the same packed `0xRRGGBB` integer that lives on
 * `arenaLobbyStore.colorU32` and ultimately gets forwarded to the
 * STDB `register_player.color_u32` reducer, so swapping a swatch
 * here is a 1:1 representation of what the network sees.
 *
 * Keep this list small (≤ 9) so the swatch row stays single-line on
 * narrow viewports and so the optional `1`-`9` keyboard shortcut
 * never needs a modifier.
 */
export interface LobbySwatch {
	id: string;
	label: string;
	value: number;
}

export const LOBBY_COLOR_SWATCHES: readonly LobbySwatch[] = [
	{ id: 'white', label: 'White', value: 0xffffff },
	{ id: 'crimson', label: 'Crimson', value: 0xe24a4a },
	{ id: 'tangerine', label: 'Tangerine', value: 0xf08a3c },
	{ id: 'gold', label: 'Gold', value: 0xf3c13a },
	{ id: 'leaf', label: 'Leaf', value: 0x4caf50 },
	{ id: 'teal', label: 'Teal', value: 0x35b6a8 },
	{ id: 'azure', label: 'Azure', value: 0x4a8cf0 },
	{ id: 'violet', label: 'Violet', value: 0x8b5cf6 },
	{ id: 'blossom', label: 'Blossom', value: 0xf06c9b },
] as const;

export const DEFAULT_LOBBY_COLOR: number = LOBBY_COLOR_SWATCHES[0]?.value || 0xffffff;

/**
 * Find the swatch whose `value` matches `colorU32`, or `null` if the
 * lobby store currently holds a value that isn't one of the presets
 * (e.g. a stale value from before the palette existed).
 */
export function findLobbySwatch(colorU32: number): LobbySwatch | null {
	return LOBBY_COLOR_SWATCHES.find((s) => s.value === colorU32) ?? null;
}

/**
 * Format a swatch's `value` as a CSS hex literal. Pads to 6 digits so
 * dark colors like `#0000ff` don't collapse to `#ff` and break the
 * background style.
 */
export function swatchCss(value: number): string {
	return `#${value.toString(16).padStart(6, '0')}`;
}
