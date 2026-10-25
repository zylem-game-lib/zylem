/**
 * `@zylem/game-lib/behavior/sports/racket`
 *
 * Named re-exports of `@zylem/behaviors/sports/racket`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	LobAndDropPlacementBehavior,
	RacketContactTimingBehavior,
	RacketSpinShotBehavior,
	RallyPointAdjudicationBehavior,
	SPORTS_ABILITIES,
	ServeAndFaultSequenceBehavior,
	sportsData,
	sportsOperation,
} from '@zylem/behaviors/sports/racket';

export type {
	SportsAbility,
	SportsAction,
	SportsEntity,
	SportsOptions,
	SportsPoint,
	SportsState,
} from '@zylem/behaviors/sports/racket';
