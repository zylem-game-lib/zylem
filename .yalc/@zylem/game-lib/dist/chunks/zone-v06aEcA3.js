import { ColliderDesc as I, ActiveCollisionTypes as q } from "@dimforge/rapier3d-compat";
import { MeshStandardMaterial as Q, MeshBasicMaterial as j, MeshPhongMaterial as J, Color as v, Vector3 as a, BoxGeometry as K, SphereGeometry as W, TextureLoader as k, SpriteMaterial as tt, Sprite as et, Group as st, Quaternion as it, Euler as nt, BufferGeometry as ot, Float32BufferAttribute as P, Vector2 as A, PlaneGeometry as rt } from "three";
import { c as B, G as C, d as S, E as M, e as G, s as Z } from "./actor-CDwH9h9-.js";
function at(n) {
  return n && typeof n.getDebugInfo == "function";
}
class H {
  entity;
  constructor(t) {
    this.entity = t;
  }
  /**
   * Get formatted position string
   */
  getPositionString() {
    if (this.entity.mesh) {
      const { x: i, y: o, z: r } = this.entity.mesh.position;
      return `${i.toFixed(2)}, ${o.toFixed(2)}, ${r.toFixed(2)}`;
    }
    const { x: t, y: e, z: s } = this.entity.options.position || { x: 0, y: 0, z: 0 };
    return `${t.toFixed(2)}, ${e.toFixed(2)}, ${s.toFixed(2)}`;
  }
  /**
   * Get formatted rotation string (in degrees)
   */
  getRotationString() {
    if (this.entity.mesh) {
      const { x: o, y: r, z: l } = this.entity.mesh.rotation, u = (c) => (c * 180 / Math.PI).toFixed(1);
      return `${u(o)}°, ${u(r)}°, ${u(l)}°`;
    }
    const { x: t, y: e, z: s } = this.entity.options.rotation || { x: 0, y: 0, z: 0 }, i = (o) => (o * 180 / Math.PI).toFixed(1);
    return `${i(t)}°, ${i(e)}°, ${i(s)}°`;
  }
  /**
   * Get material information
   */
  getMaterialInfo() {
    if (!this.entity.mesh || !this.entity.mesh.material)
      return { type: "none" };
    const t = Array.isArray(this.entity.mesh.material) ? this.entity.mesh.material[0] : this.entity.mesh.material, e = {
      type: t.type
    };
    return (t instanceof Q || t instanceof j || t instanceof J) && (e.color = `#${t.color.getHexString()}`, e.opacity = t.opacity, e.transparent = t.transparent), "roughness" in t && (e.roughness = t.roughness), "metalness" in t && (e.metalness = t.metalness), e;
  }
  getPhysicsInfo() {
    if (!this.entity.body)
      return null;
    const t = {
      type: this.entity.body.bodyType(),
      mass: this.entity.body.mass(),
      isEnabled: this.entity.body.isEnabled(),
      isSleeping: this.entity.body.isSleeping()
    }, e = this.entity.body.linvel();
    return t.velocity = `${e.x.toFixed(2)}, ${e.y.toFixed(2)}, ${e.z.toFixed(2)}`, t;
  }
  buildDebugInfo() {
    const t = {
      name: this.entity.name || this.entity.uuid,
      uuid: this.entity.uuid,
      position: this.getPositionString(),
      rotation: this.getRotationString(),
      material: this.getMaterialInfo()
    }, e = this.getPhysicsInfo();
    if (e && (t.physics = e), this.entity.behaviors.length > 0 && (t.behaviors = this.entity.behaviors.map((s) => s.constructor.name)), at(this.entity)) {
      const s = this.entity.getDebugInfo();
      return { ...t, ...s };
    }
    return t;
  }
}
const X = {
  size: new a(1, 1, 1),
  position: new a(0, 0, 0),
  collision: {
    static: !1
  },
  material: {
    color: new v("#ffffff"),
    shader: "standard"
  }
};
class lt extends S {
  collider(t) {
    const e = t.size || new a(1, 1, 1), s = { x: e.x / 2, y: e.y / 2, z: e.z / 2 };
    return I.cuboid(s.x, s.y, s.z);
  }
}
class ct extends G {
  build(t) {
    const e = t.size ?? new a(1, 1, 1);
    return new K(e.x, e.y, e.z);
  }
}
class ut extends M {
  createEntity(t) {
    return new z(t);
  }
}
const ht = Symbol("Box");
class z extends C {
  static type = ht;
  constructor(t) {
    super(), this.options = { ...X, ...t };
  }
  buildInfo() {
    const e = new H(this).buildDebugInfo(), { x: s, y: i, z: o } = this.options.size ?? { x: 1, y: 1, z: 1 };
    return {
      ...e,
      type: String(z.type),
      size: `${s}, ${i}, ${o}`
    };
  }
}
async function At(...n) {
  return B({
    args: n,
    defaultConfig: X,
    EntityClass: z,
    BuilderClass: ut,
    MeshBuilderClass: ct,
    CollisionBuilderClass: lt,
    entityType: z.type
  });
}
const N = {
  radius: 1,
  position: new a(0, 0, 0),
  collision: {
    static: !1
  },
  material: {
    color: new v("#ffffff"),
    shader: "standard"
  }
};
class dt extends S {
  collider(t) {
    const e = t.radius ?? 1;
    return I.ball(e);
  }
}
class pt extends G {
  build(t) {
    const e = t.radius ?? 1;
    return new W(e);
  }
}
class yt extends M {
  createEntity(t) {
    return new E(t);
  }
}
const ft = Symbol("Sphere");
class E extends C {
  static type = ft;
  constructor(t) {
    super(), this.options = { ...N, ...t };
  }
  buildInfo() {
    const e = new H(this).buildDebugInfo(), s = this.options.radius ?? 1;
    return {
      ...e,
      type: String(E.type),
      radius: s.toFixed(2)
    };
  }
}
async function vt(...n) {
  return B({
    args: n,
    defaultConfig: N,
    EntityClass: E,
    BuilderClass: yt,
    MeshBuilderClass: pt,
    CollisionBuilderClass: dt,
    entityType: E.type
  });
}
const O = {
  size: new a(1, 1, 1),
  position: new a(0, 0, 0),
  collision: {
    static: !1
  },
  material: {
    color: new v("#ffffff"),
    shader: "standard"
  },
  images: [],
  animations: []
};
class mt extends S {
  collider(t) {
    const e = t.collisionSize || t.size || new a(1, 1, 1), s = { x: e.x / 2, y: e.y / 2, z: e.z / 2 };
    return I.cuboid(s.x, s.y, s.z);
  }
}
class xt extends M {
  createEntity(t) {
    return new _(t);
  }
}
const gt = Symbol("Sprite");
class _ extends C {
  static type = gt;
  sprites = [];
  spriteMap = /* @__PURE__ */ new Map();
  currentSpriteIndex = 0;
  animations = /* @__PURE__ */ new Map();
  currentAnimation = null;
  currentAnimationFrame = "";
  currentAnimationIndex = 0;
  currentAnimationTime = 0;
  constructor(t) {
    super(), this.options = { ...O, ...t }, this.createSpritesFromImages(t?.images || []), this.createAnimations(t?.animations || []), this.lifeCycleDelegate = {
      update: [this.spriteUpdate.bind(this)],
      destroy: [this.spriteDestroy.bind(this)]
    };
  }
  createSpritesFromImages(t) {
    const e = new k();
    t.forEach((s, i) => {
      const o = e.load(s.file), r = new tt({
        map: o,
        transparent: !0
      }), l = new et(r);
      l.position.normalize(), this.sprites.push(l), this.spriteMap.set(s.name, i);
    }), this.group = new st(), this.group.add(...this.sprites);
  }
  createAnimations(t) {
    t.forEach((e) => {
      const { name: s, frames: i, loop: o = !1, speed: r = 1 } = e, l = {
        frames: i.map((u, c) => ({
          key: u,
          index: c,
          time: (typeof r == "number" ? r : r[c]) * (c + 1),
          duration: typeof r == "number" ? r : r[c]
        })),
        loop: o
      };
      this.animations.set(s, l);
    });
  }
  setSprite(t) {
    const s = this.spriteMap.get(t) ?? 0;
    this.currentSpriteIndex = s, this.sprites.forEach((i, o) => {
      i.visible = this.currentSpriteIndex === o;
    });
  }
  setAnimation(t, e) {
    const s = this.animations.get(t);
    if (!s)
      return;
    const { loop: i, frames: o } = s, r = o[this.currentAnimationIndex];
    t === this.currentAnimation ? (this.currentAnimationFrame = r.key, this.currentAnimationTime += e, this.setSprite(this.currentAnimationFrame)) : this.currentAnimation = t, this.currentAnimationTime > r.time && this.currentAnimationIndex++, this.currentAnimationIndex >= o.length && (i ? (this.currentAnimationIndex = 0, this.currentAnimationTime = 0) : this.currentAnimationTime = o[this.currentAnimationIndex].time);
  }
  async spriteUpdate(t) {
    this.sprites.forEach((e) => {
      if (e.material) {
        const s = this.body?.rotation();
        if (s) {
          const i = new it(s.x, s.y, s.z, s.w), o = new nt().setFromQuaternion(i, "XYZ");
          e.material.rotation = o.z;
        }
        e.scale.set(this.options.size?.x ?? 1, this.options.size?.y ?? 1, this.options.size?.z ?? 1);
      }
    });
  }
  async spriteDestroy(t) {
    this.sprites.forEach((e) => {
      e.removeFromParent();
    }), this.group?.remove(...this.sprites), this.group?.removeFromParent();
  }
}
async function Ft(...n) {
  return B({
    args: n,
    defaultConfig: O,
    EntityClass: _,
    BuilderClass: xt,
    CollisionBuilderClass: mt,
    entityType: _.type
  });
}
class Y extends ot {
  constructor(t = 1, e = 1, s = 1, i = 1) {
    super(), this.type = "XZPlaneGeometry", this.parameters = {
      width: t,
      height: e,
      widthSegments: s,
      heightSegments: i
    };
    const o = t / 2, r = e / 2, l = Math.floor(s), u = Math.floor(i), c = l + 1, y = u + 1, f = t / l, d = e / u, b = [], m = [], x = [], F = [];
    for (let h = 0; h < y; h++) {
      const p = h * d - r;
      for (let g = 0; g < c; g++) {
        const D = g * f - o;
        m.push(D, 0, p), x.push(0, 1, 0), F.push(g / l), F.push(1 - h / u);
      }
    }
    for (let h = 0; h < u; h++)
      for (let p = 0; p < l; p++) {
        const g = p + c * h, D = p + c * (h + 1), V = p + 1 + c * (h + 1), R = p + 1 + c * h;
        b.push(g, D, R), b.push(D, V, R);
      }
    this.setIndex(b), this.setAttribute("position", new P(m, 3)), this.setAttribute("normal", new P(x, 3)), this.setAttribute("uv", new P(F, 2));
  }
  copy(t) {
    return super.copy(t), this.parameters = Object.assign({}, t.parameters), this;
  }
  static fromJSON(t) {
    return new Y(t.width, t.height, t.widthSegments, t.heightSegments);
  }
}
const w = 4, L = {
  tile: new A(10, 10),
  repeat: new A(1, 1),
  position: new a(0, 0, 0),
  collision: {
    static: !0
  },
  material: {
    color: new v("#ffffff"),
    shader: "standard"
  },
  subdivisions: w
};
class bt extends S {
  collider(t) {
    const e = t.tile ?? new A(1, 1), s = t.subdivisions ?? w, i = new a(e.x, 1, e.y), o = t._builders?.meshBuilder?.heightData, r = new a(i.x, 1, i.z);
    return I.heightfield(s, s, o, r);
  }
}
class wt extends G {
  heightData = new Float32Array();
  columnsRows = /* @__PURE__ */ new Map();
  build(t) {
    const e = t.tile ?? new A(1, 1), s = t.subdivisions ?? w, i = new a(e.x, 1, e.y), o = new Y(i.x, i.z, s, s), r = new rt(i.x, i.z, s, s), l = i.x / s, u = i.z / s, c = o.attributes.position.array, y = r.attributes.position.array, f = /* @__PURE__ */ new Map();
    for (let d = 0; d < y.length; d += 3) {
      let b = Math.floor(Math.abs(y[d] + i.x / 2) / l), m = Math.floor(Math.abs(y[d + 1] - i.z / 2) / u);
      const x = Math.random() * 4;
      y[d + 2] = x, c[d + 1] = x, f.get(m) || f.set(m, /* @__PURE__ */ new Map()), f.get(m).set(b, x);
    }
    return this.columnsRows = f, o;
  }
  postBuild() {
    const t = [];
    for (let e = 0; e <= w; ++e)
      for (let s = 0; s <= w; ++s) {
        const i = this.columnsRows.get(s);
        if (!i)
          continue;
        const o = i.get(e);
        t.push(o);
      }
    this.heightData = new Float32Array(t);
  }
}
class zt extends M {
  createEntity(t) {
    return new T(t);
  }
}
const Et = Symbol("Plane");
class T extends C {
  static type = Et;
  constructor(t) {
    super(), this.options = { ...L, ...t };
  }
}
async function Pt(...n) {
  return B({
    args: n,
    defaultConfig: L,
    EntityClass: T,
    BuilderClass: zt,
    MeshBuilderClass: wt,
    CollisionBuilderClass: bt,
    entityType: T.type
  });
}
const U = {
  size: new a(1, 1, 1),
  position: new a(0, 0, 0),
  collision: {
    static: !0
  },
  material: {
    shader: "standard"
  }
};
class It extends S {
  collider(t) {
    const e = t.size || new a(1, 1, 1), s = { x: e.x / 2, y: e.y / 2, z: e.z / 2 };
    let i = I.cuboid(s.x, s.y, s.z);
    return i.setSensor(!0), i.activeCollisionTypes = q.KINEMATIC_FIXED, i;
  }
}
class Bt extends M {
  createEntity(t) {
    return new $(t);
  }
}
const Ct = Symbol("Zone");
class $ extends C {
  static type = Ct;
  _enteredZone = /* @__PURE__ */ new Map();
  _exitedZone = /* @__PURE__ */ new Map();
  _zoneEntities = /* @__PURE__ */ new Map();
  constructor(t) {
    super(), this.options = { ...U, ...t };
  }
  handlePostCollision({ delta: t }) {
    return this._enteredZone.forEach((e, s) => {
      this.exited(t, s);
    }), this._enteredZone.size > 0;
  }
  handleIntersectionEvent({ other: t, delta: e }) {
    this._enteredZone.get(t.uuid) ? this.held(e, t) : (this.entered(t), this._zoneEntities.set(t.uuid, t));
  }
  onEnter(t) {
    return this.options.onEnter = t, this;
  }
  onHeld(t) {
    return this.options.onHeld = t, this;
  }
  onExit(t) {
    return this.options.onExit = t, this;
  }
  entered(t) {
    this._enteredZone.set(t.uuid, 1), this.options.onEnter && this.options.onEnter({
      self: this,
      visitor: t,
      globals: Z.globals
    });
  }
  exited(t, e) {
    const s = this._exitedZone.get(e);
    if (s && s > 1 + t) {
      this._exitedZone.delete(e), this._enteredZone.delete(e);
      const i = this._zoneEntities.get(e);
      this.options.onExit && this.options.onExit({
        self: this,
        visitor: i,
        globals: Z.globals
      });
      return;
    }
    this._exitedZone.set(e, 1 + t);
  }
  held(t, e) {
    const s = this._enteredZone.get(e.uuid) ?? 0;
    this._enteredZone.set(e.uuid, s + t), this._exitedZone.set(e.uuid, 1), this.options.onHeld && this.options.onHeld({
      delta: t,
      self: this,
      visitor: e,
      globals: Z.globals,
      heldTime: s
    });
  }
}
async function Zt(...n) {
  return B({
    args: n,
    defaultConfig: U,
    EntityClass: $,
    BuilderClass: Bt,
    CollisionBuilderClass: It,
    entityType: $.type
  });
}
export {
  H as D,
  z as Z,
  Ft as a,
  At as b,
  Pt as p,
  vt as s,
  Zt as z
};
