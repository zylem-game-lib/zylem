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

export const CHARACTER_CLASSES = ['tank', 'assassin', 'healer'] as const;

export type CharacterClass = (typeof CHARACTER_CLASSES)[number];

export function isCharacterClass(value: unknown): value is CharacterClass {
	return (
		typeof value === 'string' &&
		(CHARACTER_CLASSES as readonly string[]).includes(value)
	);
}

/**
 * Dispatcher that builds the correct character actor for a given class.
 * Keeps the entrypoint free of class-specific imports.
 */
export function createCharacterActor(
	characterClass: CharacterClass,
	color?: Color,
	position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
) {
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
