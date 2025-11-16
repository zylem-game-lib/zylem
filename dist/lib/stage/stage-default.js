import { proxy as r } from "valtio/vanilla";
import { Vector3 as i } from "three";
import { ZylemBlueColor as n } from "../core/utility/vector.js";
const g = {
  backgroundColor: n,
  backgroundImage: null,
  inputs: {
    p1: ["gamepad-1", "keyboard"],
    p2: ["gamepad-2", "keyboard"]
  },
  gravity: new i(0, 0, 0),
  variables: {}
}, o = r({
  ...g
});
function b(a) {
  const e = l();
  let t = {};
  return typeof a[0] == "object" && (t = a.shift() ?? {}), [{ ...e, ...t }, ...a];
}
function l() {
  return {
    backgroundColor: o.backgroundColor,
    backgroundImage: o.backgroundImage ?? null,
    inputs: o.inputs ? { ...o.inputs } : void 0,
    gravity: o.gravity,
    variables: o.variables ? { ...o.variables } : void 0
  };
}
export {
  b as getStageOptions
};
