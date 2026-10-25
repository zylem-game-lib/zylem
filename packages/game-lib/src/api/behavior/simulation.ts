/**
 * `@zylem/game-lib/behavior/simulation`
 *
 * Named re-exports of `@zylem/behaviors/simulation`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	CalendarNpcRoutineBehavior,
	CropGrowthStagesBehavior,
	DriftChargeBoostBehavior,
	EnergyFundedRaceBoostBehavior,
	ExertionAndFatigueBehavior,
	FishingBiteAndHookBehavior,
	HarvestableFruitRegrowthBehavior,
	HoverTrackSuspensionBehavior,
	LIFE_ABILITIES,
	LIFE_EVENTS,
	LifeSimulationBehavior,
	LivestockDailyCareBehavior,
	OrderedLapCheckpointsBehavior,
	PositionWeightedRaceItemsBehavior,
	RACING_ABILITIES,
	RacingVehiclesBehavior,
	RelationshipEventMemoryBehavior,
	RoomFurniturePlacementBehavior,
	SeasonalCropEligibilityBehavior,
	SlipstreamDraftingBehavior,
	SoilMoistureCycleBehavior,
	TrackFollowingHomingItemBehavior,
	VehicleDamageProgressionBehavior,
	VehicleSeatEntryExitBehavior,
	VehicleSideAttackBehavior,
	lifeData,
	lifeOperation,
	racingData,
	racingOperation,
} from '@zylem/behaviors/simulation';

export type {
	LifeAbility,
	LifeAction,
	LifeAnimal,
	LifeEntity,
	LifeEvent,
	LifeFurniture,
	LifeMemory,
	LifeOptions,
	LifePerson,
	LifePlot,
	LifeSchedule,
	LifeState,
	LifeTree,
	RacingAbility,
	RacingAction,
	RacingEntity,
	RacingOptions,
	RacingPoint,
	RacingState,
} from '@zylem/behaviors/simulation';
