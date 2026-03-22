import type { Mesh, Object3D } from 'three';
import { Vector3 } from 'three';

export type AsteroidSize = 'large' | 'small';

export type ColorStop = readonly [string, number];
export type AlphaStop = readonly [number, number];

export const PLAYFIELD_WIDTH = 30;
export const PLAYFIELD_HEIGHT = 20;
export const WRAP_WIDTH = 36;
export const WRAP_HEIGHT = 24;
export const OFFSCREEN_SPAWN_MARGIN = 1.5;
export const BULLET_BOUNDS_X = PLAYFIELD_WIDTH * 0.5 + 4;
export const BULLET_BOUNDS_Y = PLAYFIELD_HEIGHT * 0.5 + 4;
export const SHIP_TURN_SPEED = 3.5;
export const SHIP_ACCELERATION = 9;
export const SHIP_DRAG = 0.985;
export const SHIP_BRAKE = 1.8;
export const SHIP_MAX_SPEED = 12;
export const BULLET_SPEED = 25;
export const SHOOT_COOLDOWN_SECONDS = 0.18;
export const SHIP_MODEL_TILT_X = -Math.PI / 2;
export const SHIP_MODEL_YAW_OFFSET = Math.PI;
export const ASTEROID_FRAGMENT_TTL_SECONDS = 3.5;
export const ASTEROID_RESPAWN_DELAY_MIN_SECONDS = 1;
export const ASTEROID_RESPAWN_DELAY_MAX_SECONDS = 5;
export const MAX_ACTIVE_ASTEROIDS = 5;
export const LARGE_ASTEROID_POOL_SIZE = 8;
export const SMALL_ASTEROID_POOL_SIZE = 12;
export const LARGE_ASTEROID_FRAGMENT_COUNT = 12;
export const SMALL_ASTEROID_FRAGMENT_COUNT = 6;
export const LARGE_ASTEROID_SCALE = 1.6;
export const SMALL_ASTEROID_SCALE = 0.9;
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_COLLISION_DAMAGE = 20;
export const PLAYER_DAMAGE_COOLDOWN_SECONDS = 0.8;
export const PLAYER_ASTEROID_SPAWN_SAFE_DISTANCE = 10;
export const HEALTH_BAR_WIDTH = 220;
export const HEALTH_BAR_HEIGHT = 18;

export function clampVectorLength(vector: Vector3, maxLength: number) {
	if (vector.lengthSq() <= maxLength * maxLength) {
		return vector;
	}
	return vector.normalize().multiplyScalar(maxLength);
}

export function rotateVector2(vector: Vector3, angle: number) {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return new Vector3(
		vector.x * cos - vector.y * sin,
		vector.x * sin + vector.y * cos,
		0,
	);
}

export function getForwardDirection(angle: number) {
	return new Vector3(Math.sin(-angle), Math.cos(angle), 0);
}

export function getRightDirection(angle: number) {
	return new Vector3(Math.cos(angle), Math.sin(angle), 0);
}

export function randomDirection(speed: number) {
	const angle = Math.random() * Math.PI * 2;
	return new Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, 0);
}

export function randomRespawnDelay() {
	return ASTEROID_RESPAWN_DELAY_MIN_SECONDS
		+ Math.random()
			* (ASTEROID_RESPAWN_DELAY_MAX_SECONDS - ASTEROID_RESPAWN_DELAY_MIN_SECONDS);
}

export function clamp01(value: number) {
	return Math.min(1, Math.max(0, value));
}

export function getDifficultyRamp(elapsedSeconds: number) {
	return clamp01(elapsedSeconds / 150);
}

export function getRespawnDelayForElapsed(elapsedSeconds: number) {
	const ramp = getDifficultyRamp(elapsedSeconds);
	const minDelay = ASTEROID_RESPAWN_DELAY_MIN_SECONDS - ramp * 0.45;
	const maxDelay = ASTEROID_RESPAWN_DELAY_MAX_SECONDS - ramp * 2.4;
	const clampedMin = Math.max(0.45, minDelay);
	const clampedMax = Math.max(clampedMin + 0.5, maxDelay);
	return clampedMin + Math.random() * (clampedMax - clampedMin);
}

export function getAsteroidSpeed(size: AsteroidSize, elapsedSeconds: number) {
	const ramp = getDifficultyRamp(elapsedSeconds);
	const base = size === 'large' ? 1.2 : 2.0;
	const variance = size === 'large' ? 1.2 : 1.4;
	return base + Math.random() * variance + ramp * (size === 'large' ? 1.1 : 1.4);
}

export function getFirstMesh(root: unknown): Mesh | null {
	let resolved: Mesh | null = null;
	(root as { traverse?: (fn: (child: unknown) => void) => void } | null)?.traverse?.((child) => {
		if (resolved) {
			return;
		}

		if ((child as { isMesh?: boolean }).isMesh) {
			resolved = child as Mesh;
		}
	});
	return resolved;
}

export function getModelRoot(entity: { group?: Object3D | null }): Object3D | null {
	return entity.group?.children[0] ?? null;
}
