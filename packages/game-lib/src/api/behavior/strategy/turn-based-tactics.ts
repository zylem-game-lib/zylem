/**
 * `@zylem/game-lib/behavior/strategy/turn-based-tactics`
 *
 * Named re-exports of `@zylem/behaviors/strategy/turn-based-tactics`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	CommanderPowerWindowBehavior,
	CounterattackAndFollowUpBehavior,
	FuelAmmunitionResupplyBehavior,
	MinMaxAttackRangeBehavior,
	PersistentUnitLossBehavior,
	ProgressiveBuildingCaptureBehavior,
	TACTICS_ABILITIES,
	TACTICS_EVENTS,
	TacticalGridBehavior,
	TerrainDefenseModifierBehavior,
	TerrainMovementBudgetBehavior,
	TransportLoadUnloadBehavior,
	WeaponAdvantageCycleBehavior,
	tacticsData,
	tacticsOperation,
} from '@zylem/behaviors/strategy/turn-based-tactics';

export type {
	TacticsAbility,
	TacticsAction,
	TacticsCell,
	TacticsEntity,
	TacticsEvent,
	TacticsOptions,
	TacticsPower,
	TacticsState,
	TacticsStructure,
	TacticsUnit,
} from '@zylem/behaviors/strategy/turn-based-tactics';
