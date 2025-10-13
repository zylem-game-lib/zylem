import { BaseNode as t } from "./base-node.js";
const r = Symbol("vessel");
class n extends t {
  static type = r;
  _setup(s) {
  }
  async _loaded(s) {
  }
  _update(s) {
  }
  _destroy(s) {
  }
  async _cleanup(s) {
  }
  create() {
    return this;
  }
}
function o(...e) {
  const s = new n();
  return e.forEach((a) => s.add(a)), s;
}
export {
  r as VESSEL_TYPE,
  n as Vessel,
  o as vessel
};
