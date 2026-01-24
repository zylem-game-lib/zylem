// src/lib/behaviors/behavior-descriptor.ts
function defineBehavior(config) {
  return {
    key: /* @__PURE__ */ Symbol.for(`zylem:behavior:${config.name}`),
    defaultOptions: config.defaultOptions,
    systemFactory: config.systemFactory,
    createHandle: config.createHandle
  };
}

// src/lib/behaviors/use-behavior.ts
function useBehavior(entity, descriptor, options) {
  entity.use(descriptor, options);
  return entity;
}

// src/lib/behaviors/components.ts
import { Vector3, Quaternion } from "three";
function createTransformComponent() {
  return {
    position: new Vector3(),
    rotation: new Quaternion()
  };
}
function createPhysicsBodyComponent(body) {
  return { body };
}

// src/lib/behaviors/physics-step.behavior.ts
var PhysicsStepBehavior = class {
  constructor(physicsWorld) {
    this.physicsWorld = physicsWorld;
  }
  update(dt) {
    this.physicsWorld.timestep = dt;
    this.physicsWorld.step();
  }
};

// src/lib/behaviors/physics-sync.behavior.ts
var PhysicsSyncBehavior = class {
  constructor(world) {
    this.world = world;
  }
  /**
   * Query entities that have both physics body and transform components
   */
  queryEntities() {
    const entities = [];
    for (const [, entity] of this.world.collisionMap) {
      const gameEntity = entity;
      if (gameEntity.physics?.body && gameEntity.transform) {
        entities.push({
          physics: gameEntity.physics,
          transform: gameEntity.transform
        });
      }
    }
    return entities;
  }
  update(_dt) {
    const entities = this.queryEntities();
    for (const e of entities) {
      const body = e.physics.body;
      const transform = e.transform;
      const p = body.translation();
      transform.position.set(p.x, p.y, p.z);
      const r = body.rotation();
      transform.rotation.set(r.x, r.y, r.z, r.w);
    }
  }
};

// src/lib/behaviors/thruster/components.ts
function createThrusterMovementComponent(linearThrust, angularThrust, options) {
  return {
    linearThrust,
    angularThrust,
    linearDamping: options?.linearDamping,
    angularDamping: options?.angularDamping
  };
}
function createThrusterInputComponent() {
  return {
    thrust: 0,
    rotate: 0
  };
}
function createThrusterStateComponent() {
  return {
    enabled: true,
    currentThrust: 0
  };
}

// src/lib/behaviors/thruster/thruster-fsm.ts
import { StateMachine, t } from "typescript-fsm";
var ThrusterState = /* @__PURE__ */ ((ThrusterState2) => {
  ThrusterState2["Idle"] = "idle";
  ThrusterState2["Active"] = "active";
  ThrusterState2["Boosting"] = "boosting";
  ThrusterState2["Disabled"] = "disabled";
  ThrusterState2["Docked"] = "docked";
  return ThrusterState2;
})(ThrusterState || {});
var ThrusterEvent = /* @__PURE__ */ ((ThrusterEvent2) => {
  ThrusterEvent2["Activate"] = "activate";
  ThrusterEvent2["Deactivate"] = "deactivate";
  ThrusterEvent2["Boost"] = "boost";
  ThrusterEvent2["EndBoost"] = "endBoost";
  ThrusterEvent2["Disable"] = "disable";
  ThrusterEvent2["Enable"] = "enable";
  ThrusterEvent2["Dock"] = "dock";
  ThrusterEvent2["Undock"] = "undock";
  return ThrusterEvent2;
})(ThrusterEvent || {});
var ThrusterFSM = class {
  constructor(ctx) {
    this.ctx = ctx;
    this.machine = new StateMachine(
      "idle" /* Idle */,
      [
        // Core transitions
        t("idle" /* Idle */, "activate" /* Activate */, "active" /* Active */),
        t("active" /* Active */, "deactivate" /* Deactivate */, "idle" /* Idle */),
        t("active" /* Active */, "boost" /* Boost */, "boosting" /* Boosting */),
        t("active" /* Active */, "disable" /* Disable */, "disabled" /* Disabled */),
        t("active" /* Active */, "dock" /* Dock */, "docked" /* Docked */),
        t("boosting" /* Boosting */, "endBoost" /* EndBoost */, "active" /* Active */),
        t("boosting" /* Boosting */, "disable" /* Disable */, "disabled" /* Disabled */),
        t("disabled" /* Disabled */, "enable" /* Enable */, "idle" /* Idle */),
        t("docked" /* Docked */, "undock" /* Undock */, "idle" /* Idle */),
        // Self-transitions (no-ops for redundant events)
        t("idle" /* Idle */, "deactivate" /* Deactivate */, "idle" /* Idle */),
        t("active" /* Active */, "activate" /* Activate */, "active" /* Active */)
      ]
    );
  }
  machine;
  /**
   * Get current state
   */
  getState() {
    return this.machine.getState();
  }
  /**
   * Dispatch an event to transition state
   */
  dispatch(event) {
    if (this.machine.can(event)) {
      this.machine.dispatch(event);
    }
  }
  /**
   * Update FSM state based on player input.
   * Auto-transitions between Idle/Active to report current state.
   * Does NOT modify input - just observes and reports.
   */
  update(playerInput) {
    const state = this.machine.getState();
    const hasInput = Math.abs(playerInput.thrust) > 0.01 || Math.abs(playerInput.rotate) > 0.01;
    if (hasInput && state === "idle" /* Idle */) {
      this.dispatch("activate" /* Activate */);
    } else if (!hasInput && state === "active" /* Active */) {
      this.dispatch("deactivate" /* Deactivate */);
    }
  }
};

