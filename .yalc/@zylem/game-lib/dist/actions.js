import { m as p, a as w, b as x } from "./chunks/transformable-w6tbWWdP.js";
function s(e, t) {
  setTimeout(t, e);
}
const c = /* @__PURE__ */ (() => {
  let e = !1;
  return (t, o) => {
    t && !e ? (e = !0, o()) : t || (e = !1);
  };
})(), f = /* @__PURE__ */ (() => {
  let e = !1;
  return (t, o) => {
    !t && e ? (e = !1, o()) : t && (e = !0);
  };
})(), u = /* @__PURE__ */ (() => {
  let e = -1 / 0, t = !1;
  return ({ timer: o, immediate: n = !0 }, l, i) => {
    let a = Date.now();
    !t && !n && (t = !0, e = a);
    const r = a - e;
    r >= o && (e = a, l()), i({ delta: r });
  };
})(), m = /* @__PURE__ */ (() => {
  let e = 0;
  return (t, o) => {
    const n = Date.now();
    n - e >= t && (e = n, o());
  };
})(), b = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  actionOnPress: c,
  actionOnRelease: f,
  actionWithCooldown: u,
  actionWithThrottle: m,
  wait: s
}, Symbol.toStringTag, { value: "Module" }));
export {
  b as actions,
  p as makeMoveable,
  w as makeRotatable,
  x as makeTransformable
};
