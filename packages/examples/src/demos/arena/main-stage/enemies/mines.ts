import { Color, Vector3 } from 'three';
import { createSphere } from '@zylem/game-lib/entity';
import type { ArenaDbConnection } from '../../networking/arena-stdb-client';
import type { ArenaMainStageHandle, AvatarRecord } from '../main-stage';
import {
	spawnParticleBurst,
	type StageAddTarget,
} from '../../characters/attack-effects';
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
 * Active proximity mine planted by an iguano planter. Like projectiles, the
 * sim runs locally on the AI host; only `damage_player` reaches the network.
 */
export interface ProximityMine {
	entity: SphereEntityLike;
	/** Seconds until the mine can hurt players after spawn. */
	armTimer: number;
	lifetime: number;
}

export interface MineTuning {
	armDelay: number;
	lifetime: number;
	triggerRadius: number;
	damage: number;
	visualRadius: number;
}

export type MineList = ProximityMine[];

/**
 * Spawn a translucent mine sphere just above `pos` and register it for the
 * proximity-trigger sim. The sphere is added to `stage` immediately.
 */
export function spawnProximityMineAt(
	stage: ArenaMainStageHandle['stage'],
	mines: MineList,
	pos: Vector3,
	tuning: MineTuning,
): void {
	const sphere = createSphere({
		name: 'arena-planter-mine',
		radius: tuning.visualRadius,
		position: { x: pos.x, y: pos.y + 0.06, z: pos.z },
		material: { color: new Color(0xb4ff77), opacity: 0.55 },
		collision: { static: false },
	});
	stage.add(sphere as unknown as Parameters<typeof stage.add>[0]);
	mines.push({
		entity: sphere as unknown as SphereEntityLike,
		armTimer: tuning.armDelay,
		lifetime: tuning.lifetime,
	});
}

/**
 * Step every active mine: count down the arm timer / lifetime, detonate on
 * proximity (after arming), and apply blast damage to overlapping avatars.
 */
export function updateProximityMines(
	stage: ArenaMainStageHandle['stage'],
	burstStage: StageAddTarget,
	mines: MineList,
	avatars: ReadonlyMap<bigint, AvatarRecord>,
	conn: ArenaDbConnection,
	tuning: MineTuning,
	delta: number,
): void {
	for (let i = mines.length - 1; i >= 0; i -= 1) {
		const m = mines[i]!;
		m.lifetime -= delta;
		if (m.armTimer > 0) {
			m.armTimer = Math.max(0, m.armTimer - delta);
		}
		const minePos = m.entity.body?.translation?.() ?? {
			x: m.entity.group?.position.x ?? 0,
			y: m.entity.group?.position.y ?? 0,
			z: m.entity.group?.position.z ?? 0,
		};

		let detonate = false;
		const worldMine = new Vector3(minePos.x, minePos.y, minePos.z);
		if (m.armTimer <= 0 && m.lifetime > 0) {
			for (const av of avatars.values()) {
				const pt = avatarWorldPosition(av);
				if (!pt) continue;
				const dx = pt.x - worldMine.x;
				const dy = pt.y - worldMine.y;
				const dz = pt.z - worldMine.z;
				if (
					dx * dx + dy * dy + dz * dz <=
					tuning.triggerRadius * tuning.triggerRadius
				) {
					detonate = true;
					break;
				}
			}
		}

		if (detonate) {
			spawnParticleBurst(burstStage, worldMine, {
				color: '#b4ff44',
				count: 28,
				duration: 0.06,
				speed: [4, 12],
				size: [0.1, 0.35],
				yOffset: 0.2,
			});
			for (const av of avatars.values()) {
				const pt = avatarWorldPosition(av);
				if (!pt) continue;
				const dx = pt.x - worldMine.x;
				const dy = pt.y - worldMine.y;
				const dz = pt.z - worldMine.z;
				const blastRadius = tuning.triggerRadius + 0.6;
				if (dx * dx + dy * dy + dz * dz <= blastRadius * blastRadius) {
					void conn.reducers.damagePlayer({
						deviceId: av.deviceId,
						amount: tuning.damage,
					});
				}
			}
		}

		if (detonate || m.lifetime <= 0) {
			if (stage.wrappedStage && m.entity.uuid) {
				stage.wrappedStage.removeEntityByUuid(m.entity.uuid);
			}
			mines.splice(i, 1);
		}
	}
}

/** Best-effort cleanup used by `EnemiesHandle.reset()`. */
export function clearMines(
	stage: ArenaMainStageHandle['stage'],
	mines: MineList,
): void {
	for (const m of mines) {
		if (stage.wrappedStage && m.entity.uuid) {
			stage.wrappedStage.removeEntityByUuid(m.entity.uuid);
		}
	}
	mines.length = 0;
}
