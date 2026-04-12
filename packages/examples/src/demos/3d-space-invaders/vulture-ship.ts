import { Vector3 } from 'three';
import vultureShipGlb from '../../assets/vulture-ship.glb';
import {
	createEnemyRuntime,
	type EnemyFactoryOptions,
	type EnemyRuntime,
	type EnemyUpdateContext,
} from './enemy-common';
import {
	CIRCLE_ENEMY_DIVE_COOLDOWN_SECONDS,
	CIRCLE_ENEMY_DIVE_SPEED,
	CIRCLE_ENEMY_ORBIT_DURATION_SECONDS,
	CIRCLE_ENEMY_ORBIT_RADIUS,
	CIRCLE_ENEMY_ORBIT_SPEED,
	CIRCLE_ENEMY_PATROL_RANGE,
	CIRCLE_ENEMY_PATROL_SPEED,
	CIRCLE_ENEMY_RETURN_SPEED,
	DOWN_VECTOR,
	ENEMY_VERTICAL_BOB_AMPLITUDE,
	PLAYER_START_Y,
	faceEntity,
	getDifficultyScale,
	getEntityPosition,
	moveEntityTowards,
	randomBetween,
	setWorldPosition,
} from './shared';

const VULTURE_SHIP_SCALE = 1.4;
const VULTURE_SHIP_COLLISION_SIZE = { x: 1.25, y: 0.95, z: 1.35 } as const;
const VULTURE_SHIP_COLLISION_POSITION = { x: 0, y: -0.08, z: 0 } as const;

export function createVultureShipRuntime({
	anchor,
	waveNumber,
	index,
}: EnemyFactoryOptions): EnemyRuntime {
	const difficulty = getDifficultyScale(waveNumber);
	return createEnemyRuntime({
		name: `3d-space-invaders-vulture-${waveNumber}-${index + 1}`,
		kind: 'circle',
		model: vultureShipGlb,
		anchor,
		scale: VULTURE_SHIP_SCALE,
		collisionSize: VULTURE_SHIP_COLLISION_SIZE,
		collisionPosition: VULTURE_SHIP_COLLISION_POSITION,
		fractureSeed: waveNumber * 101 + index * 13 + 29,
		fragmentCount: 12,
		patrolRange: CIRCLE_ENEMY_PATROL_RANGE,
		patrolSpeed: CIRCLE_ENEMY_PATROL_SPEED,
		fireCooldown: Number.POSITIVE_INFINITY,
		abilityCooldown:
			randomBetween(2.8, CIRCLE_ENEMY_DIVE_COOLDOWN_SECONDS) / difficulty,
		phaseOffset: index * 0.6 + Math.random() * 0.4,
		difficulty,
	});
}

export function updateVultureShip(
	runtime: EnemyRuntime,
	{ delta, getPlayerPosition }: EnemyUpdateContext,
) {
	switch (runtime.phase) {
		case 'patrol': {
			const current = getEntityPosition(runtime.entity) ?? runtime.anchor.clone();
			const time = runtime.time * runtime.patrolSpeed + runtime.phaseOffset;
			const target = new Vector3(
				runtime.anchor.x + Math.sin(time) * runtime.patrolRange,
				runtime.anchor.y
				+ Math.sin(time * 1.1) * ENEMY_VERTICAL_BOB_AMPLITUDE * 0.8,
				0,
			);
			const movement = target.clone().sub(current);
			setWorldPosition(runtime.entity, target);
			faceEntity(
				runtime.entity,
				movement.lengthSq() > 0.0001 ? movement : DOWN_VECTOR,
			);

			runtime.abilityCooldown -= delta * Math.max(1, runtime.difficulty * 0.72);
			if (runtime.abilityCooldown <= 0) {
				runtime.phase = 'dive';
				runtime.phaseTime = 0;
			}
			return;
		}

		case 'dive': {
			const playerPosition =
				getPlayerPosition() ?? new Vector3(0, PLAYER_START_Y, 0);
			runtime.orbitCenter.copy(playerPosition);
			const diveTarget = playerPosition.clone().add(new Vector3(0, 2.45, 0));
			const result = moveEntityTowards(
				runtime.entity,
				diveTarget,
				CIRCLE_ENEMY_DIVE_SPEED * runtime.difficulty,
				delta,
			);
			faceEntity(
				runtime.entity,
				result.movement.lengthSq() > 0.0001 ? result.movement : DOWN_VECTOR,
			);

			if (result.remaining <= 0.25 || runtime.phaseTime >= 2.35) {
				runtime.phase = 'orbit';
				runtime.phaseTime = 0;
				const orbitReference = result.position.clone().sub(runtime.orbitCenter);
				runtime.orbitAngle = Math.atan2(orbitReference.y, orbitReference.x);
			}
			return;
		}

		case 'orbit': {
			const playerPosition = getPlayerPosition();
			if (playerPosition) {
				runtime.orbitCenter.lerp(playerPosition, Math.min(1, delta * 3.2));
			}

			runtime.orbitAngle += delta * CIRCLE_ENEMY_ORBIT_SPEED * runtime.difficulty;
			const orbitTarget = runtime.orbitCenter.clone().add(
				new Vector3(
					Math.cos(runtime.orbitAngle) * CIRCLE_ENEMY_ORBIT_RADIUS,
					Math.sin(runtime.orbitAngle) * CIRCLE_ENEMY_ORBIT_RADIUS,
					0,
				),
			);
			const current = getEntityPosition(runtime.entity) ?? orbitTarget.clone();
			const movement = orbitTarget.clone().sub(current);
			setWorldPosition(runtime.entity, orbitTarget);
			faceEntity(
				runtime.entity,
				movement.lengthSq() > 0.0001 ? movement : DOWN_VECTOR,
			);

			if (runtime.phaseTime >= CIRCLE_ENEMY_ORBIT_DURATION_SECONDS) {
				runtime.phase = 'return';
				runtime.phaseTime = 0;
			}
			return;
		}

		case 'return': {
			const result = moveEntityTowards(
				runtime.entity,
				runtime.anchor,
				CIRCLE_ENEMY_RETURN_SPEED * runtime.difficulty,
				delta,
			);
			faceEntity(
				runtime.entity,
				result.movement.lengthSq() > 0.0001 ? result.movement : DOWN_VECTOR,
			);

			if (result.remaining <= 0.18) {
				runtime.phase = 'patrol';
				runtime.phaseTime = 0;
				runtime.abilityCooldown =
					randomBetween(2.9, CIRCLE_ENEMY_DIVE_COOLDOWN_SECONDS)
					/ runtime.difficulty;
			}
			return;
		}

		default:
			return;
	}
}
