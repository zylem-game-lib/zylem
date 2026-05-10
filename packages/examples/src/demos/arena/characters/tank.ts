import { Color } from 'three';
import { createActor } from '@zylem/game-lib/entity';

import { demoAsset } from '../../../assets/manifest';

const idle = demoAsset('arena/models/tank/idle.fbx');
const walk = demoAsset('arena/models/tank/walk.fbx');
const jump = demoAsset('arena/models/tank/jump.fbx');
const attackLight = demoAsset('arena/models/tank/attack-light.fbx');
const attackMedium = demoAsset('arena/models/tank/attack-medium.fbx');
const attackStrong = demoAsset('arena/models/tank/attack-strong.fbx');
const damageLight = demoAsset('arena/models/tank/damage-light.fbx');
const damageHeavy = demoAsset('arena/models/tank/damage-heavy.fbx');
const fallen = demoAsset('arena/models/tank/fallen.fbx');
const specialGroundSlam = demoAsset('arena/models/tank/special-ground-slam.fbx');
const specialShield = demoAsset('arena/models/tank/special-shield.fbx');
const specialTaunt = demoAsset('arena/models/tank/special-taunt.fbx');

const baseColorUrl = demoAsset('arena/models/tank/textures/base-color.jpg');
const normalUrl = demoAsset('arena/models/tank/textures/normal-gl.jpg');
const ormUrl = demoAsset('arena/models/tank/textures/orm.jpg');

import {
	type PbrMaterialOptions,
	bindPbrTextures,
	createPbrTextureLoader,
	resolvePbrOptions,
} from './pbr-materials';
import type { CharacterActorBundle } from './bundle';
import type {
	CharacterLoadout,
	CharacterMoveset,
	CharacterPlatformerOpts,
	CharacterStats,
} from './movesets';

const TANK_SCALE = { x: 0.02, y: 0.02, z: 0.02 };
const TANK_COLLISION = { size: { x: 1, y: 1, z: 0.5 }, static: false };

/**
 * Tank platformer tuning: slightly slower than baseline for a weighty
 * feel. Jump force is clipped so vertical clearance reads as "stocky".
 */
export const TANK_PLATFORMER_OPTS: CharacterPlatformerOpts = {
	walkSpeed: 8,
	jumpForce: 14,
	maxJumps: 1,
	gravity: 9.82,
	groundRayLength: 0.25,
};

/** Tank is the tanky class — higher HP pool at the cost of mobility. */
export const TANK_STATS: CharacterStats = {
	maxHp: 140,
};

/**
 * Tank combat surface. Earth-tan sparks on the 3-tier A combo; dust ring
 * on the slam; small warm sparkles on the taunt. Particle colours are
 * multiplied over the soft-circle texture built by `attack-effects`.
 */
