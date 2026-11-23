import type { GameEntityOptions } from '../entity';
import { VEC3_ONE, type Vec3Input, toThreeVector3 } from '../../core/vector';
import type { MaterialOptions } from '../../graphics/material';
import { commonDefaults } from '../common';
import { standardShader } from '../../graphics/shaders/standard.shader';
import { Vector3 } from 'three';

type AnimationObject = {
	key?: string;
	path: string;
};

export type CollisionShapeType = 'capsule' | 'bounds' | 'trimesh' | 'model';
export type ResolvedCollisionShape = 'capsule' | 'bounds' | 'trimesh';

export type ZylemActorOptions = GameEntityOptions & {
	static?: boolean;
	animations?: AnimationObject[];
	models?: string[];
	scale?: Vec3Input;
	material?: MaterialOptions;
	collisionShape?: CollisionShapeType;
	/**
	 * Opt-in: also strip the root bone's Y translation track so the
	 * mixer never overrides the bind-pose hip Y. Useful when the
	 * actor is shown statically (e.g. a lobby preview) and you want
	 * to suppress the bind→animation Y "snap" at load time. Defaults
	 * to false because most FBX exports use the Y track as a
	 * hip-height calibration that the renderer needs to keep feet on
	 * the ground.
	 */
	stripRootMotionY?: boolean;
};

export const actorDefaults: ZylemActorOptions = {
	...commonDefaults,
	material: {
		shader: standardShader,
	},
	animations: [],
	models: [],
	collisionShape: 'capsule',
};

export function getActorScale(options: ZylemActorOptions): Vector3 {
	return toThreeVector3(options.scale, VEC3_ONE);
}
