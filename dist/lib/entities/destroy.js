import { getGlobalState as n } from "../game/game-state.js";
function r(o, t, e) {
  e({
    me: o,
    globals: t
  });
}
function d(o, t) {
  const e = t ?? n();
  r(o, e, o.nodeDestroy.bind(o));
}
export {
  d as destroy,
  r as destroyEntity
};
