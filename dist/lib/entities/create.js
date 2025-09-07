import { BaseNode as s } from "../core/base-node.js";
import { isLoadable as p, EntityLoader as C } from "./delegates/loader.js";
async function E(w) {
  const { args: n, defaultConfig: l, EntityClass: g, BuilderClass: y, entityType: c, MeshBuilderClass: f, CollisionBuilderClass: d } = w;
  let e = null, r;
  const u = n.findIndex((i) => !(i instanceof s));
  u !== -1 && (r = n.splice(u, 1).find((t) => !(t instanceof s)));
  const m = r ? { ...l, ...r } : l;
  n.push(m);
  for (const i of n) {
    if (i instanceof s)
      continue;
    let t = null;
    const a = new g(i);
    try {
      if (p(a)) {
        const o = new C(a);
        await o.load(), t = await o.data();
      }
    } catch (o) {
      console.error("Error creating entity with loader:", o);
    }
    e = new y(i, a, f ? new f(t) : null, d ? new d(t) : null), i.material && await e.withMaterial(i.material, c);
  }
  if (!e)
    throw new Error(`missing options for ${String(c)}, builder is not initialized.`);
  return await e.build();
}
export {
  E as createEntity
};
