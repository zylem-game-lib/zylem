import { ColliderDesc as l } from "@dimforge/rapier3d-compat";
import { Color as n, Vector3 as a, SphereGeometry as d } from "three";
import { GameEntity as u } from "./entity.js";
import { EntityCollisionBuilder as c, EntityBuilder as p, EntityMeshBuilder as f } from "./builder.js";
import { DebugDelegate as m } from "./delegates/debug.js";
import { createEntity as y } from "./create.js";
const o = {
  radius: 1,
  position: new a(0, 0, 0),
  collision: {
    static: !1
  },
  material: {
    color: new n("#ffffff"),
    shader: "standard"
  }
};
class h extends c {
  collider(e) {
    const t = e.radius ?? 1;
    return l.ball(t);
  }
}
class C extends f {
  build(e) {
    const t = e.radius ?? 1;
    return new d(t);
  }
}
class E extends p {
  createEntity(e) {
    return new r(e);
  }
}
const B = Symbol("Sphere");
class r extends u {
  static type = B;
  constructor(e) {
    super(), this.options = { ...o, ...e };
  }
  buildInfo() {
    const t = new m(this).buildDebugInfo(), i = this.options.radius ?? 1;
    return {
      ...t,
      type: String(r.type),
      radius: i.toFixed(2)
    };
  }
}
async function I(...s) {
  return y({
    args: s,
    defaultConfig: o,
    EntityClass: r,
    BuilderClass: E,
    MeshBuilderClass: C,
    CollisionBuilderClass: h,
    entityType: r.type
  });
}
export {
  B as SPHERE_TYPE,
  E as SphereBuilder,
  h as SphereCollisionBuilder,
  C as SphereMeshBuilder,
  r as ZylemSphere,
  I as sphere
};
