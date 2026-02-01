import { Mesh, Material, ShaderMaterial, Group, Color } from 'three';
import {
  Collider,
  ColliderDesc,
  RigidBody,
  RigidBodyDesc,
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
import { applyTransformChanges } from '../actions/capabilities/apply-transform';

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

export type BehaviorContext<T, O extends GameEntityOptions> =
  | SetupContext<T, O>
  | UpdateContext<T, O>
  | CollisionContext<T, O>
  | DestroyContext<T, O>;

export type BehaviorCallback<T, O extends GameEntityOptions> = (
  params: BehaviorContext<T, O>,
) => void;

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
};

export abstract class GameEntityLifeCycle {
  abstract _setup(params: SetupContext<this>): void;
  abstract _update(params: UpdateContext<this>): void;
  abstract _destroy(params: DestroyContext<this>): void;
}

export interface EntityDebugInfo {
  buildInfo: () => Record<string, string>;
}

export type BehaviorCallbackType = 'setup' | 'update' | 'destroy' | 'collision';

export class GameEntity<O extends GameEntityOptions>
  extends BaseNode<O>
  implements GameEntityLifeCycle, EntityDebugInfo
{
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

  /**
   * @deprecated Use the new ECS-based behavior system instead.
   * Use 'any' for callback types to avoid contravariance issues
   * with function parameters. Type safety is enforced where callbacks are registered.
   */
  public behaviorCallbackMap: Record<
    BehaviorCallbackType,
    BehaviorCallback<any, any>[]
  > = {
    setup: [],
    update: [],
    destroy: [],
    collision: [],
  };

  // Event delegate for dispatch/listen API
  protected eventDelegate = new EventEmitterDelegate<EntityEvents>();

  // Behavior references (new ECS pattern)
  private behaviorRefs: BehaviorRef[] = [];

  // Transform store for batched physics updates (optional, attached by makeTransformable)
  public transformStore?: TransformState;

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
  public _setup(params: SetupContext<this>): void {
    // this.behaviorCallbackMap.setup.forEach((callback) => {
    //   callback({ ...params, me: this });
    // });
  }

  protected async _loaded(_params: LoadedContext<this>): Promise<void> {}

  /**
   * Entity-specific update - updates materials and runs behavior callbacks
   * (User callbacks are handled by BaseNode's lifecycleCallbacks.update)
   */
  public _update(params: UpdateContext<this>): void {
    this.updateMaterials(params);
    // this.behaviorCallbackMap.update.forEach((callback) => {
    //   callback({ ...params, me: this });
    // });
    
    // Apply pending transformations to physics after update callbacks
    if (this.transformStore) {
      applyTransformChanges(this, this.transformStore);
    }
  }

  /**
   * Entity-specific destroy - runs behavior callbacks
   * (User callbacks are handled by BaseNode's lifecycleCallbacks.destroy)
   */
  public _destroy(params: DestroyContext<this>): void {
    // this.behaviorCallbackMap.destroy.forEach((callback) => {
    //   callback({ ...params, me: this });
    // });
  }

  protected async _cleanup(_params: CleanupContext<this>): Promise<void> {}

  public _collision(other: GameEntity<O>, globals?: any): void {
    if (this.collisionDelegate.collision?.length) {
      const callbacks = this.collisionDelegate.collision;
      callbacks.forEach((callback) => {
        callback({ entity: this, other, globals });
      });
    }
    // this.behaviorCallbackMap.collision.forEach((callback) => {
    //   callback({ entity: this, other, globals });
    // });
  }

  /**
   * @deprecated Use the new ECS-based behavior system instead.
   * See `lib/behaviors/thruster/thruster-movement.behavior.ts` for an example.
   */
  public addBehavior(behaviorCallback: {
    type: BehaviorCallbackType;
    handler: any;
  }): this {
    const handler = behaviorCallback.handler as unknown as BehaviorCallback<
      this,
      O
    >;
    if (handler) {
      this.behaviorCallbackMap[behaviorCallback.type].push(handler);
    }
    return this;
  }

  /**
   * @deprecated Use the new ECS-based behavior system instead.
   * See `lib/behaviors/thruster/thruster-movement.behavior.ts` for an example.
   */
  public addBehaviors(
    behaviorCallbacks: { type: BehaviorCallbackType; handler: any }[],
  ): this {
    behaviorCallbacks.forEach((callback) => {
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
