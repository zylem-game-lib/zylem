/**
 * Stream a level buffer into a stage through the catalog.
 *
 * `streamLevel` only walks entries. This is the call gameplay code makes:
 * each entry is created from its catalog id, spawned, then posed. Unknown
 * catalog ids are skipped. Batching stays in `streamLevel`.
 */

import type { LevelBuffer, LevelEntry } from '@zylem/bridge';
import { applyEntityPose, commitEntityScale } from '../bridge/game-bridge';
import type { BaseNode } from '../core/base-node';
import { getEntityType } from '../entities/entity-registry';
import { streamLevel, type StreamLevelOptions, type StreamLevelResult } from './stream-level';

/** The slice of a stage `streamLevelOnStage` needs. */
export interface LevelStage {
	spawnEntity(node: BaseNode): Promise<void> | void;
}

/**
 * Spawn every catalog entry in `buffer` onto `stage`.
 *
 * Position is handed to the type's factory. Rotation and scale are applied
 * after spawn, and a scale change rebuilds colliders. An entry whose catalog
 * id is not registered is skipped.
 */
export function streamLevelOnStage(
	stage: LevelStage,
	buffer: LevelBuffer,
	options?: StreamLevelOptions,
): Promise<StreamLevelResult> {
	return streamLevel(buffer, (entry) => spawnEntry(stage, entry), options);
}

async function spawnEntry(stage: LevelStage, entry: LevelEntry): Promise<void> {
	const registration = getEntityType(entry.typeId);
	if (!registration) return;

	const position = entry.pose.position ?? { x: 0, y: 0, z: 0 };
	const node = await registration.create({
		position,
		props: { ...(registration.defaultProps ?? {}) },
	});
	if (!node) return;

	await stage.spawnEntity(node);
	applyEntityPose(node, entry.pose);
	if (entry.pose.scale) commitEntityScale(node);
}
