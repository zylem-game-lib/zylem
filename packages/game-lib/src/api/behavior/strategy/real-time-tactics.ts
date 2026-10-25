/**
 * `@zylem/game-lib/behavior/strategy/real-time-tactics`
 *
 * Named re-exports of `@zylem/behaviors/strategy/real-time-tactics`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	CooperativeConstructionWorkBehavior,
	CooperativeObjectTransportBehavior,
	DayEndUnitRecallBehavior,
	DeliveredResourceConversionBehavior,
	GrowthStageMobilityBehavior,
	SQUAD_ABILITIES,
	SQUAD_EVENTS,
	SpeciesHazardAffinityBehavior,
	SquadFormationFollowBehavior,
	SquadRtsBehavior,
	SurfaceLatchAttackBehavior,
	ThrownWorkerDeploymentBehavior,
	WhistleRecallBehavior,
	squadData,
	squadOperation,
} from '@zylem/behaviors/strategy/real-time-tactics';

export type {
	SquadAbility,
	SquadAction,
	SquadEntity,
	SquadEvent,
	SquadOptions,
	SquadState,
	SquadTask,
	SquadWorker,
} from '@zylem/behaviors/strategy/real-time-tactics';