// src/lib/behaviors/thruster/thruster-movement.behavior.ts
var ThrusterMovementBehavior = class {
  constructor(world) {
    this.world = world;
  }
  /**
   * Query function - returns entities with required thruster components
   */
  queryEntities() {
    const entities = [];
    for (const [, entity] of this.world.collisionMap) {
      const gameEntity = entity;
      if (gameEntity.physics?.body && gameEntity.thruster && gameEntity.$thruster) {
        entities.push({
          physics: gameEntity.physics,
          thruster: gameEntity.thruster,
          $thruster: gameEntity.$thruster
        });
      }
    }
    return entities;
  }
  update(_dt) {
    const entities = this.queryEntities();
    for (const e of entities) {
      const body = e.physics.body;
      const thruster = e.thruster;
      const input = e.$thruster;
      const q = body.rotation();
      const rotationZ = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
      if (input.thrust !== 0) {
        const currentVel = body.linvel();
        if (input.thrust > 0) {
          const forwardX = Math.sin(-rotationZ);
          const forwardY = Math.cos(-rotationZ);
          const thrustAmount = thruster.linearThrust * input.thrust * 0.1;
          body.setLinvel({
            x: currentVel.x + forwardX * thrustAmount,
            y: currentVel.y + forwardY * thrustAmount,
            z: currentVel.z
          }, true);
        } else {
          const brakeAmount = 0.9;
          body.setLinvel({
            x: currentVel.x * brakeAmount,
            y: currentVel.y * brakeAmount,
            z: currentVel.z
          }, true);
        }
      }
      if (input.rotate !== 0) {
        body.setAngvel({ x: 0, y: 0, z: -thruster.angularThrust * input.rotate }, true);
      } else {
        const angVel = body.angvel();
        body.setAngvel({ x: angVel.x, y: angVel.y, z: 0 }, true);
      }
    }
  }
};

// src/lib/behaviors/thruster/thruster.descriptor.ts
var defaultOptions = {
  linearThrust: 10,
  angularThrust: 5
};
var ThrusterBehaviorSystem = class {
  constructor(world) {
    this.world = world;
    this.movementBehavior = new ThrusterMovementBehavior(world);
  }
  movementBehavior;
  update(ecs, delta) {
    if (!this.world?.collisionMap) return;
    for (const [, entity] of this.world.collisionMap) {
      const gameEntity = entity;
      if (typeof gameEntity.getBehaviorRefs !== "function") continue;
      const refs = gameEntity.getBehaviorRefs();
      const thrusterRef = refs.find(
        (r) => r.descriptor.key === /* @__PURE__ */ Symbol.for("zylem:behavior:thruster")
      );
      if (!thrusterRef || !gameEntity.body) continue;
      const options = thrusterRef.options;
      if (!gameEntity.thruster) {
        gameEntity.thruster = {
          linearThrust: options.linearThrust,
          angularThrust: options.angularThrust
        };
      }
      if (!gameEntity.$thruster) {
        gameEntity.$thruster = {
          thrust: 0,
          rotate: 0
        };
      }
      if (!gameEntity.physics) {
        gameEntity.physics = { body: gameEntity.body };
      }
      if (!thrusterRef.fsm && gameEntity.$thruster) {
        thrusterRef.fsm = new ThrusterFSM({ input: gameEntity.$thruster });
      }
      if (thrusterRef.fsm && gameEntity.$thruster) {
        thrusterRef.fsm.update({
          thrust: gameEntity.$thruster.thrust,
          rotate: gameEntity.$thruster.rotate
        });
      }
    }
    this.movementBehavior.update(delta);
  }
  destroy(_ecs) {
  }
};
var ThrusterBehavior = defineBehavior({
  name: "thruster",
  defaultOptions,
  systemFactory: (ctx) => new ThrusterBehaviorSystem(ctx.world)
});

