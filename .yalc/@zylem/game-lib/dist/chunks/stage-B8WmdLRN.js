import { p as f, Z as T, s as C, b as m, i as O, j as P, n as A, B as I, k as F, l as W, m as N, G as H, r as G } from "./actor-CDwH9h9-.js";
import { Scene as Z, Color as g, TextureLoader as V, AmbientLight as U, DirectionalLight as $, Vector3 as h, GridHelper as j, Box3 as q, BoxGeometry as v, Mesh as Q, MeshBasicMaterial as Y, EdgesGeometry as M, LineSegments as B, LineBasicMaterial as k, Group as K, Vector2 as z, Raycaster as X, BufferGeometry as J, BufferAttribute as S } from "three";
import L, { Ray as ee } from "@dimforge/rapier3d-compat";
import { C as x, Z as te, P as se } from "./camera-Clk19MUu.js";
const ie = f({
  messages: []
}), oe = (a) => {
  const t = `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] ${a}`;
  ie.messages.push(t);
}, p = {
  NONE: "NONE",
  SELECT: "SELECT",
  DELETE: "DELETE"
}, d = f({
  on: !1,
  paused: !1,
  configuration: {
    showCollisionBounds: !1,
    showModelBounds: !1,
    showSpriteBounds: !1
  },
  hovered: null,
  selected: [],
  tool: p.NONE
}), De = (a = !1) => {
  d.on = a;
}, ne = (a) => {
  d.selected.push(a);
}, R = () => d.tool, ae = (a) => {
  d.hovered = a;
}, re = () => {
  d.hovered = null;
}, de = () => d.hovered, Be = (a) => {
  d.paused = a, oe(a ? "Paused" : "Resumed");
}, ke = () => d.paused;
function _(a) {
  return typeof a?.handlePostCollision == "function" && typeof a?.handleIntersectionEvent == "function";
}
class D {
  type = "World";
  world;
  collisionMap = /* @__PURE__ */ new Map();
  collisionBehaviorMap = /* @__PURE__ */ new Map();
  _removalMap = /* @__PURE__ */ new Map();
  static async loadPhysics(e) {
    return await L.init(), new L.World(e);
  }
  constructor(e) {
    this.world = e;
  }
  addEntity(e) {
    const t = this.world.createRigidBody(e.bodyDesc);
    e.body = t, e.body.userData = { uuid: e.uuid, ref: e }, this.world.gravity.x === 0 && this.world.gravity.y === 0 && this.world.gravity.z === 0 && (e.body.lockTranslations(!0, !0), e.body.lockRotations(!0, !0));
    const s = this.world.createCollider(e.colliderDesc, e.body);
    e.collider = s, (e.controlledRotation || e instanceof T) && (e.body.lockRotations(!0, !0), e.characterController = this.world.createCharacterController(0.01), e.characterController.setMaxSlopeClimbAngle(45 * Math.PI / 180), e.characterController.setMinSlopeSlideAngle(30 * Math.PI / 180), e.characterController.enableSnapToGround(0.01), e.characterController.setSlideEnabled(!0), e.characterController.setApplyImpulsesToDynamicBodies(!0), e.characterController.setCharacterMass(1)), this.collisionMap.set(e.uuid, e);
  }
  setForRemoval(e) {
    e.body && this._removalMap.set(e.uuid, e);
  }
  destroyEntity(e) {
    e.collider && this.world.removeCollider(e.collider, !0), e.body && (this.world.removeRigidBody(e.body), this.collisionMap.delete(e.uuid), this._removalMap.delete(e.uuid));
  }
  setup() {
  }
  update(e) {
    const { delta: t } = e;
    this.world && (this.updateColliders(t), this.updatePostCollisionBehaviors(t), this.world.step());
  }
  updatePostCollisionBehaviors(e) {
    const t = this.collisionBehaviorMap;
    for (let [s, i] of t) {
      const o = i;
      if (!_(o))
        return;
      o.handlePostCollision({ entity: o, delta: e }) || this.collisionBehaviorMap.delete(s);
    }
  }
  updateColliders(e) {
    const t = this.collisionMap;
    for (let [s, i] of t) {
      const o = i;
      if (o.body) {
        if (this._removalMap.get(o.uuid)) {
          this.destroyEntity(o);
          continue;
        }
        this.world.contactsWith(o.body.collider(0), (n) => {
          const l = n._parent.userData.uuid, r = t.get(l);
          r && o._collision && o._collision(r, C.globals);
        }), this.world.intersectionsWith(o.body.collider(0), (n) => {
          const l = n._parent.userData.uuid, r = t.get(l);
          r && (o._collision && o._collision(r, C.globals), _(r) && (r.handleIntersectionEvent({ entity: r, other: o, delta: e }), this.collisionBehaviorMap.set(l, r)));
        });
      }
    }
  }
  destroy() {
    try {
      for (const [, e] of this.collisionMap)
        try {
          this.destroyEntity(e);
        } catch {
        }
      this.collisionMap.clear(), this.collisionBehaviorMap.clear(), this._removalMap.clear(), this.world = void 0;
    } catch {
    }
  }
}
class le {
  type = "Scene";
  _setup;
  scene;
  zylemCamera;
  containerElement = null;
  constructor(e, t, s) {
    const i = new Z();
    if (i.background = new g(s.backgroundColor), s.backgroundImage) {
      const n = new V().load(s.backgroundImage);
      i.background = n;
    }
    this.scene = i, this.zylemCamera = t, this.setupContainer(e), this.setupLighting(i), this.setupCamera(i, t), d.on && this.debugScene();
  }
  /**
   * Setup the container element and append camera's renderer
   */
  setupContainer(e) {
    let t = document.getElementById(e);
    if (!t) {
      console.warn(`Could not find element with id: ${e}`);
      const s = document.createElement("main");
      s.setAttribute("id", e), document.body.appendChild(s), t = s;
    }
    t?.firstChild && t.removeChild(t.firstChild), this.containerElement = t, t?.appendChild(this.zylemCamera.getDomElement());
  }
  setup() {
    this._setup && this._setup({ me: this, camera: this.zylemCamera, globals: m() });
  }
  destroy() {
    if (this.containerElement && this.zylemCamera)
      try {
        const e = this.zylemCamera.getDomElement();
        e && e.parentElement === this.containerElement && this.containerElement.removeChild(e);
      } catch {
      }
    this.zylemCamera && this.zylemCamera.destroy && this.zylemCamera.destroy(), this.scene && this.scene.traverse((e) => {
      e.geometry && e.geometry.dispose?.(), e.material && (Array.isArray(e.material) ? e.material.forEach((t) => t.dispose?.()) : e.material.dispose?.());
    });
  }
  update({ delta: e }) {
  }
  /**
   * Setup camera with the scene
   */
  setupCamera(e, t) {
    e.add(t.cameraRig), t.setup(e);
  }
  /**
   * Setup scene lighting
   */
  setupLighting(e) {
    const t = new U(16777215, 2);
    e.add(t);
    const s = new $(16777215, 2);
    s.name = "Light", s.position.set(0, 100, 0), s.castShadow = !0, s.shadow.camera.near = 0.1, s.shadow.camera.far = 2e3, s.shadow.camera.left = -100, s.shadow.camera.right = 100, s.shadow.camera.top = 100, s.shadow.camera.bottom = -100, s.shadow.mapSize.width = 2048, s.shadow.mapSize.height = 2048, e.add(s);
  }
  /**
   * Update renderer size - delegates to camera
   */
  updateRenderer(e, t) {
    this.zylemCamera.resize(e, t);
  }
  /**
   * Add object to scene
   */
  add(e, t = new h(0, 0, 0)) {
    e.position.set(t.x, t.y, t.z), this.scene.add(e);
  }
  /**
   * Add game entity to scene
   */
  addEntity(e) {
    e.group ? this.add(e.group, e.options.position) : e.mesh && this.add(e.mesh, e.options.position);
  }
  /**
   * Add debug helpers to scene
   */
  debugScene() {
    const s = new j(1e3, 100);
    this.scene.add(s);
  }
}
const c = f({
  backgroundColor: new g(g.NAMES.cornflowerblue),
  backgroundImage: null,
  inputs: {
    p1: ["gamepad-1", "keyboard-1"],
    p2: ["gamepad-2", "keyboard-2"]
  },
  variables: {},
  gravity: new h(0, 0, 0),
  entities: []
}), ce = (a) => {
  c.backgroundColor = a;
}, he = (a) => {
  c.backgroundImage = a;
}, ue = (a, e) => {
  c.variables[a] = e;
}, pe = (a) => {
  if (c.variables.hasOwnProperty(a))
    return c.variables[a];
  console.warn(`Stage variable ${a} not found`);
}, ge = (a) => {
  c.variables = { ...a };
}, me = () => {
  c.variables = {};
};
class fe {
  update = () => {
  };
  setup = () => {
  };
  destroy = () => {
  };
  nodeSetup(e) {
    typeof this._setup == "function" && this._setup(e), this.setup && this.setup(e);
  }
  nodeUpdate(e) {
    typeof this._update == "function" && this._update(e), this.update && this.update(e);
  }
  nodeDestroy(e) {
    this.destroy && this.destroy(e), typeof this._destroy == "function" && this._destroy(e);
  }
}
class ye {
  scene;
  container;
  fillMesh;
  edgeLines;
  currentColor = new g(65280);
  bbox = new q();
  size = new h();
  center = new h();
  constructor(e) {
    this.scene = e;
    const t = new v(1, 1, 1);
    this.fillMesh = new Q(t, new Y({
      color: this.currentColor,
      transparent: !0,
      opacity: 0.12,
      depthWrite: !1
    }));
    const s = new M(t);
    this.edgeLines = new B(s, new k({ color: this.currentColor, linewidth: 1 })), this.container = new K(), this.container.name = "DebugEntityCursor", this.container.add(this.fillMesh), this.container.add(this.edgeLines), this.container.visible = !1, this.scene.add(this.container);
  }
  setColor(e) {
    this.currentColor.set(e), this.fillMesh.material.color.set(this.currentColor), this.edgeLines.material.color.set(this.currentColor);
  }
  /**
   * Update the cursor to enclose the provided Object3D using a world-space AABB.
   */
  updateFromObject(e) {
    if (!e) {
      this.hide();
      return;
    }
    if (this.bbox.setFromObject(e), !isFinite(this.bbox.min.x) || !isFinite(this.bbox.max.x)) {
      this.hide();
      return;
    }
    this.bbox.getSize(this.size), this.bbox.getCenter(this.center);
    const t = new v(Math.max(this.size.x, 1e-6), Math.max(this.size.y, 1e-6), Math.max(this.size.z, 1e-6));
    this.fillMesh.geometry.dispose(), this.fillMesh.geometry = t;
    const s = new M(t);
    this.edgeLines.geometry.dispose(), this.edgeLines.geometry = s, this.container.position.copy(this.center), this.container.visible = !0;
  }
  hide() {
    this.container.visible = !1;
  }
  dispose() {
    this.scene.remove(this.container), this.fillMesh.geometry.dispose(), this.fillMesh.material.dispose(), this.edgeLines.geometry.dispose(), this.edgeLines.material.dispose();
  }
}
const be = 2293538, we = 16724787;
class Ee {
  stage;
  options;
  mouseNdc = new z(-2, -2);
  raycaster = new X();
  isMouseDown = !1;
  disposeFns = [];
  debugCursor = null;
  debugLines = null;
  constructor(e, t) {
    this.stage = e, this.options = {
      maxRayDistance: t?.maxRayDistance ?? 5e3,
      addEntityFactory: t?.addEntityFactory ?? null
    }, this.stage.scene && (this.debugLines = new B(new J(), new k({ vertexColors: !0 })), this.stage.scene.scene.add(this.debugLines), this.debugLines.visible = !0, this.debugCursor = new ye(this.stage.scene.scene)), this.attachDomListeners();
  }
  update() {
    if (!d.on || !this.stage.scene || !this.stage.world || !this.stage.cameraRef)
      return;
    const { world: e, cameraRef: t } = this.stage;
    if (this.debugLines) {
      const { vertices: E, colors: u } = e.world.debugRender();
      this.debugLines.geometry.setAttribute("position", new S(E, 3)), this.debugLines.geometry.setAttribute("color", new S(u, 4));
    }
    const s = R(), i = s === p.SELECT || s === p.DELETE;
    this.raycaster.setFromCamera(this.mouseNdc, t.camera);
    const o = this.raycaster.ray.origin.clone(), n = this.raycaster.ray.direction.clone().normalize(), l = new ee({ x: o.x, y: o.y, z: o.z }, { x: n.x, y: n.y, z: n.z }), r = e.world.castRay(l, this.options.maxRayDistance, !0);
    if (r && i) {
      const u = r.collider?._parent?.userData?.uuid;
      u ? ae(u) : re(), this.isMouseDown && this.handleActionOnHit(u ?? null, o, n, r.toi);
    }
    this.isMouseDown = !1;
    const y = de();
    if (!y) {
      this.debugCursor?.hide();
      return;
    }
    const b = this.stage._debugMap.get(`${y}`), w = b?.group ?? b?.mesh ?? null;
    if (!w) {
      this.debugCursor?.hide();
      return;
    }
    switch (s) {
      case p.SELECT:
        this.debugCursor?.setColor(be);
        break;
      case p.DELETE:
        this.debugCursor?.setColor(we);
        break;
      default:
        this.debugCursor?.setColor(16777215);
        break;
    }
    this.debugCursor?.updateFromObject(w);
  }
  dispose() {
    this.disposeFns.forEach((e) => e()), this.disposeFns = [], this.debugCursor?.dispose(), this.debugLines && this.stage.scene && (this.stage.scene.scene.remove(this.debugLines), this.debugLines.geometry.dispose(), this.debugLines.material.dispose(), this.debugLines = null);
  }
  handleActionOnHit(e, t, s, i) {
    switch (R()) {
      case "SELECT": {
        e && ne(e);
        break;
      }
      case "DELETE": {
        e && this.stage.removeEntityByUuid(e);
        break;
      }
      case "ADD": {
        if (!this.options.addEntityFactory)
          break;
        const n = t.clone().add(s.clone().multiplyScalar(i)), l = this.options.addEntityFactory({ position: n });
        l && Promise.resolve(l).then((r) => {
          r && this.stage.spawnEntity(r);
        }).catch(() => {
        });
        break;
      }
    }
  }
  attachDomListeners() {
    const e = this.stage.cameraRef?.renderer.domElement ?? this.stage.scene?.zylemCamera.renderer.domElement;
    if (!e)
      return;
    const t = (i) => {
      const o = e.getBoundingClientRect(), n = (i.clientX - o.left) / o.width * 2 - 1, l = -((i.clientY - o.top) / o.height * 2 - 1);
      this.mouseNdc.set(n, l);
    }, s = (i) => {
      this.isMouseDown = !0;
    };
    e.addEventListener("mousemove", t), e.addEventListener("mousedown", s), this.disposeFns.push(() => e.removeEventListener("mousemove", t)), this.disposeFns.push(() => e.removeEventListener("mousedown", s));
  }
}
const Ce = "Stage";
class ve extends fe {
  type = Ce;
  state = {
    backgroundColor: O,
    backgroundImage: null,
    inputs: {
      p1: ["gamepad-1", "keyboard"],
      p2: ["gamepad-2", "keyboard"]
    },
    gravity: new h(0, 0, 0),
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
  ecs = P();
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
    super(), this.world = null, this.scene = null, this.uuid = A();
    const { config: t, entities: s, asyncEntities: i, camera: o } = this.parseOptions(e);
    this.camera = o, this.children = s, this.pendingEntities = i, this.saveState({
      backgroundColor: t.backgroundColor ?? this.state.backgroundColor,
      backgroundImage: t.backgroundImage ?? this.state.backgroundImage,
      inputs: t.inputs ?? this.state.inputs,
      gravity: t.gravity ?? this.state.gravity,
      variables: t.variables ?? this.state.variables,
      entities: []
    }), this.gravity = t.gravity ?? new h(0, 0, 0);
    const n = this;
    window.onresize = function() {
      n.resize(window.innerWidth, window.innerHeight);
    };
  }
  parseOptions(e) {
    let t = {};
    const s = [], i = [];
    let o;
    for (const n of e)
      this.isCameraWrapper(n) ? o = n : this.isBaseNode(n) ? s.push(n) : this.isEntityInput(n) ? i.push(n) : this.isZylemStageConfig(n) && (t = { ...t, ...n });
    return { config: t, entities: s, asyncEntities: i, camera: o };
  }
  isZylemStageConfig(e) {
    return e && typeof e == "object" && !(e instanceof I) && !(e instanceof x);
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
    ce(e), he(t), ge(this.state.variables ?? {});
  }
  /**
   * Load and initialize the stage's scene and world.
   * @param id DOM element id for the renderer container
   * @param camera Optional camera override
   */
  async load(e, t) {
    this.setState();
    const s = t || (this.camera ? this.camera.cameraRef : this.createDefaultCamera());
    this.cameraRef = s, this.scene = new le(e, s, this.state);
    const i = await D.loadPhysics(this.gravity ?? new h(0, 0, 0));
    this.world = new D(i), this.scene.setup();
    for (let o of this.children)
      this.spawnEntity(o);
    if (this.pendingEntities.length && (this.enqueue(...this.pendingEntities), this.pendingEntities = []), this.pendingPromises.length) {
      for (const o of this.pendingPromises)
        o.then((n) => this.spawnEntity(n)).catch((n) => console.error("Failed to resolve pending stage entity", n));
      this.pendingPromises = [];
    }
    this.transformSystem = F(this), this.isLoaded = !0;
  }
  createDefaultCamera() {
    const e = window.innerWidth, t = window.innerHeight, s = new z(e, t);
    return new te(se.ThirdPerson, s);
  }
  _setup(e) {
    if (!this.scene || !this.world) {
      this.logMissingEntities();
      return;
    }
    d.on && (this.debugDelegate = new Ee(this));
  }
  _update(e) {
    const { delta: t } = e;
    if (!this.scene || !this.world) {
      this.logMissingEntities();
      return;
    }
    this.world.update(e), this.transformSystem(this.ecs), this._childrenMap.forEach((s, i) => {
      s.nodeUpdate({
        ...e,
        me: s
      }), s.markedForRemoval && this.removeEntityByUuid(s.uuid);
    }), this.scene.update({ delta: t });
  }
  outOfLoop() {
    this.debugUpdate();
  }
  /** Update debug overlays and helpers if enabled. */
  debugUpdate() {
    d.on && this.debugDelegate?.update();
  }
  /** Cleanup owned resources when the stage is destroyed. */
  _destroy(e) {
    this._childrenMap.forEach((t) => {
      try {
        t.nodeDestroy({ me: t, globals: m() });
      } catch {
      }
    }), this._childrenMap.clear(), this._removalMap.clear(), this._debugMap.clear(), this.world?.destroy(), this.scene?.destroy(), this.debugDelegate?.dispose(), this.isLoaded = !1, this.world = null, this.scene = null, this.cameraRef = null, me();
  }
  /**
   * Create, register, and add an entity to the scene/world.
   * Safe to call only after `load` when scene/world exist.
   */
  async spawnEntity(e) {
    if (!this.scene || !this.world)
      return;
    const t = e.create(), s = W(this.ecs);
    if (t.eid = s, this.scene.addEntity(t), e.behaviors)
      for (let i of e.behaviors) {
        N(this.ecs, i.component, t.eid);
        const o = Object.keys(i.values);
        for (const n of o)
          i.component[n][t.eid] = i.values[n];
      }
    t.colliderDesc && this.world.addEntity(t), e.nodeSetup({
      me: e,
      globals: m(),
      camera: this.scene.zylemCamera
    }), this.addEntityToStage(t);
  }
  buildEntityState(e) {
    return e instanceof H ? { ...e.buildInfo() } : {
      uuid: e.uuid,
      name: e.name,
      eid: e.eid
    };
  }
  /** Add the entity to internal maps and notify listeners. */
  addEntityToStage(e) {
    this._childrenMap.set(e.eid, e), d.on && this._debugMap.set(e.uuid, e);
    for (const t of this.entityAddedHandlers)
      try {
        t(e);
      } catch (s) {
        console.error("onEntityAdded handler failed", s);
      }
  }
  /**
   * Subscribe to entity-added events.
   * @param callback Invoked for each entity when added
   * @param options.replayExisting If true and stage already loaded, replays existing entities
   * @returns Unsubscribe function
   */
  onEntityAdded(e, t) {
    return this.entityAddedHandlers.push(e), t?.replayExisting && this.isLoaded && this._childrenMap.forEach((s) => {
      try {
        e(s);
      } catch (i) {
        console.error("onEntityAdded replay failed", i);
      }
    }), () => {
      this.entityAddedHandlers = this.entityAddedHandlers.filter((s) => s !== e);
    };
  }
  /**
   * Remove an entity and its resources by its UUID.
   * @returns true if removed, false if not found or stage not ready
   */
  removeEntityByUuid(e) {
    if (!this.scene || !this.world)
      return !1;
    const s = this.world.collisionMap.get(e) ?? this._debugMap.get(e);
    if (!s)
      return !1;
    this.world.destroyEntity(s), s.group ? this.scene.scene.remove(s.group) : s.mesh && this.scene.scene.remove(s.mesh), G(this.ecs, s.eid);
    let i = null;
    return this._childrenMap.forEach((o, n) => {
      o.uuid === e && (i = n);
    }), i !== null && this._childrenMap.delete(i), this._debugMap.delete(e), !0;
  }
  /** Get an entity by its name; returns null if not found. */
  getEntityByName(e) {
    const s = Object.entries(Object.fromEntries(this._childrenMap)).map((i) => i[1]).find((i) => i.name === e);
    return s || console.warn(`Entity ${e} not found`), s ?? null;
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
            const s = t();
            this.isBaseNode(s) ? this.handleEntityImmediatelyOrQueue(s) : this.isThenable(s) && this.handlePromiseWithSpawnOnResolve(s);
          } catch (s) {
            console.error("Error executing entity factory", s);
          }
          continue;
        }
        this.isThenable(t) && this.handlePromiseWithSpawnOnResolve(t);
      }
  }
}
class Me {
  stageRef;
  options = [];
  update = () => {
  };
  setup = () => {
  };
  destroy = () => {
  };
  constructor(e) {
    this.options = e, this.stageRef = new ve(this.options);
  }
  async load(e, t) {
    this.stageRef.wrapperRef = this;
    const s = t instanceof x ? t.cameraRef : t;
    await this.stageRef.load(e, s);
  }
  async addEntities(e) {
    this.options.push(...e), this.stageRef.enqueue(...e);
  }
  add(...e) {
    this.stageRef.enqueue(...e);
  }
  start(e) {
    this.stageRef?.nodeSetup(e), this.stageRef.onEntityAdded((t) => {
      const s = this.stageRef.buildEntityState(t);
      c.entities = [...c.entities, s];
    }, { replayExisting: !0 });
  }
  onUpdate(...e) {
    this.stageRef.update = (t) => {
      const s = { ...t, stage: this };
      e.forEach((i) => i(s));
    };
  }
  onSetup(e) {
    this.stageRef.setup = e;
  }
  onDestroy(e) {
    this.stageRef.destroy = e;
  }
  setVariable(e, t) {
    ue(e, t);
  }
  getVariable(e) {
    return pe(e);
  }
}
function ze(...a) {
  return new Me(a);
}
export {
  Me as S,
  De as a,
  Be as b,
  ke as i,
  ze as s
};
