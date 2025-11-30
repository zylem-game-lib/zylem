// src/lib/actions/behaviors/boundaries/boundary.ts
var defaultBoundaryOptions = {
  boundaries: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  stopMovement: true
};
function boundary2d(options = {}) {
  return {
    type: "update",
    handler: (updateContext) => {
      _boundary2d(updateContext, options);
    }
  };
}
function _boundary2d(updateContext, options) {
  const { me: entity } = updateContext;
  const { boundaries, onBoundary } = {
    ...defaultBoundaryOptions,
    ...options
  };
  const position = entity.getPosition();
  if (!position) return;
  let boundariesHit = { top: false, bottom: false, left: false, right: false };
  if (position.x <= boundaries.left) {
    boundariesHit.left = true;
  } else if (position.x >= boundaries.right) {
    boundariesHit.right = true;
  }
  if (position.y <= boundaries.bottom) {
    boundariesHit.bottom = true;
  } else if (position.y >= boundaries.top) {
    boundariesHit.top = true;
  }
  const stopMovement = options.stopMovement ?? true;
  if (stopMovement && boundariesHit) {
    const velocity = entity.getVelocity() ?? { x: 0, y: 0, z: 0 };
    let { x: newX, y: newY } = velocity;
    if (velocity?.y < 0 && boundariesHit.bottom) {
      newY = 0;
    } else if (velocity?.y > 0 && boundariesHit.top) {
      newY = 0;
    }
    if (velocity?.x < 0 && boundariesHit.left) {
      newX = 0;
    } else if (velocity?.x > 0 && boundariesHit.right) {
      newX = 0;
    }
    entity.moveXY(newX, newY);
  }
  if (onBoundary && boundariesHit) {
    onBoundary({
      me: entity,
      boundary: boundariesHit,
      position: { x: position.x, y: position.y, z: position.z },
      updateContext
    });
  }
}

// src/lib/collision/collision-builder.ts
import { ActiveCollisionTypes, ColliderDesc, RigidBodyDesc, RigidBodyType, Vector3 } from "@dimforge/rapier3d-compat";
var typeToGroup = /* @__PURE__ */ new Map();
var nextGroupId = 0;
function getOrCreateCollisionGroupId(type) {
  let groupId = typeToGroup.get(type);
  if (groupId === void 0) {
    groupId = nextGroupId++ % 16;
    typeToGroup.set(type, groupId);
  }
  return groupId;
}

// src/lib/collision/utils.ts
function matchesCollisionSelector(other, selector) {
  if (!selector) return true;
  const otherName = other.name ?? "";
  if ("name" in selector) {
    const sel = selector.name;
    if (sel instanceof RegExp) {
      return sel.test(otherName);
    } else if (Array.isArray(sel)) {
      return sel.some((s) => s === otherName);
    } else {
      return otherName === sel;
    }
  } else if ("mask" in selector) {
    const m = selector.mask;
    if (m instanceof RegExp) {
      const type = other.collisionType ?? "";
      return m.test(type);
    } else {
      const type = other.collisionType ?? "";
      const gid = getOrCreateCollisionGroupId(type);
      return (m & 1 << gid) !== 0;
    }
  } else if ("test" in selector) {
    return !!selector.test(other);
  }
  return true;
}

