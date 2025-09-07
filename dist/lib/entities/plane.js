import { ColliderDesc as B } from "@dimforge/rapier3d-compat";
import { Color as M, Vector3 as u, Vector2 as d, PlaneGeometry as C } from "three";
import { GameEntity as D } from "./entity.js";
import { EntityCollisionBuilder as E, EntityBuilder as P, EntityMeshBuilder as v } from "./builder.js";
import { XZPlaneGeometry as z } from "../graphics/geometries/XZPlaneGeometry.js";
import { createEntity as A } from "./create.js";
const r = 4, p = {
  tile: new d(10, 10),
  repeat: new d(1, 1),
  position: new u(0, 0, 0),
  collision: {
    static: !0
  },
  material: {
    color: new M("#ffffff"),
    shader: "standard"
  },
  subdivisions: r
};
class G extends E {
  collider(e) {
    const o = e.tile ?? new d(1, 1), s = e.subdivisions ?? r, t = new u(o.x, 1, o.y), i = e._builders?.meshBuilder?.heightData, h = new u(t.x, 1, t.z);
    return B.heightfield(s, s, i, h);
  }
}
class R extends v {
  heightData = new Float32Array();
  columnsRows = /* @__PURE__ */ new Map();
  build(e) {
    const o = e.tile ?? new d(1, 1), s = e.subdivisions ?? r, t = new u(o.x, 1, o.y), i = new z(t.x, t.z, s, s), h = new C(t.x, t.z, s, s), w = t.x / s, g = t.z / s, x = i.attributes.position.array, a = h.attributes.position.array, c = /* @__PURE__ */ new Map();
    for (let n = 0; n < a.length; n += 3) {
      let b = Math.floor(Math.abs(a[n] + t.x / 2) / w), m = Math.floor(Math.abs(a[n + 1] - t.z / 2) / g);
      const y = Math.random() * 4;
      a[n + 2] = y, x[n + 1] = y, c.get(m) || c.set(m, /* @__PURE__ */ new Map()), c.get(m).set(b, y);
    }
    return this.columnsRows = c, i;
  }
  postBuild() {
    const e = [];
    for (let o = 0; o <= r; ++o)
      for (let s = 0; s <= r; ++s) {
        const t = this.columnsRows.get(s);
        if (!t)
          continue;
        const i = t.get(o);
        e.push(i);
      }
    this.heightData = new Float32Array(e);
  }
}
class S extends P {
  createEntity(e) {
    return new f(e);
  }
}
const V = Symbol("Plane");
class f extends D {
  static type = V;
  constructor(e) {
    super(), this.options = { ...p, ...e };
  }
}
async function U(...l) {
  return A({
    args: l,
    defaultConfig: p,
    EntityClass: f,
    BuilderClass: S,
    MeshBuilderClass: R,
    CollisionBuilderClass: G,
    entityType: f.type
  });
}
export {
  V as PLANE_TYPE,
  S as PlaneBuilder,
  G as PlaneCollisionBuilder,
  R as PlaneMeshBuilder,
  f as ZylemPlane,
  U as plane
};
