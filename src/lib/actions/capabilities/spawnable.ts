import { Euler, Quaternion, Vector3 } from 'three';
import { stageState } from '../../stage/stage-state';
import { EntityWithBody } from "./moveable";
import { OptionalVector } from '../../interfaces/entity';
import { cloneDeep } from 'es-toolkit';

export interface SpawnableEntity {
	spawn: <TFactory extends (options: any) => any>(factory: TFactory, options: Parameters<TFactory>[0]) => ReturnType<TFactory>;
	spawnRelative: <TFactory extends (options: any) => any>(factory: TFactory, options: Parameters<TFactory>[0], offset: OptionalVector) => ReturnType<TFactory>;
}

export function makeSpawnable<T extends EntityWithBody>(entity: T): T & SpawnableEntity {
	const entityClone = cloneDeep(entity);
	const spawnable = entityClone as T & SpawnableEntity;

	// spawnable.spawn = (options) => {
	// 	const stage = (stageState as any).stageRef;
	// 	const instance = factory(options);
	// 	stage?.enqueue(instance as any);
	// 	return instance;
	// };

	// spawnable.spawnRelative = (options, offset) => {
	// 	const stage = (stageState as any).stageRef;
	// 	if (!entityClone.body) {
	// 		console.warn('body missing for entity during spawnRelative');
	// 		return;
	// 	}
	// 	const { x, y, z } = entityClone.body.translation();
	// 	let rz = (entityClone as any)._rotation2DAngle ?? 0;
	// 	try {
	// 		const r = entityClone.body.rotation();
	// 		const q = new Quaternion(r.x, r.y, r.z, r.w);
	// 		const e = new Euler().setFromQuaternion(q, 'XYZ');
	// 		rz = e.z;
	// 	} catch { /* fallback to provided or zero */ }
	// 	const offsetX = Math.sin(-rz) * (offset.x ?? 0);
	// 	const offsetY = Math.cos(-rz) * (offset.y ?? 0);
	// 	const merged = { ...options, position: new Vector3(x + offsetX, y + offsetY, z + (offset.z ?? 0)) };
	// 	const instance = factory(merged);
	// 	stage?.enqueue(instance as any);
	// 	return instance;
	// };

	return spawnable;
}