// src/lib/behaviors/screen-wrap/screen-wrap-fsm.ts
import { StateMachine as StateMachine2, t as t2 } from "typescript-fsm";
var ScreenWrapState = /* @__PURE__ */ ((ScreenWrapState2) => {
  ScreenWrapState2["Center"] = "center";
  ScreenWrapState2["NearEdgeLeft"] = "near-edge-left";
  ScreenWrapState2["NearEdgeRight"] = "near-edge-right";
  ScreenWrapState2["NearEdgeTop"] = "near-edge-top";
  ScreenWrapState2["NearEdgeBottom"] = "near-edge-bottom";
  ScreenWrapState2["Wrapped"] = "wrapped";
  return ScreenWrapState2;
})(ScreenWrapState || {});
var ScreenWrapEvent = /* @__PURE__ */ ((ScreenWrapEvent2) => {
  ScreenWrapEvent2["EnterCenter"] = "enter-center";
  ScreenWrapEvent2["ApproachLeft"] = "approach-left";
  ScreenWrapEvent2["ApproachRight"] = "approach-right";
  ScreenWrapEvent2["ApproachTop"] = "approach-top";
  ScreenWrapEvent2["ApproachBottom"] = "approach-bottom";
  ScreenWrapEvent2["Wrap"] = "wrap";
  return ScreenWrapEvent2;
})(ScreenWrapEvent || {});
var ScreenWrapFSM = class {
  machine;
  constructor() {
    this.machine = new StateMachine2(
      "center" /* Center */,
      [
        // From Center
        t2("center" /* Center */, "approach-left" /* ApproachLeft */, "near-edge-left" /* NearEdgeLeft */),
        t2("center" /* Center */, "approach-right" /* ApproachRight */, "near-edge-right" /* NearEdgeRight */),
        t2("center" /* Center */, "approach-top" /* ApproachTop */, "near-edge-top" /* NearEdgeTop */),
        t2("center" /* Center */, "approach-bottom" /* ApproachBottom */, "near-edge-bottom" /* NearEdgeBottom */),
        // From NearEdge to Wrapped
        t2("near-edge-left" /* NearEdgeLeft */, "wrap" /* Wrap */, "wrapped" /* Wrapped */),
        t2("near-edge-right" /* NearEdgeRight */, "wrap" /* Wrap */, "wrapped" /* Wrapped */),
        t2("near-edge-top" /* NearEdgeTop */, "wrap" /* Wrap */, "wrapped" /* Wrapped */),
        t2("near-edge-bottom" /* NearEdgeBottom */, "wrap" /* Wrap */, "wrapped" /* Wrapped */),
        // From NearEdge back to Center
        t2("near-edge-left" /* NearEdgeLeft */, "enter-center" /* EnterCenter */, "center" /* Center */),
        t2("near-edge-right" /* NearEdgeRight */, "enter-center" /* EnterCenter */, "center" /* Center */),
        t2("near-edge-top" /* NearEdgeTop */, "enter-center" /* EnterCenter */, "center" /* Center */),
        t2("near-edge-bottom" /* NearEdgeBottom */, "enter-center" /* EnterCenter */, "center" /* Center */),
        // From Wrapped back to Center
        t2("wrapped" /* Wrapped */, "enter-center" /* EnterCenter */, "center" /* Center */),
        // From Wrapped to NearEdge (landed near opposite edge)
        t2("wrapped" /* Wrapped */, "approach-left" /* ApproachLeft */, "near-edge-left" /* NearEdgeLeft */),
        t2("wrapped" /* Wrapped */, "approach-right" /* ApproachRight */, "near-edge-right" /* NearEdgeRight */),
        t2("wrapped" /* Wrapped */, "approach-top" /* ApproachTop */, "near-edge-top" /* NearEdgeTop */),
        t2("wrapped" /* Wrapped */, "approach-bottom" /* ApproachBottom */, "near-edge-bottom" /* NearEdgeBottom */),
        // Self-transitions (no-ops for redundant events)
        t2("center" /* Center */, "enter-center" /* EnterCenter */, "center" /* Center */),
        t2("near-edge-left" /* NearEdgeLeft */, "approach-left" /* ApproachLeft */, "near-edge-left" /* NearEdgeLeft */),
        t2("near-edge-right" /* NearEdgeRight */, "approach-right" /* ApproachRight */, "near-edge-right" /* NearEdgeRight */),
        t2("near-edge-top" /* NearEdgeTop */, "approach-top" /* ApproachTop */, "near-edge-top" /* NearEdgeTop */),
        t2("near-edge-bottom" /* NearEdgeBottom */, "approach-bottom" /* ApproachBottom */, "near-edge-bottom" /* NearEdgeBottom */)
      ]
    );
  }
  getState() {
    return this.machine.getState();
  }
  dispatch(event) {
    if (this.machine.can(event)) {
      this.machine.dispatch(event);
    }
  }
  /**
   * Update FSM based on entity position relative to bounds
   */
  update(position, bounds, wrapped) {
    const { x, y } = position;
    const { minX, maxX, minY, maxY, edgeThreshold } = bounds;
    if (wrapped) {
      this.dispatch("wrap" /* Wrap */);
      return;
    }
    const nearLeft = x < minX + edgeThreshold;
    const nearRight = x > maxX - edgeThreshold;
    const nearBottom = y < minY + edgeThreshold;
    const nearTop = y > maxY - edgeThreshold;
    if (nearLeft) {
      this.dispatch("approach-left" /* ApproachLeft */);
    } else if (nearRight) {
      this.dispatch("approach-right" /* ApproachRight */);
    } else if (nearTop) {
      this.dispatch("approach-top" /* ApproachTop */);
    } else if (nearBottom) {
      this.dispatch("approach-bottom" /* ApproachBottom */);
    } else {
      this.dispatch("enter-center" /* EnterCenter */);
    }
  }
};

// src/lib/behaviors/screen-wrap/screen-wrap.descriptor.ts
var defaultOptions2 = {
  width: 20,
  height: 15,
  centerX: 0,
  centerY: 0,
  edgeThreshold: 2
};
var ScreenWrapSystem = class {
  constructor(world) {
    this.world = world;
  }
  update(ecs, delta) {
    if (!this.world?.collisionMap) return;
    for (const [, entity] of this.world.collisionMap) {
      const gameEntity = entity;
      if (typeof gameEntity.getBehaviorRefs !== "function") continue;
      const refs = gameEntity.getBehaviorRefs();
      const wrapRef = refs.find(
        (r) => r.descriptor.key === /* @__PURE__ */ Symbol.for("zylem:behavior:screen-wrap")
      );
      if (!wrapRef || !gameEntity.body) continue;
      const options = wrapRef.options;
      if (!wrapRef.fsm) {
        wrapRef.fsm = new ScreenWrapFSM();
      }
      const wrapped = this.wrapEntity(gameEntity, options);
      const pos = gameEntity.body.translation();
      const { width, height, centerX, centerY, edgeThreshold } = options;
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      wrapRef.fsm.update(
        { x: pos.x, y: pos.y },
        {
          minX: centerX - halfWidth,
          maxX: centerX + halfWidth,
          minY: centerY - halfHeight,
          maxY: centerY + halfHeight,
          edgeThreshold
        },
        wrapped
      );
    }
  }
  wrapEntity(entity, options) {
    const body = entity.body;
    if (!body) return false;
    const { width, height, centerX, centerY } = options;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const minX = centerX - halfWidth;
    const maxX = centerX + halfWidth;
    const minY = centerY - halfHeight;
    const maxY = centerY + halfHeight;
    const pos = body.translation();
    let newX = pos.x;
    let newY = pos.y;
    let wrapped = false;
    if (pos.x < minX) {
      newX = maxX - (minX - pos.x);
      wrapped = true;
    } else if (pos.x > maxX) {
      newX = minX + (pos.x - maxX);
      wrapped = true;
    }
    if (pos.y < minY) {
      newY = maxY - (minY - pos.y);
      wrapped = true;
    } else if (pos.y > maxY) {
      newY = minY + (pos.y - maxY);
      wrapped = true;
    }
    if (wrapped) {
      body.setTranslation({ x: newX, y: newY, z: pos.z }, true);
    }
    return wrapped;
  }
  destroy(_ecs) {
  }
};
var ScreenWrapBehavior = defineBehavior({
  name: "screen-wrap",
  defaultOptions: defaultOptions2,
  systemFactory: (ctx) => new ScreenWrapSystem(ctx.world)
});