// src/lib/actions/behaviors/ricochet/ricochet-2d-collision.ts
function ricochet2DCollision(options = {}, callback) {
  return {
    type: "collision",
    handler: (collisionContext) => {
      debugger;
      _handleRicochet2DCollision(collisionContext, options, callback);
    }
  };
}
function _handleRicochet2DCollision(collisionContext, options, callback) {
  const { entity, other } = collisionContext;
  const self = entity;
  if (other.collider?.isSensor()) return;
  const {
    minSpeed = 2,
    maxSpeed = 20,
    separation = 0,
    collisionWith = void 0
  } = {
    ...options
  };
  const reflectionMode = options?.reflectionMode ?? "angled";
  const maxAngleDeg = options?.maxAngleDeg ?? 60;
  const speedUpFactor = options?.speedUpFactor ?? 1.05;
  const minOffsetForAngle = options?.minOffsetForAngle ?? 0.15;
  const centerRetentionFactor = options?.centerRetentionFactor ?? 0.5;
  if (!matchesCollisionSelector(other, collisionWith)) return;
  const selfPos = self.getPosition();
  const otherPos = other.body?.translation();
  const vel = self.getVelocity();
  if (!selfPos || !otherPos || !vel) return;
  let newVelX = vel.x;
  let newVelY = vel.y;
  let newX = selfPos.x;
  let newY = selfPos.y;
  const dx = selfPos.x - otherPos.x;
  const dy = selfPos.y - otherPos.y;
  let extentX = null;
  let extentY = null;
  const colliderShape = other.collider?.shape;
  if (colliderShape) {
    if (colliderShape.halfExtents) {
      extentX = Math.abs(colliderShape.halfExtents.x ?? colliderShape.halfExtents[0] ?? null);
      extentY = Math.abs(colliderShape.halfExtents.y ?? colliderShape.halfExtents[1] ?? null);
    }
    if ((extentX == null || extentY == null) && typeof colliderShape.radius === "number") {
      extentX = extentX ?? Math.abs(colliderShape.radius);
      extentY = extentY ?? Math.abs(colliderShape.radius);
    }
  }
  if ((extentX == null || extentY == null) && typeof other.collider?.halfExtents === "function") {
    const he = other.collider.halfExtents();
    if (he) {
      extentX = extentX ?? Math.abs(he.x);
      extentY = extentY ?? Math.abs(he.y);
    }
  }
  if ((extentX == null || extentY == null) && typeof other.collider?.radius === "function") {
    const r = other.collider.radius();
    if (typeof r === "number") {
      extentX = extentX ?? Math.abs(r);
      extentY = extentY ?? Math.abs(r);
    }
  }
  let relX = 0;
  let relY = 0;
  if (extentX && extentY) {
    relX = clamp(dx / extentX, -1, 1);
    relY = clamp(dy / extentY, -1, 1);
  } else {
    relX = Math.sign(dx);
    relY = Math.sign(dy);
  }
  let bounceVertical = Math.abs(dy) >= Math.abs(dx);
  let selfExtentX = null;
  let selfExtentY = null;
  const selfShape = self.collider?.shape;
  if (selfShape) {
    if (selfShape.halfExtents) {
      selfExtentX = Math.abs(selfShape.halfExtents.x ?? selfShape.halfExtents[0] ?? null);
      selfExtentY = Math.abs(selfShape.halfExtents.y ?? selfShape.halfExtents[1] ?? null);
    }
    if ((selfExtentX == null || selfExtentY == null) && typeof selfShape.radius === "number") {
      selfExtentX = selfExtentX ?? Math.abs(selfShape.radius);
      selfExtentY = selfExtentY ?? Math.abs(selfShape.radius);
    }
  }
  if ((selfExtentX == null || selfExtentY == null) && typeof self.collider?.halfExtents === "function") {
    const heS = self.collider.halfExtents();
    if (heS) {
      selfExtentX = selfExtentX ?? Math.abs(heS.x);
      selfExtentY = selfExtentY ?? Math.abs(heS.y);
    }
  }
  if ((selfExtentX == null || selfExtentY == null) && typeof self.collider?.radius === "function") {
    const rS = self.collider.radius();
    if (typeof rS === "number") {
      selfExtentX = selfExtentX ?? Math.abs(rS);
      selfExtentY = selfExtentY ?? Math.abs(rS);
    }
  }
  if (extentX != null && extentY != null && selfExtentX != null && selfExtentY != null) {
    const penX = selfExtentX + extentX - Math.abs(dx);
    const penY = selfExtentY + extentY - Math.abs(dy);
    if (!Number.isNaN(penX) && !Number.isNaN(penY)) {
      bounceVertical = penY <= penX;
    }
  }
  let usedAngleDeflection = false;
  if (bounceVertical) {
    const resolvedY = (extentY ?? 0) + (selfExtentY ?? 0) + separation;
    newY = otherPos.y + (dy > 0 ? resolvedY : -resolvedY);
    newX = selfPos.x;
    const isHorizontalPaddle = extentX != null && extentY != null && extentX > extentY;
    if (isHorizontalPaddle && reflectionMode === "angled") {
      const maxAngleRad = maxAngleDeg * Math.PI / 180;
      const deadzone = Math.max(0, Math.min(1, minOffsetForAngle));
      const clampedOffsetX = clamp(relX, -1, 1);
      const absOff = Math.abs(clampedOffsetX);
      const baseSpeed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      const speed = clamp(baseSpeed * speedUpFactor, minSpeed, maxSpeed);
      if (absOff > deadzone) {
        const t = (absOff - deadzone) / (1 - deadzone);
        const angle = Math.sign(clampedOffsetX) * (t * maxAngleRad);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const vy = Math.abs(speed * cosA);
        const vx = speed * sinA;
        newVelY = dy > 0 ? vy : -vy;
        newVelX = vx;
      } else {
        const vx = vel.x * centerRetentionFactor;
        const vyMagSquared = Math.max(0, speed * speed - vx * vx);
        const vy = Math.sqrt(vyMagSquared);
        newVelY = dy > 0 ? vy : -vy;
        newVelX = vx;
      }
      usedAngleDeflection = true;
    } else {
      newVelY = dy > 0 ? Math.abs(vel.y) : -Math.abs(vel.y);
      if (reflectionMode === "simple") usedAngleDeflection = true;
    }
  } else {
    const resolvedX = (extentX ?? 0) + (selfExtentX ?? 0) + separation;
    newX = otherPos.x + (dx > 0 ? resolvedX : -resolvedX);
    newY = selfPos.y;
    if (reflectionMode === "angled") {
      const maxAngleRad = maxAngleDeg * Math.PI / 180;
      const deadzone = Math.max(0, Math.min(1, minOffsetForAngle));
      const clampedOffsetY = clamp(relY, -1, 1);
      const absOff = Math.abs(clampedOffsetY);
      const baseSpeed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      const speed = clamp(baseSpeed * speedUpFactor, minSpeed, maxSpeed);
      if (absOff > deadzone) {
        const t = (absOff - deadzone) / (1 - deadzone);
        const angle = Math.sign(clampedOffsetY) * (t * maxAngleRad);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const vx = Math.abs(speed * cosA);
        const vy = speed * sinA;
        newVelX = dx > 0 ? vx : -vx;
        newVelY = vy;
      } else {
        const vy = vel.y * centerRetentionFactor;
        const vxMagSquared = Math.max(0, speed * speed - vy * vy);
        const vx = Math.sqrt(vxMagSquared);
        newVelX = dx > 0 ? vx : -vx;
        newVelY = vy;
      }
      usedAngleDeflection = true;
    } else {
      newVelX = dx > 0 ? Math.abs(vel.x) : -Math.abs(vel.x);
      newVelY = vel.y;
      usedAngleDeflection = true;
    }
  }
  if (!usedAngleDeflection) {
    const additionBaseX = Math.abs(newVelX);
    const additionBaseY = Math.abs(newVelY);
    const addX = Math.sign(relX) * Math.abs(relX) * additionBaseX;
    const addY = Math.sign(relY) * Math.abs(relY) * additionBaseY;
    newVelX += addX;
    newVelY += addY;
  }
  const currentSpeed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
  if (currentSpeed > 0) {
    const targetSpeed = clamp(currentSpeed, minSpeed, maxSpeed);
    if (targetSpeed !== currentSpeed) {
      const scale = targetSpeed / currentSpeed;
      newVelX *= scale;
      newVelY *= scale;
    }
  }
  if (newX !== selfPos.x || newY !== selfPos.y) {
    self.setPosition(newX, newY, selfPos.z);
    self.moveXY(newVelX, newVelY);
    if (callback) {
      const velocityAfter = self.getVelocity();
      if (velocityAfter) {
        callback({
          position: { x: newX, y: newY, z: selfPos.z },
          ...collisionContext
        });
      }
    }
  }
}

