/**
 * `@zylem/game-lib/behavior/puzzle`
 *
 * Named re-exports of `@zylem/behaviors/puzzle`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	AdjacentPanelSwapBehavior,
	CascadeChainCreditBehavior,
	ColumnCollapseBehavior,
	ConductiveContactNetworkBehavior,
	FreezeAndShatterBehavior,
	GarbageBlockConversionBehavior,
	GridConstrainedPushBlockBehavior,
	MATCHING_ABILITIES,
	MATCHING_EVENTS,
	MagneticObjectManipulationBehavior,
	MaterialIgnitionSpreadBehavior,
	MirrorBeamRoutingBehavior,
	PUZZLE_ABILITIES,
	RisingStackPressureBehavior,
	SimultaneousMatchClearBehavior,
	StasisImpulseStorageBehavior,
	TimedSolidPlatformBehavior,
	WaterLevelMechanismBehavior,
	WeightedPressureSwitchBehavior,
	matchingData,
	matchingOperation,
	puzzleCommandData,
	puzzleData,
} from '@zylem/behaviors/puzzle';

export type {
	MatchingAbility,
	MatchingAction,
	MatchingCell,
	MatchingEntity,
	MatchingEvent,
	MatchingOptions,
	MatchingState,
	PuzzleAbility,
	PuzzleCommand,
	PuzzleEntity,
	PuzzleOptions,
	PuzzleSegment,
	PuzzleState,
	PuzzleVector,
} from '@zylem/behaviors/puzzle';
