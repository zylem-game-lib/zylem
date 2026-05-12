import { Color, Vector3 } from 'three';
import { createSphere } from '@zylem/game-lib/entity';
import type { ArenaDbConnection } from '../../networking/arena-stdb-client';
import type { ArenaMainStageHandle, AvatarRecord } from '../main-stage';
import { avatarWorldPosition } from './shared';

interface SphereEntityLike {
	uuid: string;
	group:
		| {
				position: { x: number; y: number; z: number };
		  }
		| null
		| undefined;
	body?:
		| {
				setTranslation(
					v: { x: number; y: number; z: number },
					wake: boolean,
				): void;
				translation(): { x: number; y: number; z: number };
		  }
		| undefined;
}

/**
 * In-flight projectile spawned by an iguano shooter. Kinematics are simulated
 * locally on the AI host (no STDB sync) — only the resulting `damage_player`
 * call hits the network.
 */
export interface ProjectileSim {
	entity: SphereEntityLike;
	velocity: Vector3;
	life: number;
	/** World-space vertical acceleration applied each tick (typically ≤ 0 for lob arc). */
	gravityY: number;
	damage: number;
	hitRadius: number;
}

export interface ProjectileTuning {
	horizSpeed: number;
	upBias: number;
	gravity: number;
	lifetime: number;
	damage: number;
	hitRadius: number;
}

export type ProjectileList = ProjectileSim[];

/**
 * Construct a low-arc projectile from `from` aimed at `toward` (XZ-normalised),
 * push it onto the active-projectile list, and add the visible sphere to the
 * stage. Caller-controlled tuning keeps shooter-specific values out of here.
 */
export function spawnLobProjectile(
	stage: ArenaMainStageHandle['stage'],
	projectiles: ProjectileList,
	from: Vector3,
	toward: Vector3,
	tuning: ProjectileTuning,
): void {
	const flat = new Vector3(toward.x - from.x, 0, toward.z - from.z);
	if (flat.lengthSq() < 0.0001) flat.set(0, 0, 1);
	flat.normalize();
	const vel = new Vector3(
		flat.x * tuning.horizSpeed,
		tuning.upBias,
		flat.z * tuning.horizSpeed,
	);

	const bullet = createSphere({
		name: 'arena-enemy-lob',
		radius: 0.4,
		position: { x: from.x, y: from.y + 0.8, z: from.z },
		material: { color: new Color(0xffaa66), opacity: 0.94 },
		collision: { static: false },
	});
	stage.add(bullet as unknown as Parameters<typeof stage.add>[0]);
	projectiles.push({
		entity: bullet as unknown as SphereEntityLike,
		velocity: vel,
		life: tuning.lifetime,
		gravityY: tuning.gravity,
		damage: tuning.damage,
		hitRadius: tuning.hitRadius,
	});
}

/**
 * Step every active projectile: integrate gravity, advance position, test
 * proximity vs every avatar (uses fall-through to `group.position` for the
 * wasm-runtime local player), and despawn on hit / lifetime / ground touch.
 */
export function updateProjectiles(
	stage: ArenaMainStageHandle['stage'],
	projectiles: ProjectileList,
	avatars: ReadonlyMap<bigint, AvatarRecord>,
	conn: ArenaDbConnection,
	delta: number,
): void {
	for (let i = projectiles.length - 1; i >= 0; i -= 1) {
		const p = projectiles[i]!;
		p.life -= delta;
		p.velocity.y += p.gravityY * delta;
		const current = p.entity.body?.translation?.() ?? {
			x: p.entity.group?.position.x ?? 0,
			y: p.entity.group?.position.y ?? 0,
			z: p.entity.group?.position.z ?? 0,
		};
		const next = {
			x: current.x + p.velocity.x * delta,
			y: current.y + p.velocity.y * delta,
			z: current.z + p.velocity.z * delta,
		};
		p.entity.body?.setTranslation(next, true);
		if (p.entity.group) {
			p.entity.group.position.x = next.x;
			p.entity.group.position.y = next.y;
			p.entity.group.position.z = next.z;
		}

		let hit = false;
		for (const av of avatars.values()) {
			const pt = avatarWorldPosition(av);
			if (!pt) continue;
			const dx = pt.x - next.x;
			const dy = pt.y - next.y;
			const dz = pt.z - next.z;
			if (dx * dx + dy * dy + dz * dz <= p.hitRadius * p.hitRadius) {
				void conn.reducers.damagePlayer({
					deviceId: av.deviceId,
					amount: p.damage,
				});
				hit = true;
				break;
			}
		}

		if (hit || p.life <= 0 || next.y < 0.1) {
			if (stage.wrappedStage && p.entity.uuid) {
				stage.wrappedStage.removeEntityByUuid(p.entity.uuid);
			}
			projectiles.splice(i, 1);
		}
	}
}

/**
 * Best-effort cleanup used by `EnemiesHandle.reset()`. Removes every active
 * projectile entity from the stage and empties the list in place.
 */
export function clearProjectiles(
	stage: ArenaMainStageHandle['stage'],
	projectiles: ProjectileList,
): void {
	for (const p of projectiles) {
		if (stage.wrappedStage && p.entity.uuid) {
			stage.wrappedStage.removeEntityByUuid(p.entity.uuid);
		}
	}
	projectiles.length = 0;
}
