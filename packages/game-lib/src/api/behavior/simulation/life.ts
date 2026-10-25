/**
 * `@zylem/game-lib/behavior/simulation/life`
 *
 * Named re-exports of `@zylem/behaviors/simulation/life`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	CalendarNpcRoutineBehavior,
	CropGrowthStagesBehavior,
	ExertionAndFatigueBehavior,
	FishingBiteAndHookBehavior,
	HarvestableFruitRegrowthBehavior,
	LIFE_ABILITIES,
	LIFE_EVENTS,
	LifeSimulationBehavior,
	LivestockDailyCareBehavior,
	RelationshipEventMemoryBehavior,
	RoomFurniturePlacementBehavior,
	SeasonalCropEligibilityBehavior,
	SoilMoistureCycleBehavior,
	lifeData,
	lifeOperation,
} from '@zylem/behaviors/simulation/life';

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
} from '@zylem/behaviors/simulation/life';
