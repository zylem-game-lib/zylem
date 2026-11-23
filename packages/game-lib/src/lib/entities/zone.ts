import { Box3, Vector3 } from 'three';
import { BaseNode } from '../core/base-node';
import {
  padSelectionBounds,
  type SelectionBoundsProvider,
} from '../debug/selection-bounds';
import {
  finalizeEntityCloneSupport,
  GameEntityOptions,
  GameEntity,
} from './entity';
import { CollisionHandlerDelegate } from '../collision/world';
import { state } from '../game/game-state';
import { commonDefaults, mergeArgs } from './common';
import { zoneCollision } from './primitives/parts/collision-factories';
import { Vec3Input, VEC3_ZERO, normalizeVec3, toThreeVector3 } from '../core/vector';
import { deepMergeValues } from '../core/clone-utils';

export type OnHeldParams = {
  delta: number;
  self: ZylemZone;
  visitor: GameEntity<any>;
  heldTime: number;
  globals: any;
};

export type OnEnterParams = Pick<OnHeldParams, 'self' | 'visitor' | 'globals'>;
export type OnExitParams = Pick<OnHeldParams, 'self' | 'visitor' | 'globals'>;

interface ZoneVisit {
  visitor: GameEntity<any>;
  heldTime: number;
  seenThisFrame: boolean;
}

type ZylemZoneOptions = GameEntityOptions & {
  size?: Vec3Input;
  static?: boolean;
  onEnter?: (params: OnEnterParams) => void;
  onHeld?: (params: OnHeldParams) => void;
  onExit?: (params: OnExitParams) => void;
};

const zoneDefaults: ZylemZoneOptions = {
  ...commonDefaults,
  size: new Vector3(1, 1, 1),
  collision: {
    static: true,
  },
};

export const ZONE_TYPE = Symbol('Zone');

export class ZylemZone extends GameEntity<ZylemZoneOptions>
  implements CollisionHandlerDelegate, SelectionBoundsProvider {
  static type = ZONE_TYPE;

  private readonly visits = new Map<string, ZoneVisit>();

  constructor(options?: ZylemZoneOptions) {
    super();
    this.options = deepMergeValues(zoneDefaults, options);
  }

  /**
   * A zone has no render object, so the editor cannot measure it. Its
   * selection view is the sensor volume itself: `options.size` centred on
   * the live pose (or the configured position before spawn).
   */
  getSelectionBounds(target: Box3): Box3 | null {
    const size = toThreeVector3(this.options.size, new Vector3(1, 1, 1));
    const position = this.getPose()?.position ?? normalizeVec3(this.options.position, VEC3_ZERO);
    target.setFromCenterAndSize(
      new Vector3(position.x, position.y, position.z),
      size,
    );
    return padSelectionBounds(target);
  }

  public handlePostCollision({ delta }: { delta: number }): boolean {
    for (const key of this.visits.keys()) {
      this.exited(delta, key);
    }
    return this.visits.size > 0;
  }

  public handleIntersectionEvent({
    other,
    delta,
  }: {
    other: GameEntity<any>;
    delta: number;
  }) {
    if (!this.visits.has(other.uuid)) {
      this.entered(other);
    } else {
      this.held(delta, other);
    }
  }

  onEnter(callback: (params: OnEnterParams) => void) {
    this.options.onEnter = callback;
    return this;
  }

  onHeld(callback: (params: OnHeldParams) => void) {
    this.options.onHeld = callback;
    return this;
  }

  onExit(callback: (params: OnExitParams) => void) {
    this.options.onExit = callback;
    return this;
  }

  entered(visitor: GameEntity<any>) {
    this.visits.set(visitor.uuid, { visitor, heldTime: 0, seenThisFrame: true });
    this.options.onEnter?.({ self: this, visitor, globals: state.globals });
  }

  exited(_delta: number, key: string) {
    const visit = this.visits.get(key);
    if (!visit) return;
    if (visit.seenThisFrame) {
      visit.seenThisFrame = false;
      return;
    }
    this.visits.delete(key);
    this.options.onExit?.({ self: this, visitor: visit.visitor, globals: state.globals });
  }

  held(delta: number, visitor: GameEntity<any>) {
    const visit = this.visits.get(visitor.uuid);
    if (!visit) return;
    visit.seenThisFrame = true;
    visit.heldTime += delta;
    this.options.onHeld?.({
      delta,
      self: this,
      visitor,
      globals: state.globals,
      heldTime: visit.heldTime,
    });
  }
}

type ZoneOptions = BaseNode | Partial<ZylemZoneOptions>;

export function createZone(...args: Array<ZoneOptions>): ZylemZone {
  const options = mergeArgs(args, zoneDefaults);
  const entity = new ZylemZone(options);
  entity.add(
    zoneCollision({
      size: options.size,
      static: options.collision?.static ?? true,
      collisionType: options.collisionType,
      collisionFilter: options.collisionFilter,
    }),
  );
  return finalizeEntityCloneSupport(entity, cloneOptions =>
    createZone(cloneOptions ?? {}),
  );
}