// src/lib/actions/behaviors/ricochet/ricochet.ts
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// src/lib/actions/behaviors/ricochet/ricochet-2d-in-bounds.ts
function ricochet2DInBounds(options = {}, callback) {
  return {
    type: "update",
    handler: (updateContext) => {
      _handleRicochet2DInBounds(updateContext, options, callback);
    }
  };
}
function _handleRicochet2DInBounds(updateContext, options, callback) {
  const { me } = updateContext;
  const {
    restitution = 0,
    minSpeed = 2,
    maxSpeed = 20,
    boundaries = { top: 5, bottom: -5, left: -6.5, right: 6.5 },
    separation = 0
  } = { ...options };
  const position = me.getPosition();
  const velocity = me.getVelocity();
  if (!position || !velocity) return;
  let newVelX = velocity.x;
  let newVelY = velocity.y;
  let newX = position.x;
  let newY = position.y;
  let ricochetBoundary = null;
  if (position.x <= boundaries.left) {
    newVelX = Math.abs(velocity.x);
    newX = boundaries.left + separation;
    ricochetBoundary = "left";
  } else if (position.x >= boundaries.right) {
    newVelX = -Math.abs(velocity.x);
    newX = boundaries.right - separation;
    ricochetBoundary = "right";
  }
  if (position.y <= boundaries.bottom) {
    newVelY = Math.abs(velocity.y);
    newY = boundaries.bottom + separation;
    ricochetBoundary = "bottom";
  } else if (position.y >= boundaries.top) {
    newVelY = -Math.abs(velocity.y);
    newY = boundaries.top - separation;
    ricochetBoundary = "top";
  }
  const currentSpeed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
  if (currentSpeed > 0) {
    const targetSpeed = clamp(currentSpeed, minSpeed, maxSpeed);
    if (targetSpeed !== currentSpeed) {
      const scale = targetSpeed / currentSpeed;
      newVelX *= scale;
      newVelY *= scale;
    }
  }
  if (restitution) {
    newVelX *= restitution;
    newVelY *= restitution;
  }
  if (newX !== position.x || newY !== position.y) {
    me.setPosition(newX, newY, position.z);
    me.moveXY(newVelX, newVelY);
    if (callback && ricochetBoundary) {
      const velocityAfter = me.getVelocity();
      if (velocityAfter) {
        callback({
          boundary: ricochetBoundary,
          position: { x: newX, y: newY, z: position.z },
          velocityBefore: velocity,
          velocityAfter,
          ...updateContext
        });
      }
    }
  }
}
export {
  boundary2d,
  ricochet2DCollision,
  ricochet2DInBounds
};
//# sourceMappingURL=behaviors.js.map