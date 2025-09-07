import { createWorld as l, addEntity as c, addComponent as u, removeEntity as f } from "bitecs";
import { Vector3 as o, Vector2 as p } from "three";
import { ZylemWorld as d } from "../collision/world.js";
import { ZylemScene as m } from "../graphics/zylem-scene.js";
import { setStageBackgroundColor as y, setStageBackgroundImage as g, setStageVariables as b, resetStageVariables as w } from "./stage-state.js";
import { ZylemBlueColor as E } from "../core/utility.js";
import { debugState as a } from "../debug/debug-state.js";
import { getGlobalState as h } from "../game/game-state.js";
import { LifeCycleBase as v } from "../core/lifecycle-base.js";
import S from "../systems/transformable.system.js";
import { BaseNode as M } from "../core/base-node.js";
import { nanoid as C } from "nanoid";
import { ZylemCamera as _ } from "../camera/zylem-camera.js";
import { Perspectives as k } from "../camera/perspective.js";
import { CameraWrapper as B } from "../camera/camera.js";
import { StageDebugDelegate as I } from "./stage-debug-delegate.js";
import { GameEntity as O } from "../entities/entity.js";
const P = "Stage";
class K extends v {
  type = P;
  state = {
    backgroundColor: E,
    backgroundImage: null,
    inputs: {
      p1: ["gamepad-1", "keyboard"],
      p2: ["gamepad-2", "keyboard"]
    },
    gravity: new o(0, 0, 0),
    variables: {},
    entities: []
  };
  gravity;
  world;
  scene;
  children = [];
  _childrenMap = /* @__PURE__ */ new Map();
  _removalMap = /* @__PURE__ */ new Map();
  pendingEntities = [];
  pendingPromises = [];
  isLoaded = !1;
  _debugMap = /* @__PURE__ */ new Map();
  entityAddedHandlers = [];
  ecs = l();
  testSystem = null;
  transformSystem = null;
  debugDelegate = null;
  uuid;
  wrapperRef = null;
  camera;
  cameraRef = null;
  /**
   * Create a new stage.
   * @param options Stage options: partial config, camera, and initial entities or factories
   */
  constructor(e = []) {
    super(), this.world = null, this.scene = null, this.uuid = C();
    const { config: t, entities: i, asyncEntities: s, camera: r } = this.parseOptions(e);
    this.camera = r, this.children = i, this.pendingEntities = s, this.saveState({
      backgroundColor: t.backgroundColor ?? this.state.backgroundColor,
      backgroundImage: t.backgroundImage ?? this.state.backgroundImage,
      inputs: t.inputs ?? this.state.inputs,
      gravity: t.gravity ?? this.state.gravity,
      variables: t.variables ?? this.state.variables,
      entities: []
    }), this.gravity = t.gravity ?? new o(0, 0, 0);
    const n = this;
    window.onresize = function() {
      n.resize(window.innerWidth, window.innerHeight);
    };
  }
  parseOptions(e) {
    let t = {};
    const i = [], s = [];
    let r;
    for (const n of e)
      this.isCameraWrapper(n) ? r = n : this.isBaseNode(n) ? i.push(n) : this.isEntityInput(n) ? s.push(n) : this.isZylemStageConfig(n) && (t = { ...t, ...n });
    return { config: t, entities: i, asyncEntities: s, camera: r };
  }
  isZylemStageConfig(e) {
    return e && typeof e == "object" && !(e instanceof M) && !(e instanceof B);
  }
  isBaseNode(e) {
    return e && typeof e == "object" && typeof e.create == "function";
  }
  isCameraWrapper(e) {
    return e && typeof e == "object" && e.constructor.name === "CameraWrapper";
  }
  isEntityInput(e) {
    return e ? !!(this.isBaseNode(e) || typeof e == "function" || typeof e == "object" && typeof e.then == "function") : !1;
  }
  isThenable(e) {
    return !!e && typeof e.then == "function";
  }
  handleEntityImmediatelyOrQueue(e) {
    this.isLoaded ? this.spawnEntity(e) : this.children.push(e);
  }
  handlePromiseWithSpawnOnResolve(e) {
    this.isLoaded ? e.then((t) => this.spawnEntity(t)).catch((t) => console.error("Failed to build async entity", t)) : this.pendingPromises.push(e);
  }
  saveState(e) {
    this.state = e;
  }
  setState() {
    const { backgroundColor: e, backgroundImage: t } = this.state;
    y(e), g(t), b(this.state.variables ?? {});
  }
  /**
   * Load and initialize the stage's scene and world.
   * @param id DOM element id for the renderer container
   * @param camera Optional camera override
   */
  async load(e, t) {
    this.setState();
    const i = t || (this.camera ? this.camera.cameraRef : this.createDefaultCamera());
    this.cameraRef = i, this.scene = new m(e, i, this.state);
    const s = await d.loadPhysics(this.gravity ?? new o(0, 0, 0));
    this.world = new d(s), this.scene.setup();
    for (let r of this.children)
      this.spawnEntity(r);
    if (this.pendingEntities.length && (this.enqueue(...this.pendingEntities), this.pendingEntities = []), this.pendingPromises.length) {
      for (const r of this.pendingPromises)
        r.then((n) => this.spawnEntity(n)).catch((n) => console.error("Failed to resolve pending stage entity", n));
      this.pendingPromises = [];
    }
    this.transformSystem = S(this), this.isLoaded = !0;
  }
  createDefaultCamera() {
    const e = window.innerWidth, t = window.innerHeight, i = new p(e, t);
    return new _(k.ThirdPerson, i);
  }
  _setup(e) {
    if (!this.scene || !this.world) {
      this.logMissingEntities();
      return;
    }
    a.on && (this.debugDelegate = new I(this));
  }
  _update(e) {
    const { delta: t } = e;
    if (!this.scene || !this.world) {
      this.logMissingEntities();
      return;
    }
    this.world.update(e), this.transformSystem(this.ecs), this._childrenMap.forEach((i, s) => {
      i.nodeUpdate({
        ...e,
        me: i
      }), i.markedForRemoval && this.removeEntityByUuid(i.uuid);
    }), this.scene.update({ delta: t });
  }
  outOfLoop() {
    this.debugUpdate();
  }
  /** Update debug overlays and helpers if enabled. */
  debugUpdate() {
    a.on && this.debugDelegate?.update();
  }
  /** Cleanup owned resources when the stage is destroyed. */
  _destroy(e) {
    this._childrenMap.forEach((t) => {
      try {
        t.nodeDestroy({ me: t, globals: h() });
      } catch {
      }
    }), this._childrenMap.clear(), this._removalMap.clear(), this._debugMap.clear(), this.world?.destroy(), this.scene?.destroy(), this.debugDelegate?.dispose(), this.isLoaded = !1, this.world = null, this.scene = null, this.cameraRef = null, w();
  }
  /**
   * Create, register, and add an entity to the scene/world.
   * Safe to call only after `load` when scene/world exist.
   */
  async spawnEntity(e) {
    if (!this.scene || !this.world)
      return;
    const t = e.create(), i = c(this.ecs);
    if (t.eid = i, this.scene.addEntity(t), e.behaviors)
      for (let s of e.behaviors) {
        u(this.ecs, s.component, t.eid);
        const r = Object.keys(s.values);
        for (const n of r)
          s.component[n][t.eid] = s.values[n];
      }
    t.colliderDesc && this.world.addEntity(t), e.nodeSetup({
      me: e,
      globals: h(),
      camera: this.scene.zylemCamera
    }), this.addEntityToStage(t);
  }
  buildEntityState(e) {
    return e instanceof O ? { ...e.buildInfo() } : {
      uuid: e.uuid,
      name: e.name,
      eid: e.eid
    };
  }
  /** Add the entity to internal maps and notify listeners. */
  addEntityToStage(e) {
    this._childrenMap.set(e.eid, e), a.on && this._debugMap.set(e.uuid, e);
    for (const t of this.entityAddedHandlers)
      try {
        t(e);
      } catch (i) {
        console.error("onEntityAdded handler failed", i);
      }
  }
  /**
   * Subscribe to entity-added events.
   * @param callback Invoked for each entity when added
   * @param options.replayExisting If true and stage already loaded, replays existing entities
   * @returns Unsubscribe function
   */
  onEntityAdded(e, t) {
    return this.entityAddedHandlers.push(e), t?.replayExisting && this.isLoaded && this._childrenMap.forEach((i) => {
      try {
        e(i);
      } catch (s) {
        console.error("onEntityAdded replay failed", s);
      }
    }), () => {
      this.entityAddedHandlers = this.entityAddedHandlers.filter((i) => i !== e);
    };
  }
  /**
   * Remove an entity and its resources by its UUID.
   * @returns true if removed, false if not found or stage not ready
   */
  removeEntityByUuid(e) {
    if (!this.scene || !this.world)
      return !1;
    const i = this.world.collisionMap.get(e) ?? this._debugMap.get(e);
    if (!i)
      return !1;
    this.world.destroyEntity(i), i.group ? this.scene.scene.remove(i.group) : i.mesh && this.scene.scene.remove(i.mesh), f(this.ecs, i.eid);
    let s = null;
    return this._childrenMap.forEach((r, n) => {
      r.uuid === e && (s = n);
    }), s !== null && this._childrenMap.delete(s), this._debugMap.delete(e), !0;
  }
  /** Get an entity by its name; returns null if not found. */
  getEntityByName(e) {
    const i = Object.entries(Object.fromEntries(this._childrenMap)).map((s) => s[1]).find((s) => s.name === e);
    return i || console.warn(`Entity ${e} not found`), i ?? null;
  }
  logMissingEntities() {
    console.warn("Zylem world or scene is null");
  }
  /** Resize renderer viewport. */
  resize(e, t) {
    this.scene && this.scene.updateRenderer(e, t);
  }
  /**
   * Enqueue items to be spawned. Items can be:
   * - BaseNode instances (immediate or deferred until load)
   * - Factory functions returning BaseNode or Promise<BaseNode>
   * - Promises resolving to BaseNode
   */
  enqueue(...e) {
    for (const t of e)
      if (t) {
        if (this.isBaseNode(t)) {
          this.handleEntityImmediatelyOrQueue(t);
          continue;
        }
        if (typeof t == "function") {
          try {
            const i = t();
            this.isBaseNode(i) ? this.handleEntityImmediatelyOrQueue(i) : this.isThenable(i) && this.handlePromiseWithSpawnOnResolve(i);
          } catch (i) {
            console.error("Error executing entity factory", i);
          }
          continue;
        }
        this.isThenable(t) && this.handlePromiseWithSpawnOnResolve(t);
      }
  }
}
export {
  P as STAGE_TYPE,
  K as ZylemStage
};