// src/lib/behaviors/world-boundary-2d/world-boundary-2d-fsm.ts
import { StateMachine as StateMachine3, t as t3 } from "typescript-fsm";
var WorldBoundary2DState = /* @__PURE__ */ ((WorldBoundary2DState2) => {
  WorldBoundary2DState2["Inside"] = "inside";
  WorldBoundary2DState2["Touching"] = "touching";
  return WorldBoundary2DState2;
})(WorldBoundary2DState || {});
var WorldBoundary2DEvent = /* @__PURE__ */ ((WorldBoundary2DEvent2) => {
  WorldBoundary2DEvent2["EnterInside"] = "enter-inside";
  WorldBoundary2DEvent2["TouchBoundary"] = "touch-boundary";
  return WorldBoundary2DEvent2;
})(WorldBoundary2DEvent || {});
function computeWorldBoundary2DHits(position, bounds) {
  const hits = {
    top: false,
    bottom: false,
    left: false,
    right: false
  };
  if (position.x <= bounds.left) hits.left = true;
  else if (position.x >= bounds.right) hits.right = true;
  if (position.y <= bounds.bottom) hits.bottom = true;
  else if (position.y >= bounds.top) hits.top = true;
  return hits;
}
function hasAnyWorldBoundary2DHit(hits) {
  return !!(hits.left || hits.right || hits.top || hits.bottom);
}
var WorldBoundary2DFSM = class {
  machine;
  lastHits = { top: false, bottom: false, left: false, right: false };
  lastPosition = null;
  lastUpdatedAtMs = null;
  constructor() {
    this.machine = new StateMachine3(
      "inside" /* Inside */,
      [
        t3("inside" /* Inside */, "touch-boundary" /* TouchBoundary */, "touching" /* Touching */),
        t3("touching" /* Touching */, "enter-inside" /* EnterInside */, "inside" /* Inside */),
        // Self transitions (no-ops)
        t3("inside" /* Inside */, "enter-inside" /* EnterInside */, "inside" /* Inside */),
        t3("touching" /* Touching */, "touch-boundary" /* TouchBoundary */, "touching" /* Touching */)
      ]
    );
  }
  getState() {
    return this.machine.getState();
  }
  /**
   * Returns the last computed hits (always available after first update call).
   */
  getLastHits() {
    return this.lastHits;
  }
  /**
   * Returns adjusted movement values based on boundary hits.
   * If the entity is touching a boundary and trying to move further into it,
   * that axis component is zeroed out.
   *
   * @param moveX - The desired X movement
   * @param moveY - The desired Y movement
   * @returns Adjusted { moveX, moveY } with boundary-blocked axes zeroed
   */
  getMovement(moveX, moveY) {
    const hits = this.lastHits;
    let adjustedX = moveX;
    let adjustedY = moveY;
    if (hits.left && moveX < 0 || hits.right && moveX > 0) {
      adjustedX = 0;
    }
    if (hits.bottom && moveY < 0 || hits.top && moveY > 0) {
      adjustedY = 0;
    }
    return { moveX: adjustedX, moveY: adjustedY };
  }
  /**
   * Returns the last position passed to `update`, if any.
   */
  getLastPosition() {
    return this.lastPosition;
  }
  /**
   * Best-effort timestamp (ms) of the last `update(...)` call.
   * This is optional metadata; systems can ignore it.
   */
  getLastUpdatedAtMs() {
    return this.lastUpdatedAtMs;
  }
  /**
   * Update FSM + extended state based on current position and bounds.
   * Returns the computed hits for convenience.
   */
  update(position, bounds) {
    const hits = computeWorldBoundary2DHits(position, bounds);
    this.lastHits = hits;
    this.lastPosition = { x: position.x, y: position.y };
    this.lastUpdatedAtMs = Date.now();
    if (hasAnyWorldBoundary2DHit(hits)) {
      this.dispatch("touch-boundary" /* TouchBoundary */);
    } else {
      this.dispatch("enter-inside" /* EnterInside */);
    }
    return hits;
  }
  dispatch(event) {
    if (this.machine.can(event)) {
      this.machine.dispatch(event);
    }
  }
};

