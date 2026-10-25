/**
 * `@zylem/game-lib/behavior/action/shooter/shoot-em-up`
 *
 * Named re-exports of `@zylem/behaviors/action/shooter/shoot-em-up`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	MultidirectionalSpaceShooterCoordinator,
	Shooter2DBehavior,
	ThrusterBehavior,
	ThrusterEvent,
	ThrusterFSM,
	ThrusterState,
	TopDownMovementBehavior,
	TopDownShooterCoordinator,
	createShooter2DStateComponent,
	createThrusterInputComponent,
	createThrusterMovementComponent,
	createThrusterStateComponent,
	createTopDownMovementComponent,
	createTopDownMovementInputComponent,
	createTopDownMovementStateComponent,
} from '@zylem/behaviors/action/shooter/shoot-em-up';

export type {
	MultidirectionalSpaceShooterEntity,
	MultidirectionalSpaceShooterInput,
	PlayerInput,
	Shooter2DBehaviorOptions,
	Shooter2DFireArgs,
	Shooter2DHandle,
	Shooter2DProjectileFactory,
	Shooter2DSourceEntity,
	Shooter2DStageLike,
	Shooter2DStateComponent,
	Shooter2DTarget,
	ThrusterBehaviorOptions,
	ThrusterEntity,
	ThrusterFSMContext,
	ThrusterInputComponent,
	ThrusterMovementComponent,
	ThrusterStateComponent,
	TopDownMovementBehaviorOptions,
	TopDownMovementComponent,
	TopDownMovementEntity,
	TopDownMovementHandle,
	TopDownMovementInputComponent,
	TopDownMovementStateComponent,
	TopDownShooterEntity,
	TopDownShooterInput,
} from '@zylem/behaviors/action/shooter/shoot-em-up';
