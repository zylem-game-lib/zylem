import { Vector3 as r, ActiveCollisionTypes as f, ColliderDesc as p, RigidBodyType as c, RigidBodyDesc as D } from "@dimforge/rapier3d-compat";
const n = /* @__PURE__ */ new Map();
let h = 0;
function d(i) {
  let e = n.get(i);
  return e === void 0 && (e = h++ % 16, n.set(i, e)), e;
}
function C(i) {
  let e = 0;
  return i.forEach((s) => {
    const t = d(s);
    e |= 1 << t;
  }), e;
}
class g {
  static = !1;
  sensor = !1;
  gravity = new r(0, 0, 0);
  build(e) {
    const s = this.bodyDesc({
      isDynamicBody: !this.static
    }), t = this.collider(e), o = e.collisionType;
    if (o) {
      let u = d(o), l = 65535;
      e.collisionFilter && (l = C(e.collisionFilter)), t.setCollisionGroups(u << 16 | l);
    }
    const { KINEMATIC_FIXED: a, DEFAULT: y } = f;
    return t.activeCollisionTypes = this.sensor ? a : y, [s, t];
  }
  withCollision(e) {
    return this.sensor = e?.sensor ?? this.sensor, this.static = e?.static ?? this.static, this;
  }
  collider(e) {
    const s = e.size ?? new r(1, 1, 1), t = { x: s.x / 2, y: s.y / 2, z: s.z / 2 };
    return p.cuboid(t.x, t.y, t.z);
  }
  bodyDesc({ isDynamicBody: e = !0 }) {
    const s = e ? c.Dynamic : c.Fixed;
    return new D(s).setTranslation(0, 0, 0).setGravityScale(1).setCanSleep(!1).setCcdEnabled(!0);
  }
}
export {
  g as CollisionBuilder,
  C as createCollisionFilter,
  d as getOrCreateCollisionGroupId
};
