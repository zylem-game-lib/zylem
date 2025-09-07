import { BaseNode as a } from "./base-node.js";
const r = Symbol("vessel");
class n extends a {
  static type = r;
  _setup(e) {
  }
  _update(e) {
  }
  _destroy(e) {
  }
  create() {
    return this;
  }
}
function c(...s) {
  const e = new n();
  return s.forEach((t) => e.add(t)), e;
}
export {
  r as VESSEL_TYPE,
  n as Vessel,
  c as vessel
};
