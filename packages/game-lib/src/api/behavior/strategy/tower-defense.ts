/**
 * `@zylem/game-lib/behavior/strategy/tower-defense`
 *
 * Named re-exports of `@zylem/behaviors/strategy/tower-defense`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	ArmingProximityMineBehavior,
	BlockerChewTransitionBehavior,
	BudgetedWaveSchedulerBehavior,
	BurrowToBacklineBehavior,
	CostedGridDeploymentBehavior,
	DEFENSE_ABILITIES,
	DEFENSE_EVENTS,
	LaneDefenseBehavior,
	LaneTargetAcquisitionBehavior,
	LastChanceLaneSweeperBehavior,
	LayeredBreakawayArmorBehavior,
	PeriodicResourceProductionBehavior,
	SingleUseObstacleVaultBehavior,
	defenseData,
	defenseOperation,
} from '@zylem/behaviors/strategy/tower-defense';

export type {
	DefenseAbility,
	DefenseAction,
	DefenseEntity,
	DefenseEvent,
	DefenseOptions,
	DefenseReceipt,
	DefenseState,
	DefenseTarget,
	DefenseTile,
} from '@zylem/behaviors/strategy/tower-defense';
