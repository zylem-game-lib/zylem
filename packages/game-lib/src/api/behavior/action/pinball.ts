/**
 * `@zylem/game-lib/behavior/action/pinball`
 *
 * Named re-exports of `@zylem/behaviors/action/pinball`. Do not switch this file
 * to `export *`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
export {
	ActiveBumperKickBehavior,
	MATCHING_ABILITIES,
	MATCHING_EVENTS,
	PinballModeObjectivesBehavior,
	PoweredPinballFlipperBehavior,
	SpringPlungerLaunchBehavior,
	matchingData,
	matchingOperation,
} from '@zylem/behaviors/action/pinball';

export type {
	MatchingAbility,
	MatchingAction,
	MatchingCell,
	MatchingEntity,
	MatchingEvent,
	MatchingOptions,
	MatchingState,
} from '@zylem/behaviors/action/pinball';
