import { Quaternion } from 'three';
import { StageEntity } from '../interfaces/entity';
import {
	getBodyRenderPose,
	type PhysicsPoseReadable,
} from '../physics/physics-pose';

export type StageSystem = {
	_childrenMap: Map<string, StageEntity & { body: PhysicsPoseReadable | null }>;
	_world: { interpolationAlpha: number } | null;
};

const _tempQuaternion = new Quaternion();

/**
 * Copies each entity’s physics/render-interpolated pose onto its Three.js
 * `group` or `mesh` transform. No ECS storage — the rigid body (or wasm
 * proxy) remains the source of truth.
 */
export function syncRenderPoses(stage: StageSystem): void {
	const stageEntities = stage._childrenMap;
	const interpolationSource = stage._world;

	for (const [, stageEntity] of stageEntities) {
		if (!stageEntity?.body || stageEntity.markedForRemoval) {
			continue;
		}

		// Instanced and bundled entities are synced by RenderStrategyManager / bundles.
		// Camera-parented viewmodels own their local transform.
		if (
			stageEntity.isInstanced
			|| stageEntity.isBundled
			|| stageEntity.skipRenderPoseSync
		) {
			continue;
		}

		const body = stageEntity.body;
		const target = stageEntity.group ?? stageEntity.mesh;
		const renderPose = target
			? getBodyRenderPose(body, interpolationSource?.interpolationAlpha ?? 0)
			: null;

		if (target && renderPose) {
			target.position.set(
				renderPose.position.x,
				renderPose.position.y,
				renderPose.position.z,
			);
		}

		if (stageEntity.controlledRotation) {
			continue;
		}

		if (target && renderPose) {
			_tempQuaternion.set(
				renderPose.rotation.x,
				renderPose.rotation.y,
				renderPose.rotation.z,
				renderPose.rotation.w,
			);
			target.setRotationFromQuaternion(_tempQuaternion);
		}
	}
}
