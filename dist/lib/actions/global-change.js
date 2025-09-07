function v(r, l) {
  let n;
  return (a) => {
    const e = a.globals?.[r];
    n !== e && (n === void 0 && e === void 0 || l(e, a), n = e);
  };
}
function d(r, l) {
  let n = new Array(r.length).fill(void 0);
  return (a) => {
    const e = r.map((t) => a.globals?.[t]);
    if (e.some((t, o) => n[o] !== t)) {
      const t = n.every((i) => i === void 0), o = e.every((i) => i === void 0);
      t && o || l(e, a), n = e;
    }
  };
}
function f(r, l) {
  let n;
  return (a) => {
    const e = a.stage?.getVariable?.(r) ?? void 0;
    n !== e && (n === void 0 && e === void 0 || l(e, a), n = e);
  };
}
function g(r, l) {
  let n = new Array(r.length).fill(void 0);
  return (a) => {
    const e = (o) => a.stage?.getVariable?.(o), s = r.map(e);
    if (s.some((o, i) => n[i] !== o)) {
      const o = n.every((u) => u === void 0), i = s.every((u) => u === void 0);
      o && i || l(s, a), n = s;
    }
  };
}
export {
  v as globalChange,
  d as globalChanges,
  f as variableChange,
  g as variableChanges
};
