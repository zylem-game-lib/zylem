import {
	defineSystem,
	defineQuery,
} from 'bitecs'

import { position, scale, rotation } from './transform';
import { ZylemStage } from '~/main';
import { Quaternion } from 'three';

export default function createTransformSystem(stage: ZylemStage) {
	const transformQuery = defineQuery([position, rotation])
	const stageEntities = stage._childrenMap;
	return defineSystem((world) => {
		const entities = transformQuery(world);
		if (stageEntities === undefined) {
			return world
		};
		for (let i = 0; i < entities.length; ++i)
		{
			const id = entities[i]
			const stageEntity = stageEntities.get(id)
			if (stageEntity === undefined) {
				continue
			}
			const { x, y, z } = stageEntity.body.translation();
			position.x[id] = x;
			position.y[id] = y;
			position.z[id] = z;
			stageEntity.group.position.set(position.x[id], position.y[id], position.z[id]);
			if (!stageEntity.controlledRotation) {
				const { x: rx, y: ry, z: rz, w: rw } = stageEntity.body.rotation();
				rotation.x[id] = rx;
				rotation.y[id] = ry;
				rotation.z[id] = rz;
				rotation.w[id] = rw;
				stageEntity.group.setRotationFromQuaternion(new Quaternion(rx, ry, rz, rw));
			}
		}
	
		return world
	})
}