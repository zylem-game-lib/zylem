import { Euler, Quaternion, Vector2 } from "three";
import { GameEntity } from "../entities";
import { Stage } from "./stage";

export interface EntitySpawner {
	spawn: (stage: Stage, x: number, y: number) => Promise<GameEntity<any>>;
	spawnRelative: (source: any, stage: Stage, offset?: Vector2) => Promise<any | void>;
}

export function entitySpawner(factory: (x: number, y: number) => Promise<any> | GameEntity<any>): EntitySpawner {
	return {
		spawn: async (stage: Stage, x: number, y: number) => {
			const instance = await Promise.resolve(factory(x, y));
			stage.add(instance);
			return instance;
		},
		spawnRelative: async (source: any, stage: Stage, offset: Vector2 = new Vector2(0, 1)) => {
			if (!source.body) {
				console.warn('body missing for entity during spawnRelative');
				return undefined;
			}

			const { x, y, z } = source.body.translation();
			let rz = (source as any)._rotation2DAngle ?? 0;
			try {
				const r = source.body.rotation();
				const q = new Quaternion(r.x, r.y, r.z, r.w);
				const e = new Euler().setFromQuaternion(q, 'XYZ');
				rz = e.z;
			} catch { /* use fallback angle */ }

			const offsetX = Math.sin(-rz) * (offset.x ?? 0);
			const offsetY = Math.cos(-rz) * (offset.y ?? 0);

			const instance = await Promise.resolve(factory(x + offsetX, y + offsetY));
			stage.add(instance);
			return instance;
		}
	};
}