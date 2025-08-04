import { Mesh, Material, ShaderMaterial, Group, Color } from "three";
import { Collider, ColliderDesc, RigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { position, rotation, scale } from "~/lib/systems/transformable.system";
import { Vec3 } from "../core/vector";
import { MaterialBuilder, MaterialOptions } from "../graphics/material";
import { PhysicsOptions } from "../collision/physics";
import { CollisionOptions } from "../collision/collision";
import { BaseNode } from "../core/base-node";
import { DestroyContext, SetupContext, UpdateContext } from "../core/base-node-life-cycle";
import { debugState } from '../debug/debug-state';

export abstract class AbstractEntity {
	abstract uuid: string;
	abstract eid: number;
	abstract name: string;
}

export interface LifeCycleDelegate<U> {
	setup?: ((params: SetupContext<U>) => void) | ((params: SetupContext<U>) => void)[];
	update?: ((params: UpdateContext<U>) => void) | ((params: UpdateContext<U>) => void)[];
	destroy?: ((params: DestroyContext<U>) => void) | ((params: DestroyContext<U>) => void)[];
}

export interface CollisionContext<T, O extends GameEntityOptions> {
	entity: T;
	other: GameEntity<O>;
	globals?: any;
}

export interface CollisionDelegate<T, O extends GameEntityOptions> {
	collision?: ((params: CollisionContext<T, O>) => void) | ((params: CollisionContext<T, O>) => void)[];
}

export type IBuilder<BuilderOptions = any> = {
	preBuild: (options: BuilderOptions) => BuilderOptions;
	build: (options: BuilderOptions) => BuilderOptions;
	postBuild: (options: BuilderOptions) => BuilderOptions;
}

export type GameEntityOptions = {
	name?: string;
	color?: Color;
	size?: Vec3;
	position?: Vec3;
	batched?: boolean;
	collision?: Partial<CollisionOptions>;
	physics?: Partial<PhysicsOptions>;
	material?: Partial<MaterialOptions>;
	custom?: { [key: string]: any };
	collisionType?: string;
	collisionGroup?: string;
	collisionFilter?: string[];
	_builders?: {
		meshBuilder?: IBuilder | null;
		collisionBuilder?: IBuilder | null;
		materialBuilder?: MaterialBuilder | null;
	};
}

export abstract class GameEntityLifeCycle {
	abstract _setup(params: SetupContext<this>): void;
	abstract _update(params: UpdateContext<this>): void;
	abstract _destroy(params: DestroyContext<this>): void;
}

export interface EntityDebugInfo {
	buildInfo: () => Record<string, string>;
}

export class GameEntity<O extends GameEntityOptions> extends BaseNode<O> implements GameEntityLifeCycle, EntityDebugInfo {
	public group: Group | undefined;
	public mesh: Mesh | undefined;
	public materials: Material[] | undefined;
	public bodyDesc: RigidBodyDesc | null = null;
	public body: RigidBody | null = null;
	public colliderDesc: ColliderDesc | undefined;
	public collider: Collider | undefined;
	public custom: Record<string, any> = {};

	public debugInfo: Record<string, any> = {};
	public debugMaterial: ShaderMaterial | undefined;

	public lifeCycleDelegate: LifeCycleDelegate<O> | undefined;
	public collisionDelegate: CollisionDelegate<this, O> | undefined;
	public collisionType?: string;

	constructor() {
		super();
	}

	public create(): this {
		const { position: setupPosition } = this.options;
		const { x, y, z } = setupPosition || { x: 0, y: 0, z: 0 };
		this.behaviors = [
			{ component: position, values: { x, y, z } },
			{ component: scale, values: { x: 0, y: 0, z: 0 } },
			{ component: rotation, values: { x: 0, y: 0, z: 0, w: 0 } },
		];
		this.name = this.options.name || '';
		return this;
	}

	public onSetup(...callbacks: ((params: SetupContext<this>) => void)[]): this {
		this.lifeCycleDelegate = {
			...this.lifeCycleDelegate,
			setup: callbacks.length > 0 ? callbacks as unknown as ((params: SetupContext<O>) => void)[] : undefined
		};
		return this;
	}

	public onUpdate(...callbacks: ((params: UpdateContext<this>) => void)[]): this {
		this.lifeCycleDelegate = {
			...this.lifeCycleDelegate,
			update: callbacks.length > 0 ? callbacks as unknown as ((params: UpdateContext<O>) => void)[] : undefined
		};
		return this;
	}

	public onDestroy(...callbacks: ((params: DestroyContext<this>) => void)[]): this {
		this.lifeCycleDelegate = {
			...this.lifeCycleDelegate,
			destroy: callbacks.length > 0 ? callbacks as unknown as ((params: DestroyContext<O>) => void)[] : undefined
		};
		return this;
	}

	public onCollision(...callbacks: ((params: CollisionContext<this, O>) => void)[]): this {
		this.collisionDelegate = {
			collision: callbacks.length > 0 ? callbacks : undefined
		};
		return this;
	}

	public _setup(params: SetupContext<this>): void {
		if (this.lifeCycleDelegate?.setup) {
			const callbacks = this.lifeCycleDelegate.setup;
			if (typeof callbacks === 'function') {
				callbacks({ ...params, me: this as unknown as O });
			} else if (Array.isArray(callbacks)) {
				callbacks.forEach(callback => {
					callback({ ...params, me: this as unknown as O });
				});
			}
		}
	}

	public _update(params: UpdateContext<this>): void {
		this.updateMaterials(params);
		if (this.lifeCycleDelegate?.update) {
			const callbacks = this.lifeCycleDelegate.update;
			if (typeof callbacks === 'function') {
				callbacks({ ...params, me: this as unknown as O });
			} else if (Array.isArray(callbacks)) {
				callbacks.forEach(callback => {
					callback({ ...params, me: this as unknown as O });
				});
			}
		}
	}

	public _destroy(params: DestroyContext<this>): void {
		if (this.lifeCycleDelegate?.destroy) {
			const callbacks = this.lifeCycleDelegate.destroy;
			if (typeof callbacks === 'function') {
				callbacks({ ...params, me: this as unknown as O });
			} else if (Array.isArray(callbacks)) {
				callbacks.forEach(callback => {
					callback({ ...params, me: this as unknown as O });
				});
			}
		}
	}

	public _collision(other: GameEntity<O>, globals?: any): void {
		if (this.collisionDelegate?.collision) {
			const callbacks = this.collisionDelegate.collision;
			if (typeof callbacks === 'function') {
				callbacks({ entity: this, other, globals });
			} else if (Array.isArray(callbacks)) {
				callbacks.forEach(callback => {
					callback({ entity: this, other, globals });
				});
			}
		}
	}

	protected updateMaterials(params: any) {
		if (!this.materials?.length) {
			return;
		}
		for (const material of this.materials) {
			if (material instanceof ShaderMaterial) {
				if (material.uniforms) {
					material.uniforms.iTime && (material.uniforms.iTime.value += params.delta);
				}
			}
		}
		if (debugState.on) {
			// if (debugState.selected.includes(this.eid.toString())) {
			// 	debugger;
			// this.mesh?.geometry.computeVertexNormals();
			// if (this.debugMaterial && !this.materials.find(material => material === this.debugMaterial)) {
			// 	this.materials.unshift(this.debugMaterial);
			// }
			// } else {
			// 	if (this.debugMaterial && this.materials.find(material => material === this.debugMaterial)) {
			// 		this.materials = this.materials.filter(material => material !== this.debugMaterial);
			// 	}
			// }
		}
	}

	buildInfo(): Record<string, string> {
		const info: Record<string, string> = {};
		info.name = this.name;
		info.uuid = this.uuid;
		info.eid = this.eid.toString();
		return info;
	}
}
