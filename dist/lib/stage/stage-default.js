import { proxy as i } from "valtio/vanilla";
import { Vector3 as r } from "three";
import { ZylemBlueColor as g } from "../core/utility/vector.js";
const o = {
  backgroundColor: g,
  backgroundImage: null,
  inputs: {
    p1: ["gamepad-1", "keyboard"],
    p2: ["gamepad-2", "keyboard"]
  },
  gravity: new r(0, 0, 0),
  variables: {}
}, t = i({
  ...o
});
function b(a) {
  Object.assign(t, a);
}
function d() {
  Object.assign(t, o);
}
function m(a) {
  const n = u();
  let e = {};
  return typeof a[0] == "object" && (e = a.shift() ?? {}), [{ ...n, ...e }, ...a];
}
function u() {
  return {
    backgroundColor: t.backgroundColor,
    backgroundImage: t.backgroundImage ?? null,
    inputs: t.inputs ? { ...t.inputs } : void 0,
    gravity: t.gravity,
    variables: t.variables ? { ...t.variables } : void 0
  };
}
export {
  u as getStageDefaultConfig,
  m as getStageOptions,
  d as resetStageDefaults,
  b as setStageDefaults,
  t as stageDefaultsState
};