// src/lib/behaviors/world-boundary-2d/world-boundary-2d.descriptor.ts
var defaultOptions3 = {
  boundaries: { top: 0, bottom: 0, left: 0, right: 0 }
};
function createWorldBoundary2DHandle(ref) {
  return {
    getLastHits: () => {
      const fsm = ref.fsm;
      return fsm?.getLastHits() ?? null;
    },
    getMovement: (moveX, moveY) => {
      const fsm = ref.fsm;
      return fsm?.getMovement(moveX, moveY) ?? { moveX, moveY };
    }
  };
}
var WorldBoundary2DSystem = class {
  constructor(world) {
    this.world = world;
  }
  update(_ecs, _delta) {
    if (!this.world?.collisionMap) return;
    for (const [, entity] of this.world.collisionMap) {
      const gameEntity = entity;
      if (typeof gameEntity.getBehaviorRefs !== "function") continue;
      const refs = gameEntity.getBehaviorRefs();
      const boundaryRef = refs.find(
        (r) => r.descriptor.key === /* @__PURE__ */ Symbol.for("zylem:behavior:world-boundary-2d")
      );
      if (!boundaryRef || !gameEntity.body) continue;
      const options = boundaryRef.options;
      if (!boundaryRef.fsm) {
        boundaryRef.fsm = new WorldBoundary2DFSM();
      }
      const body = gameEntity.body;
      const pos = body.translation();
      boundaryRef.fsm.update(
        { x: pos.x, y: pos.y },
        options.boundaries
      );
    }
  }
  destroy(_ecs) {
  }
};
var WorldBoundary2DBehavior = defineBehavior({
  name: "world-boundary-2d",
  defaultOptions: defaultOptions3,
  systemFactory: (ctx) => new WorldBoundary2DSystem(ctx.world),
  createHandle: createWorldBoundary2DHandle
});

