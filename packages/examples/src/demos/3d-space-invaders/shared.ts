import type { Mesh, Object3D } from 'three';
import { Vector3 } from 'three';

export type EnemyKind = 'sine' | 'circle' | 'charge';

export type PositionableEntity = {
	getPosition: () => { x: number; y: number; z?: number } | null;
	setPosition: (x: number, y: number, z: number) => void;
	setPositionZ: (z: number) => void;
	body?: {
		setTranslation?: (
			translation: { x: number; y: number; z: number },
			wakeUp: boolean,
		) => void;
	} | null;
};

export type RotatableEntity = {
	setRotation: (x: number, y: number, z: number) => void;
};

export const PLAYFIELD_WIDTH = 30;
export const PLAYFIELD_HEIGHT = 20;
export const WRAP_WIDTH = 34;
export const WRAP_HEIGHT = 24;

export const PLAYER_START_Y = -8.3;
export const PLAYER_BOUNDS_X = PLAYFIELD_WIDTH * 0.5 - 1.4;
export const PLAYER_MAX_LIVES = 3;
export const PLAYER_SPEED = 13.5;
export const PLAYER_SHOOT_COOLDOWN_SECONDS = 0.18;
export const PLAYER_DAMAGE_COOLDOWN_SECONDS = 1.15;
export const PLAYER_BULLET_SPEED = 22;
export const SHIP_FRAGMENT_TTL_SECONDS = 2.8;

export const ENEMY_BULLET_SPEED = 10.5;
export const SINE_BULLET_AMPLITUDE = 1.35;
export const SINE_BULLET_FREQUENCY = 7.5;
export const BULLET_RADIUS = 0.16;
export const BULLET_BOUNDS_X = PLAYFIELD_WIDTH * 0.5 + 3.5;
export const BULLET_BOUNDS_Y = PLAYFIELD_HEIGHT * 0.5 + 4;

export const ENEMY_VERTICAL_BOB_AMPLITUDE = 0.18;

export const SINE_ENEMY_PATROL_RANGE = 4.4;
export const SINE_ENEMY_PATROL_SPEED = 1.55;
export const SINE_ENEMY_FIRE_COOLDOWN_SECONDS = 1.6;

export const CIRCLE_ENEMY_PATROL_RANGE = 2.8;
export const CIRCLE_ENEMY_PATROL_SPEED = 1.1;
export const CIRCLE_ENEMY_DIVE_SPEED = 8.4;
export const CIRCLE_ENEMY_RETURN_SPEED = 10.4;
export const CIRCLE_ENEMY_ORBIT_RADIUS = 2.15;
export const CIRCLE_ENEMY_ORBIT_SPEED = 3.8;
export const CIRCLE_ENEMY_ORBIT_DURATION_SECONDS = 2.25;
export const CIRCLE_ENEMY_DIVE_COOLDOWN_SECONDS = 4.2;

export const CHARGE_ENEMY_PATROL_RANGE = 3.4;
export const CHARGE_ENEMY_PATROL_SPEED = 1.65;
export const CHARGE_ENEMY_FIRE_COOLDOWN_SECONDS = 1.75;
export const CHARGE_ENEMY_PREPARE_SECONDS = 0.52;
export const CHARGE_ENEMY_SPEED = 16.5;
export const CHARGE_ENEMY_RECOVER_SPEED = 9.8;
export const CHARGE_ENEMY_COOLDOWN_SECONDS = 4.8;

export const DIFFICULTY_STEP_PER_WAVE = 0.09;
export const WAVE_RESPAWN_DELAY_SECONDS = 1.35;
export const ANNOUNCEMENT_DURATION_SECONDS = 1.1;

export const PLAYER_MODEL_TILT_X = -Math.PI / 2;
export const PLAYER_MODEL_YAW_OFFSET = Math.PI;
export const ENEMY_MODEL_TILT_X = PLAYER_MODEL_TILT_X;
export const ENEMY_MODEL_YAW_OFFSET = PLAYER_MODEL_YAW_OFFSET;

