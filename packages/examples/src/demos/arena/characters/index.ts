import { Color } from 'three';
import {
	ASSASSIN_LOADOUT,
	ASSASSIN_MOVESET,
	ASSASSIN_PLATFORMER_OPTS,
	createAssassinActor,
} from './assassin';
import {
	HEALER_LOADOUT,
	HEALER_MOVESET,
	HEALER_PLATFORMER_OPTS,
	createHealerActor,
} from './healer';
import {
	TANK_LOADOUT,
	TANK_MOVESET,
	TANK_PLATFORMER_OPTS,
	createTankActor,
} from './tank';
import type { CharacterLoadout } from './movesets';
import type { CharacterActorBundle, CharacterPresenter } from './bundle';
import { createLoadingIndicator, fadeInActor } from './loading-indicator';

export const CHARACTER_CLASSES = ['tank', 'assassin', 'healer'] as const;

export type CharacterClass = (typeof CHARACTER_CLASSES)[number];

export function isCharacterClass(value: unknown): value is CharacterClass {
	return (
		typeof value === 'string' &&
		(CHARACTER_CLASSES as readonly string[]).includes(value)
	);
}

function buildCharacterBundle(
	characterClass: CharacterClass,
	color: Color | undefined,
	position: { x: number; y: number; z: number },
): CharacterActorBundle {
	switch (characterClass) {
		case 'tank':
			return createTankActor(color, position);
		case 'assassin':
			return createAssassinActor(color, position);
		case 'healer':
			return createHealerActor(color, position);
		default: {
			const _exhaustive: never = characterClass;
			void _exhaustive;
			return createTankActor(color, position);
		}
	}
}

/**
 * Dispatcher that builds the correct character actor for a given class
 * and pairs it with a self-managing loading indicator.
 *
 * The character is invisible until its FBX model and PBR textures have
 * both fully resolved; once they do, the actor fades in and the
 * indicator fades out in lockstep. Both the actor and the indicator
 * entity should be added to the stage, and both should be removed (by
 * uuid) when the character is despawned — the indicator does not remove
 * itself from the entity manager, only its visible mesh.
 */
export function createCharacterActor(
	characterClass: CharacterClass,
	color?: Color,
	position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
): CharacterPresenter {
	const { actor, ready } = buildCharacterBundle(characterClass, color, position);
	const indicator = createLoadingIndicator(position);

	void ready.then(() => {
		fadeInActor(actor);
		indicator.startFadeOut();
	});

	return { actor, indicator: indicator.entity };
}

/**
 * Resolve the per-class combat + platformer bundle used by the arena
 * main stage. Declared here (rather than in `main-stage.ts`) so any
 * future networked peers can look up the same authored values.
 */
export function getCharacterLoadout(
	characterClass: CharacterClass,
): CharacterLoadout {
	switch (characterClass) {
		case 'tank':
			return TANK_LOADOUT;
		case 'assassin':
			return ASSASSIN_LOADOUT;
		case 'healer':
			return HEALER_LOADOUT;
		default: {
			const _exhaustive: never = characterClass;
			void _exhaustive;
			return TANK_LOADOUT;
		}
	}
}

export { createAssassinActor, createHealerActor, createTankActor };
export {
	ASSASSIN_LOADOUT,
	ASSASSIN_MOVESET,
	ASSASSIN_PLATFORMER_OPTS,
	HEALER_LOADOUT,
	HEALER_MOVESET,
	HEALER_PLATFORMER_OPTS,
	TANK_LOADOUT,
	TANK_MOVESET,
	TANK_PLATFORMER_OPTS,
};
export type {
	CharacterActionEntry,
	CharacterLoadout,
	CharacterMoveset,
	CharacterPlatformerOpts,
	CharacterStats,
	SpecialSlotId,
} from './movesets';
