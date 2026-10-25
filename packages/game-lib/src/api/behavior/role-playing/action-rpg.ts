/**
 * `@zylem/game-lib/behavior/role-playing/action-rpg`
 *
 * Named re-exports of `@zylem/behaviors/role-playing/action-rpg`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	ActionRpgBehavior,
	AffixBudgetGenerationBehavior,
	AutonomousFamiliarBehavior,
	ConsumableBeltSlotsBehavior,
	DamageToResourceLeechBehavior,
	DeathDropOwnershipBehavior,
	DurabilityAndRepairBehavior,
	EquipmentStatAggregationBehavior,
	RPG_ABILITIES,
	RPG_EVENTS,
	ResourceDrainingTransformationBehavior,
	SeededLootTableBehavior,
	TypedResistanceResolutionBehavior,
	rpgData,
	rpgOperation,
} from '@zylem/behaviors/role-playing/action-rpg';

export type {
	RpgAbility,
	RpgAction,
	RpgAffix,
	RpgEntity,
	RpgEvent,
	RpgItem,
	RpgOptions,
	RpgPoint,
	RpgState,
} from '@zylem/behaviors/role-playing/action-rpg';
