/**
 * `@zylem/game-lib/behavior/puzzle/physics`
 *
 * Named re-exports of `@zylem/behaviors/puzzle/physics`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	ConductiveContactNetworkBehavior,
	FreezeAndShatterBehavior,
	GridConstrainedPushBlockBehavior,
	MagneticObjectManipulationBehavior,
	MaterialIgnitionSpreadBehavior,
	MirrorBeamRoutingBehavior,
	PUZZLE_ABILITIES,
	StasisImpulseStorageBehavior,
	TimedSolidPlatformBehavior,
	WaterLevelMechanismBehavior,
	WeightedPressureSwitchBehavior,
	puzzleCommandData,
	puzzleData,
} from '@zylem/behaviors/puzzle/physics';

export type {
	PuzzleAbility,
	PuzzleCommand,
	PuzzleEntity,
	PuzzleOptions,
	PuzzleSegment,
	PuzzleState,
	PuzzleVector,
} from '@zylem/behaviors/puzzle/physics';
