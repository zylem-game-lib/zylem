/**
 * `@zylem/game-lib/behavior/sports/racing`
 *
 * Named re-exports of `@zylem/behaviors/sports/racing`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	DriftChargeBoostBehavior,
	EnergyFundedRaceBoostBehavior,
	HoverTrackSuspensionBehavior,
	OrderedLapCheckpointsBehavior,
	PositionWeightedRaceItemsBehavior,
	RACING_ABILITIES,
	RacingVehiclesBehavior,
	SlipstreamDraftingBehavior,
	TrackFollowingHomingItemBehavior,
	VehicleDamageProgressionBehavior,
	VehicleSeatEntryExitBehavior,
	VehicleSideAttackBehavior,
	racingData,
	racingOperation,
} from '@zylem/behaviors/sports/racing';

export type {
	RacingAbility,
	RacingAction,
	RacingEntity,
	RacingOptions,
	RacingPoint,
	RacingState,
} from '@zylem/behaviors/sports/racing';
