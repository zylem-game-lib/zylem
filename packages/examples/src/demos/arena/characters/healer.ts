import { Color } from 'three';
import { createActor } from '@zylem/game-lib';

import { demoAsset } from '../../../assets/manifest';

const idle = demoAsset('arena/models/healer/idle.fbx');
const move = demoAsset('arena/models/healer/move.fbx');
const jump = demoAsset('arena/models/healer/jump.fbx');
const attackLight = demoAsset('arena/models/healer/attack-light.fbx');
const attackHeavy = demoAsset('arena/models/healer/attack-heavy.fbx');
const damageLight = demoAsset('arena/models/healer/damage-light.fbx');
const fallen = demoAsset('arena/models/healer/fallen.fbx');
const specialHeal = demoAsset('arena/models/healer/special-heal.fbx');
const specialSpellLink = demoAsset('arena/models/healer/special-spell-link.fbx');
const specialSpellShot = demoAsset('arena/models/healer/special-spell-shot.fbx');

const baseColorUrl = demoAsset('arena/models/healer/textures/base-color.jpg');
const normalUrl = demoAsset('arena/models/healer/textures/normal-gl.jpg');
const ormUrl = demoAsset('arena/models/healer/textures/orm.jpg');

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
const HEALER_COLLISION = { size: { x: 1, y: 1.5, z: 0.5 }, static: false };

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
			name: 'Restore',
			description:
				'Channel a soothing wave that restores hit points to you and any nearby allies.',
			duration: 1.4,
			cooldown: 6,
			icon: 'arena/images/icon-heal.png',
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
			name: 'Spell Link',
			description:
				'Tether yourself to an ally so you share incoming damage and healing.',
			duration: 1.4,
			cooldown: 3,
			icon: 'arena/images/icon-health-link.png',
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
			name: 'Spell Shot',
			description:
				'Hurl a focused bolt of arcane light that punches through enemies in a line.',
			duration: 1.1,
			damage: 20,
			cooldown: 5,
			icon: 'arena/images/icon-cleanse.png',
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
	basics: {
		attack: { cooldown: 0.55, icon: 'arena/images/icon-attack.png' },
		jump: { cooldown: 0.6, icon: 'arena/images/icon-jump.png' },
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
