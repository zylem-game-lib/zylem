import { defineComponent as s, defineQuery as Q, defineSystem as R, Types as e } from "bitecs";
import { Quaternion as v } from "three";
const n = s({
  x: e.f32,
  y: e.f32,
  z: e.f32
}), i = s({
  x: e.f32,
  y: e.f32,
  z: e.f32,
  w: e.f32
}), k = s({
  x: e.f32,
  y: e.f32,
  z: e.f32
});
function E(y) {
  const c = Q([n, i]), f = y._childrenMap;
  return R((r) => {
    const m = c(r);
    if (f === void 0)
      return r;
    for (const [u, p] of f) {
      const o = m[u], t = p;
      if (t === void 0 || !t?.body || t.markedForRemoval)
        continue;
      const { x, y: d, z } = t.body.translation();
      if (n.x[o] = x, n.y[o] = d, n.z[o] = z, t.group ? t.group.position.set(n.x[o], n.y[o], n.z[o]) : t.mesh && t.mesh.position.set(n.x[o], n.y[o], n.z[o]), t.controlledRotation)
        continue;
      const { x: l, y: g, z: h, w } = t.body.rotation();
      i.x[o] = l, i.y[o] = g, i.z[o] = h, i.w[o] = w;
      const a = new v(i.x[o], i.y[o], i.z[o], i.w[o]);
      t.group ? t.group.setRotationFromQuaternion(a) : t.mesh && t.mesh.setRotationFromQuaternion(a);
    }
    return r;
  });
}
export {
  E as default,
  n as position,
  i as rotation,
  k as scale
};
