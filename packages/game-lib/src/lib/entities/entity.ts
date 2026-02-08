import { Mesh, Material, ShaderMaterial, Group, Color, Vector3 } from 'three';
import {
	Collider,
	ColliderDesc,
	RigidBody,
	RigidBodyDesc,
	Vector,
} from '@dimforge/rapier3d-compat';
import { position, rotation, scale } from '../systems/transformable.system';
import { Vec3 } from '../core/vector';
import { MaterialBuilder, MaterialOptions } from '../graphics/material';
import { CollisionOptions } from '../collision/collision-builder';
import { BaseNode } from '../core/base-node';
import {
	DestroyContext,
	SetupContext,
	UpdateContext,
	LoadedContext,
	CleanupContext,
} from '../core/base-node-life-cycle';
import type { EntityMeshBuilder, EntityCollisionBuilder } from './builder';
import { Behavior } from '../actions/behaviors/behavior';
import {
	EventEmitterDelegate,
	zylemEventBus,
	type EntityEvents,
} from '../events';
import type {
	BehaviorDescriptor,
	BehaviorRef,
	BehaviorHandle,
} from '../behaviors/behavior-descriptor';
import type { TransformState } from '../actions/capabilities/transform-store';
import { createTransformStore } from '../actions/capabilities/transform-store';
import { makeTransformable } from '../actions/capabilities/transformable';
import type { MoveableEntity } from '../actions/capabilities/moveable';
import type { RotatableEntityAPI } from '../actions/capabilities/rotatable';

export interface CollisionContext<
	T,
	O extends GameEntityOptions,
	TGlobals extends Record<string, unknown> = any,
> {
	entity: T;
	// Use 'any' for other's options type to break recursive type variance issues
	other: GameEntity<O | any>;
	globals: TGlobals;
}

export interface CollisionDelegate<T, O extends GameEntityOptions> {
	// Use 'any' for entity and options types to avoid contravariance issues
	// with function parameters. Type safety is still enforced at the call site via onCollision()
	collision?: ((params: CollisionContext<any, any>) => void)[];
}

export type IBuilder<BuilderOptions = any> = {
	preBuild: (options: BuilderOptions) => BuilderOptions;
	build: (options: BuilderOptions) => BuilderOptions;
	postBuild: (options: BuilderOptions) => BuilderOptions;
};

/**
 * Configuration for an additional collider shape on a compound entity.
 * Each additional collider is attached to the same rigid body.
 */
export interface CompoundColliderConfig {
	/** Collider shape type */
	shape: 'box' | 'sphere' | 'capsule' | 'cylinder';
	/** Size for box colliders */
	size?: Vec3;
	/** Radius for sphere/capsule/cylinder colliders */
	radius?: number;
	/** Half-height for capsule/cylinder colliders */
	halfHeight?: number;
	/** Position offset relative to the entity origin */
	offset?: Vec3;
	/** Whether this collider is a sensor */
	sensor?: boolean;
}

/**
 * Configuration for an additional mesh on a compound entity.
 * Each additional mesh is added to the entity's group.
 */
export interface CompoundMeshConfig {
	/** Geometry type */
	geometry: 'box' | 'sphere' | 'capsule' | 'cylinder' | 'cone';
	/** Size for box geometry */
	size?: Vec3;
	/** Radius for sphere/capsule/cylinder/cone geometry */
	radius?: number;
	/** Height for capsule/cylinder/cone geometry */
	height?: number;
	/** Position offset relative to the entity origin */
	position?: Vec3;
	/** Optional material override */
	material?: Partial<MaterialOptions>;
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
	/** Additional collider shapes for compound collision bodies */
	additionalColliders?: CompoundColliderConfig[];
	/** Additional meshes for compound visual entities */
	additionalMeshes?: CompoundMeshConfig[];
	_builders?: {
		meshBuilder?: IBuilder | EntityMeshBuilder | null;
		collisionBuilder?: IBuilder | EntityCollisionBuilder | null;
		materialBuilder?: MaterialBuilder | null;
	};
};

