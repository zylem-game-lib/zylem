/**
 * `@zylem/game-lib/behavior/sports/golf`
 *
 * Named re-exports of `@zylem/behaviors/sports/golf`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	ClubShotProfileBehavior,
	LandingSpinTransferBehavior,
	SPORTS_ABILITIES,
	SlopeAwarePuttingBehavior,
	SwingPowerAccuracyBehavior,
	WindDragBallFlightBehavior,
	sportsData,
	sportsOperation,
} from '@zylem/behaviors/sports/golf';

export type {
	SportsAbility,
	SportsAction,
	SportsEntity,
	SportsOptions,
	SportsPoint,
	SportsState,
} from '@zylem/behaviors/sports/golf';
