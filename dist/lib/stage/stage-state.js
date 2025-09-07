import { Vector3 as t, Color as r } from "three";
import { proxy as s } from "valtio/vanilla";
const e = s({
  backgroundColor: new r(r.NAMES.cornflowerblue),
  backgroundImage: null,
  inputs: {
    p1: ["gamepad-1", "keyboard-1"],
    p2: ["gamepad-2", "keyboard-2"]
  },
  variables: {},
  gravity: new t(0, 0, 0),
  entities: []
}), l = (a) => {
  e.backgroundColor = a;
}, b = (a) => {
  e.backgroundImage = a;
}, i = (a, o) => {
  e.variables[a] = o;
}, c = (a) => {
  if (e.variables.hasOwnProperty(a))
    return e.variables[a];
  console.warn(`Stage variable ${a} not found`);
}, d = (a) => {
  e.variables = { ...a };
}, u = () => {
  e.variables = {};
};
export {
  c as getStageVariable,
  u as resetStageVariables,
  l as setStageBackgroundColor,
  b as setStageBackgroundImage,
  i as setStageVariable,
  d as setStageVariables,
  e as stageState
};
