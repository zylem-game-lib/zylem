import type { IguanoBehavior } from '../shared';
import { RUNNER_BEHAVIOR } from './runner';
import { PLANTER_BEHAVIOR } from './planter';
import { FIGHTER_BEHAVIOR } from './fighter';
import { SHOOTER_BEHAVIOR } from './shooter';
import { PATROL_BEHAVIOR } from './patrol';
import { WANDERER_BEHAVIOR } from './wanderer';
import { POUNCER_BEHAVIOR } from './pouncer';
import { GUARDIAN_BEHAVIOR } from './guardian';

/**
 * Spacetime `enemy.kind` discriminator. Stays a plain string at the wire
 * boundary; this union is the local exhaustive type for behaviour dispatch.
 *
 * The list is also the canonical wave order: orchestrators iterate it to
 * spawn one of every archetype each wave, so the order here is what shows
 * up around the bowl.
 */
export type IguanoKind =
	| 'runner'
	| 'planter'
	| 'fighter'
	| 'shooter'
	| 'patrol'
	| 'wanderer'
	| 'pouncer'
	| 'guardian';

/** Stable iteration order. Used by wave kickoff and guest-spawn modulo. */
export const ALL_IGUANO_KINDS: readonly IguanoKind[] = [
	'runner',
	'planter',
	'fighter',
	'shooter',
	'patrol',
	'wanderer',
	'pouncer',
	'guardian',
] as const;

/**
 * Coerce an arbitrary STDB-supplied kind string to a known {@link IguanoKind}.
 * Legacy snapshots from older modules (`iguano`) and unknown values fall back
 * to `fighter` so subscriptions never reject a row outright.
 */
export function parseIguanoKind(raw: string): IguanoKind {
	if ((ALL_IGUANO_KINDS as readonly string[]).includes(raw)) {
		return raw as IguanoKind;
	}
	if (raw === 'iguano') return 'fighter';
	return 'fighter';
}

/** Behaviour table consumed by the orchestrator's per-tick dispatch. */
export const IGUANO_BEHAVIORS: Record<IguanoKind, IguanoBehavior> = {
	runner: RUNNER_BEHAVIOR,
	planter: PLANTER_BEHAVIOR,
	fighter: FIGHTER_BEHAVIOR,
	shooter: SHOOTER_BEHAVIOR,
	patrol: PATROL_BEHAVIOR,
	wanderer: WANDERER_BEHAVIOR,
	pouncer: POUNCER_BEHAVIOR,
	guardian: GUARDIAN_BEHAVIOR,
};

/** Per-kind hp ceiling. Mirrors `IGUANO_BEHAVIORS[k].maxHp` for fast lookup. */
export const KIND_MAX_HP: Record<IguanoKind, number> = {
	runner: RUNNER_BEHAVIOR.maxHp,
	planter: PLANTER_BEHAVIOR.maxHp,
	fighter: FIGHTER_BEHAVIOR.maxHp,
	shooter: SHOOTER_BEHAVIOR.maxHp,
	patrol: PATROL_BEHAVIOR.maxHp,
	wanderer: WANDERER_BEHAVIOR.maxHp,
	pouncer: POUNCER_BEHAVIOR.maxHp,
	guardian: GUARDIAN_BEHAVIOR.maxHp,
};

export { RUNNER_BEHAVIOR } from './runner';
export { PLANTER_BEHAVIOR } from './planter';
export { FIGHTER_BEHAVIOR } from './fighter';
export { SHOOTER_BEHAVIOR } from './shooter';
export { PATROL_BEHAVIOR } from './patrol';
export { WANDERER_BEHAVIOR } from './wanderer';
export { POUNCER_BEHAVIOR } from './pouncer';
export { GUARDIAN_BEHAVIOR } from './guardian';
