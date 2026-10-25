/**
 * `@zylem/game-lib/behavior/action-adventure`
 *
 * Named re-exports of `@zylem/behaviors/action-adventure`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	ADVENTURE_ABILITIES,
	ADVENTURE_BUTTONS,
	ADVENTURE_EVENT_KINDS,
	ADVENTURE_FLAGS,
	AdventureToolsBehavior,
	BreathAndDrowningBehavior,
	CarryAimAndThrowBehavior,
	CombatLockOnBehavior,
	ENVIRONMENT_ABILITIES,
	ENVIRONMENT_MODES,
	EnvironmentalLocomotionBehavior,
	FusedCarryableBombBehavior,
	GrappleSwingBehavior,
	GravityFrameTransitionBehavior,
	HookshotPullBehavior,
	KeyedInteractionGateBehavior,
	LocalGravityFieldBehavior,
	MagneticTrackAdhesionBehavior,
	MorphBallTransitionBehavior,
	ReturningBoomerangBehavior,
	ScanningAndDiscoveryBehavior,
	StaminaGlideAndUpdraftBehavior,
	StrokeSwimmingBehavior,
	SurfaceBreachJumpBehavior,
	TubeSlideSteeringBehavior,
	VolumeBuoyancyBehavior,
	WaterCurrentAdvectionBehavior,
	WindDrivenSailingBehavior,
} from '@zylem/behaviors/action-adventure';

export type {
	AdventureAbility,
	AdventureEntity,
	AdventureInput,
	AdventureObject,
	AdventureObjectState,
	AdventureOptions,
	AdventureRole,
	AdventureState,
	EnvironmentAbility,
	EnvironmentEntity,
	EnvironmentInput,
	EnvironmentOptions,
	EnvironmentState,
	EnvironmentVector,
	EnvironmentVolume,
	TubeRail,
} from '@zylem/behaviors/action-adventure';
