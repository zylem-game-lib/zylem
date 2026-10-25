/**
 * `@zylem/game-lib/behavior/action/fighting`
 *
 * Named re-exports of `@zylem/behaviors/action/fighting`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	AirDodgeRecoveryBehavior,
	AttackPhaseHitboxesBehavior,
	COMBAT_ABILITIES,
	COMBAT_EVENTS,
	COMBAT_PHASES,
	CombatHitstopBehavior,
	DamageScaledKnockbackBehavior,
	DepletingShieldBehavior,
	DirectionalInfluenceBehavior,
	GrabHoldThrowBehavior,
	GroundedAttackChainBehavior,
	ImpactTechWindowBehavior,
	MeleeCombatBehavior,
	TimedPerfectGuardBehavior,
	combatAttackData,
	combatButtons,
	combatData,
	combatHitData,
} from '@zylem/behaviors/action/fighting';

export type {
	CombatAbility,
	CombatAttack,
	CombatEntity,
	CombatHit,
	CombatInput,
	CombatOptions,
	CombatState,
} from '@zylem/behaviors/action/fighting';