// src/lib/behaviors/ricochet-2d/ricochet-2d-fsm.ts
import { StateMachine as StateMachine4, t as t4 } from "typescript-fsm";
var Ricochet2DState = /* @__PURE__ */ ((Ricochet2DState2) => {
  Ricochet2DState2["Idle"] = "idle";
  Ricochet2DState2["Ricocheting"] = "ricocheting";
  return Ricochet2DState2;
})(Ricochet2DState || {});
var Ricochet2DEvent = /* @__PURE__ */ ((Ricochet2DEvent2) => {
  Ricochet2DEvent2["StartRicochet"] = "start-ricochet";
  Ricochet2DEvent2["EndRicochet"] = "end-ricochet";
  return Ricochet2DEvent2;
})(Ricochet2DEvent || {});
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
var Ricochet2DFSM = class {
  machine;
  lastResult = null;
  lastUpdatedAtMs = null;
  constructor() {
    this.machine = new StateMachine4(
      "idle" /* Idle */,
      [
        t4("idle" /* Idle */, "start-ricochet" /* StartRicochet */, "ricocheting" /* Ricocheting */),
        t4("ricocheting" /* Ricocheting */, "end-ricochet" /* EndRicochet */, "idle" /* Idle */),
        // Self transitions (no-ops)
        t4("idle" /* Idle */, "end-ricochet" /* EndRicochet */, "idle" /* Idle */),
        t4("ricocheting" /* Ricocheting */, "start-ricochet" /* StartRicochet */, "ricocheting" /* Ricocheting */)
      ]
    );
  }
  getState() {
    return this.machine.getState();
  }
  /**
   * Returns the last computed ricochet result, or null if none.
   */
  getLastResult() {
    return this.lastResult;
  }
  /**
   * Best-effort timestamp (ms) of the last computation.
   */
  getLastUpdatedAtMs() {
    return this.lastUpdatedAtMs;
  }
  /**
   * Compute a ricochet result from collision context.
   * Returns the result for the consumer to apply, or null if invalid input.
   */
  computeRicochet(ctx, options = {}) {
    const {
      minSpeed = 2,
      maxSpeed = 20,
      speedMultiplier = 1.05,
      reflectionMode = "angled",
      maxAngleDeg = 60
    } = options;
    const { selfVelocity, selfPosition, otherPosition, otherSize } = this.extractDataFromEntities(ctx);
    if (!selfVelocity) {
      this.dispatch("end-ricochet" /* EndRicochet */);
      return null;
    }
    const speed = Math.hypot(selfVelocity.x, selfVelocity.y);
    if (speed === 0) {
      this.dispatch("end-ricochet" /* EndRicochet */);
      return null;
    }
    const normal = ctx.contact.normal ?? this.computeNormalFromPositions(selfPosition, otherPosition);
    if (!normal) {
      this.dispatch("end-ricochet" /* EndRicochet */);
      return null;
    }
    let reflected = this.computeBasicReflection(selfVelocity, normal);
    if (reflectionMode === "angled") {
      reflected = this.computeAngledDeflection(
        selfVelocity,
        normal,
        speed,
        maxAngleDeg,
        speedMultiplier,
        selfPosition,
        otherPosition,
        otherSize,
        ctx.contact.position
      );
    }
    reflected = this.applySpeedClamp(reflected, minSpeed, maxSpeed);
    const result = {
      velocity: { x: reflected.x, y: reflected.y, z: 0 },
      speed: Math.hypot(reflected.x, reflected.y),
      normal: { x: normal.x, y: normal.y, z: 0 }
    };
    this.lastResult = result;
    this.lastUpdatedAtMs = Date.now();
    this.dispatch("start-ricochet" /* StartRicochet */);
    return result;
  }
  /**
   * Extract velocity, position, and size data from entities or context.
   */
  extractDataFromEntities(ctx) {
    let selfVelocity = ctx.selfVelocity;
    let selfPosition = ctx.selfPosition;
    let otherPosition = ctx.otherPosition;
    let otherSize = ctx.otherSize;
    if (ctx.entity?.body) {
      const vel = ctx.entity.body.linvel();
      selfVelocity = selfVelocity ?? { x: vel.x, y: vel.y, z: vel.z };
      const pos = ctx.entity.body.translation();
      selfPosition = selfPosition ?? { x: pos.x, y: pos.y, z: pos.z };
    }
    if (ctx.otherEntity?.body) {
      const pos = ctx.otherEntity.body.translation();
      otherPosition = otherPosition ?? { x: pos.x, y: pos.y, z: pos.z };
    }
    if (ctx.otherEntity && "size" in ctx.otherEntity) {
      const size = ctx.otherEntity.size;
      if (size && typeof size.x === "number") {
        otherSize = otherSize ?? { x: size.x, y: size.y, z: size.z };
      }
    }
    return { selfVelocity, selfPosition, otherPosition, otherSize };
  }
  /**
   * Compute collision normal from entity positions using AABB heuristic.
   */
  computeNormalFromPositions(selfPosition, otherPosition) {
    if (!selfPosition || !otherPosition) return null;
    const dx = selfPosition.x - otherPosition.x;
    const dy = selfPosition.y - otherPosition.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      return { x: dx > 0 ? 1 : -1, y: 0, z: 0 };
    } else {
      return { x: 0, y: dy > 0 ? 1 : -1, z: 0 };
    }
  }
  /**
   * Compute basic reflection using the formula: v' = v - 2(v·n)n
   */
  computeBasicReflection(velocity, normal) {
    const vx = velocity.x;
    const vy = velocity.y;
    const dotProduct = vx * normal.x + vy * normal.y;
    return {
      x: vx - 2 * dotProduct * normal.x,
      y: vy - 2 * dotProduct * normal.y
    };
  }
  /**
   * Compute angled deflection for paddle-style reflections.
   */
  computeAngledDeflection(velocity, normal, speed, maxAngleDeg, speedMultiplier, selfPosition, otherPosition, otherSize, contactPosition) {
    const maxAngleRad = maxAngleDeg * Math.PI / 180;
    let tx = -normal.y;
    let ty = normal.x;
    if (Math.abs(normal.x) > Math.abs(normal.y)) {
      if (ty < 0) {
        tx = -tx;
        ty = -ty;
      }
    } else {
      if (tx < 0) {
        tx = -tx;
        ty = -ty;
      }
    }
    const offset = this.computeHitOffset(
      velocity,
      normal,
      speed,
      tx,
      ty,
      selfPosition,
      otherPosition,
      otherSize,
      contactPosition
    );
    const angle = clamp(offset, -1, 1) * maxAngleRad;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const newSpeed = speed * speedMultiplier;
    return {
      x: newSpeed * (normal.x * cosA + tx * sinA),
      y: newSpeed * (normal.y * cosA + ty * sinA)
    };
  }
  /**
   * Compute hit offset for angled deflection (-1 to 1).
   */
  computeHitOffset(velocity, normal, speed, tx, ty, selfPosition, otherPosition, otherSize, contactPosition) {
    if (otherPosition && otherSize) {
      const useY = Math.abs(normal.x) > Math.abs(normal.y);
      const halfExtent = useY ? otherSize.y / 2 : otherSize.x / 2;
      if (useY) {
        const selfY = selfPosition?.y ?? contactPosition?.y ?? 0;
        const paddleY = otherPosition.y;
        return (selfY - paddleY) / halfExtent;
      } else {
        const selfX = selfPosition?.x ?? contactPosition?.x ?? 0;
        const paddleX = otherPosition.x;
        return (selfX - paddleX) / halfExtent;
      }
    }
    return (velocity.x * tx + velocity.y * ty) / speed;
  }
  /**
   * Apply speed constraints to the reflected velocity.
   */
  applySpeedClamp(velocity, minSpeed, maxSpeed) {
    const currentSpeed = Math.hypot(velocity.x, velocity.y);
    if (currentSpeed === 0) return velocity;
    const targetSpeed = clamp(currentSpeed, minSpeed, maxSpeed);
    const scale = targetSpeed / currentSpeed;
    return {
      x: velocity.x * scale,
      y: velocity.y * scale
    };
  }
  /**
   * Clear the ricochet state (call after consumer has applied the result).
   */
  clearRicochet() {
    this.dispatch("end-ricochet" /* EndRicochet */);
  }
  dispatch(event) {
    if (this.machine.can(event)) {
      this.machine.dispatch(event);
    }
  }
};

// src/lib/behaviors/ricochet-2d/ricochet-2d.descriptor.ts
var defaultOptions4 = {
  minSpeed: 2,
  maxSpeed: 20,
  speedMultiplier: 1.05,
  reflectionMode: "angled",
  maxAngleDeg: 60
};
function createRicochet2DHandle(ref) {
  return {
    getRicochet: (ctx) => {
      const fsm = ref.fsm;
      if (!fsm) return null;
      return fsm.computeRicochet(ctx, ref.options);
    },
    getLastResult: () => {
      const fsm = ref.fsm;
      return fsm?.getLastResult() ?? null;
    }
  };
}
var Ricochet2DSystem = class {
  constructor(world) {
    this.world = world;
  }
  update(_ecs, _delta) {
    if (!this.world?.collisionMap) return;
    for (const [, entity] of this.world.collisionMap) {
      const gameEntity = entity;
      if (typeof gameEntity.getBehaviorRefs !== "function") continue;
      const refs = gameEntity.getBehaviorRefs();
      const ricochetRef = refs.find(
        (r) => r.descriptor.key === /* @__PURE__ */ Symbol.for("zylem:behavior:ricochet-2d")
      );
      if (!ricochetRef) continue;
      if (!ricochetRef.fsm) {
        ricochetRef.fsm = new Ricochet2DFSM();
      }
    }
  }
  destroy(_ecs) {
  }
};
var Ricochet2DBehavior = defineBehavior({
  name: "ricochet-2d",
  defaultOptions: defaultOptions4,
  systemFactory: (ctx) => new Ricochet2DSystem(ctx.world),
  createHandle: createRicochet2DHandle
});