export abstract class GameEntityLifeCycle {
	abstract _setup(params: SetupContext<this>): void;
	abstract _update(params: UpdateContext<this>): void;
	abstract _destroy(params: DestroyContext<this>): void;
}

export interface EntityDebugInfo {
	buildInfo: () => Record<string, string>;
}

export class GameEntity<O extends GameEntityOptions>
	extends BaseNode<O>
	implements GameEntityLifeCycle, EntityDebugInfo, MoveableEntity, RotatableEntityAPI {
	public behaviors: Behavior[] = [];
	public group: Group | undefined;
	public mesh: Mesh | undefined;
	public materials: Material[] | undefined;
	public bodyDesc: RigidBodyDesc | null = null;
	public body: RigidBody | null = null;
	public colliderDesc: ColliderDesc | undefined;
	public collider: Collider | undefined;
	public custom: Record<string, any> = {};

	// Compound entity support: multiple colliders and meshes
	/** All collider descriptions for this entity (including primary) */
	public colliderDescs: ColliderDesc[] = [];
	/** All colliders attached to this entity's rigid body */
	public colliders: Collider[] = [];
	/** Built meshes for compound visual entities (from additionalMeshes config) */
	public compoundMeshes: Mesh[] = [];

	public debugInfo: Record<string, any> = {};
	public debugMaterial: ShaderMaterial | undefined;

	public collisionDelegate: CollisionDelegate<this, O> = {
		collision: [],
	};
	public collisionType?: string;

	// Instancing support
	/** Batch key for instanced rendering (null if not instanced) */
	public batchKey: string | null = null;
	/** Index within the instanced mesh batch */
	public instanceId: number = -1;
	/** Whether this entity uses instanced rendering */
	public isInstanced: boolean = false;

	// Event delegate for dispatch/listen API
	protected eventDelegate = new EventEmitterDelegate<EntityEvents>();

	// Behavior references (new ECS pattern)
	private behaviorRefs: BehaviorRef[] = [];

	// Transform store for batched physics updates (auto-created in create())
	public transformStore: TransformState;

	// Movement & rotation methods are assigned at runtime by makeTransformable.
	// The `implements` clause above ensures the type contract; declarations below
	// satisfy the compiler while the constructor fills them in.
	moveX!: (delta: number) => void;
	moveY!: (delta: number) => void;
	moveZ!: (delta: number) => void;
	moveXY!: (deltaX: number, deltaY: number) => void;
	moveXZ!: (deltaX: number, deltaZ: number) => void;
	move!: (vector: Vector3) => void;
	resetVelocity!: () => void;
	moveForwardXY!: (delta: number, rotation2DAngle: number) => void;
	getPosition!: () => Vector | null;
	getVelocity!: () => Vector | null;
	setPosition!: (x: number, y: number, z: number) => void;
	setPositionX!: (x: number) => void;
	setPositionY!: (y: number) => void;
	setPositionZ!: (z: number) => void;
	wrapAroundXY!: (boundsX: number, boundsY: number) => void;
	wrapAround3D!: (boundsX: number, boundsY: number, boundsZ: number) => void;
	rotateInDirection!: (moveVector: Vector3) => void;
	rotateYEuler!: (amount: number) => void;
	rotateEuler!: (eulerRotation: Vector3) => void;
	rotateX!: (delta: number) => void;
	rotateY!: (delta: number) => void;
	rotateZ!: (delta: number) => void;
	setRotationY!: (y: number) => void;
	setRotationX!: (x: number) => void;
	setRotationZ!: (z: number) => void;
	setRotationDegrees!: (x: number, y: number, z: number) => void;
	setRotationDegreesY!: (y: number) => void;
	setRotationDegreesX!: (x: number) => void;
	setRotationDegreesZ!: (z: number) => void;
	setRotation!: (x: number, y: number, z: number) => void;
	getRotation!: () => any;

	constructor() {
		super();
		this.transformStore = createTransformStore();
		makeTransformable(this);
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

	/**
	 * Add collision callbacks
	 */
	public onCollision(
		...callbacks: ((params: CollisionContext<this, O>) => void)[]
	): this {
		const existing = this.collisionDelegate.collision ?? [];
		this.collisionDelegate.collision = [...existing, ...callbacks];
		return this;
	}

	/**
	 * Use a behavior on this entity via typed descriptor.
	 * Behaviors will be auto-registered as systems when the entity is spawned.
	 * @param descriptor The behavior descriptor (import from behaviors module)
	 * @param options Optional overrides for the behavior's default options
	 * @returns BehaviorHandle with behavior-specific methods for lazy FSM access
	 */
	public use<
		O extends Record<string, any>,
		H extends Record<string, any> = Record<string, never>,
	>(
		descriptor: BehaviorDescriptor<O, H>,
		options?: Partial<O>,
	): BehaviorHandle<O, H> {
		const behaviorRef: BehaviorRef<O> = {
			descriptor: descriptor as BehaviorDescriptor<O, any>,
			options: { ...descriptor.defaultOptions, ...options } as O,
		};
		this.behaviorRefs.push(behaviorRef as BehaviorRef<any>);

		// Create base handle
		const baseHandle = {
			getFSM: () => behaviorRef.fsm ?? null,
			getOptions: () => behaviorRef.options,
			ref: behaviorRef,
		};

		// Merge behavior-specific methods if createHandle is provided
		const customMethods = descriptor.createHandle?.(behaviorRef) ?? ({} as H);

		return {
			...baseHandle,
			...customMethods,
		} as BehaviorHandle<O, H>;
	}

	/**
	 * Get all behavior references attached to this entity.
	 * Used by the stage to auto-register required systems.
	 */
	public getBehaviorRefs(): BehaviorRef[] {
		return this.behaviorRefs;
	}

	/**
	 * Entity-specific setup - runs behavior callbacks
	 * (User callbacks are handled by BaseNode's lifecycleCallbacks.setup)
	 */
	public _setup(params: SetupContext<this>): void { }

	protected async _loaded(_params: LoadedContext<this>): Promise<void> { }

	/**
	 * Entity-specific update - updates materials.
	 * Transform changes are applied by the stage after all update callbacks complete.
	 * (User callbacks are handled by BaseNode's lifecycleCallbacks.update)
	 */
	public _update(params: UpdateContext<this>): void {
		this.updateMaterials(params);
	}

	/**
	 * Entity-specific destroy - runs behavior callbacks
	 * (User callbacks are handled by BaseNode's lifecycleCallbacks.destroy)
	 */
	public _destroy(params: DestroyContext<this>): void { }

	protected async _cleanup(_params: CleanupContext<this>): Promise<void> { }

	public _collision(other: GameEntity<O>, globals?: any): void {
		if (this.collisionDelegate.collision?.length) {
			const callbacks = this.collisionDelegate.collision;
			callbacks.forEach((callback) => {
				callback({ entity: this, other, globals });
			});
		}
	}

	protected updateMaterials(params: any) {
		if (!this.materials?.length) {
			return;
		}
		for (const material of this.materials) {
			if (material instanceof ShaderMaterial) {
				if (material.uniforms) {
					material.uniforms.iTime &&
						(material.uniforms.iTime.value += params.delta);
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

	// ─────────────────────────────────────────────────────────────────────────────
	// Events API
	// ─────────────────────────────────────────────────────────────────────────────

	/**
	 * Dispatch an event from this entity.
	 * Events are emitted both locally and to the global event bus.
	 */
	dispatch<K extends keyof EntityEvents>(
		event: K,
		payload: EntityEvents[K],
	): void {
		this.eventDelegate.dispatch(event, payload);
		(zylemEventBus as any).emit(event, payload);
	}

	/**
	 * Listen for events on this entity instance.
	 * @returns Unsubscribe function
	 */
	listen<K extends keyof EntityEvents>(
		event: K,
		handler: (payload: EntityEvents[K]) => void,
	): () => void {
		return this.eventDelegate.listen(event, handler);
	}

	/**
	 * Clean up entity event subscriptions.
	 */
	disposeEvents(): void {
		this.eventDelegate.dispose();
	}
}
