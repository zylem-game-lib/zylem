import { getOrCreateCollisionGroupId as o } from "./collision-builder.js";
function u(i, n) {
  if (!n)
    return !0;
  const r = i.name ?? "";
  if ("name" in n) {
    const e = n.name;
    return e instanceof RegExp ? e.test(r) : Array.isArray(e) ? e.some((t) => t === r) : r === e;
  } else if ("mask" in n) {
    const e = n.mask;
    if (e instanceof RegExp) {
      const t = i.collisionType ?? "";
      return e.test(t);
    } else {
      const t = i.collisionType ?? "", s = o(t);
      return (e & 1 << s) !== 0;
    }
  } else if ("test" in n)
    return !!n.test(i);
  return !0;
}
export {
  u as matchesCollisionSelector
};
