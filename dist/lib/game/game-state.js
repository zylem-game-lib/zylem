import { proxy as a } from "valtio/vanilla";
const o = a({
  id: "",
  globals: {},
  time: 0
});
function r(t, l) {
  o.globals[t] = l;
}
function i(t) {
  return t !== void 0 ? o.globals[t] : o.globals;
}
export {
  i as getGlobalState,
  r as setGlobalState,
  o as state
};
