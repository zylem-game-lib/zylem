import { proxy as d } from "valtio/vanilla";
import { deepClone as i } from "valtio/utils";
import { nanoid as c } from "nanoid";
import { stage as l } from "./stage.js";
const u = {
  byId: {},
  order: [],
  currentId: null
}, e = d(i(u));
function m() {
  const r = i(u);
  Object.keys(r).forEach((t) => {
    e[t] = r[t];
  });
}
function I(r, t) {
  const n = t?.id ?? c(), o = { id: n, name: t?.name, config: { ...r } };
  return e.byId[n] = o, e.order.includes(n) || (e.order = [...e.order, n]), t?.setCurrent && (e.currentId = n), o;
}
function S(r) {
  e.byId[r.id] = { ...r, config: { ...r.config } }, e.order.includes(r.id) || (e.order = [...e.order, r.id]);
}
function B(r) {
  delete e.byId[r], e.order = e.order.filter((t) => t !== r), e.currentId === r && (e.currentId = null);
}
function f(r) {
  return e.byId[r];
}
function b() {
  return e.order.map((r) => e.byId[r]).filter((r) => !!r);
}
function y(r) {
  e.currentId = r;
}
function C() {
  const r = e.currentId;
  return r ? e.byId[r] ?? null : null;
}
function h(r, ...t) {
  const n = typeof r == "string" ? f(r) : r;
  if (!n)
    throw new Error("Stage blueprint not found");
  return l(n.config, ...t);
}
export {
  h as buildStageFromBlueprint,
  I as createStageBlueprint,
  C as getCurrentStageBlueprint,
  f as getStageBlueprint,
  b as listStageBlueprints,
  B as removeStageBlueprint,
  m as resetStageBlueprints,
  y as setCurrentStageBlueprint,
  e as stageBlueprintsState,
  S as upsertStageBlueprint
};
