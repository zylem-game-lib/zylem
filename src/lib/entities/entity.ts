import { Mesh, Material, ShaderMaterial, Group, Color } from "three";
import { Collider, ColliderDesc, RigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { position, rotation, scale } from "../systems/transformable.system";
import { Vec3 } from "../core/vector";
import { MaterialBuilder, MaterialOptions } from "../graphics/material";
import { CollisionOptions } from "../collision/collision";
import { BaseNode } from "../core/base-node";
import { DestroyContext, SetupContext, UpdateContext, LoadedContext, CleanupContext } from "../core/base-node-life-cycle";
import type { EntityMeshBuilder, EntityCollisionBuilder } from "./builder";
import { Behavior } from "../actions/behaviors/behavior";

export interface LifeCycleDelegate<U> {
	setup?: ((params: SetupContext<U>) => void)[];
	update?: ((params: UpdateContext<U>) => void)[];
	destroy?: ((params: DestroyContext<U>) => void)[];
}

export interface CollisionContext<T, O extends GameEntityOptions, TGlobals extends Record<string, unknown> = any> {
	entity: T;
	other: GameEntity<O>;
	globals: TGlobals;
}

export type BehaviorContext<T, O extends GameEntityOptions> =
	SetupContext<T, O> |
	UpdateContext<T, O> |
	CollisionContext<T, O> |
	DestroyContext<T, O>;

export type BehaviorCallback<T, O extends GameEntityOptions> = (params: BehaviorContext<T, O>) => void;

export interface CollisionDelegate<T, O extends GameEntityOptions> {
	collision?: ((params: CollisionContext<T, O>) => void)[];
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
	material?: Partial<MaterialOptions>;
	custom?: { [key: string]: any };
	collisionType?: string;
	collisionGroup?: string;
	collisionFilter?: string[];
	_builders?: {
		meshBuilder?: IBuilder | EntityMeshBuilder | null;
		collisionBuilder?: IBuilder | EntityCollisionBuilder | null;
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

export type BehaviorCallbackType = 'setup' | 'update' | 'destroy' | 'collision';

export class GameEntity<O extends GameEntityOptions> extends BaseNode<O> implements
	GameEntityLifeCycle,
	EntityDebugInfo {
	public behaviors: Behavior[] = [];
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

	public lifeCycleDelegate: LifeCycleDelegate<O> = {
		setup: [],
		update: [],
		destroy: [],
	};
	public collisionDelegate: CollisionDelegate<this, O> = {
		collision: [],
	};
	public collisionType?: string;

	public behaviorCallbackMap: Record<BehaviorCallbackType, BehaviorCallback<this, O>[]> = {
		setup: [],
		update: [],
		destroy: [],
		collision: [],
	};

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
		const combineCallbacks = [...(this.lifeCycleDelegate.setup ?? []), ...callbacks];
		this.lifeCycleDelegate = {
			...this.lifeCycleDelegate,
			setup: combineCallbacks as unknown as ((params: SetupContext<O>) => void)[]
		};
		return this;
	}

	public onUpdate(...callbacks: ((params: UpdateContext<this>) => void)[]): this {
		const combineCallbacks = [...(this.lifeCycleDelegate.update ?? []), ...callbacks];
		this.lifeCycleDelegate = {
			...this.lifeCycleDelegate,
			update: combineCallbacks as unknown as ((params: UpdateContext<O>) => void)[]
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
		this.behaviorCallbackMap.setup.forEach(callback => {
			callback({ ...params, me: this });
		});
		if (this.lifeCycleDelegate.setup?.length) {
			const callbacks = this.lifeCycleDelegate.setup;
			callbacks.forEach(callback => {
				callback({ ...params, me: this as unknown as O });
			});
		}
	}

	protected async _loaded(_params: LoadedContext<this>): Promise<void> { }

	public _update(params: UpdateContext<this>): void {
		this.updateMaterials(params);
		if (this.lifeCycleDelegate.update?.length) {
			const callbacks = this.lifeCycleDelegate.update;
			callbacks.forEach(callback => {
				callback({ ...params, me: this as unknown as O });
			});
		}
		this.behaviorCallbackMap.update.forEach(callback => {
			callback({ ...params, me: this });
		});
	}

	public _destroy(params: DestroyContext<this>): void {
		if (this.lifeCycleDelegate.destroy?.length) {
			const callbacks = this.lifeCycleDelegate.destroy;
			callbacks.forEach(callback => {
				callback({ ...params, me: this as unknown as O });
			});
		}
		this.behaviorCallbackMap.destroy.forEach(callback => {
			callback({ ...params, me: this });
		});
	}

	protected async _cleanup(_params: CleanupContext<this>): Promise<void> { }

	public _collision(other: GameEntity<O>, globals?: any): void {
		if (this.collisionDelegate.collision?.length) {
			const callbacks = this.collisionDelegate.collision;
			callbacks.forEach(callback => {
				callback({ entity: this, other, globals });
			});
		}
		this.behaviorCallbackMap.collision.forEach(callback => {
			callback({ entity: this, other, globals });
		});
	}

	public addBehavior(
		behaviorCallback: ({ type: BehaviorCallbackType, handler: any })
	): this {
		const handler = behaviorCallback.handler as unknown as BehaviorCallback<this, O>;
		if (handler) {
			this.behaviorCallbackMap[behaviorCallback.type].push(handler);
		}
		return this;
	}

	public addBehaviors(
		behaviorCallbacks: ({ type: BehaviorCallbackType, handler: any })[]
	): this {
		behaviorCallbacks.forEach(callback => {
			const handler = callback.handler as unknown as BehaviorCallback<this, O>;
			if (handler) {
				this.behaviorCallbackMap[callback.type].push(handler);
			}
		});
		return this;
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
	}

	public buildInfo(): Record<string, string> {
		const info: Record<string, string> = {};
		info.name = this.name;
		info.uuid = this.uuid;
		info.eid = this.eid.toString();
		return info;
	}
}
