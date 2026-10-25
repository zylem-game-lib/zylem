/**
 * `@zylem/game-lib/behavior/role-playing/monster-taming`
 *
 * Named re-exports of `@zylem/behaviors/role-playing/monster-taming`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	ActivePartnerSwapBehavior,
	BATTLE_ABILITIES,
	BATTLE_EVENTS,
	CaptureAttemptResolutionBehavior,
	ConditionalEvolutionBehavior,
	TypeEffectivenessMatrixBehavior,
	battleData,
	battleOperation,
} from '@zylem/behaviors/role-playing/monster-taming';

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
} from '@zylem/behaviors/role-playing/monster-taming';
