/**
 * `@zylem/game-lib/behavior/sports/skate`
 *
 * Named re-exports of `@zylem/behaviors/sports/skate`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	AirGrabTrickBehavior,
	LandingAlignmentBailBehavior,
	ManualBalanceBehavior,
	PrewoundSpinBehavior,
	RailGrindBalanceBehavior,
	RampLipLaunchBehavior,
	RepeatedTrickDevaluationBehavior,
	SKATE_ABILITIES,
	SkateSnowboardBehavior,
	TrickEarnedBoostMeterBehavior,
	UnbankedTrickComboBehavior,
	WallRideBehavior,
	skateData,
	skateOperation,
} from '@zylem/behaviors/sports/skate';

export type {
	SkateAbility,
	SkateAction,
	SkateEntity,
	SkateOptions,
	SkatePhase,
	SkatePoint,
	SkateState,
} from '@zylem/behaviors/sports/skate';
