/**
 * `@zylem/game-lib/behavior/role-playing/tactical-rpg`
 *
 * Named re-exports of `@zylem/behaviors/role-playing/tactical-rpg`. Do not switch this file
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
} from '@zylem/behaviors/role-playing/tactical-rpg';

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
} from '@zylem/behaviors/role-playing/tactical-rpg';
