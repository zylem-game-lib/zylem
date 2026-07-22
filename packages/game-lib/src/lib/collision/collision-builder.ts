import {
  StageBodyKind,
  type SimulationBodyDefinition,
  type SimulationColliderDefinition,
} from '@zylem/behaviors/core';
import {
  Vec3Input,
  VEC3_ZERO,
  VEC3_ONE,
  normalizeVec3,
} from '../core/vector';

/** Per-axis lock input: `true` locks all axes, or pass an [x, y, z] tuple. */
export type LockAxesInput = boolean | readonly [boolean, boolean, boolean];

/**
 * Normalize a lock input to the wasm tuple form. Returns undefined when the
 * author didn't specify locks, so world-level defaults can still apply.
 */
export function normalizeLockAxes(
  value?: LockAxesInput,
): readonly [boolean, boolean, boolean] | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return [value, value, value];
  return value;
}

/**
 * Options for configuring entity collision behavior.
 */
export interface CollisionOptions {
  static?: boolean;
  sensor?: boolean;
  canSleep?: boolean;
  ccdEnabled?: boolean;
  size?: Vec3Input;
  position?: Vec3Input;
  collisionType?: string;
  collisionFilter?: string[];
  /** Gravity scale applied at body spawn (no live setter FFI; default 1). */
  gravityScale?: number;
  /** Lock rotation axes at body spawn: `true` for all, or per-axis tuple. */
  lockRotations?: LockAxesInput;
  /** Lock translation axes at body spawn: `true` for all, or per-axis tuple. */
  lockTranslations?: LockAxesInput;
}

const typeToGroup = new Map<string, number>();
let nextGroupId = 0;

export function getOrCreateCollisionGroupId(type: string): number {
  let groupId = typeToGroup.get(type);
  if (groupId === undefined) {
    groupId = nextGroupId++ % 16;
    typeToGroup.set(type, groupId);
  }
  return groupId;
}

export function createCollisionFilter(allowedTypes: string[]): number {
  let filter = 0;
  allowedTypes.forEach(type => {
    const groupId = getOrCreateCollisionGroupId(type);
    filter |= 1 << groupId;
  });
  return filter;
}

/**
 * Pack a collision type + filter into the runtime's interaction-groups u32
 * (high 16 bits = membership mask, low 16 bits = filter mask).
 */
export function packCollisionGroups(
  collisionType?: string,
  collisionFilter?: string[],
): number {
  if (!collisionType) return 0xffffffff;
  const groupId = getOrCreateCollisionGroupId(collisionType);
  const filter = collisionFilter ? createCollisionFilter(collisionFilter) : 0xffff;
  const membership = 1 << groupId;
  return ((membership & 0xffff) << 16) | (filter & 0xffff);
}

/**
 * Builds plain body + collider definitions consumable by the behaviors
 * `Simulation` (`simulation.spawn(...)`). No physics-engine types appear
 * here — everything is data until the world uploads it to the wasm runtime.
 */
export class CollisionBuilder {
  static: boolean = false;
  sensor: boolean = false;
  gravityScale?: number;
  lockRotations?: LockAxesInput;
  lockTranslations?: LockAxesInput;

  build(options: Partial<CollisionOptions>): [SimulationBodyDefinition, SimulationColliderDefinition] {
    const bodyDef = this.bodyDesc({
      isDynamicBody: !this.static,
    });
    const collider = this.collider(options);
    if (this.sensor) {
      collider.sensor = true;
    }
    if (options.collisionType) {
      collider.collisionGroups = packCollisionGroups(
        options.collisionType,
        options.collisionFilter,
      );
    }
    return [bodyDef, collider];
  }

  withCollision(collisionOptions: Partial<CollisionOptions>): this {
    this.sensor = collisionOptions?.sensor ?? this.sensor;
    this.static = collisionOptions?.static ?? this.static;
    this.gravityScale = collisionOptions?.gravityScale ?? this.gravityScale;
    this.lockRotations = collisionOptions?.lockRotations ?? this.lockRotations;
    this.lockTranslations = collisionOptions?.lockTranslations ?? this.lockTranslations;
    return this;
  }

  collider(options: CollisionOptions): SimulationColliderDefinition {
    const size = normalizeVec3(options.size, VEC3_ONE);
    const position = normalizeVec3(options.position, VEC3_ZERO);
    return {
      shape: { type: 'box', halfExtents: [size.x / 2, size.y / 2, size.z / 2] },
      offset: [position.x, position.y, position.z],
    };
  }

  bodyDesc({ isDynamicBody = true }): SimulationBodyDefinition {
    const def: SimulationBodyDefinition = {
      kind: isDynamicBody ? StageBodyKind.Dynamic : StageBodyKind.Static,
      position: [0, 0, 0],
      gravityScale: this.gravityScale ?? 1,
      canSleep: false,
      ccdEnabled: true,
    };
    const lockRotation = normalizeLockAxes(this.lockRotations);
    if (lockRotation) {
      def.lockRotation = lockRotation;
    }
    const lockTranslation = normalizeLockAxes(this.lockTranslations);
    if (lockTranslation) {
      def.lockTranslation = lockTranslation;
    }
    return def;
  }
}
