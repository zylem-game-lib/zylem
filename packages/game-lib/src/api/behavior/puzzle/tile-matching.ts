/**
 * `@zylem/game-lib/behavior/puzzle/tile-matching`
 *
 * Named re-exports of `@zylem/behaviors/puzzle/tile-matching`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	AdjacentPanelSwapBehavior,
	CascadeChainCreditBehavior,
	ColumnCollapseBehavior,
	GarbageBlockConversionBehavior,
	MATCHING_ABILITIES,
	MATCHING_EVENTS,
	RisingStackPressureBehavior,
	SimultaneousMatchClearBehavior,
	matchingData,
	matchingOperation,
} from '@zylem/behaviors/puzzle/tile-matching';

export type {
	MatchingAbility,
	MatchingAction,
	MatchingCell,
	MatchingEntity,
	MatchingEvent,
	MatchingOptions,
	MatchingState,
} from '@zylem/behaviors/puzzle/tile-matching';