export const TANK_MOVESET: CharacterMoveset = {
	attacks: [
		{
			key: 'attack-light',
			duration: 0.55,
			damage: 8,
			particles: {
				kind: 'burst',
				color: '#d4a373',
				count: 10,
				duration: 0.2,
				life: [0.22, 0.42],
				speed: [1.4, 3.6],
				size: [0.1, 0.22],
				yOffset: 1.2,
			},
		},
		{
			key: 'attack-medium',
			duration: 0.75,
			damage: 14,
			particles: {
				kind: 'burst',
				color: '#c97f52',
				count: 16,
				duration: 0.25,
				life: [0.25, 0.5],
				speed: [1.8, 4.4],
				size: [0.14, 0.3],
				yOffset: 1.2,
			},
		},
		{
			key: 'attack-heavy',
			duration: 1.0,
			damage: 22,
			particles: {
				kind: 'burst',
				color: '#b05d33',
				count: 24,
				duration: 0.35,
				life: [0.3, 0.7],
				speed: [2.4, 5.8],
				size: [0.18, 0.42],
				yOffset: 1.2,
			},
		},
	],
	specials: {
		X: {
			key: 'special-ground-slam',
			name: 'Ground Slam',
			description:
				'Pound the earth in a heavy AoE that staggers anyone standing too close.',
			duration: 1.2,
			damage: 30,
			cooldown: 8,
			icon: 'arena/images/icon-ground-slam.png',
			particles: {
				kind: 'smoke',
				color: '#8b5a2b',
				count: 28,
				duration: 0.5,
				life: [0.7, 1.3],
				speed: [1.4, 3.2],
				size: [0.35, 0.7],
				yOffset: -0.2,
			},
		},
		Y: {
			key: 'special-taunt',
			name: 'Rally Taunt',
			description:
				'Bellow at every nearby enemy and force their aggro on you for several seconds.',
			duration: 1.6,
			cooldown: 12,
			icon: 'arena/images/icon-taunt.png',
			particles: {
				kind: 'burst',
				color: '#ffd166',
				count: 12,
				duration: 0.4,
				life: [0.4, 0.8],
				speed: [0.6, 1.6],
				size: [0.12, 0.28],
				yOffset: 1.8,
			},
		},
		// Defensive stance: dedicated shield-raise pose paired with a
		// pale-blue smoke dome that reads as the protective bubble.
		L: {
			key: 'special-shield',
			name: 'Shield Wall',
			description:
				'Brace behind a protective bubble that soaks incoming damage while it holds.',
			duration: 2.0,
			cooldown: 10,
			icon: 'arena/images/icon-shield.png',
			particles: {
				kind: 'smoke',
				color: '#93c5fd',
				count: 30,
				duration: 0.8,
				life: [0.9, 1.8],
				speed: [0.5, 1.4],
				size: [0.4, 0.85],
				yOffset: 1.2,
			},
		},
	},
	basics: {
		attack: { cooldown: 0.55, icon: 'arena/images/icon-attack.png' },
		jump: { cooldown: 0.75, icon: 'arena/images/icon-jump.png' },
	},
};

export const TANK_LOADOUT: CharacterLoadout = {
	platformerOpts: TANK_PLATFORMER_OPTS,
	stats: TANK_STATS,
	moveset: TANK_MOVESET,
};

const loadTankTextures = createPbrTextureLoader({
	baseColor: baseColorUrl,
	normal: normalUrl,
	orm: ormUrl,
});

/**
 * Create a tank character actor with Tripo-pack PBR textures extracted from
 * `tank.glb` and re-applied over the FBX skeleton.
 *
 * Shares the platformer-friendly animation keys (`idle`, `walking`, `running`,
 * `jumping-up`, `jumping-down`) with the other arena classes so the existing
 * `animationForPlatformerState` mapping in the demo works unchanged. Additional
 * class-specific keys are exposed for gameplay wiring later.
 *
 * The `color` parameter is applied as a multiplicative tint over the base-color
 * texture (default white = raw texture).
 */
export function createTankActor(
	color?: Color,
	position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
	materialOverrides?: PbrMaterialOptions,
): CharacterActorBundle {
	const material = resolvePbrOptions(materialOverrides);
	const actor = createActor({
		position,
		scale: TANK_SCALE,
		models: [idle],
		animations: [
			{ key: 'idle', path: idle },
			{ key: 'walking', path: walk },
			{ key: 'running', path: walk },
			{ key: 'jumping-up', path: jump },
			{ key: 'jumping-down', path: jump },
			{ key: 'attack-light', path: attackLight },
			{ key: 'attack-medium', path: attackMedium },
			{ key: 'attack-heavy', path: attackStrong },
			{ key: 'damage-light', path: damageLight },
			{ key: 'damage-heavy', path: damageHeavy },
			{ key: 'fallen', path: fallen },
			{ key: 'special-ground-slam', path: specialGroundSlam },
			{ key: 'special-shield', path: specialShield },
			{ key: 'special-taunt', path: specialTaunt },
		],
		collision: TANK_COLLISION,
		collisionShape: 'capsule',
	});

	const tint = color ?? new Color(0xffffff);
	const ready = bindPbrTextures({
		actor,
		loadTextures: loadTankTextures,
		tint,
		options: material,
	});

	return { actor, ready };
}
