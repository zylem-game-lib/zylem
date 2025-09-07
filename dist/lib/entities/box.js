import { ColliderDesc as a } from "@dimforge/rapier3d-compat";
import { Color as d, Vector3 as n, BoxGeometry as u } from "three";
import { GameEntity as y } from "./entity.js";
import { EntityCollisionBuilder as f, EntityBuilder as x, EntityMeshBuilder as m } from "./builder.js";
import { DebugDelegate as p } from "./delegates/debug.js";
import { createEntity as z } from "./create.js";
const l = {
  size: new n(1, 1, 1),
  position: new n(0, 0, 0),
  collision: {
    static: !1
  },
  material: {
    color: new d("#ffffff"),
    shader: "standard"
  }
};
class B extends f {
  collider(t) {
    const e = t.size || new n(1, 1, 1), s = { x: e.x / 2, y: e.y / 2, z: e.z / 2 };
    return a.cuboid(s.x, s.y, s.z);
  }
}
class b extends m {
  build(t) {
    const e = t.size ?? new n(1, 1, 1);
    return new u(e.x, e.y, e.z);
  }
}
class C extends x {
  createEntity(t) {
    return new i(t);
  }
}
const h = Symbol("Box");
class i extends y {
  static type = h;
  constructor(t) {
    super(), this.options = { ...l, ...t };
  }
  buildInfo() {
    const e = new p(this).buildDebugInfo(), { x: s, y: r, z: c } = this.options.size ?? { x: 1, y: 1, z: 1 };
    return {
      ...e,
      type: String(i.type),
      size: `${s}, ${r}, ${c}`
    };
  }
}
async function $(...o) {
  return z({
    args: o,
    defaultConfig: l,
    EntityClass: i,
    BuilderClass: C,
    MeshBuilderClass: b,
    CollisionBuilderClass: B,
    entityType: i.type
  });
}
export {
  h as BOX_TYPE,
  C as BoxBuilder,
  B as BoxCollisionBuilder,
  b as BoxMeshBuilder,
  i as ZylemBox,
  $ as box
};