export const PLAYER_COLOR = '#7dd3fc';
export const ENEMY_COLORS: Record<EnemyKind, string> = {
	sine: '#22c55e',
	circle: '#ef4444',
	charge: '#a855f7',
};

export const ENEMY_SCORES: Record<EnemyKind, number> = {
	sine: 120,
	circle: 175,
	charge: 150,
};

export const WAVE_COLUMNS = [-7.5, 0, 7.5] as const;
export const WAVE_ROWS: Record<EnemyKind, number> = {
	sine: 7.4,
	circle: 5.1,
	charge: 2.8,
};
export const WAVE_KIND_ORDER = [
	'sine',
	'circle',
	'charge',
] as const satisfies readonly EnemyKind[];

export const PLAYER_COLLISION_TYPE = 'space-invaders-player';
export const PLAYER_BULLET_COLLISION_TYPE = 'space-invaders-player-bullet';
export const ENEMY_COLLISION_TYPE = 'space-invaders-enemy';
export const ENEMY_BULLET_COLLISION_TYPE = 'space-invaders-enemy-bullet';
export const PLAYER_SHIELD_COLLISION_TYPE = 'space-invaders-player-shield';

export const DOWN_VECTOR = new Vector3(0, -1, 0);

export function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

export function randomBetween(min: number, max: number) {
	return min + Math.random() * (max - min);
}

export function getDifficultyScale(wave: number) {
	return 1 + Math.max(0, wave - 1) * DIFFICULTY_STEP_PER_WAVE;
}

export function getFacingAngleForVector(vector: Pick<Vector3, 'x' | 'y'>) {
	if (Math.abs(vector.x) <= 0.0001 && Math.abs(vector.y) <= 0.0001) {
		return Math.PI;
	}

	return Math.atan2(-vector.x, vector.y);
}

export function setWorldPosition(
	entity: PositionableEntity,
	position: Vector3,
) {
	entity.setPosition(position.x, position.y, position.z);
	entity.body?.setTranslation?.(
		{ x: position.x, y: position.y, z: position.z },
		true,
	);
	entity.setPositionZ(position.z);
}

export function getEntityPosition(entity: Pick<PositionableEntity, 'getPosition'>) {
	const position = entity.getPosition();
	if (!position) {
		return null;
	}

	return new Vector3(position.x, position.y, position.z ?? 0);
}

export function faceEntity(
	entity: RotatableEntity,
	direction: Vector3,
) {
	entity.setRotation(0, 0, getFacingAngleForVector(direction));
}

export function getModelRoot(entity: { group?: Object3D | null }) {
	return entity.group?.children[0] ?? null;
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

export function orientEntityModel(
	entity: { group?: Object3D | null },
	tiltX = ENEMY_MODEL_TILT_X,
	yawOffset = ENEMY_MODEL_YAW_OFFSET,
) {
	const modelRoot = getModelRoot(entity);
	if (!modelRoot) {
		return;
	}

	modelRoot.rotation.set(tiltX, 0, yawOffset);
}

export function moveEntityTowards(
	entity: PositionableEntity,
	target: Vector3,
	speed: number,
	delta: number,
) {
	const current = getEntityPosition(entity) ?? target.clone();
	const offset = target.clone().sub(current);
	const distance = offset.length();

	if (distance <= 0.0001) {
		setWorldPosition(entity, target);
		return {
			position: target.clone(),
			movement: new Vector3(),
			remaining: 0,
		};
	}

	const maxStep = speed * delta;
	if (distance <= maxStep) {
		setWorldPosition(entity, target);
		return {
			position: target.clone(),
			movement: offset,
			remaining: 0,
		};
	}

	const movement = offset.normalize().multiplyScalar(maxStep);
	const nextPosition = current.clone().add(movement);
	setWorldPosition(entity, nextPosition);
	return {
		position: nextPosition,
		movement,
		remaining: distance - maxStep,
	};
}

export function setEntityVisibility(
	entity: { group?: { visible: boolean } | null; mesh?: { visible: boolean } | null },
	visible: boolean,
) {
	if (entity.group) {
		entity.group.visible = visible;
	}

	if (entity.mesh) {
		entity.mesh.visible = visible;
	}
}
