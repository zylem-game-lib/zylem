/// <reference types="@zylem/assets" />

import { Color } from 'three';
import { createActor } from '@zylem/game-lib';

import idle from '../assets/assassin/idle.fbx';
import move from '../assets/assassin/move.fbx';
import jump from '../assets/assassin/jump.fbx';
import attackLight from '../assets/assassin/attack-light.fbx';
import attackMedium from '../assets/assassin/attack-medium.fbx';
import attackHeavy from '../assets/assassin/attack-heavy.fbx';
import damageLight from '../assets/assassin/damage-light.fbx';
import fallen from '../assets/assassin/fallen.fbx';
import specialAttack from '../assets/assassin/special-attack.fbx';
import specialStealth from '../assets/assassin/special-stealth.fbx';

import baseColorUrl from '../assets/assassin/textures/base-color.jpg';
import normalUrl from '../assets/assassin/textures/normal-gl.jpg';
import ormUrl from '../assets/assassin/textures/orm.jpg';

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

const ASSASSIN_SCALE = { x: 0.02, y: 0.02, z: 0.02 };
const ASSASSIN_COLLISION = { size: { x: 1, y: 3.8, z: 0.5 }, static: false };

/**
 * Assassin platformer tuning: faster walk speed and a taller jump arc.
 * Keeps `maxJumps: 1` to avoid trivialising the platforming, with
 * gravity/groundRay at baseline to keep the feel tight.
 */
export const ASSASSIN_PLATFORMER_OPTS: CharacterPlatformerOpts = {
	walkSpeed: 12,
	jumpForce: 22,
	maxJumps: 1,
	gravity: 9.82,
	groundRayLength: 0.25,
};

/** Assassin is glass-cannon: lowest HP pool, highest mobility and burst. */
export const ASSASSIN_STATS: CharacterStats = {
	maxHp: 80,
};

/**
 * Assassin combat surface. Magenta slash sparks on the A combo, dark
 * smoke puff for stealth, sharp crimson spray on the lunging special.
 */
export const ASSASSIN_MOVESET: CharacterMoveset = {
	attacks: [
		{
			key: 'attack-light',
			duration: 0.4,
			damage: 10,
			particles: {
				kind: 'burst',
				color: '#c084fc',
				count: 10,
				duration: 0.18,
				life: [0.16, 0.32],
				speed: [2.2, 4.8],
				size: [0.08, 0.18],
				yOffset: 1.2,
			},
		},
		{
			key: 'attack-medium',
			duration: 0.55,
			damage: 14,
			particles: {
				kind: 'burst',
				color: '#a855f7',
				count: 14,
				duration: 0.2,
				life: [0.2, 0.4],
				speed: [2.6, 5.6],
				size: [0.1, 0.22],
				yOffset: 1.2,
			},
		},
		{
			key: 'attack-heavy',
			duration: 0.75,
			damage: 18,
			particles: {
				kind: 'burst',
				color: '#7c3aed',
				count: 20,
				duration: 0.28,
				life: [0.25, 0.55],
				speed: [3.2, 6.4],
				size: [0.14, 0.3],
				yOffset: 1.2,
			},
		},
	],
	specials: {
		X: {
			key: 'special-attack',
			duration: 0.9,
			damage: 28,
			cooldown: 4,
			particles: {
				kind: 'burst',
				color: '#ef4444',
				count: 26,
				duration: 0.3,
				life: [0.25, 0.55],
				speed: [3.5, 7.0],
				size: [0.14, 0.32],
				yOffset: 1.2,
			},
		},
		Y: {
			key: 'special-stealth',
			duration: 1.0,
			cooldown: 10,
			particles: {
				kind: 'smoke',
				color: '#1f2937',
				count: 22,
				duration: 0.5,
				life: [0.8, 1.6],
				speed: [0.4, 1.2],
				size: [0.4, 0.9],
				yOffset: 1.0,
			},
		},
	},
};

export const ASSASSIN_LOADOUT: CharacterLoadout = {
	platformerOpts: ASSASSIN_PLATFORMER_OPTS,
	stats: ASSASSIN_STATS,
	moveset: ASSASSIN_MOVESET,
};

const loadAssassinTextures = createPbrTextureLoader({
	baseColor: baseColorUrl,
	normal: normalUrl,
	orm: ormUrl,
});

/**
 * Create an assassin character actor with Tripo-pack PBR textures extracted
 * from `assassin.glb` and re-applied over the FBX skeleton.
 *
 * Exposes the shared platformer animation keys plus class-specific specials
 * (`special-attack`, `special-stealth`) for later gameplay wiring.
 *
 * The `color` parameter is applied as a multiplicative tint over the base-color
 * texture (default white = raw texture).
 */
export function createAssassinActor(
	color?: Color,
	position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
	materialOverrides?: PbrMaterialOptions,
) {
	const material = resolvePbrOptions(materialOverrides);
	const actor = createActor({
		position,
		scale: ASSASSIN_SCALE,
		models: [idle],
		animations: [
			{ key: 'idle', path: idle },
			{ key: 'walking', path: move },
			{ key: 'running', path: move },
			{ key: 'jumping-up', path: jump },
			{ key: 'jumping-down', path: jump },
			{ key: 'attack-light', path: attackLight },
			{ key: 'attack-medium', path: attackMedium },
			{ key: 'attack-heavy', path: attackHeavy },
			{ key: 'damage-light', path: damageLight },
			{ key: 'fallen', path: fallen },
			{ key: 'special-attack', path: specialAttack },
			{ key: 'special-stealth', path: specialStealth },
		],
		collision: ASSASSIN_COLLISION,
		collisionShape: 'capsule',
	});

	const tint = color ?? new Color(0xffffff);

	actor.listen('entity:model:loaded', ({ success }) => {
		if (!success) return;
		void loadAssassinTextures().then((textures) => {
			applyPbrMaterial(actor.group, textures, tint, material);
		});
	});

	return actor;
}
