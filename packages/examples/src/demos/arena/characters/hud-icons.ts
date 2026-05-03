/**
 * Arena HUD icon builder.
 *
 * Renders the top-right action stack (basic attack, jump, and any special
 * slots that carry a cooldown) from a {@link CharacterLoadout}. Character
 * files own *which* icon and *what* cooldown maps to each slot via their
 * authored `basics` + `specials` data; this module is the shared
 * presentation layer that turns that data into:
 *
 *  - a {@link CooldownOptions} payload for `actor.use(CooldownBehavior, ...)`
 *  - a positioned array of {@link createCooldownIcon} entities
 *
 * Spacing is expressed in view units (viewport height = 192, matching the
 * `IconSizePreset` table in `cooldown-icon.ts`). The HUD groups attack +
 * jump together tightly, then leaves a wider gap before the specials
 * stack so the two categories read as distinct.
 */

import {
	type CooldownOptions,
	createCooldownIcon,
	type ScreenAnchor,
} from '@zylem/game-lib';

import type { CharacterLoadout, SpecialSlotId } from './movesets';
import { demoAsset } from '../../../assets/manifest';

/** Global cooldown name used for the universal A-button attack slot. */
export const ATTACK_COOLDOWN_NAME = 'arena-attack';

/** Global cooldown name used for the universal jump slot. */
export const JUMP_COOLDOWN_NAME = 'arena-jump';

/**
 * The string-key name used to register a special slot's cooldown on the
 * global CooldownStore. Mirrors `cooldownNameForSlot` in the combat
 * controller; re-exported here so the HUD and cooldown-options builders
 * agree on the same mapping without an import cycle.
 */
export function cooldownNameForSlot(slot: SpecialSlotId): string {
	return `arena-special-${slot}`;
}

const HUD_ANCHOR: ScreenAnchor = 'top-right';
const HUD_Y = 10;
const HUD_ICON_SIZE = 16; // view units; matches `'sm'` preset
const HUD_EDGE_PADDING = 10; // gap from the right edge to the first icon
const HUD_GAP_IN_GROUP = 8; // spacing between icons inside the same group
const HUD_GAP_BETWEEN_GROUPS = 24; // wider gap between the basics + specials clusters

/** Special slot iteration order, matches the controller's button polling. */
const SPECIAL_SLOT_ORDER: readonly SpecialSlotId[] = ['X', 'Y', 'L', 'R'];

/**
 * Fallback fill colour per special slot. Only shown if the icon texture
 * fails to resolve; the authored icon takes precedence when loaded.
 */
const SLOT_FALLBACK_COLOR: Record<SpecialSlotId, string> = {
	X: '#cc3333',
	Y: '#ccaa33',
	L: '#3366cc',
	R: '#aa33cc',
};

/**
 * Build the `cooldowns` config payload for `CooldownBehavior`. Registers
 * the universal attack/jump cooldowns, plus one entry per special slot
 * that carries a cooldown on its moveset entry.
 *
 * Returns `null` when nothing needs registering (guard for future
 * loadouts that omit `basics` and have no cooldowned specials).
 */
export function buildActionCooldownOptions(
	loadout: CharacterLoadout,
): CooldownOptions | null {
	const cooldowns: CooldownOptions['cooldowns'] = {};

	const { basics, specials } = loadout.moveset;
	cooldowns[ATTACK_COOLDOWN_NAME] = { duration: basics.attack.cooldown };
	cooldowns[JUMP_COOLDOWN_NAME] = { duration: basics.jump.cooldown };

	for (const slot of SPECIAL_SLOT_ORDER) {
		const entry = specials[slot];
		if (entry?.cooldown === undefined) continue;
		cooldowns[cooldownNameForSlot(slot)] = { duration: entry.cooldown };
	}

	return Object.keys(cooldowns).length === 0 ? null : { cooldowns };
}

/**
 * Create the top-right stack of cooldown HUD icons driven by the loadout.
 *
 * Layout (right → left):
 *   `[ attack, jump ]  ← 24u gap →  [ X?, Y?, L?, R? ]`
 *
 * Icons without a bound slot (e.g. an unbound `L`) are skipped; if the
 * specials group is empty, no extra gap is inserted.
 */
export function buildActionIcons(
	loadout: CharacterLoadout,
): Array<ReturnType<typeof createCooldownIcon>> {
	const icons: Array<ReturnType<typeof createCooldownIcon>> = [];
	const { basics, specials } = loadout.moveset;

	// Cursor tracks the x-offset (in view units) of the *next* icon's
	// centre relative to the top-right anchor. We march leftward with
	// negative offsets; each step advances by (icon width + gap).
	let cursor = -HUD_EDGE_PADDING - HUD_ICON_SIZE / 2;

	const placeIcon = (
		cooldown: string,
		icon: string,
		fillColor: string,
	): void => {
		icons.push(
			createCooldownIcon({
				cooldown,
				icon,
				fillColor,
				screenAnchor: HUD_ANCHOR,
				screenPosition: { x: cursor, y: HUD_Y },
				iconSize: 'sm',
				showTimer: true,
			}),
		);
	};

	// Group 1: basics (attack, jump). Always present — authored as
	// required fields on the moveset.
	placeIcon(ATTACK_COOLDOWN_NAME, demoAsset(basics.attack.icon), '#cc3333');
	cursor -= HUD_ICON_SIZE + HUD_GAP_IN_GROUP;
	placeIcon(JUMP_COOLDOWN_NAME, demoAsset(basics.jump.icon), '#33aa55');

	// Group 2: specials. Only advance the cursor by the larger gap when
	// at least one slot is actually going to render, so a character with
	// no specials doesn't leave an awkward trailing air-gap.
	const activeSpecials = SPECIAL_SLOT_ORDER.filter(
		(slot) => specials[slot]?.cooldown !== undefined && specials[slot]?.icon,
	);

	if (activeSpecials.length > 0) {
		cursor -= HUD_ICON_SIZE + HUD_GAP_BETWEEN_GROUPS;
		for (let i = 0; i < activeSpecials.length; i += 1) {
			const slot = activeSpecials[i]!;
			const entry = specials[slot]!;
			placeIcon(
				cooldownNameForSlot(slot),
				demoAsset(entry.icon!),
				SLOT_FALLBACK_COLOR[slot],
			);
			if (i < activeSpecials.length - 1) {
				cursor -= HUD_ICON_SIZE + HUD_GAP_IN_GROUP;
			}
		}
	}

	return icons;
}
