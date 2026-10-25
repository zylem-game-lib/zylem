/**
 * `@zylem/game-lib/behavior/action/shooter/first-person`
 *
 * Named re-exports of `@zylem/behaviors/action/shooter/first-person`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	AlternateWeaponModeBehavior,
	BeamMissileCombinationBehavior,
	ChargeAndReleaseShotBehavior,
	DelayedShieldRegenerationBehavior,
	FirstPersonBehavior,
	FirstPersonEvent,
	FirstPersonFSM,
	FirstPersonPresentation,
	FirstPersonShooterCoordinator,
	FirstPersonState,
	InterruptibleMagazineReloadBehavior,
	MaterialPenetratingShotBehavior,
	RemoteGuidedProjectileBehavior,
	StationaryAimModeBehavior,
	StickyGrenadeAttachmentBehavior,
	WEAPON_ABILITIES,
	WEAPON_EVENTS,
	WEAPON_PHASES,
	WeaponHeatAndVentBehavior,
	WeaponSystemsBehavior,
	createFirstPersonInputComponent,
	createFirstPersonMovementComponent,
	createFirstPersonStateComponent,
	weaponButtons,
	weaponData,
	weaponModeData,
	weaponProjectileData,
} from '@zylem/behaviors/action/shooter/first-person';

export type {
	FirstPersonBehaviorOptions,
	FirstPersonContext,
	FirstPersonEntity,
	FirstPersonInputComponent,
	FirstPersonMovementComponent,
	FirstPersonShooterEntity,
	FirstPersonShooterInput,
	FirstPersonStateComponent,
	ViewmodelConfig,
	WeaponAbility,
	WeaponCameraIntent,
	WeaponEntity,
	WeaponInput,
	WeaponMode,
	WeaponOptions,
	WeaponProjectileKind,
	WeaponProjectileOptions,
	WeaponProjectileState,
	WeaponShot,
	WeaponState,
	WeaponSurface,
} from '@zylem/behaviors/action/shooter/first-person';
