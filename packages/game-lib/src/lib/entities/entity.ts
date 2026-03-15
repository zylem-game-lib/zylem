import { Mesh, Material, ShaderMaterial, Group, Color, Vector3 } from 'three';
import {
	Collider,
	ColliderDesc,
	RigidBody,
	RigidBodyDesc,
	Vector,
} from '@dimforge/rapier3d-compat';
import { position, rotation, scale } from '../systems/transformable.system';
import { Vec3, Vec3Input, VEC3_ZERO, normalizeVec3 } from '../core/vector';
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
import { Behavior } from '../behaviors/behavior';
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
import { clearVelocityIntent } from '../actions/capabilities/velocity-intents';
import type { MoveableEntity } from '../actions/capabilities/moveable';
import type { RotatableEntityAPI } from '../actions/capabilities/rotatable';
import {
	cloneCollisionComponent,
	isCollisionComponent,
	type CollisionComponent,
} from './parts/collision-factories';
import type { NodeInterface } from '../core/node-interface';
import { commonDefaults } from './common';
import type { Action } from '../actions/action';
import { deepCloneValue, deepMergeValues } from '../core/clone-utils';

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

export type CollisionPhase = 'enter' | 'stay';

export interface CollisionRegistrationOptions {
	phase?: CollisionPhase;
	cooldownMs?: number;
}

interface NormalizedCollisionRegistrationOptions {
	phase: CollisionPhase;
	cooldownMs?: number;
}

export interface CollisionRegistration<T, O extends GameEntityOptions> {
	id: number;
	callback: (params: CollisionContext<T, O>) => void;
	options: NormalizedCollisionRegistrationOptions;
}

export interface CollisionDispatchMetadata {
	phase: CollisionPhase;
	nowMs: number;
}

export interface CollisionDelegate<T, O extends GameEntityOptions> {
	// Use 'any' for entity and options types to avoid contravariance issues
	// with function parameters. Type safety is still enforced at the call site via onCollision()
	collision?: CollisionRegistration<any, any>[];
	cooldowns?: Map<string, number>;
	nextId?: number;
}

export type IBuilder<BuilderOptions = any> = {
	preBuild: (options: BuilderOptions) => BuilderOptions;
	build: (options: BuilderOptions) => BuilderOptions;
	postBuild: (options: BuilderOptions) => BuilderOptions;
};

export type GameEntityOptions = {
	name?: string;
	color?: Color;
	size?: Vec3Input;
	position?: Vec3Input;
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
};

export abstract class GameEntityLifeCycle {
	abstract _setup(params: SetupContext<this>): void;
	abstract _update(params: UpdateContext<this>): void;
	abstract _destroy(params: DestroyContext<this>): void;
}

export interface EntityDebugInfo {
	buildInfo: () => Record<string, string>;
}

type EntityCloneFactory<O extends GameEntityOptions, E extends GameEntity<O>> = (
	options?: Partial<O>,
) => E;

type TrackedEntityComponent =
	| { kind: 'mesh'; component: Mesh }
	| { kind: 'collision'; component: CollisionComponent };

function isCollisionRegistrationOptions(
	value: unknown,
): value is CollisionRegistrationOptions {
	return value != null && typeof value === 'object';
}

function normalizeCollisionRegistrationOptions(
	options?: CollisionRegistrationOptions,
): NormalizedCollisionRegistrationOptions {
	return {
		phase: options?.phase ?? 'stay',
		cooldownMs: options?.cooldownMs,
	};
}

