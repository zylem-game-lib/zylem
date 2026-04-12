import { Vector3 } from 'three';
import snakeShipGlb from '../../assets/snake-ship.glb';
import {
	createEnemyRuntime,
	type EnemyFactoryOptions,
	type EnemyRuntime,
	type EnemyUpdateContext,
} from './enemy-common';
import {
	DOWN_VECTOR,
	ENEMY_VERTICAL_BOB_AMPLITUDE,
	SINE_ENEMY_FIRE_COOLDOWN_SECONDS,
	SINE_ENEMY_PATROL_RANGE,
	SINE_ENEMY_PATROL_SPEED,
	getDifficultyScale,
	getEntityPosition,
	randomBetween,
	setWorldPosition,
	faceEntity,
} from './shared';

const SNAKE_SHIP_SCALE = 1.4;
const SNAKE_SHIP_COLLISION_SIZE = { x: 1.15, y: 0.9, z: 1.35 } as const;
const SNAKE_SHIP_COLLISION_POSITION = { x: 0, y: -0.1, z: 0 } as const;

export function createSnakeShipRuntime({
	anchor,
	waveNumber,
	index,
}: EnemyFactoryOptions): EnemyRuntime {
	const difficulty = getDifficultyScale(waveNumber);
	return createEnemyRuntime({
		name: `3d-space-invaders-snake-${waveNumber}-${index + 1}`,
		kind: 'sine',
		model: snakeShipGlb,
		anchor,
		scale: SNAKE_SHIP_SCALE,
		collisionSize: SNAKE_SHIP_COLLISION_SIZE,
		collisionPosition: SNAKE_SHIP_COLLISION_POSITION,
		fractureSeed: waveNumber * 97 + index * 11 + 17,
		fragmentCount: 12,
		patrolRange: SINE_ENEMY_PATROL_RANGE,
		patrolSpeed: SINE_ENEMY_PATROL_SPEED,
		fireCooldown:
			randomBetween(0.95, SINE_ENEMY_FIRE_COOLDOWN_SECONDS) / difficulty,
		abilityCooldown: Number.POSITIVE_INFINITY,
		phaseOffset: index * 0.6 + Math.random() * 0.4,
		difficulty,
	});
}

export function updateSnakeShip(
	runtime: EnemyRuntime,
	{ delta, addProjectile, createSineEnemyBullet }: EnemyUpdateContext,
) {
	const current = getEntityPosition(runtime.entity) ?? runtime.anchor.clone();
	const time = runtime.time * runtime.patrolSpeed + runtime.phaseOffset;
	const target = new Vector3(
		runtime.anchor.x + Math.sin(time) * runtime.patrolRange,
		runtime.anchor.y + Math.sin(time * 1.4) * ENEMY_VERTICAL_BOB_AMPLITUDE,
		0,
	);
	const movement = target.clone().sub(current);
	setWorldPosition(runtime.entity, target);
	faceEntity(
		runtime.entity,
		movement.lengthSq() > 0.0001 ? movement : DOWN_VECTOR,
	);

	runtime.fireCooldown -= delta * Math.max(1, runtime.difficulty * 0.82);
	if (runtime.fireCooldown > 0) {
		return;
	}

	addProjectile(
		createSineEnemyBullet(target.clone().add(new Vector3(0, -0.95, 0))),
	);
	runtime.fireCooldown =
		randomBetween(1.05, SINE_ENEMY_FIRE_COOLDOWN_SECONDS) / runtime.difficulty;
}
