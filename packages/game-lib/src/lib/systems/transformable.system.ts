import {
	defineSystem,
	defineQuery,
	defineComponent,
	Types,
	removeQuery,
	type IWorld,
} from 'bitecs';
import { Quaternion } from 'three';
import { StageEntity } from '../interfaces/entity';
import RAPIER from '@dimforge/rapier3d-compat';

export type StageSystem = {
	_childrenMap: Map<number, StageEntity & { body: RAPIER.RigidBody }>;
}

export const position = defineComponent({
	x: Types.f32,
	y: Types.f32,
	z: Types.f32
});

export const rotation = defineComponent({
	x: Types.f32,
	y: Types.f32,
	z: Types.f32,
	w: Types.f32
});

export const scale = defineComponent({
	x: Types.f32,
	y: Types.f32,
	z: Types.f32
});

// Reusable quaternion to avoid allocations per frame
const _tempQuaternion = new Quaternion();

export type TransformSystemResult = {
	system: ReturnType<typeof defineSystem>;
	destroy: (world: IWorld) => void;
};

export default function createTransformSystem(stage: StageSystem): TransformSystemResult {
	const queryTerms = [position, rotation];
	const transformQuery = defineQuery(queryTerms);
	const stageEntities = stage._childrenMap;

	const system = defineSystem((world) => {
		const entities = transformQuery(world);
		if (stageEntities === undefined) {
			return world;
		}

		for (const [key, stageEntity] of stageEntities) {
			// Early bailout - combine conditions
			if (!stageEntity?.body || stageEntity.markedForRemoval) {
				continue;
			}

			const id = entities[key];
			const body = stageEntity.body;
			const target = stageEntity.group ?? stageEntity.mesh;

			// Position sync
			const translation = body.translation();
			position.x[id] = translation.x;
			position.y[id] = translation.y;
			position.z[id] = translation.z;

			if (target) {
				target.position.set(translation.x, translation.y, translation.z);
			}

			// Skip rotation if controlled externally
			if (stageEntity.controlledRotation) {
				continue;
			}

			// Rotation sync - reuse quaternion
			const rot = body.rotation();
			rotation.x[id] = rot.x;
			rotation.y[id] = rot.y;
			rotation.z[id] = rot.z;
			rotation.w[id] = rot.w;

			if (target) {
				_tempQuaternion.set(rot.x, rot.y, rot.z, rot.w);
				target.setRotationFromQuaternion(_tempQuaternion);
			}
		}

		return world;
	});

	const destroy = (world: IWorld) => {
		// Remove the query from bitecs world tracking
		removeQuery(world, transformQuery);
	};

	return { system, destroy };
}