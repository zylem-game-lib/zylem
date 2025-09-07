import { Color as i } from "three";
import { Vector3 as n } from "@dimforge/rapier3d-compat";
const u = new i("#0333EC");
function f(r) {
  const e = Object.keys(r).sort().reduce((t, o) => (t[o] = r[o], t), {});
  return JSON.stringify(e);
}
function h(r) {
  let e = 0;
  for (let t = 0; t < r.length; t++)
    e = Math.imul(31, e) + r.charCodeAt(t) | 0;
  return e.toString(36);
}
new n(0, 0, 0);
new n(1, 1, 1);
export {
  u as ZylemBlueColor,
  h as shortHash,
  f as sortedStringify
};