function getCollisionNowMs(): number {
	if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
		return performance.now();
	}
	return Date.now();
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
	public physicsAttached = false;
	public colliderDesc: ColliderDesc | undefined;
	public collider: Collider | undefined;
	public custom: Record<string, any> = {};

	// Compound entity support: multiple colliders and meshes
	/** All collider descriptions for this entity (including primary) */
	public colliderDescs: ColliderDesc[] = [];
	/** All colliders attached to this entity's rigid body */
	public colliders: Collider[] = [];
	/** Additional meshes for compound visual entities (added via add()) */
	public compoundMeshes: Mesh[] = [];

	public debugInfo: Record<string, any> = {};
	public debugMaterial: ShaderMaterial | undefined;

	public collisionDelegate: CollisionDelegate<this, O> = {
		collision: [],
		cooldowns: new Map(),
		nextId: 0,
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
	private cloneFactory: EntityCloneFactory<O, this> | null = null;
	private trackAddedComponents: boolean = false;
	private trackedComponents: TrackedEntityComponent[] = [];

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

	// ─────────────────────────────────────────────────────────────────────────────
	// Composable add() - accepts Mesh, CollisionComponent, or child entities
	// ─────────────────────────────────────────────────────────────────────────────

	/**
	 * Add meshes, collision components, or child entities to this entity.
	 * Supports fluent chaining: `entity.add(boxMesh()).add(boxCollision())`.
	 *
	 * - `Mesh`: First mesh becomes the primary mesh; subsequent meshes are
	 *   compound meshes grouped together.
	 * - `CollisionComponent`: First sets bodyDesc + colliderDesc; subsequent
	 *   add extra colliders to the same rigid body.
	 * - `NodeInterface`: Added as a child entity (delegates to BaseNode.add).
	 */
	public add(...components: Array<NodeInterface | Mesh | CollisionComponent>): this {
		for (const component of components) {
			if (component instanceof Mesh) {
				this.addMeshComponent(component);
				this.trackComponent(component);
			} else if (isCollisionComponent(component)) {
				this.addCollisionComponent(component);
				this.trackComponent(component);
			} else {
				super.add(component as NodeInterface);
			}
		}
		return this;
	}

	private addMeshComponent(mesh: Mesh): void {
		if (!this.mesh) {
			// First mesh becomes the primary mesh
			this.mesh = mesh;
			if (!this.materials) {
				this.materials = [];
			}
			if (mesh.material) {
				const mat = mesh.material;
				if (Array.isArray(mat)) {
					this.materials.push(...mat);
				} else {
					this.materials.push(mat);
				}
			}
		} else {
			// Subsequent meshes are compound meshes
			this.compoundMeshes.push(mesh);
			// Ensure the entity has a group so all meshes are parented together
			if (!this.group) {
				this.group = new Group();
				this.group.add(this.mesh);
			}
			this.group.add(mesh);
		}
	}

	private addCollisionComponent(collision: CollisionComponent): void {
		if (!this.bodyDesc) {
			// First collision sets the body description and primary collider
			this.bodyDesc = collision.bodyDesc;
			this.colliderDesc = collision.colliderDesc;
			this.colliderDescs.push(collision.colliderDesc);
			// Apply entity position to the body
				const pos = normalizeVec3(this.options?.position, VEC3_ZERO);
				this.bodyDesc.setTranslation(pos.x, pos.y, pos.z);
			} else {
			// Subsequent collisions add extra colliders to the same body
			this.colliderDescs.push(collision.colliderDesc);
		}
	}

	private trackComponent(component: Mesh | CollisionComponent): void {
		if (!this.trackAddedComponents) {
			return;
		}

		if (component instanceof Mesh) {
			this.trackedComponents.push({
				kind: 'mesh',
				component: cloneMeshComponent(component),
			});
			return;
		}

		this.trackedComponents.push({
			kind: 'collision',
			component: cloneCollisionComponent(component),
		});
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// Actions API -- entity-scoped, self-contained stateful actions
	// ─────────────────────────────────────────────────────────────────────────────

	private _actions: Action[] = [];

	/**
	 * Run a fire-and-forget action. Auto-removed when done.
	 * @example `me.runAction(moveBy({ x: 10, duration: 0.3 }))`
	 */
	public runAction<A extends Action>(action: A): A {
		this._actions.push(action);
		return action;
	}

	/**
	 * Register a persistent action (throttle, onPress). Not removed when done.
	 * @example `const press = entity.action(onPress())`
	 */
	public action<A extends Action>(action: A): A {
		action.persistent = true;
		this._actions.push(action);
		return action;
	}

	/**
	 * Tick all registered actions. Called automatically before user onUpdate callbacks.
	 *
	 * Resets velocity/angularVelocity accumulation before ticking so that
	 * actions can compose via `+=` without cross-frame build-up.
	 * (The existing move helpers like `moveXY` use `=` which doesn't accumulate,
	 * but action composition needs additive writes on a clean slate each frame.)
	 */
	public _tickActions(delta: number): void {
		if (this._actions.length === 0) return;

		// Clear accumulation from the previous frame so that
		// actions can compose via `+=` on a clean slate each frame.
		const store = this.transformStore;
		store.velocity.x = 0;
		store.velocity.y = 0;
		store.velocity.z = 0;
		clearVelocityIntent(store, 'actions');
		store.angularVelocity.x = 0;
		store.angularVelocity.y = 0;
		store.angularVelocity.z = 0;
		store.dirty.angularVelocity = false;

		for (let i = this._actions.length - 1; i >= 0; i--) {
			const act = this._actions[i];
			act.tick(this, delta);
			if (act.done && !act.persistent) {
				this._actions.splice(i, 1);
			}
		}

		if (this._actions.length === 0) {
			store.velocity.x = 0;
			store.velocity.y = 0;
			store.velocity.z = 0;
			clearVelocityIntent(store, 'actions');
			store.angularVelocity.x = 0;
			store.angularVelocity.y = 0;
			store.angularVelocity.z = 0;
			store.dirty.angularVelocity = false;
		}
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

	public clone(overrides?: Partial<O>): this {
		if (!this.cloneFactory) {
			throw new Error(
				`Cannot clone ${this.constructor.name}: clone() is only supported for entities created by official factory helpers.`,
			);
		}

		const clone = this.cloneFactory(
			deepMergeValues(this.options, overrides),
		) as this;

		const behaviorAliases = this.copyBehaviorRefsTo(clone);
		const wrapCallback = <T extends Function>(callback: T): T =>
			wrapBehaviorCallback(callback, behaviorAliases);

		this.replayUserLifecycleRegistrationsTo(clone, wrapCallback);

		const collisionRegistrations = this.getCollisionRegistrations();
		if (collisionRegistrations.length > 0) {
			for (const registration of collisionRegistrations) {
				clone.onCollision(
					wrapCallback(registration.callback),
					registration.options,
				);
			}
		}

		for (const trackedComponent of this.trackedComponents) {
			if (trackedComponent.kind === 'mesh') {
				clone.add(cloneMeshComponent(trackedComponent.component));
				continue;
			}
			clone.add(cloneCollisionComponent(trackedComponent.component));
		}

		this.cloneChildrenInto(clone);

		return clone;
	}

	public finalizeCloneSupport(factory: (options?: Partial<O>) => GameEntity<O>): this {
		this.cloneFactory = factory as EntityCloneFactory<O, this>;
		this.enableUserLifecycleTracking();
		this.trackAddedComponents = true;
		return this;
	}

	/**
	 * Add collision callbacks
	 */
	public onCollision(
		callback: (params: CollisionContext<this, O>) => void,
		options?: CollisionRegistrationOptions,
	): this;
	public onCollision(
		...callbacks: ((params: CollisionContext<this, O>) => void)[]
	): this;
	public onCollision(
		...args: Array<((params: CollisionContext<this, O>) => void) | CollisionRegistrationOptions | undefined>
	): this {
		const existing = [...(this.collisionDelegate.collision ?? [])];
		let nextId = this.collisionDelegate.nextId ?? 0;

		if (
			args.length === 1
			|| (
				args.length === 2
				&& (
					args[1] == null
					|| isCollisionRegistrationOptions(args[1])
				)
			)
		) {
			const callback = args[0] as ((params: CollisionContext<this, O>) => void) | undefined;
			if (!callback) {
				return this;
			}

			const options = args[1] as CollisionRegistrationOptions | undefined;
			existing.push({
				id: nextId,
				callback,
				options: normalizeCollisionRegistrationOptions(options),
			});
			nextId += 1;
			this.collisionDelegate.collision = existing;
			this.collisionDelegate.nextId = nextId;
			return this;
		}

		for (const callback of args as Array<(params: CollisionContext<this, O>) => void>) {
			existing.push({
				id: nextId,
				callback,
				options: normalizeCollisionRegistrationOptions(),
			});
			nextId += 1;
		}

		this.collisionDelegate.collision = existing;
		this.collisionDelegate.nextId = nextId;
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

	public getCollisionCallbacks(): Array<(params: CollisionContext<this, O>) => void> {
		return this.getCollisionRegistrations().map((registration) => registration.callback);
	}

	public getCollisionRegistrations(): Array<CollisionRegistration<this, O>> {
		return (this.collisionDelegate.collision ?? []).map((registration) => ({
			id: registration.id,
			callback: registration.callback,
			options: { ...registration.options },
		}));
	}

	private copyBehaviorRefsTo(target: GameEntity<any>): Map<BehaviorRef, BehaviorRef> {
		const aliases = new Map<BehaviorRef, BehaviorRef>();

		for (const ref of this.behaviorRefs) {
			target.use(ref.descriptor, deepCloneValue(ref.options));
			const targetRef = target.getBehaviorRefs().at(-1);
			if (targetRef) {
				aliases.set(ref, targetRef);
			}
		}

		return aliases;
	}

	/**
	 * Entity-specific setup - resets actions for a fresh stage session.
	 * (User callbacks are handled by BaseNode's lifecycleCallbacks.setup)
	 */
	public _setup(params: SetupContext<this>): void {
		// Reset actions for the new stage session.
		// Remove completed fire-and-forget actions; reset all others
		// so they replay from the beginning.
		for (let i = this._actions.length - 1; i >= 0; i--) {
			const act = this._actions[i];
			if (act.done && !act.persistent) {
				this._actions.splice(i, 1);
			} else {
				act.reset();
			}
		}
	}

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
	 * Entity-specific destroy -- reserved for consumer game logic.
	 * Engine-internal resource disposal runs in _cleanup() instead.
	 */
	public _destroy(params: DestroyContext<this>): void { }

	/**
	 * Engine-internal resource cleanup -- runs automatically after destroy.
	 * Disposes GPU/DOM resources (meshes, materials, debug material).
	 *
	 * Note: actions, collision callbacks, and behavior refs are intentionally
	 * NOT cleared here -- they are registered by consumer code at module level
	 * and must persist across stage reloads. Actions are reset in _setup().
	 */
	protected _cleanup(_params: CleanupContext<this>): void {
		// Dispose entity event emitter & subscriptions
		this.disposeEvents();

		// Dispose compound meshes
		for (const m of this.compoundMeshes) {
			m.geometry?.dispose();
			if (Array.isArray(m.material)) {
				m.material.forEach(mat => mat.dispose());
			} else {
				m.material?.dispose();
			}
		}
		this.compoundMeshes.length = 0;

		// Dispose debug material
		this.debugMaterial?.dispose();
		this.debugMaterial = undefined;

		// Remove group from parent (camera or scene)
		this.group?.removeFromParent();

		// Note: physics references (body, collider, colliders) are intentionally
		// NOT nulled here. They are needed by removeEntityByUuid() → world.destroyEntity()
		// which runs later when the stage processes markedForRemoval entities.
	}

	public _collision(
		other: GameEntity<O>,
		globals?: any,
		dispatch: CollisionDispatchMetadata = {
			phase: 'stay',
			nowMs: getCollisionNowMs(),
		},
	): void {
		if (!this.collisionDelegate.collision?.length) {
			return;
		}

		const cooldowns = this.collisionDelegate.cooldowns ?? new Map<string, number>();
		this.collisionDelegate.cooldowns = cooldowns;

		for (const registration of this.collisionDelegate.collision) {
			if (registration.options.phase !== dispatch.phase) {
				continue;
			}

			const cooldownMs = registration.options.cooldownMs;
			if (cooldownMs != null) {
				const cooldownKey = `${registration.id}:${other.uuid}`;
				const lastTriggeredAt = cooldowns.get(cooldownKey);
				if (
					lastTriggeredAt != null
					&& (dispatch.nowMs - lastTriggeredAt) < cooldownMs
				) {
					continue;
				}
				cooldowns.set(cooldownKey, dispatch.nowMs);
			}

			registration.callback({ entity: this, other, globals });
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

// ─────────────────────────────────────────────────────────────────────────────
// Bare entity factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a bare entity with no mesh or collision.
 * Use `.add(boxMesh(), boxCollision())` to compose its shape.
 *
 * @example
 * ```ts
 * const box = create({ position: { x: 0, y: 5, z: 0 } })
 *   .add(boxMesh({ size: { x: 2, y: 2, z: 2 } }))
 *   .add(boxCollision({ size: { x: 2, y: 2, z: 2 } }));
 * ```
 */
export function create(options?: Partial<GameEntityOptions>): GameEntity<GameEntityOptions> {
	const entity = new (GameEntity as any)() as GameEntity<GameEntityOptions>;
	entity.options = { ...commonDefaults, ...options } as GameEntityOptions;
	return finalizeEntityCloneSupport(
		entity,
		(cloneOptions) => create(cloneOptions ?? {}),
	);
}

function cloneMeshComponent(mesh: Mesh): Mesh {
	const clonedMesh = mesh.clone(true);
	const originalNodes: any[] = [];
	const clonedNodes: any[] = [];

	mesh.traverse((node) => originalNodes.push(node));
	clonedMesh.traverse((node) => clonedNodes.push(node));

	for (let i = 0; i < originalNodes.length; i++) {
		const originalNode = originalNodes[i];
		const clonedNode = clonedNodes[i];

		if (originalNode?.geometry?.clone) {
			clonedNode.geometry = originalNode.geometry.clone();
		}

		if (originalNode?.material) {
			clonedNode.material = Array.isArray(originalNode.material)
				? originalNode.material.map((material: Material) => material.clone())
				: originalNode.material.clone();
		}
	}

	return clonedMesh;
}

function wrapBehaviorCallback<T extends Function>(
	callback: T,
	aliases: Map<BehaviorRef, BehaviorRef>,
): T {
	if (aliases.size === 0) {
		return callback;
	}

	return ((...args: any[]) => {
		const previousValues = Array.from(aliases.entries()).map(([sourceRef, targetRef]) => ({
			sourceRef,
			options: sourceRef.options,
			fsm: sourceRef.fsm,
			hasFSM: Object.prototype.hasOwnProperty.call(sourceRef, 'fsm'),
			targetRef,
		}));

		for (const entry of previousValues) {
			entry.sourceRef.options = entry.targetRef.options;
			if (entry.targetRef.fsm === undefined) {
				delete entry.sourceRef.fsm;
			} else {
				entry.sourceRef.fsm = entry.targetRef.fsm;
			}
		}

		try {
			return callback(...args);
		} finally {
			for (let i = previousValues.length - 1; i >= 0; i--) {
				const entry = previousValues[i];
				entry.sourceRef.options = entry.options;
				if (!entry.hasFSM) {
					delete entry.sourceRef.fsm;
				} else {
					entry.sourceRef.fsm = entry.fsm;
				}
			}
		}
	}) as unknown as T;
}

export function finalizeEntityCloneSupport<E extends GameEntity<any>>(
	entity: E,
	factory: (options?: Partial<E['options']>) => E,
): E {
	entity.finalizeCloneSupport(factory as any);
	return entity;
}
