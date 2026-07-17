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
    return {
      kind: isDynamicBody ? StageBodyKind.Dynamic : StageBodyKind.Static,
      position: [0, 0, 0],
      gravityScale: 1,
      canSleep: false,
      ccdEnabled: true,
    };
  }
}