// src/lib/behaviors/movement-sequence-2d/movement-sequence-2d-fsm.ts
import { StateMachine as StateMachine5, t as t5 } from "typescript-fsm";
var MovementSequence2DState = /* @__PURE__ */ ((MovementSequence2DState2) => {
  MovementSequence2DState2["Idle"] = "idle";
  MovementSequence2DState2["Running"] = "running";
  MovementSequence2DState2["Paused"] = "paused";
  MovementSequence2DState2["Completed"] = "completed";
  return MovementSequence2DState2;
})(MovementSequence2DState || {});
var MovementSequence2DEvent = /* @__PURE__ */ ((MovementSequence2DEvent2) => {
  MovementSequence2DEvent2["Start"] = "start";
  MovementSequence2DEvent2["Pause"] = "pause";
  MovementSequence2DEvent2["Resume"] = "resume";
  MovementSequence2DEvent2["Complete"] = "complete";
  MovementSequence2DEvent2["Reset"] = "reset";
  return MovementSequence2DEvent2;
})(MovementSequence2DEvent || {});
var MovementSequence2DFSM = class {
  machine;
  sequence = [];
  loop = true;
  currentIndex = 0;
  timeRemaining = 0;
  constructor() {
    this.machine = new StateMachine5(
      "idle" /* Idle */,
      [
        // From Idle
        t5("idle" /* Idle */, "start" /* Start */, "running" /* Running */),
        // From Running
        t5("running" /* Running */, "pause" /* Pause */, "paused" /* Paused */),
        t5("running" /* Running */, "complete" /* Complete */, "completed" /* Completed */),
        t5("running" /* Running */, "reset" /* Reset */, "idle" /* Idle */),
        // From Paused
        t5("paused" /* Paused */, "resume" /* Resume */, "running" /* Running */),
        t5("paused" /* Paused */, "reset" /* Reset */, "idle" /* Idle */),
        // From Completed
        t5("completed" /* Completed */, "reset" /* Reset */, "idle" /* Idle */),
        t5("completed" /* Completed */, "start" /* Start */, "running" /* Running */),
        // Self-transitions (no-ops)
        t5("idle" /* Idle */, "pause" /* Pause */, "idle" /* Idle */),
        t5("idle" /* Idle */, "resume" /* Resume */, "idle" /* Idle */),
        t5("running" /* Running */, "start" /* Start */, "running" /* Running */),
        t5("running" /* Running */, "resume" /* Resume */, "running" /* Running */),
        t5("paused" /* Paused */, "pause" /* Pause */, "paused" /* Paused */),
        t5("completed" /* Completed */, "complete" /* Complete */, "completed" /* Completed */)
      ]
    );
  }
  /**
   * Initialize the sequence. Call this once with options.
   */
  init(sequence, loop) {
    this.sequence = sequence;
    this.loop = loop;
    this.currentIndex = 0;
    this.timeRemaining = sequence.length > 0 ? sequence[0].timeInSeconds : 0;
  }
  getState() {
    return this.machine.getState();
  }
  /**
   * Start the sequence (from Idle or Completed).
   */
  start() {
    if (this.machine.getState() === "idle" /* Idle */ || this.machine.getState() === "completed" /* Completed */) {
      this.currentIndex = 0;
      this.timeRemaining = this.sequence.length > 0 ? this.sequence[0].timeInSeconds : 0;
    }
    this.dispatch("start" /* Start */);
  }
  /**
   * Pause the sequence.
   */
  pause() {
    this.dispatch("pause" /* Pause */);
  }
  /**
   * Resume a paused sequence.
   */
  resume() {
    this.dispatch("resume" /* Resume */);
  }
  /**
   * Reset to Idle state.
   */
  reset() {
    this.dispatch("reset" /* Reset */);
    this.currentIndex = 0;
    this.timeRemaining = this.sequence.length > 0 ? this.sequence[0].timeInSeconds : 0;
  }
  /**
   * Update the sequence with delta time.
   * Returns the current movement to apply.
   * Automatically starts if in Idle state.
   */
  update(delta) {
    if (this.sequence.length === 0) {
      return { moveX: 0, moveY: 0 };
    }
    if (this.machine.getState() === "idle" /* Idle */) {
      this.start();
    }
    if (this.machine.getState() !== "running" /* Running */) {
      if (this.machine.getState() === "completed" /* Completed */) {
        return { moveX: 0, moveY: 0 };
      }
      const step2 = this.sequence[this.currentIndex];
      return { moveX: step2?.moveX ?? 0, moveY: step2?.moveY ?? 0 };
    }
    let timeLeft = this.timeRemaining - delta;
    while (timeLeft <= 0) {
      const overflow = -timeLeft;
      this.currentIndex += 1;
      if (this.currentIndex >= this.sequence.length) {
        if (!this.loop) {
          this.dispatch("complete" /* Complete */);
          return { moveX: 0, moveY: 0 };
        }
        this.currentIndex = 0;
      }
      timeLeft = this.sequence[this.currentIndex].timeInSeconds - overflow;
    }
    this.timeRemaining = timeLeft;
    const step = this.sequence[this.currentIndex];
    return { moveX: step?.moveX ?? 0, moveY: step?.moveY ?? 0 };
  }
  /**
   * Get the current movement without advancing time.
   */
  getMovement() {
    if (this.sequence.length === 0 || this.machine.getState() === "completed" /* Completed */) {
      return { moveX: 0, moveY: 0 };
    }
    const step = this.sequence[this.currentIndex];
    return { moveX: step?.moveX ?? 0, moveY: step?.moveY ?? 0 };
  }
  /**
   * Get current step info.
   */
  getCurrentStep() {
    if (this.sequence.length === 0) return null;
    const step = this.sequence[this.currentIndex];
    if (!step) return null;
    return {
      name: step.name,
      index: this.currentIndex,
      moveX: step.moveX ?? 0,
      moveY: step.moveY ?? 0,
      timeRemaining: this.timeRemaining
    };
  }
  /**
   * Get sequence progress.
   */
  getProgress() {
    return {
      stepIndex: this.currentIndex,
      totalSteps: this.sequence.length,
      stepTimeRemaining: this.timeRemaining,
      done: this.machine.getState() === "completed" /* Completed */
    };
  }
  dispatch(event) {
    if (this.machine.can(event)) {
      this.machine.dispatch(event);
    }
  }
};

