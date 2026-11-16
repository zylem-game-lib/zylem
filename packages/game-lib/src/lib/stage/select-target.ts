/**
 * What a Select click picks.
 *
 * The pointer can be over three kinds of thing at once: a HUD element on the
 * lens, an entity in the world, and the level. Select picks one of them by
 * the same rule in every editor mode, so what a click does never depends on
 * which toolbar happens to be up.
 */

/** What a Select click at the pointer would pick. */
export type SelectTarget =
	| { kind: 'hud'; uuid: string }
	| { kind: 'entity'; uuid: string; distance: number }
	| { kind: 'level'; distance: number };

export interface SelectCandidates {
	/** The HUD element on top under the pointer. */
	hud: string | null;
	/** The first entity along the pointer ray. */
	entity: { uuid: string; distance: number } | null;
	/** How far along the pointer ray the level is, or `null` where the ray misses it. */
	level: number | null;
}

/**
 * Choose among what is under the pointer.
 *
 * The HUD is drawn over the world, so an element of it wins outright. Behind
 * it, the nearer of the level and an entity wins: an entity standing on the
 * level is nearer than the face under it, so it is the one picked. At exactly
 * the same distance the level wins.
 */
export function chooseSelectTarget({ hud, entity, level }: SelectCandidates): SelectTarget | null {
	if (hud) return { kind: 'hud', uuid: hud };
	if (level !== null && (!entity || level <= entity.distance)) {
		return { kind: 'level', distance: level };
	}
	return entity ? { kind: 'entity', ...entity } : null;
}
