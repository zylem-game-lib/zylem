/// <reference types="@zylem/assets" />

import { Color } from 'three';
import { createActor } from '@zylem/game-lib';

import idle from '../assets/healer/idle.fbx';
import move from '../assets/healer/move.fbx';
import jump from '../assets/healer/jump.fbx';
import attackLight from '../assets/healer/attack-light.fbx';
import attackHeavy from '../assets/healer/attack-heavy.fbx';
import damageLight from '../assets/healer/damage-light.fbx';
import fallen from '../assets/healer/fallen.fbx';
import specialHeal from '../assets/healer/special-heal.fbx';
import specialSpellLink from '../assets/healer/special-spell-link.fbx';
import specialSpellShot from '../assets/healer/special-spell-shot.fbx';

import baseColorUrl from '../assets/healer/textures/base-color.jpg';
import normalUrl from '../assets/healer/textures/normal-gl.jpg';
import ormUrl from '../assets/healer/textures/orm.jpg';

import {
	type PbrMaterialOptions,
	applyPbrMaterial,
	createPbrTextureLoader,
	resolvePbrOptions,
} from './pbr-materials';
import type {
	CharacterLoadout,
	CharacterMoveset,
	CharacterPlatformerOpts,
	CharacterStats,
} from './movesets';

const HEALER_SCALE = { x: 0.02, y: 0.02, z: 0.02 };
const HEALER_COLLISION = { size: { x: 1, y: 3.8, z: 0.5 }, static: false };

/** Healer platformer tuning: baseline arena values. */
export const HEALER_PLATFORMER_OPTS: CharacterPlatformerOpts = {
	walkSpeed: 10,
	jumpForce: 16,
	maxJumps: 1,
	gravity: 9.82,
	groundRayLength: 0.25,
};

/** Healer sits between tank and assassin on durability. */
export const HEALER_STATS: CharacterStats = {
	maxHp: 100,
};

/**
 * Healer combat surface. The healer asset pack does not include an
 * `attack-medium` FBX, so the combo is a 2-tier chain (light -> heavy)
 * and the combat controller clamps the tier index to the array length.
 * Particles lean cyan/green for the supportive theme.
 */
export const HEALER_MOVESET: CharacterMoveset = {
	attacks: [
		{
			key: 'attack-light',
			duration: 0.55,
			damage: 6,
			particles: {
				kind: 'burst',
				color: '#67e8f9',
				count: 12,
				duration: 0.22,
				life: [0.22, 0.45],
				speed: [1.2, 3.2],
				size: [0.1, 0.22],
				yOffset: 1.2,
			},
		},
		{
			key: 'attack-heavy',
			duration: 0.85,
			damage: 14,
			particles: {
				kind: 'burst',
				color: '#22d3ee',
				count: 22,
				duration: 0.3,
				life: [0.3, 0.6],
				speed: [2.0, 4.8],
				size: [0.14, 0.3],
				yOffset: 1.2,
			},
		},
	],
	specials: {
		X: {
			key: 'special-heal',
			duration: 1.4,
			cooldown: 6,
			particles: {
				kind: 'burst',
				color: '#86efac',
				count: 24,
				duration: 0.6,
				life: [0.6, 1.2],
				speed: [0.6, 1.6],
				size: [0.16, 0.34],
				yOffset: 0.6,
			},
		},
		Y: {
			key: 'special-spell-link',
			duration: 1.4,
			cooldown: 3,
			particles: {
				kind: 'smoke',
				color: '#60a5fa',
				count: 18,
				duration: 0.7,
				life: [0.8, 1.6],
				speed: [0.3, 0.9],
				size: [0.3, 0.7],
				yOffset: 1.4,
			},
		},
		L: {
			key: 'special-spell-shot',
			duration: 1.1,
			damage: 20,
			cooldown: 5,
			particles: {
				kind: 'burst',
				color: '#e0f2fe',
				count: 20,
				duration: 0.3,
				life: [0.25, 0.55],
				speed: [3.0, 6.0],
				size: [0.12, 0.26],
				yOffset: 1.4,
			},
		},
	},
};

export const HEALER_LOADOUT: CharacterLoadout = {
	platformerOpts: HEALER_PLATFORMER_OPTS,
	stats: HEALER_STATS,
	moveset: HEALER_MOVESET,
};

const loadHealerTextures = createPbrTextureLoader({
	baseColor: baseColorUrl,
	normal: normalUrl,
	orm: ormUrl,
});

/**
 * Create a healer character actor with Tripo-pack PBR textures extracted from
 * `healer.glb` and re-applied over the FBX skeleton.
 *
 * Exposes the shared platformer animation keys plus class-specific specials
 * (`special-heal`, `special-spell-link`, `special-spell-shot`) for later
 * gameplay wiring. Note: the healer set does not include an `attack-medium`
 * FBX, so only light + heavy attacks are bound.
 *
 * The `color` parameter is applied as a multiplicative tint over the base-color
 * texture (default white = raw texture).
 */
export function createHealerActor(
	color?: Color,
	position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
	materialOverrides?: PbrMaterialOptions,
) {
	const material = resolvePbrOptions(materialOverrides);
	const actor = createActor({
		position,
		scale: HEALER_SCALE,
		models: [idle],
		animations: [
			{ key: 'idle', path: idle },
			{ key: 'walking', path: move },
			{ key: 'running', path: move },
			{ key: 'jumping-up', path: jump },
			{ key: 'jumping-down', path: jump },
			{ key: 'attack-light', path: attackLight },
			{ key: 'attack-heavy', path: attackHeavy },
			{ key: 'damage-light', path: damageLight },
			{ key: 'fallen', path: fallen },
			{ key: 'special-heal', path: specialHeal },
			{ key: 'special-spell-link', path: specialSpellLink },
			{ key: 'special-spell-shot', path: specialSpellShot },
		],
		collision: HEALER_COLLISION,
		collisionShape: 'capsule',
	});

	const tint = color ?? new Color(0xffffff);

	actor.listen('entity:model:loaded', ({ success }) => {
		if (!success) return;
		void loadHealerTextures().then((textures) => {
			applyPbrMaterial(actor.group, textures, tint, material);
		});
	});

	return actor;
}
