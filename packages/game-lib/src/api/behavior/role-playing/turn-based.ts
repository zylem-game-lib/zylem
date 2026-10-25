/**
 * `@zylem/game-lib/behavior/role-playing/turn-based`
 *
 * Named re-exports of `@zylem/behaviors/role-playing/turn-based`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	BATTLE_ABILITIES,
	BATTLE_EVENTS,
	BudgetedPassiveLoadoutBehavior,
	EscapeAttemptBehavior,
	FieldFirstStrikeBehavior,
	PrioritySpeedTurnOrderBehavior,
	TimedBattleActionCommandBehavior,
	TurnDurationStatusBehavior,
	battleData,
	battleOperation,
} from '@zylem/behaviors/role-playing/turn-based';

export type {
	BattleAbility,
	BattleAction,
	BattleEight,
	BattleEntity,
	BattleEvent,
	BattleFour,
	BattleOptions,
	BattleState,
	BattleTriple,
} from '@zylem/behaviors/role-playing/turn-based';
