import { ColliderDesc as a, ActiveCollisionTypes as h } from "@dimforge/rapier3d-compat";
import { Vector3 as l } from "three";
import { GameEntity as u } from "./entity.js";
import { EntityCollisionBuilder as c, EntityBuilder as p } from "./builder.js";
import { createEntity as E } from "./create.js";
import { state as o } from "../game/game-state.js";
const d = {
  size: new l(1, 1, 1),
  position: new l(0, 0, 0),
  collision: {
    static: !0
  },
  material: {
    shader: "standard"
  }
};
class f extends c {
  collider(e) {
    const t = e.size || new l(1, 1, 1), i = { x: t.x / 2, y: t.y / 2, z: t.z / 2 };
    let s = a.cuboid(i.x, i.y, i.z);
    return s.setSensor(!0), s.activeCollisionTypes = h.KINEMATIC_FIXED, s;
  }
}
class x extends p {
  createEntity(e) {
    return new r(e);
  }
}
const Z = Symbol("Zone");
class r extends u {
  static type = Z;
  _enteredZone = /* @__PURE__ */ new Map();
  _exitedZone = /* @__PURE__ */ new Map();
  _zoneEntities = /* @__PURE__ */ new Map();
  constructor(e) {
    super(), this.options = { ...d, ...e };
  }
  handlePostCollision({ delta: e }) {
    return this._enteredZone.forEach((t, i) => {
      this.exited(e, i);
    }), this._enteredZone.size > 0;
  }
  handleIntersectionEvent({ other: e, delta: t }) {
    this._enteredZone.get(e.uuid) ? this.held(t, e) : (this.entered(e), this._zoneEntities.set(e.uuid, e));
  }
  onEnter(e) {
    return this.options.onEnter = e, this;
  }
  onHeld(e) {
    return this.options.onHeld = e, this;
  }
  onExit(e) {
    return this.options.onExit = e, this;
  }
  entered(e) {
    this._enteredZone.set(e.uuid, 1), this.options.onEnter && this.options.onEnter({
      self: this,
      visitor: e,
      globals: o.globals
    });
  }
  exited(e, t) {
    const i = this._exitedZone.get(t);
    if (i && i > 1 + e) {
      this._exitedZone.delete(t), this._enteredZone.delete(t);
      const s = this._zoneEntities.get(t);
      this.options.onExit && this.options.onExit({
        self: this,
        visitor: s,
        globals: o.globals
      });
      return;
    }
    this._exitedZone.set(t, 1 + e);
  }
  held(e, t) {
    const i = this._enteredZone.get(t.uuid) ?? 0;
    this._enteredZone.set(t.uuid, i + e), this._exitedZone.set(t.uuid, 1), this.options.onHeld && this.options.onHeld({
      delta: e,
      self: this,
      visitor: t,
      globals: o.globals,
      heldTime: i
    });
  }
}
async function b(...n) {
  return E({
    args: n,
    defaultConfig: d,
    EntityClass: r,
    BuilderClass: x,
    CollisionBuilderClass: f,
    entityType: r.type
  });
}
export {
  Z as ZONE_TYPE,
  x as ZoneBuilder,
  f as ZoneCollisionBuilder,
  r as ZylemZone,
  b as zone
};
