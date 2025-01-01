import { Mesh, Material, ShaderMaterial } from "three";
import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d-compat";

import { position, rotation, scale } from "~/lib/behaviors/components/transform";
import { Vec3 } from "../core/vector";
import { MaterialOptions } from "../graphics/material";
import { PhysicsOptions } from "../collision/physics";
import { CollisionOptions } from "../collision/collision";
import { BaseNode } from "../core/base-node";
import { DestroyContext, SetupContext, UpdateContext } from "../core/base-node-life-cycle";

export abstract class AbstractEntity {
	abstract uuid: string;
	abstract eid: number;
}

export type EntityOptions = {
	size?: Vec3;
	position?: Vec3;
	batched?: boolean;
	collision?: Partial<CollisionOptions>;
	physics?: Partial<PhysicsOptions>;
	material?: Partial<MaterialOptions>;
	custom?: { [key: string]: any };
}

export class GameEntity<O extends EntityOptions> extends BaseNode<O> {
	public group = null;
	public instanceId: number = 0;
	public mesh: Mesh | undefined;
	public materials: Material[] | undefined;
	public rigidBody: RigidBodyDesc | undefined;
	public collider: ColliderDesc | undefined;
	public custom: Record<string, any> = {};

	public create(): this {
		const { position: setupPosition } = this.options;
		const { x, y, z } = setupPosition || { x: 0, y: 0, z: 0 };
		this.behaviors = [
			{ component: position, values: { x, y, z } },
			{ component: scale, values: { x: 0, y: 0, z: 0 } },
			{ component: rotation, values: { x: 0, y: 0, z: 0, w: 0 } },
		];
		return this;
	}

	protected _setup(params: SetupContext<this>): void { }

	protected _update(params: UpdateContext<this>): void {
		this.updateMaterials(params);
	}

	protected _destroy(params: DestroyContext<this>): void { }

	protected updateMaterials(params: any) {
		if (!this.materials?.length) {
			return;
		}
		for (const material of this.materials) {
			if (material instanceof ShaderMaterial) {
				if (material.uniforms) {
					material.uniforms.iTime.value += params.delta;
				}
			}
		}
	}
}