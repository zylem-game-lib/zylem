/**
 * `@zylem/game-lib/behavior/simulation/vehicle/racing`
 *
 * Named re-exports of `@zylem/behaviors/simulation/vehicle/racing`. Do not switch this file
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
} from '@zylem/behaviors/simulation/vehicle/racing';

export type {
	RacingAbility,
	RacingAction,
	RacingEntity,
	RacingOptions,
	RacingPoint,
	RacingState,
} from '@zylem/behaviors/simulation/vehicle/racing';
