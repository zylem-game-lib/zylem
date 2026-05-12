import type { DemoAssetKey } from '../../../assets/manifest';
import type { ParticleBurstSpec } from './attack-effects';

/**
 * Subset of `Platformer3DBehaviorOptions` tuned per character. Typed as a
 * readonly record so individual character files can author the literal
 * inline without losing inference on specific fields.
 */
export interface CharacterPlatformerOpts {
	walkSpeed: number;
	jumpForce: number;
	maxJumps: number;
	gravity: number;
	groundRayLength: number;
}

/**
 * One entry in a combo chain or special slot. `key` is the animation key
 * registered on the character actor (e.g. `attack-light`), and `duration`
 * is the wall-clock seconds the combat controller holds before releasing
 * the actor back to the platformer FSM. The optional `particles` spec
 * spawns a themed burst at the actor's position when the action fires.
 *
 * Combat extensions:
 * - `damage`: damage dealt to any enemy overlapping the attack's hit sphere
 *   at the emission point (see combat-controller). Omit for specials that
 *   don't deal damage on the initiating character.
 * - `cooldown`: seconds the slot is locked out after firing. Currently
 *   only honoured on `specials` entries; attacks are already gated by the
 *   combo/cancel-window logic in the combat controller.
 * - `icon`: manifest asset key for the HUD cooldown icon. Optional so
 *   entries without an icon fall back to the slot's solid fill colour.
 */
export interface CharacterActionEntry {
	key: string;
	duration: number;
	particles?: ParticleBurstSpec;
	damage?: number;
	/**
	 * HP restored to the caster and any allies within the heal AoE
	 * (defined by `HEAL_AOE_RADIUS` in `main-stage.ts`) when this
	 * action's active frames hit. Mutually independent from `damage`:
	 * an entry may carry both (e.g. a "drain" spell), but the healer's
	 * `Restore` is heal-only. Omit for actions that don't affect HP
	 * on allies.
	 */
	heal?: number;
	cooldown?: number;
	icon?: DemoAssetKey;
	/**
	 * Short human-readable name for HUDs and the character-select panel.
	 * Falls back to a prettified `key` when omitted.
	 */
	name?: string;
	/**
	 * Long-form blurb shown in the lobby's specials list. Kept brief
	 * (one or two short sentences) so it fits the right-side panel
	 * without scrolling on common viewports.
	 */
	description?: string;
}

/** The four action buttons available on the X/Y/L/R slots of the d-pad. */
export type SpecialSlotId = 'X' | 'Y' | 'L' | 'R';

/**
 * A universal "basic" action — attack or jump — that every character
 * exposes. Unlike {@link CharacterActionEntry}, the cooldown and icon are
 * required so the HUD can always render a stable button-hint row; the
 * actual gating/firing happens in the combat controller.
 */
export interface CharacterBasicAction {
	cooldown: number;
	icon: DemoAssetKey;
}

/**
 * Per-character action surface consumed by the arena combat controller.
 * `attacks` is a tier-ordered array (`[light, medium, heavy]`) of length
 * 2 or 3 — the `A` button combo advances through this list. Missing
 * special slots are simply unbound (no-op press).
 *
 * `basics` declares the always-on attack and jump HUD entries; both ship
 * with a per-class cooldown duration so the icon sweep animates on each
 * press, and an icon asset key picked out of the arena manifest.
 */
export interface CharacterMoveset {
	attacks: readonly CharacterActionEntry[];
	specials: Partial<Record<SpecialSlotId, CharacterActionEntry>>;
	basics: {
		attack: CharacterBasicAction;
		jump: CharacterBasicAction;
	};
}

/**
 * Per-class combat stats. Lives alongside the moveset so every character
 * file has a single source of truth for its durability characteristics.
 */
export interface CharacterStats {
	/** Starting + maximum hp the player spawns with. */
	maxHp: number;
}

/**
 * Authored bundle pulled per-class by {@link getCharacterLoadout}. Keeping
 * the platformer opts, stats, and moveset together lets `main-stage.ts`
 * wire everything the local actor needs from a single lookup.
 */
export interface CharacterLoadout {
	platformerOpts: CharacterPlatformerOpts;
	stats: CharacterStats;
	moveset: CharacterMoveset;
}
