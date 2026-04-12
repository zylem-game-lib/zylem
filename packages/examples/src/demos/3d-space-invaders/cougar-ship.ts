import { Vector3 } from 'three';
import {
	createEnemyRuntime,
	type EnemyFactoryOptions,
	type EnemyRuntime,
	type EnemyUpdateContext,
} from './enemy-common';
import cougarShipGlb from '../../assets/cougar-ship.glb';
import {
	CHARGE_ENEMY_COOLDOWN_SECONDS,
	CHARGE_ENEMY_FIRE_COOLDOWN_SECONDS,
	CHARGE_ENEMY_PATROL_RANGE,
	CHARGE_ENEMY_PATROL_SPEED,
	CHARGE_ENEMY_PREPARE_SECONDS,
	CHARGE_ENEMY_RECOVER_SPEED,
	CHARGE_ENEMY_SPEED,
	DOWN_VECTOR,
	ENEMY_COLORS,
	ENEMY_VERTICAL_BOB_AMPLITUDE,
	PLAYER_START_Y,
	WRAP_HEIGHT,
	WRAP_WIDTH,
	faceEntity,
	getDifficultyScale,
	getEntityPosition,
	moveEntityTowards,
	randomBetween,
	setWorldPosition,
} from './shared';

const COUGAR_SHIP_SCALE = 1.4;
const COUGAR_SHIP_COLLISION_SIZE = { x: 1.15, y: 0.92, z: 1.3 } as const;
const COUGAR_SHIP_COLLISION_POSITION = { x: 0, y: -0.08, z: 0 } as const;

export function createCougarShipRuntime({
	anchor,
	waveNumber,
	index,
}: EnemyFactoryOptions): EnemyRuntime {
	const difficulty = getDifficultyScale(waveNumber);
	return createEnemyRuntime({
		name: `3d-space-invaders-cougar-${waveNumber}-${index + 1}`,
		kind: 'charge',
		model: cougarShipGlb,
		anchor,
		scale: COUGAR_SHIP_SCALE,
		collisionSize: COUGAR_SHIP_COLLISION_SIZE,
		collisionPosition: COUGAR_SHIP_COLLISION_POSITION,
		fractureSeed: waveNumber * 103 + index * 17 + 43,
		fragmentCount: 12,
		patrolRange: CHARGE_ENEMY_PATROL_RANGE,
		patrolSpeed: CHARGE_ENEMY_PATROL_SPEED,
		fireCooldown:
			randomBetween(1.05, CHARGE_ENEMY_FIRE_COOLDOWN_SECONDS) / difficulty,
		abilityCooldown:
			randomBetween(3.2, CHARGE_ENEMY_COOLDOWN_SECONDS) / difficulty,
		phaseOffset: index * 0.6 + Math.random() * 0.4,
		difficulty,
	});
}

export function updateCougarShip(
	runtime: EnemyRuntime,
	{
		delta,
		getPlayerPosition,
		addProjectile,
		createStraightEnemyBullet,
	}: EnemyUpdateContext,
) {
	switch (runtime.phase) {
		case 'patrol': {
			const current = getEntityPosition(runtime.entity) ?? runtime.anchor.clone();
			const time = runtime.time * runtime.patrolSpeed + runtime.phaseOffset;
			const target = new Vector3(
				runtime.anchor.x + Math.sin(time) * runtime.patrolRange,
				runtime.anchor.y
				+ Math.sin(time * 1.3) * ENEMY_VERTICAL_BOB_AMPLITUDE * 0.7,
				0,
			);
			const movement = target.clone().sub(current);
			setWorldPosition(runtime.entity, target);
			faceEntity(
				runtime.entity,
				movement.lengthSq() > 0.0001 ? movement : DOWN_VECTOR,
			);

			runtime.fireCooldown -= delta * Math.max(1, runtime.difficulty * 0.8);
			if (runtime.fireCooldown <= 0) {
				addProjectile(
					createStraightEnemyBullet(
						target.clone().add(new Vector3(0, -0.95, 0)),
						ENEMY_COLORS.charge,
					),
				);
				runtime.fireCooldown =
					randomBetween(1.2, CHARGE_ENEMY_FIRE_COOLDOWN_SECONDS)
					/ runtime.difficulty;
			}

			runtime.abilityCooldown -= delta * Math.max(1, runtime.difficulty * 0.76);
			if (runtime.abilityCooldown <= 0) {
				runtime.phase = 'pause';
				runtime.phaseTime = 0;
			}
			return;
		}

		case 'pause': {
			const current = getEntityPosition(runtime.entity) ?? runtime.anchor.clone();
			const playerPosition = getPlayerPosition();
			if (playerPosition) {
				faceEntity(runtime.entity, playerPosition.clone().sub(current));
			}

			if (runtime.phaseTime < CHARGE_ENEMY_PREPARE_SECONDS) {
				return;
			}

			const playerTarget =
				getPlayerPosition() ?? new Vector3(runtime.anchor.x, PLAYER_START_Y, 0);
			const chargeDirection = playerTarget.clone().sub(current);
			chargeDirection.y -= 2.6;
			if (chargeDirection.y > -0.5) {
				chargeDirection.y = -0.5;
			}
			if (chargeDirection.lengthSq() <= 0.0001) {
				chargeDirection.copy(DOWN_VECTOR);
			}
			chargeDirection.normalize();
			runtime.chargeVelocity.copy(
				chargeDirection.multiplyScalar(CHARGE_ENEMY_SPEED * runtime.difficulty),
			);
			runtime.phase = 'charge';
			runtime.phaseTime = 0;
			return;
		}

		case 'charge': {
			const current = getEntityPosition(runtime.entity) ?? runtime.anchor.clone();
			const nextPosition = current.clone().addScaledVector(
				runtime.chargeVelocity,
				delta,
			);
			let didWrap = false;
			const wrapHalfWidth = WRAP_WIDTH * 0.5 + 0.8;
			const wrapHalfHeight = WRAP_HEIGHT * 0.5 + 0.8;

			if (nextPosition.x < -wrapHalfWidth) {
				nextPosition.x = wrapHalfWidth;
				didWrap = true;
			} else if (nextPosition.x > wrapHalfWidth) {
				nextPosition.x = -wrapHalfWidth;
				didWrap = true;
			}

			if (nextPosition.y < -wrapHalfHeight) {
				nextPosition.y = wrapHalfHeight;
				didWrap = true;
			} else if (nextPosition.y > wrapHalfHeight) {
				nextPosition.y = -wrapHalfHeight;
				didWrap = true;
			}

			setWorldPosition(runtime.entity, nextPosition);
			faceEntity(runtime.entity, runtime.chargeVelocity);

			if (didWrap) {
				runtime.phase = 'recover';
				runtime.phaseTime = 0;
			}
			return;
		}

		case 'recover': {
			const result = moveEntityTowards(
				runtime.entity,
				runtime.anchor,
				CHARGE_ENEMY_RECOVER_SPEED * runtime.difficulty,
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
					randomBetween(3.3, CHARGE_ENEMY_COOLDOWN_SECONDS)
					/ runtime.difficulty;
			}
			return;
		}

		default:
			return;
	}
}
