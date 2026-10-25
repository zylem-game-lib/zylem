/**
 * `@zylem/game-lib/behavior/action/survival`
 *
 * Named re-exports of `@zylem/behaviors/action/survival`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	AdaptiveEncounterPressureBehavior,
	CompanionAbductionObjectiveBehavior,
	EncounterClearLockBehavior,
	EnvironmentalVaultActionBehavior,
	EscortFollowWaitBehavior,
	IngredientCombinationBehavior,
	SURVIVAL_ABILITIES,
	SavePointCheckpointBehavior,
	SpatialInventoryPackingBehavior,
	StaggerFinisherOpportunityBehavior,
	SurvivalResourcesBehavior,
	WeaponUpgradeTrackBehavior,
	survivalData,
	survivalOperation,
} from '@zylem/behaviors/action/survival';

export type {
	SurvivalAbility,
	SurvivalAction,
	SurvivalCheckpoint,
	SurvivalEntity,
	SurvivalItem,
	SurvivalOptions,
	SurvivalPoint,
	SurvivalState,
} from '@zylem/behaviors/action/survival';