// src/lib/behaviors/movement-sequence-2d/movement-sequence-2d.descriptor.ts
var defaultOptions5 = {
  sequence: [],
  loop: true
};
function createMovementSequence2DHandle(ref) {
  return {
    getMovement: () => {
      const fsm = ref.fsm;
      return fsm?.getMovement() ?? { moveX: 0, moveY: 0 };
    },
    getCurrentStep: () => {
      const fsm = ref.fsm;
      return fsm?.getCurrentStep() ?? null;
    },
    getProgress: () => {
      const fsm = ref.fsm;
      return fsm?.getProgress() ?? { stepIndex: 0, totalSteps: 0, stepTimeRemaining: 0, done: true };
    },
    pause: () => {
      const fsm = ref.fsm;
      fsm?.pause();
    },
    resume: () => {
      const fsm = ref.fsm;
      fsm?.resume();
    },
    reset: () => {
      const fsm = ref.fsm;
      fsm?.reset();
    }
  };
}
var MovementSequence2DSystem = class {
  constructor(world) {
    this.world = world;
  }
  update(_ecs, delta) {
    if (!this.world?.collisionMap) return;
    for (const [, entity] of this.world.collisionMap) {
      const gameEntity = entity;
      if (typeof gameEntity.getBehaviorRefs !== "function") continue;
      const refs = gameEntity.getBehaviorRefs();
      const sequenceRef = refs.find(
        (r) => r.descriptor.key === /* @__PURE__ */ Symbol.for("zylem:behavior:movement-sequence-2d")
      );
      if (!sequenceRef) continue;
      const options = sequenceRef.options;
      if (!sequenceRef.fsm) {
        sequenceRef.fsm = new MovementSequence2DFSM();
        sequenceRef.fsm.init(options.sequence, options.loop);
      }
      sequenceRef.fsm.update(delta);
    }
  }
  destroy(_ecs) {
  }
};
var MovementSequence2DBehavior = defineBehavior({
  name: "movement-sequence-2d",
  defaultOptions: defaultOptions5,
  systemFactory: (ctx) => new MovementSequence2DSystem(ctx.world),
  createHandle: createMovementSequence2DHandle
});

// src/lib/coordinators/boundary-ricochet.coordinator.ts
var BoundaryRicochetCoordinator = class {
  constructor(entity, boundary, ricochet) {
    this.entity = entity;
    this.boundary = boundary;
    this.ricochet = ricochet;
  }
  /**
   * Update loop - call this every frame
   */
  update() {
    const hits = this.boundary.getLastHits();
    if (!hits) return null;
    const anyHit = hits.left || hits.right || hits.top || hits.bottom;
    if (!anyHit) return null;
    let normalX = 0;
    let normalY = 0;
    if (hits.left) normalX = 1;
    if (hits.right) normalX = -1;
    if (hits.bottom) normalY = 1;
    if (hits.top) normalY = -1;
    return this.ricochet.getRicochet({
      entity: this.entity,
      contact: { normal: { x: normalX, y: normalY } }
    });
  }
};
export {
  BoundaryRicochetCoordinator,
  MovementSequence2DBehavior,
  MovementSequence2DEvent,
  MovementSequence2DFSM,
  MovementSequence2DState,
  PhysicsStepBehavior,
  PhysicsSyncBehavior,
  Ricochet2DBehavior,
  Ricochet2DEvent,
  Ricochet2DFSM,
  Ricochet2DState,
  ScreenWrapBehavior,
  ScreenWrapEvent,
  ScreenWrapFSM,
  ScreenWrapState,
  ThrusterBehavior,
  ThrusterEvent,
  ThrusterFSM,
  ThrusterMovementBehavior,
  ThrusterState,
  WorldBoundary2DBehavior,
  WorldBoundary2DEvent,
  WorldBoundary2DFSM,
  WorldBoundary2DState,
  computeWorldBoundary2DHits,
  createPhysicsBodyComponent,
  createThrusterInputComponent,
  createThrusterMovementComponent,
  createThrusterStateComponent,
  createTransformComponent,
  defineBehavior,
  hasAnyWorldBoundary2DHit,
  useBehavior
};
//# sourceMappingURL=behaviors.js.map