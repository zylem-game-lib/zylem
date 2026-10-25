/**
 * `@zylem/game-lib/behavior/genre-map`
 *
 * Named re-exports of `@zylem/behaviors/genre-map`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	BEHAVIOR_GENRES,
	BEHAVIOR_MECHANICS,
	GENRE_MAP_ENTRY,
	MECHANICS_ENTRY,
	behaviorGenreById,
	publishedBehaviorEntries,
} from '@zylem/behaviors/genre-map';

export type {
	BehaviorGenre,
	BehaviorMechanic,
	GenrePublication,
} from '@zylem/behaviors/genre-map';
