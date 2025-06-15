import {
	defineSystem,
	defineQuery,
	defineComponent,
	Types,
} from 'bitecs';
import { Quaternion } from 'three';
import { StageEntity } from '../interfaces/entity';
import RAPIER from '@dimforge/rapier3d-compat';

export type StageSystem = {
	_childrenMap: Map<string, StageEntity & { body: RAPIER.RigidBody }>;
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

export default function createTransformSystem(stage: StageSystem) {
	const transformQuery = defineQuery([position, rotation]);
	const stageEntities = stage._childrenMap;
	return defineSystem((world) => {
		const entities = transformQuery(world);
		if (stageEntities === undefined) {
			return world;
		};
		for (let i = 0; i < entities.length; ++i) {
			const id = entities[i];
			const stageEntity = stageEntities.get(`${id}-key`);
			if (stageEntity === undefined || !stageEntity?.body) {
				continue;
			}
			const { x, y, z } = stageEntity.body.translation();
			position.x[id] = x;
			position.y[id] = y;
			position.z[id] = z;
			if (stageEntity.controlledRotation) {
				continue;
			}
			const { x: rx, y: ry, z: rz, w: rw } = stageEntity.body.rotation();
			rotation.x[id] = rx;
			rotation.y[id] = ry;
			rotation.z[id] = rz;
			rotation.w[id] = rw;
		}

		for (let i = 0; i < stageEntities.size; i++) {
			const id = entities[i];
			const stageEntity = stageEntities.get(`${id}-key`);
			if (stageEntity === undefined || !stageEntity?.body) {
				continue;
			}
			if (stageEntity.group) {
				stageEntity.group.position.set(position.x[id], position.y[id], position.z[id]);
			} else if (stageEntity.mesh) {
				stageEntity.mesh.position.set(position.x[id], position.y[id], position.z[id]);
			}
			if (stageEntity.controlledRotation) {
				continue;
			}
			const newRotation = new Quaternion(
				rotation.x[id],
				rotation.y[id],
				rotation.z[id],
				rotation.w[id]
			);
			if (stageEntity.group) {
				stageEntity.group.setRotationFromQuaternion(newRotation);
			} else if (stageEntity.mesh) {
				stageEntity.mesh.setRotationFromQuaternion(newRotation);
			}
		}

		return world;
	});
}