function s(t, e) {
  setTimeout(e, t);
}
const c = /* @__PURE__ */ (() => {
  let t = !1;
  return (e, n) => {
    e && !t ? (t = !0, n()) : e || (t = !1);
  };
})(), u = /* @__PURE__ */ (() => {
  let t = !1;
  return (e, n) => {
    !e && t ? (t = !1, n()) : e && (t = !0);
  };
})(), f = /* @__PURE__ */ (() => {
  let t = -1 / 0, e = !1;
  return ({ timer: n, immediate: o = !0 }, l, r) => {
    let i = Date.now();
    !e && !o && (e = !0, t = i);
    const a = i - t;
    a >= n && (t = i, l()), r({ delta: a });
  };
})(), m = /* @__PURE__ */ (() => {
  let t = 0;
  return (e, n) => {
    const o = Date.now();
    o - t >= e && (t = o, n());
  };
})();
export {
  c as actionOnPress,
  u as actionOnRelease,
  f as actionWithCooldown,
  m as actionWithThrottle,
  s as wait
};
