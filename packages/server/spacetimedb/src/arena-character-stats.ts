/**
 * Authoritative max HP per arena character class for SpacetimeDB.
 *
 * (`TANK_STATS.maxHp`, `HEALER_STATS.maxHp`, `ASSASSIN_STATS.maxHp` in `characters/*.ts`).
 */
export const ARENA_CHARACTER_CLASS_IDS = ['tank', 'assassin', 'healer'] as const;

export type ArenaCharacterClassId = (typeof ARENA_CHARACTER_CLASS_IDS)[number];

const ARENA_MAX_HP_BY_CLASS: Record<ArenaCharacterClassId, number> = {
  tank: 140,
  assassin: 80,
  healer: 100,
};

const ALLOWED = new Set<string>(ARENA_CHARACTER_CLASS_IDS);

/**
 * Normalise a client-supplied class string to a known id, or `tank`.
 */
export function normalizeArenaCharacterClass(raw: string): ArenaCharacterClassId {
  const key = raw.trim().toLowerCase();
  if (ALLOWED.has(key)) {
    return key as ArenaCharacterClassId;
  }
  return 'tank';
}

/** Max HP for a class after normalisation (tank fallback). */
export function maxHpForArenaCharacterClass(raw: string): number {
  return ARENA_MAX_HP_BY_CLASS[normalizeArenaCharacterClass(raw)];
}
