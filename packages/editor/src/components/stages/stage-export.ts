/**
 * Stage export.
 *
 * Edits are runtime-only: moving a crate in the editor does not rewrite the
 * source that created it. Export is the bridge between the two — it dumps the
 * current stage as JSON so the values can be pasted back into the code that
 * authored the scene. Source write-back is a later problem; this makes the work
 * recoverable in the meantime.
 *
 * Built from the editor's own bridge state rather than `@zylem/game-lib/schema`,
 * because the editor has no game-lib dependency at runtime and the entity
 * blueprint schema stores 2D positions, which would drop the Z of every
 * transform this feature exists to preserve.
 */

import type { Vector3Like } from '../../types';
import { stageState } from './stage-state';

export interface StageExportEntity {
	uuid: string;
	name?: string;
	type?: string;
	position?: Vector3Like;
	/** Euler angles in radians, matching the game's own representation. */
	rotation?: Vector3Like;
	scale?: Vector3Like;
}

export interface StageExport {
	/** Bumped when the shape changes, so an old file is recognisable. */
	version: 1;
	exportedAt: string;
	stage: {
		id: string;
		backgroundColor: string;
		backgroundImage: string | null;
		gravity: Vector3Like;
		variables: Record<string, unknown>;
	} | null;
	entities: StageExportEntity[];
}

/** Snapshot the current stage as a plain, serializable object. */
export function buildStageExport(): StageExport {
	const config = stageState.config;
	const entities: StageExportEntity[] = [];

	for (const entity of stageState.entities) {
		if (!entity.uuid) continue;
		const record: StageExportEntity = { uuid: entity.uuid };
		if (entity.name !== undefined) record.name = entity.name;
		if (entity.type !== undefined) record.type = entity.type;
		if (entity.position) record.position = { ...entity.position };
		if (entity.rotation) record.rotation = { ...entity.rotation };
		if (entity.scale) record.scale = { ...entity.scale };
		entities.push(record);
	}

	return {
		version: 1,
		exportedAt: new Date().toISOString(),
		stage: config
			? {
					id: config.id,
					backgroundColor: config.backgroundColor,
					backgroundImage: config.backgroundImage,
					gravity: { ...config.gravity },
					variables: { ...config.variables },
				}
			: null,
		entities,
	};
}

/** The export as formatted JSON. */
export function stageExportToString(): string {
	return JSON.stringify(buildStageExport(), null, 2);
}

/**
 * Copy the export to the clipboard.
 *
 * @returns The serialized stage when the copy succeeded, or `null` when the
 * clipboard was unavailable — over plain HTTP, or without a user gesture, the
 * API is either missing or rejects, and the caller falls back to the console.
 */
export async function copyStageExport(): Promise<string | null> {
	const json = stageExportToString();
	if (!navigator.clipboard?.writeText) return null;
	try {
		await navigator.clipboard.writeText(json);
		return json;
	} catch {
		return null;
	}
}
