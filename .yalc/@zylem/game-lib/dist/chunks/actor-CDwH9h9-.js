import { Vector3 as je, ActiveCollisionTypes as yn, ColliderDesc as ht, RigidBodyType as Jt, RigidBodyDesc as is } from "@dimforge/rapier3d-compat";
import { Quaternion as H, ShaderMaterial as vn, Vector4 as Fe, Vector3 as L, Curve as os, Loader as He, LoaderUtils as ge, FileLoader as Ft, TextureLoader as Dt, RepeatWrapping as oe, ClampToEdgeWrapping as pt, Texture as dt, MeshPhongMaterial as Ae, MeshLambertMaterial as as, ColorManagement as X, Color as F, SRGBColorSpace as D, EquirectangularReflectionMapping as cs, Matrix4 as M, Group as ye, Bone as mt, PropertyBinding as De, Object3D as pe, PerspectiveCamera as Tn, PointLight as gt, MathUtils as k, SpotLight as wn, DirectionalLight as xn, SkinnedMesh as Pt, Mesh as Pe, LineBasicMaterial as En, Line as An, Skeleton as bn, AmbientLight as ls, BufferGeometry as Me, Float32BufferAttribute as fe, Uint16BufferAttribute as us, Matrix3 as fs, Vector2 as qe, ShapeUtils as hs, Euler as se, AnimationClip as Sn, VectorKeyframeTrack as yt, QuaternionKeyframeTrack as ze, NumberKeyframeTrack as vt, TrianglesDrawMode as ps, TriangleFanDrawMode as Tt, TriangleStripDrawMode as Rn, MeshPhysicalMaterial as W, LinearSRGBColorSpace as Q, InstancedMesh as ds, InstancedBufferAttribute as ms, ImageBitmapLoader as gs, BufferAttribute as nt, InterleavedBuffer as ys, InterleavedBufferAttribute as vs, LinearMipmapLinearFilter as Mn, NearestMipmapLinearFilter as Ts, LinearMipmapNearestFilter as ws, NearestMipmapNearestFilter as xs, LinearFilter as wt, NearestFilter as _n, MirroredRepeatWrapping as Es, PointsMaterial as As, Material as st, MeshStandardMaterial as kt, DoubleSide as bs, MeshBasicMaterial as be, LineSegments as Ss, LineLoop as Rs, Points as Ms, OrthographicCamera as _s, InterpolateDiscrete as Cs, InterpolateLinear as Cn, FrontSide as Is, Interpolant as Ls, Box3 as Fs, Sphere as Ds, AnimationMixer as Ps, LoopOnce as ks, LoopRepeat as Os } from "three";
import { s as Bs } from "./standard-DsmgGGer.js";
const Ns = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
let Us = (o = 21) => {
  let e = "", t = crypto.getRandomValues(new Uint8Array(o |= 0));
  for (; o--; )
    e += Ns[t[o] & 63];
  return e;
};
class ve {
  parent = null;
  children = [];
  behaviors = [];
  options;
  eid = 0;
  uuid = "";
  name = "";
  markedForRemoval = !1;
  update = () => {
  };
  setup = () => {
  };
  destroy = () => {
  };
  constructor(e = []) {
    const t = e.filter((n) => !(n instanceof ve)).reduce((n, s) => ({ ...n, ...s }), {});
    this.options = t, this.uuid = Us();
  }
  setParent(e) {
    this.parent = e;
  }
  getParent() {
    return this.parent;
  }
  add(e) {
    this.children.push(e), e.setParent(this);
  }
  remove(e) {
    const t = this.children.indexOf(e);
    t !== -1 && (this.children.splice(t, 1), e.setParent(null));
  }
  getChildren() {
    return this.children;
  }
  isComposite() {
    return this.children.length > 0;
  }
  nodeSetup(e) {
    typeof this._setup == "function" && this._setup(e), this.setup && this.setup(e), this.children.forEach((t) => t.nodeSetup(e));
  }
  nodeUpdate(e) {
    this.markedForRemoval || (typeof this._update == "function" && this._update(e), this.update && this.update(e), this.children.forEach((t) => t.nodeUpdate(e)));
  }
  nodeDestroy(e) {
    this.children.forEach((t) => t.nodeDestroy(e)), this.destroy && this.destroy(e), typeof this._destroy == "function" && this._destroy(e), this.markedForRemoval = !0;
  }
  getOptions() {
    return this.options;
  }
  setOptions(e) {
    this.options = { ...this.options, ...e };
  }
}
const Gs = Symbol(), en = Object.getPrototypeOf, tn = /* @__PURE__ */ new WeakMap(), js = (o) => o && (tn.has(o) ? tn.get(o) : en(o) === Object.prototype || en(o) === Array.prototype), Hs = (o) => js(o) && o[Gs] || null, xt = {}, Ot = (o) => typeof o == "object" && o !== null, zs = (o) => Ot(o) && !In.has(o) && (Array.isArray(o) || !(Symbol.iterator in o)) && !(o instanceof WeakMap) && !(o instanceof WeakSet) && !(o instanceof Error) && !(o instanceof Number) && !(o instanceof Date) && !(o instanceof String) && !(o instanceof RegExp) && !(o instanceof ArrayBuffer) && !(o instanceof Promise), Ks = (o, e, t, n) => ({
  deleteProperty(s, r) {
    const i = Reflect.get(s, r);
    t(r);
    const a = Reflect.deleteProperty(s, r);
    return a && n(["delete", [r], i]), a;
  },
  set(s, r, i, a) {
    const c = !o() && Reflect.has(s, r), l = Reflect.get(s, r, a);
    if (c && (nn(l, i) || Ve.has(i) && nn(l, Ve.get(i))))
      return !0;
    t(r), Ot(i) && (i = Hs(i) || i);
    const f = !Ke.has(i) && Xs(i) ? Ln(i) : i;
    return e(r, f), Reflect.set(s, r, f, a), n(["set", [r], i, l]), !0;
  }
}), Ke = /* @__PURE__ */ new WeakMap(), In = /* @__PURE__ */ new WeakSet(), rt = [1], Ve = /* @__PURE__ */ new WeakMap();
let nn = Object.is, Vs = (o, e) => new Proxy(o, e), Xs = zs, $s = Ks;
function Ln(o = {}) {
  if (!Ot(o))
    throw new Error("object required");
  const e = Ve.get(o);
  if (e)
    return e;
  let t = rt[0];
  const n = /* @__PURE__ */ new Set(), s = (m, y = ++rt[0]) => {
    t !== y && (r = t = y, n.forEach((T) => T(m, y)));
  };
  let r = t;
  const i = (m = rt[0]) => (r !== m && (r = m, c.forEach(([y]) => {
    const T = y[1](m);
    T > t && (t = T);
  })), t), a = (m) => (y, T) => {
    const v = [...y];
    v[1] = [m, ...v[1]], s(v, T);
  }, c = /* @__PURE__ */ new Map(), l = (m, y) => {
    const T = !In.has(y) && Ke.get(y);
    if (T) {
      if ((xt ? "production" : void 0) !== "production" && c.has(m))
        throw new Error("prop listener already exists");
      if (n.size) {
        const v = T[2](a(m));
        c.set(m, [T, v]);
      } else
        c.set(m, [T]);
    }
  }, f = (m) => {
    var y;
    const T = c.get(m);
    T && (c.delete(m), (y = T[1]) == null || y.call(T));
  }, u = (m) => (n.add(m), n.size === 1 && c.forEach(([T, v], x) => {
    if ((xt ? "production" : void 0) !== "production" && v)
      throw new Error("remove already exists");
    const w = T[2](a(x));
    c.set(x, [T, w]);
  }), () => {
    n.delete(m), n.size === 0 && c.forEach(([T, v], x) => {
      v && (v(), c.set(x, [T]));
    });
  });
  let h = !0;
  const p = $s(
    () => h,
    l,
    f,
    s
  ), d = Vs(o, p);
  Ve.set(o, d);
  const g = [o, i, u];
  return Ke.set(d, g), Reflect.ownKeys(o).forEach((m) => {
    const y = Object.getOwnPropertyDescriptor(
      o,
      m
    );
    "value" in y && y.writable && (d[m] = o[m]);
  }), h = !1, d;
}
function wo(o, e, t) {
  const n = Ke.get(o);
  (xt ? "production" : void 0) !== "production" && !n && console.warn("Please use proxy object");
  let s;
  const r = [], i = n[2];
  let a = !1;
  const l = i((f) => {
    r.push(f), s || (s = Promise.resolve().then(() => {
      s = void 0, a && e(r.splice(0));
    }));
  });
  return a = !0, () => {
    a = !1, l();
  };
}
const Et = Ln({
  id: "",
  globals: {},
  time: 0
});
function xo(o, e) {
  Et.globals[o] = e;
}
function Eo(o) {
  return o !== void 0 ? Et.globals[o] : Et.globals;
}
var de = {
  ui8: "ui8",
  ui16: "ui16",
  ui32: "ui32",
  f32: "f32",
  eid: "eid"
}, sn = {
  i8: "Int8",
  ui8: "Uint8",
  ui8c: "Uint8Clamped",
  i16: "Int16",
  ui16: "Uint16",
  i32: "Int32",
  ui32: "Uint32",
  eid: "Uint32",
  f32: "Float32",
  f64: "Float64"
}, re = {
  i8: Int8Array,
  ui8: Uint8Array,
  ui8c: Uint8ClampedArray,
  i16: Int16Array,
  ui16: Uint16Array,
  i32: Int32Array,
  ui32: Uint32Array,
  f32: Float32Array,
  f64: Float64Array,
  eid: Uint32Array
}, rn = {
  uint8: 2 ** 8,
  uint16: 2 ** 16
}, Ws = (o) => (e) => Math.ceil(e / o) * o, qs = Ws(4), Ys = Symbol("storeRef"), At = Symbol("storeSize"), Qs = Symbol("storeMaps"), ie = Symbol("storeFlattened"), Ne = Symbol("storeBase"), Zs = Symbol("storeType"), Fn = Symbol("storeArrayElementCounts"), Ge = Symbol("storeSubarrays"), Dn = Symbol("subarrayCursors"), Js = Symbol("subarray"), bt = Symbol("parentArray"), Pn = Symbol("tagStore"), on = Symbol("indexType"), an = Symbol("indexBytes"), kn = Symbol("isEidType"), q = {}, er = (o, e) => {
  if (ArrayBuffer.isView(o))
    o[e] = o.slice(0);
  else {
    const t = o[bt].slice(0);
    o[e] = o.map((n, s) => {
      const { length: r } = o[s], i = r * s, a = i + r;
      return t.subarray(i, a);
    });
  }
}, tr = (o, e) => {
  o[ie] && o[ie].forEach((t) => {
    ArrayBuffer.isView(t) ? t[e] = 0 : t[e].fill(0);
  });
}, nr = (o, e) => {
  const t = e * re[o].BYTES_PER_ELEMENT, n = new ArrayBuffer(t), s = new re[o](n);
  return s[kn] = o === de.eid, s;
}, sr = (o, e, t) => {
  const n = o[At], s = Array(n).fill(0);
  s[Zs] = e, s[kn] = e === de.eid;
  const r = o[Dn], i = t <= rn.uint8 ? de.ui8 : t <= rn.uint16 ? de.ui16 : de.ui32;
  if (!t)
    throw new Error("bitECS - Must define component array length");
  if (!re[e])
    throw new Error(`bitECS - Invalid component array property type ${e}`);
  if (!o[Ge][e]) {
    const l = o[Fn][e], f = new re[e](qs(l * n));
    f[on] = sn[i], f[an] = re[i].BYTES_PER_ELEMENT, o[Ge][e] = f;
  }
  const a = r[e], c = a + n * t;
  r[e] = c, s[bt] = o[Ge][e].subarray(a, c);
  for (let l = 0; l < n; l++) {
    const f = t * l, u = f + t;
    s[l] = s[bt].subarray(f, u), s[l][on] = sn[i], s[l][an] = re[i].BYTES_PER_ELEMENT, s[l][Js] = !0;
  }
  return s;
}, cn = (o) => Array.isArray(o) && typeof o[0] == "string" && typeof o[1] == "number", rr = (o, e) => {
  const t = Symbol("store");
  if (!o || !Object.keys(o).length)
    return q[t] = {
      [At]: e,
      [Pn]: !0,
      [Ne]: () => q[t]
    }, q[t];
  o = JSON.parse(JSON.stringify(o));
  const n = {}, s = (i) => {
    const a = Object.keys(i);
    for (const c of a)
      cn(i[c]) ? (n[i[c][0]] || (n[i[c][0]] = 0), n[i[c][0]] += i[c][1]) : i[c] instanceof Object && s(i[c]);
  };
  s(o);
  const r = {
    [At]: e,
    [Qs]: {},
    [Ge]: {},
    [Ys]: t,
    [Dn]: Object.keys(re).reduce((i, a) => ({ ...i, [a]: 0 }), {}),
    [ie]: [],
    [Fn]: n
  };
  if (o instanceof Object && Object.keys(o).length) {
    const i = (a, c) => {
      if (typeof a[c] == "string")
        a[c] = nr(a[c], e), a[c][Ne] = () => q[t], r[ie].push(a[c]);
      else if (cn(a[c])) {
        const [l, f] = a[c];
        a[c] = sr(r, l, f), a[c][Ne] = () => q[t], r[ie].push(a[c]);
      } else a[c] instanceof Object && (a[c] = Object.keys(a[c]).reduce(i, a[c]));
      return a;
    };
    return q[t] = Object.assign(Object.keys(o).reduce(i, o), r), q[t][Ne] = () => q[t], q[t];
  }
}, Se = () => {
  const o = [], e = [];
  o.sort = function(i) {
    const a = Array.prototype.sort.call(this, i);
    for (let c = 0; c < o.length; c++)
      e[o[c]] = c;
    return a;
  };
  const t = (i) => o[e[i]] === i;
  return {
    add: (i) => {
      t(i) || (e[i] = o.push(i) - 1);
    },
    remove: (i) => {
      if (!t(i))
        return;
      const a = e[i], c = o.pop();
      c !== i && (o[a] = c, e[c] = a);
    },
    has: t,
    sparse: e,
    dense: o,
    reset: () => {
      o.length = 0, e.length = 0;
    }
  };
}, te = Symbol("entityMasks"), Ye = Symbol("entityComponents"), ae = Symbol("entitySparseSet"), _e = Symbol("entityArray"), ir = 1e5, St = 0, On = ir, Bt = () => On, Re = [], or = 0.01, ar = or, cr = () => St, lr = /* @__PURE__ */ new Map(), Ao = (o) => {
  const e = o[zt] ? Re.length ? Re.shift() : St++ : Re.length > Math.round(On * ar) ? Re.shift() : St++;
  if (e > o[Ht])
    throw new Error("bitECS - max entities reached");
  return o[ae].add(e), lr.set(e, o), o[Nt].forEach((t) => {
    Ut(o, t, e) && Gt(t, e);
  }), o[Ye].set(e, /* @__PURE__ */ new Set()), e;
}, ur = (o, e) => {
  if (o[ae].has(e)) {
    o[Qe].forEach((t) => {
      Nn(o, t, e);
    }), o[zt] || Re.push(e), o[ae].remove(e), o[Ye].delete(e), o[Un].delete(o[Mt].get(e)), o[Mt].delete(e);
    for (let t = 0; t < o[te].length; t++)
      o[te][t][e] = 0;
  }
}, fr = Symbol("$modifier"), Qe = Symbol("queries"), Nt = Symbol("notQueries"), hr = Symbol("queryAny"), pr = Symbol("queryAll"), dr = Symbol("queryNone"), Xe = Symbol("queryMap"), Ce = Symbol("$dirtyQueries"), Bn = Symbol("queryComponents"), mr = (o, e) => {
  const t = [], n = [], s = [];
  e[Bn].forEach((w) => {
    if (typeof w == "function" && w[fr]) {
      const [E, S] = w();
      o[Y].has(E) || Rt(o, E), S === "not" && n.push(E), S === "changed" && (s.push(E), t.push(E));
    } else
      o[Y].has(w) || Rt(o, w), t.push(w);
  });
  const r = (w) => o[Y].get(w), i = t.concat(n).map(r), a = Se(), c = [], l = [], f = Se(), u = Se(), h = Se(), p = i.map((w) => w.generationId).reduce((w, E) => (w.includes(E) || w.push(E), w), []), d = (w, E) => (w[E.generationId] || (w[E.generationId] = 0), w[E.generationId] |= E.bitflag, w), g = t.map(r).reduce(d, {}), m = n.map(r).reduce(d, {}), y = i.reduce(d, {}), T = t.filter((w) => !w[Pn]).map((w) => Object.getOwnPropertySymbols(w).includes(ie) ? w[ie] : [w]).reduce((w, E) => w.concat(E), []), x = Object.assign(a, {
    archetypes: c,
    changed: l,
    components: t,
    notComponents: n,
    changedComponents: s,
    allComponents: i,
    masks: g,
    notMasks: m,
    hasMasks: y,
    generations: p,
    flatProps: T,
    toRemove: f,
    entered: u,
    exited: h,
    shadows: []
  });
  o[Xe].set(e, x), o[Qe].add(x), i.forEach((w) => {
    w.queries.add(x);
  }), n.length && o[Nt].add(x);
  for (let w = 0; w < cr(); w++) {
    if (!o[ae].has(w))
      continue;
    Ut(o, x, w) && Gt(x, w);
  }
}, gr = (o, e) => {
  const t = Symbol(), n = o.flatProps[e];
  return er(n, t), o.shadows[e] = n[t], n[t];
}, yr = (o, e) => {
  e && (o.changed = []);
  const { flatProps: t, shadows: n } = o;
  for (let s = 0; s < o.dense.length; s++) {
    const r = o.dense[s];
    let i = !1;
    for (let a = 0; a < t.length; a++) {
      const c = t[a], l = n[a] || gr(o, a);
      if (ArrayBuffer.isView(c[r])) {
        for (let f = 0; f < c[r].length; f++)
          if (c[r][f] !== l[r][f]) {
            i = !0;
            break;
          }
        l[r].set(c[r]);
      } else
        c[r] !== l[r] && (i = !0, l[r] = c[r]);
    }
    i && o.changed.push(r);
  }
  return o.changed;
}, vr = (...o) => {
  let e, t, n, s;
  if (Array.isArray(o[0]) && (e = o[0]), e === void 0 || e[Y] !== void 0)
    return (i) => i ? i[_e] : e[_e];
  const r = function(i, a = !0) {
    i[Xe].has(r) || mr(i, r);
    const c = i[Xe].get(r);
    return wr(i), c.changedComponents.length ? yr(c, a) : c.dense;
  };
  return r[Bn] = e, r[hr] = t, r[pr] = n, r[dr] = s, r;
}, Ut = (o, e, t) => {
  const { masks: n, notMasks: s, generations: r } = e;
  for (let i = 0; i < r.length; i++) {
    const a = r[i], c = n[a], l = s[a], f = o[te][a][t];
    if (l && (f & l) !== 0 || c && (f & c) !== c)
      return !1;
  }
  return !0;
}, Gt = (o, e) => {
  o.toRemove.remove(e), o.entered.add(e), o.add(e);
}, Tr = (o) => {
  for (let e = o.toRemove.dense.length - 1; e >= 0; e--) {
    const t = o.toRemove.dense[e];
    o.toRemove.remove(t), o.remove(t);
  }
}, wr = (o) => {
  o[Ce].size && (o[Ce].forEach(Tr), o[Ce].clear());
}, Nn = (o, e, t) => {
  !e.has(t) || e.toRemove.has(t) || (e.toRemove.add(t), o[Ce].add(e), e.exited.add(t));
}, Y = Symbol("componentMap"), jt = (o, e) => {
  const t = rr(o, Bt());
  return o && Object.keys(o).length, t;
}, xr = (o) => {
  o[Ie] *= 2, o[Ie] >= 2 ** 31 && (o[Ie] = 1, o[te].push(new Uint32Array(o[Ht])));
}, Rt = (o, e) => {
  if (!e)
    throw new Error("bitECS - Cannot register null or undefined component");
  const t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set();
  o[Qe].forEach((r) => {
    r.allComponents.includes(e) && t.add(r);
  }), o[Y].set(e, {
    generationId: o[te].length - 1,
    bitflag: o[Ie],
    store: e,
    queries: t,
    notQueries: n,
    changedQueries: s
  }), xr(o);
}, Er = (o, e, t) => {
  const n = o[Y].get(e);
  if (!n)
    return !1;
  const { generationId: s, bitflag: r } = n;
  return (o[te][s][t] & r) === r;
}, bo = (o, e, t, n = !1) => {
  if (t === void 0)
    throw new Error("bitECS - entity is undefined.");
  if (!o[ae].has(t))
    throw new Error("bitECS - entity does not exist in the world.");
  if (o[Y].has(e) || Rt(o, e), Er(o, e, t))
    return;
  const s = o[Y].get(e), { generationId: r, bitflag: i, queries: a, notQueries: c } = s;
  o[te][r][t] |= i, a.forEach((l) => {
    l.toRemove.remove(t);
    const f = Ut(o, l, t);
    f && (l.exited.remove(t), Gt(l, t)), f || (l.entered.remove(t), Nn(o, l, t));
  }), o[Ye].get(t).add(e), n && tr(e, t);
}, Ht = Symbol("size"), Ie = Symbol("bitflag"), Ar = Symbol("archetypes"), Un = Symbol("localEntities"), Mt = Symbol("localEntityLookup"), zt = Symbol("manualEntityRecycling"), So = (...o) => {
  const e = typeof o[0] == "object" ? o[0] : {}, t = typeof o[0] == "number" ? o[0] : typeof o[1] == "number" ? o[1] : Bt();
  return br(e, t), e;
}, br = (o, e = Bt()) => (o[Ht] = e, o[_e] && o[_e].forEach((t) => ur(o, t)), o[te] = [new Uint32Array(e)], o[Ye] = /* @__PURE__ */ new Map(), o[Ar] = [], o[ae] = Se(), o[_e] = o[ae].dense, o[Ie] = 1, o[Y] = /* @__PURE__ */ new Map(), o[Xe] = /* @__PURE__ */ new Map(), o[Qe] = /* @__PURE__ */ new Set(), o[Nt] = /* @__PURE__ */ new Set(), o[Ce] = /* @__PURE__ */ new Set(), o[Un] = /* @__PURE__ */ new Map(), o[Mt] = /* @__PURE__ */ new Map(), o[zt] = !1, o), Sr = (o) => (e, ...t) => (o(e, ...t), e), $ = de;
const j = jt({
  x: $.f32,
  y: $.f32,
  z: $.f32
}), K = jt({
  x: $.f32,
  y: $.f32,
  z: $.f32,
  w: $.f32
}), Rr = jt({
  x: $.f32,
  y: $.f32,
  z: $.f32
});
function Ro(o) {
  const e = vr([j, K]), t = o._childrenMap;
  return Sr((n) => {
    const s = e(n);
    if (t === void 0)
      return n;
    for (const [r, i] of t) {
      const a = s[r], c = i;
      if (c === void 0 || !c?.body || c.markedForRemoval)
        continue;
      const { x: l, y: f, z: u } = c.body.translation();
      if (j.x[a] = l, j.y[a] = f, j.z[a] = u, c.group ? c.group.position.set(j.x[a], j.y[a], j.z[a]) : c.mesh && c.mesh.position.set(j.x[a], j.y[a], j.z[a]), c.controlledRotation)
        continue;
      const { x: h, y: p, z: d, w: g } = c.body.rotation();
      K.x[a] = h, K.y[a] = p, K.z[a] = d, K.w[a] = g;
      const m = new H(K.x[a], K.y[a], K.z[a], K.w[a]);
      c.group ? c.group.setRotationFromQuaternion(m) : c.mesh && c.mesh.setRotationFromQuaternion(m);
    }
    return n;
  });
}
class Mr extends ve {
  group;
  mesh;
  materials;
  bodyDesc = null;
  body = null;
  colliderDesc;
  collider;
  custom = {};
  debugInfo = {};
  debugMaterial;
  lifeCycleDelegate = {
    setup: [],
    update: [],
    destroy: []
  };
  collisionDelegate = {
    collision: []
  };
  collisionType;
  behaviorCallbackMap = {
    setup: [],
    update: [],
    destroy: [],
    collision: []
  };
  constructor() {
    super();
  }
  create() {
    const { position: e } = this.options, { x: t, y: n, z: s } = e || { x: 0, y: 0, z: 0 };
    return this.behaviors = [
      { component: j, values: { x: t, y: n, z: s } },
      { component: Rr, values: { x: 0, y: 0, z: 0 } },
      { component: K, values: { x: 0, y: 0, z: 0, w: 0 } }
    ], this.name = this.options.name || "", this;
  }
  onSetup(...e) {
    const t = [...this.lifeCycleDelegate.setup ?? [], ...e];
    return this.lifeCycleDelegate = {
      ...this.lifeCycleDelegate,
      setup: t
    }, this;
  }
  onUpdate(...e) {
    const t = [...this.lifeCycleDelegate.update ?? [], ...e];
    return this.lifeCycleDelegate = {
      ...this.lifeCycleDelegate,
      update: t
    }, this;
  }
  onDestroy(...e) {
    return this.lifeCycleDelegate = {
      ...this.lifeCycleDelegate,
      destroy: e.length > 0 ? e : void 0
    }, this;
  }
  onCollision(...e) {
    return this.collisionDelegate = {
      collision: e.length > 0 ? e : void 0
    }, this;
  }
  _setup(e) {
    this.behaviorCallbackMap.setup.forEach((t) => {
      t({ ...e, me: this });
    }), this.lifeCycleDelegate.setup?.length && this.lifeCycleDelegate.setup.forEach((n) => {
      n({ ...e, me: this });
    });
  }
  _update(e) {
    this.updateMaterials(e), this.lifeCycleDelegate.update?.length && this.lifeCycleDelegate.update.forEach((n) => {
      n({ ...e, me: this });
    }), this.behaviorCallbackMap.update.forEach((t) => {
      t({ ...e, me: this });
    });
  }
  _destroy(e) {
    this.lifeCycleDelegate.destroy?.length && this.lifeCycleDelegate.destroy.forEach((n) => {
      n({ ...e, me: this });
    }), this.behaviorCallbackMap.destroy.forEach((t) => {
      t({ ...e, me: this });
    });
  }
  _collision(e, t) {
    this.collisionDelegate.collision?.length && this.collisionDelegate.collision.forEach((s) => {
      s({ entity: this, other: e, globals: t });
    }), this.behaviorCallbackMap.collision.forEach((n) => {
      n({ entity: this, other: e, globals: t });
    });
  }
  addBehavior(e) {
    const t = e.handler;
    return t && this.behaviorCallbackMap[e.type].push(t), this;
  }
  addBehaviors(e) {
    return e.forEach((t) => {
      const n = t.handler;
      n && this.behaviorCallbackMap[t.type].push(n);
    }), this;
  }
  updateMaterials(e) {
    if (this.materials?.length)
      for (const t of this.materials)
        t instanceof vn && t.uniforms && t.uniforms.iTime && (t.uniforms.iTime.value += e.delta);
  }
  buildInfo() {
    const e = {};
    return e.name = this.name, e.uuid = this.uuid, e.eid = this.eid.toString(), e;
  }
}
function _r(o) {
  return typeof o?.load == "function" && typeof o?.data == "function";
}
class Cr {
  entityReference;
  constructor(e) {
    this.entityReference = e;
  }
  async load() {
    this.entityReference.load && await this.entityReference.load();
  }
  async data() {
    return this.entityReference.data ? this.entityReference.data() : null;
  }
}
async function Ir(o) {
  const { args: e, defaultConfig: t, EntityClass: n, BuilderClass: s, entityType: r, MeshBuilderClass: i, CollisionBuilderClass: a } = o;
  let c = null, l;
  const f = e.findIndex((h) => !(h instanceof ve));
  f !== -1 && (l = e.splice(f, 1).find((p) => !(p instanceof ve)));
  const u = l ? { ...t, ...l } : t;
  e.push(u);
  for (const h of e) {
    if (h instanceof ve)
      continue;
    let p = null;
    const d = new n(h);
    try {
      if (_r(d)) {
        const g = new Cr(d);
        await g.load(), p = await g.data();
      }
    } catch (g) {
      console.error("Error creating entity with loader:", g);
    }
    c = new s(h, d, i ? new i(p) : null, a ? new a(p) : null), h.material && await c.withMaterial(h.material, r);
  }
  if (!c)
    throw new Error(`missing options for ${String(r)}, builder is not initialized.`);
  return await c.build();
}
/*!
fflate - fast JavaScript compression/decompression
<https://101arrowz.github.io/fflate>
Licensed under MIT. https://github.com/101arrowz/fflate/blob/master/LICENSE
version 0.8.2
*/
var U = Uint8Array, me = Uint16Array, Lr = Int32Array, Gn = new U([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]), jn = new U([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]), Fr = new U([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), Hn = function(o, e) {
  for (var t = new me(31), n = 0; n < 31; ++n)
    t[n] = e += 1 << o[n - 1];
  for (var s = new Lr(t[30]), n = 1; n < 30; ++n)
    for (var r = t[n]; r < t[n + 1]; ++r)
      s[r] = r - t[n] << 5 | n;
  return { b: t, r: s };
}, zn = Hn(Gn, 2), Kn = zn.b, Dr = zn.r;
Kn[28] = 258, Dr[258] = 28;
var Pr = Hn(jn, 0), kr = Pr.b, _t = new me(32768);
for (var _ = 0; _ < 32768; ++_) {
  var J = (_ & 43690) >> 1 | (_ & 21845) << 1;
  J = (J & 52428) >> 2 | (J & 13107) << 2, J = (J & 61680) >> 4 | (J & 3855) << 4, _t[_] = ((J & 65280) >> 8 | (J & 255) << 8) >> 1;
}
var Le = (function(o, e, t) {
  for (var n = o.length, s = 0, r = new me(e); s < n; ++s)
    o[s] && ++r[o[s] - 1];
  var i = new me(e);
  for (s = 1; s < e; ++s)
    i[s] = i[s - 1] + r[s - 1] << 1;
  var a;
  if (t) {
    a = new me(1 << e);
    var c = 15 - e;
    for (s = 0; s < n; ++s)
      if (o[s])
        for (var l = s << 4 | o[s], f = e - o[s], u = i[o[s] - 1]++ << f, h = u | (1 << f) - 1; u <= h; ++u)
          a[_t[u] >> c] = l;
  } else
    for (a = new me(n), s = 0; s < n; ++s)
      o[s] && (a[s] = _t[i[o[s] - 1]++] >> 15 - o[s]);
  return a;
}), Oe = new U(288);
for (var _ = 0; _ < 144; ++_)
  Oe[_] = 8;
for (var _ = 144; _ < 256; ++_)
  Oe[_] = 9;
for (var _ = 256; _ < 280; ++_)
  Oe[_] = 7;
for (var _ = 280; _ < 288; ++_)
  Oe[_] = 8;
var Vn = new U(32);
for (var _ = 0; _ < 32; ++_)
  Vn[_] = 5;
var Or = /* @__PURE__ */ Le(Oe, 9, 1), Br = /* @__PURE__ */ Le(Vn, 5, 1), it = function(o) {
  for (var e = o[0], t = 1; t < o.length; ++t)
    o[t] > e && (e = o[t]);
  return e;
}, G = function(o, e, t) {
  var n = e / 8 | 0;
  return (o[n] | o[n + 1] << 8) >> (e & 7) & t;
}, ot = function(o, e) {
  var t = e / 8 | 0;
  return (o[t] | o[t + 1] << 8 | o[t + 2] << 16) >> (e & 7);
}, Nr = function(o) {
  return (o + 7) / 8 | 0;
}, Ur = function(o, e, t) {
  return (t == null || t > o.length) && (t = o.length), new U(o.subarray(e, t));
}, Gr = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
], z = function(o, e, t) {
  var n = new Error(e || Gr[o]);
  if (n.code = o, Error.captureStackTrace && Error.captureStackTrace(n, z), !t)
    throw n;
  return n;
}, jr = function(o, e, t, n) {
  var s = o.length, r = 0;
  if (!s || e.f && !e.l)
    return t || new U(0);
  var i = !t, a = i || e.i != 2, c = e.i;
  i && (t = new U(s * 3));
  var l = function(Yt) {
    var Qt = t.length;
    if (Yt > Qt) {
      var Zt = new U(Math.max(Qt * 2, Yt));
      Zt.set(t), t = Zt;
    }
  }, f = e.f || 0, u = e.p || 0, h = e.b || 0, p = e.l, d = e.d, g = e.m, m = e.n, y = s * 8;
  do {
    if (!p) {
      f = G(o, u, 1);
      var T = G(o, u + 1, 3);
      if (u += 3, T)
        if (T == 1)
          p = Or, d = Br, g = 9, m = 5;
        else if (T == 2) {
          var E = G(o, u, 31) + 257, S = G(o, u + 10, 15) + 4, C = E + G(o, u + 5, 31) + 1;
          u += 14;
          for (var P = new U(C), B = new U(19), R = 0; R < S; ++R)
            B[Fr[R]] = G(o, u + R * 3, 7);
          u += S * 3;
          for (var ce = it(B), Ze = (1 << ce) - 1, ts = Le(B, ce, 1), R = 0; R < C; ) {
            var Vt = ts[G(o, u, Ze)];
            u += Vt & 15;
            var v = Vt >> 4;
            if (v < 16)
              P[R++] = v;
            else {
              var le = 0, Be = 0;
              for (v == 16 ? (Be = 3 + G(o, u, 3), u += 2, le = P[R - 1]) : v == 17 ? (Be = 3 + G(o, u, 7), u += 3) : v == 18 && (Be = 11 + G(o, u, 127), u += 7); Be--; )
                P[R++] = le;
            }
          }
          var Xt = P.subarray(0, E), Z = P.subarray(E);
          g = it(Xt), m = it(Z), p = Le(Xt, g, 1), d = Le(Z, m, 1);
        } else
          z(1);
      else {
        var v = Nr(u) + 4, x = o[v - 4] | o[v - 3] << 8, w = v + x;
        if (w > s) {
          c && z(0);
          break;
        }
        a && l(h + x), t.set(o.subarray(v, w), h), e.b = h += x, e.p = u = w * 8, e.f = f;
        continue;
      }
      if (u > y) {
        c && z(0);
        break;
      }
    }
    a && l(h + 131072);
    for (var ns = (1 << g) - 1, ss = (1 << m) - 1, Je = u; ; Je = u) {
      var le = p[ot(o, u) & ns], ue = le >> 4;
      if (u += le & 15, u > y) {
        c && z(0);
        break;
      }
      if (le || z(2), ue < 256)
        t[h++] = ue;
      else if (ue == 256) {
        Je = u, p = null;
        break;
      } else {
        var $t = ue - 254;
        if (ue > 264) {
          var R = ue - 257, xe = Gn[R];
          $t = G(o, u, (1 << xe) - 1) + Kn[R], u += xe;
        }
        var et = d[ot(o, u) & ss], tt = et >> 4;
        et || z(3), u += et & 15;
        var Z = kr[tt];
        if (tt > 3) {
          var xe = jn[tt];
          Z += ot(o, u) & (1 << xe) - 1, u += xe;
        }
        if (u > y) {
          c && z(0);
          break;
        }
        a && l(h + 131072);
        var Wt = h + $t;
        if (h < Z) {
          var qt = r - Z, rs = Math.min(Z, Wt);
          for (qt + h < 0 && z(3); h < rs; ++h)
            t[h] = n[qt + h];
        }
        for (; h < Wt; ++h)
          t[h] = t[h - Z];
      }
    }
    e.l = p, e.p = Je, e.b = h, e.f = f, p && (f = 1, e.m = g, e.d = d, e.n = m);
  } while (!f);
  return h != t.length && i ? Ur(t, 0, h) : t.subarray(0, h);
}, Hr = /* @__PURE__ */ new U(0), zr = function(o, e) {
  return ((o[0] & 15) != 8 || o[0] >> 4 > 7 || (o[0] << 8 | o[1]) % 31) && z(6, "invalid zlib data"), (o[1] >> 5 & 1) == 1 && z(6, "invalid zlib data: " + (o[1] & 32 ? "need" : "unexpected") + " dictionary"), (o[1] >> 3 & 4) + 2;
};
function Kr(o, e) {
  return jr(o.subarray(zr(o), -4), { i: 2 }, e, e);
}
var Vr = typeof TextDecoder < "u" && /* @__PURE__ */ new TextDecoder(), Xr = 0;
try {
  Vr.decode(Hr, { stream: !0 }), Xr = 1;
} catch {
}
function Xn(o, e, t) {
  const n = t.length - o - 1;
  if (e >= t[n])
    return n - 1;
  if (e <= t[o])
    return o;
  let s = o, r = n, i = Math.floor((s + r) / 2);
  for (; e < t[i] || e >= t[i + 1]; )
    e < t[i] ? r = i : s = i, i = Math.floor((s + r) / 2);
  return i;
}
function $r(o, e, t, n) {
  const s = [], r = [], i = [];
  s[0] = 1;
  for (let a = 1; a <= t; ++a) {
    r[a] = e - n[o + 1 - a], i[a] = n[o + a] - e;
    let c = 0;
    for (let l = 0; l < a; ++l) {
      const f = i[l + 1], u = r[a - l], h = s[l] / (f + u);
      s[l] = c + f * h, c = u * h;
    }
    s[a] = c;
  }
  return s;
}
function Wr(o, e, t, n) {
  const s = Xn(o, n, e), r = $r(s, n, o, e), i = new Fe(0, 0, 0, 0);
  for (let a = 0; a <= o; ++a) {
    const c = t[s - o + a], l = r[a], f = c.w * l;
    i.x += c.x * f, i.y += c.y * f, i.z += c.z * f, i.w += c.w * l;
  }
  return i;
}
function qr(o, e, t, n, s) {
  const r = [];
  for (let u = 0; u <= t; ++u)
    r[u] = 0;
  const i = [];
  for (let u = 0; u <= n; ++u)
    i[u] = r.slice(0);
  const a = [];
  for (let u = 0; u <= t; ++u)
    a[u] = r.slice(0);
  a[0][0] = 1;
  const c = r.slice(0), l = r.slice(0);
  for (let u = 1; u <= t; ++u) {
    c[u] = e - s[o + 1 - u], l[u] = s[o + u] - e;
    let h = 0;
    for (let p = 0; p < u; ++p) {
      const d = l[p + 1], g = c[u - p];
      a[u][p] = d + g;
      const m = a[p][u - 1] / a[u][p];
      a[p][u] = h + d * m, h = g * m;
    }
    a[u][u] = h;
  }
  for (let u = 0; u <= t; ++u)
    i[0][u] = a[u][t];
  for (let u = 0; u <= t; ++u) {
    let h = 0, p = 1;
    const d = [];
    for (let g = 0; g <= t; ++g)
      d[g] = r.slice(0);
    d[0][0] = 1;
    for (let g = 1; g <= n; ++g) {
      let m = 0;
      const y = u - g, T = t - g;
      u >= g && (d[p][0] = d[h][0] / a[T + 1][y], m = d[p][0] * a[y][T]);
      const v = y >= -1 ? 1 : -y, x = u - 1 <= T ? g - 1 : t - u;
      for (let E = v; E <= x; ++E)
        d[p][E] = (d[h][E] - d[h][E - 1]) / a[T + 1][y + E], m += d[p][E] * a[y + E][T];
      u <= T && (d[p][g] = -d[h][g - 1] / a[T + 1][u], m += d[p][g] * a[u][T]), i[g][u] = m;
      const w = h;
      h = p, p = w;
    }
  }
  let f = t;
  for (let u = 1; u <= n; ++u) {
    for (let h = 0; h <= t; ++h)
      i[u][h] *= f;
    f *= t - u;
  }
  return i;
}
function Yr(o, e, t, n, s) {
  const r = s < o ? s : o, i = [], a = Xn(o, n, e), c = qr(a, n, o, r, e), l = [];
  for (let f = 0; f < t.length; ++f) {
    const u = t[f].clone(), h = u.w;
    u.x *= h, u.y *= h, u.z *= h, l[f] = u;
  }
  for (let f = 0; f <= r; ++f) {
    const u = l[a - o].clone().multiplyScalar(c[f][0]);
    for (let h = 1; h <= o; ++h)
      u.add(l[a - o + h].clone().multiplyScalar(c[f][h]));
    i[f] = u;
  }
  for (let f = r + 1; f <= s + 1; ++f)
    i[f] = new Fe(0, 0, 0);
  return i;
}
function Qr(o, e) {
  let t = 1;
  for (let s = 2; s <= o; ++s)
    t *= s;
  let n = 1;
  for (let s = 2; s <= e; ++s)
    n *= s;
  for (let s = 2; s <= o - e; ++s)
    n *= s;
  return t / n;
}
function Zr(o) {
  const e = o.length, t = [], n = [];
  for (let r = 0; r < e; ++r) {
    const i = o[r];
    t[r] = new L(i.x, i.y, i.z), n[r] = i.w;
  }
  const s = [];
  for (let r = 0; r < e; ++r) {
    const i = t[r].clone();
    for (let a = 1; a <= r; ++a)
      i.sub(s[r - a].clone().multiplyScalar(Qr(r, a) * n[a]));
    s[r] = i.divideScalar(n[0]);
  }
  return s;
}
function Jr(o, e, t, n, s) {
  const r = Yr(o, e, t, n, s);
  return Zr(r);
}
class ei extends os {
  /**
   * Constructs a new NURBS curve.
   *
   * @param {number} degree - The NURBS degree.
   * @param {Array<number>} knots - The knots as a flat array of numbers.
   * @param {Array<Vector2|Vector3|Vector4>} controlPoints - An array holding control points.
   * @param {number} [startKnot] - Index of the start knot into the `knots` array.
   * @param {number} [endKnot] - Index of the end knot into the `knots` array.
   */
  constructor(e, t, n, s, r) {
    super();
    const i = t ? t.length - 1 : 0, a = n ? n.length : 0;
    this.degree = e, this.knots = t, this.controlPoints = [], this.startKnot = s || 0, this.endKnot = r || i;
    for (let c = 0; c < a; ++c) {
      const l = n[c];
      this.controlPoints[c] = new Fe(l.x, l.y, l.z, l.w);
    }
  }
  /**
   * This method returns a vector in 3D space for the given interpolation factor.
   *
   * @param {number} t - A interpolation factor representing a position on the curve. Must be in the range `[0,1]`.
   * @param {Vector3} [optionalTarget] - The optional target vector the result is written to.
   * @return {Vector3} The position on the curve.
   */
  getPoint(e, t = new L()) {
    const n = t, s = this.knots[this.startKnot] + e * (this.knots[this.endKnot] - this.knots[this.startKnot]), r = Wr(this.degree, this.knots, this.controlPoints, s);
    return r.w !== 1 && r.divideScalar(r.w), n.set(r.x, r.y, r.z);
  }
  /**
   * Returns a unit vector tangent for the given interpolation factor.
   *
   * @param {number} t - The interpolation factor.
   * @param {Vector3} [optionalTarget] - The optional target vector the result is written to.
   * @return {Vector3} The tangent vector.
   */
  getTangent(e, t = new L()) {
    const n = t, s = this.knots[0] + e * (this.knots[this.knots.length - 1] - this.knots[0]), r = Jr(this.degree, this.knots, this.controlPoints, s, 1);
    return n.copy(r[1]).normalize(), n;
  }
  toJSON() {
    const e = super.toJSON();
    return e.degree = this.degree, e.knots = [...this.knots], e.controlPoints = this.controlPoints.map((t) => t.toArray()), e.startKnot = this.startKnot, e.endKnot = this.endKnot, e;
  }
  fromJSON(e) {
    return super.fromJSON(e), this.degree = e.degree, this.knots = [...e.knots], this.controlPoints = e.controlPoints.map((t) => new Fe(t[0], t[1], t[2], t[3])), this.startKnot = e.startKnot, this.endKnot = e.endKnot, this;
  }
}
let A, I, O;
class ti extends He {
  /**
   * Constructs a new FBX loader.
   *
   * @param {LoadingManager} [manager] - The loading manager.
   */
  constructor(e) {
    super(e);
  }
  /**
   * Starts loading from the given URL and passes the loaded FBX asset
   * to the `onLoad()` callback.
   *
   * @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
   * @param {function(Group)} onLoad - Executed when the loading process has been finished.
   * @param {onProgressCallback} onProgress - Executed while the loading is in progress.
   * @param {onErrorCallback} onError - Executed when errors occur.
   */
  load(e, t, n, s) {
    const r = this, i = r.path === "" ? ge.extractUrlBase(e) : r.path, a = new Ft(this.manager);
    a.setPath(r.path), a.setResponseType("arraybuffer"), a.setRequestHeader(r.requestHeader), a.setWithCredentials(r.withCredentials), a.load(e, function(c) {
      try {
        t(r.parse(c, i));
      } catch (l) {
        s ? s(l) : console.error(l), r.manager.itemError(e);
      }
    }, n, s);
  }
  /**
   * Parses the given FBX data and returns the resulting group.
   *
   * @param {ArrayBuffer} FBXBuffer - The raw FBX data as an array buffer.
   * @param {string} path - The URL base path.
   * @return {Group} An object representing the parsed asset.
   */
  parse(e, t) {
    if (ai(e))
      A = new oi().parse(e);
    else {
      const s = qn(e);
      if (!ci(s))
        throw new Error("THREE.FBXLoader: Unknown format.");
      if (un(s) < 7e3)
        throw new Error("THREE.FBXLoader: FBX version not supported, FileVersion: " + un(s));
      A = new ii().parse(s);
    }
    const n = new Dt(this.manager).setPath(this.resourcePath || t).setCrossOrigin(this.crossOrigin);
    return new ni(n, this.manager).parse(A);
  }
}
class ni {
  constructor(e, t) {
    this.textureLoader = e, this.manager = t;
  }
  parse() {
    I = this.parseConnections();
    const e = this.parseImages(), t = this.parseTextures(e), n = this.parseMaterials(t), s = this.parseDeformers(), r = new si().parse(s);
    return this.parseScene(s, r, n), O;
  }
  // Parses FBXTree.Connections which holds parent-child connections between objects (e.g. material -> texture, model->geometry )
  // and details the connection type
  parseConnections() {
    const e = /* @__PURE__ */ new Map();
    return "Connections" in A && A.Connections.connections.forEach(function(n) {
      const s = n[0], r = n[1], i = n[2];
      e.has(s) || e.set(s, {
        parents: [],
        children: []
      });
      const a = { ID: r, relationship: i };
      e.get(s).parents.push(a), e.has(r) || e.set(r, {
        parents: [],
        children: []
      });
      const c = { ID: s, relationship: i };
      e.get(r).children.push(c);
    }), e;
  }
  // Parse FBXTree.Objects.Video for embedded image data
  // These images are connected to textures in FBXTree.Objects.Textures
  // via FBXTree.Connections.
  parseImages() {
    const e = {}, t = {};
    if ("Video" in A.Objects) {
      const n = A.Objects.Video;
      for (const s in n) {
        const r = n[s], i = parseInt(s);
        if (e[i] = r.RelativeFilename || r.Filename, "Content" in r) {
          const a = r.Content instanceof ArrayBuffer && r.Content.byteLength > 0, c = typeof r.Content == "string" && r.Content !== "";
          if (a || c) {
            const l = this.parseImage(n[s]);
            t[r.RelativeFilename || r.Filename] = l;
          }
        }
      }
    }
    for (const n in e) {
      const s = e[n];
      t[s] !== void 0 ? e[n] = t[s] : e[n] = e[n].split("\\").pop();
    }
    return e;
  }
  // Parse embedded image data in FBXTree.Video.Content
  parseImage(e) {
    const t = e.Content, n = e.RelativeFilename || e.Filename, s = n.slice(n.lastIndexOf(".") + 1).toLowerCase();
    let r;
    switch (s) {
      case "bmp":
        r = "image/bmp";
        break;
      case "jpg":
      case "jpeg":
        r = "image/jpeg";
        break;
      case "png":
        r = "image/png";
        break;
      case "tif":
        r = "image/tiff";
        break;
      case "tga":
        this.manager.getHandler(".tga") === null && console.warn("FBXLoader: TGA loader not found, skipping ", n), r = "image/tga";
        break;
      case "webp":
        r = "image/webp";
        break;
      default:
        console.warn('FBXLoader: Image type "' + s + '" is not supported.');
        return;
    }
    if (typeof t == "string")
      return "data:" + r + ";base64," + t;
    {
      const i = new Uint8Array(t);
      return window.URL.createObjectURL(new Blob([i], { type: r }));
    }
  }
  // Parse nodes in FBXTree.Objects.Texture
  // These contain details such as UV scaling, cropping, rotation etc and are connected
  // to images in FBXTree.Objects.Video
  parseTextures(e) {
    const t = /* @__PURE__ */ new Map();
    if ("Texture" in A.Objects) {
      const n = A.Objects.Texture;
      for (const s in n) {
        const r = this.parseTexture(n[s], e);
        t.set(parseInt(s), r);
      }
    }
    return t;
  }
  // Parse individual node in FBXTree.Objects.Texture
  parseTexture(e, t) {
    const n = this.loadTexture(e, t);
    n.ID = e.id, n.name = e.attrName;
    const s = e.WrapModeU, r = e.WrapModeV, i = s !== void 0 ? s.value : 0, a = r !== void 0 ? r.value : 0;
    if (n.wrapS = i === 0 ? oe : pt, n.wrapT = a === 0 ? oe : pt, "Scaling" in e) {
      const c = e.Scaling.value;
      n.repeat.x = c[0], n.repeat.y = c[1];
    }
    if ("Translation" in e) {
      const c = e.Translation.value;
      n.offset.x = c[0], n.offset.y = c[1];
    }
    return n;
  }
  // load a texture specified as a blob or data URI, or via an external URL using TextureLoader
  loadTexture(e, t) {
    const n = e.FileName.split(".").pop().toLowerCase();
    let s = this.manager.getHandler(`.${n}`);
    s === null && (s = this.textureLoader);
    const r = s.path;
    r || s.setPath(this.textureLoader.path);
    const i = I.get(e.id).children;
    let a;
    if (i !== void 0 && i.length > 0 && t[i[0].ID] !== void 0 && (a = t[i[0].ID], (a.indexOf("blob:") === 0 || a.indexOf("data:") === 0) && s.setPath(void 0)), a === void 0)
      return console.warn("FBXLoader: Undefined filename, creating placeholder texture."), new dt();
    const c = s.load(a);
    return s.setPath(r), c;
  }
  // Parse nodes in FBXTree.Objects.Material
  parseMaterials(e) {
    const t = /* @__PURE__ */ new Map();
    if ("Material" in A.Objects) {
      const n = A.Objects.Material;
      for (const s in n) {
        const r = this.parseMaterial(n[s], e);
        r !== null && t.set(parseInt(s), r);
      }
    }
    return t;
  }
  // Parse single node in FBXTree.Objects.Material
  // Materials are connected to texture maps in FBXTree.Objects.Textures
  // FBX format currently only supports Lambert and Phong shading models
  parseMaterial(e, t) {
    const n = e.id, s = e.attrName;
    let r = e.ShadingModel;
    if (typeof r == "object" && (r = r.value), !I.has(n)) return null;
    const i = this.parseParameters(e, t, n);
    let a;
    switch (r.toLowerCase()) {
      case "phong":
        a = new Ae();
        break;
      case "lambert":
        a = new as();
        break;
      default:
        console.warn('THREE.FBXLoader: unknown material type "%s". Defaulting to MeshPhongMaterial.', r), a = new Ae();
        break;
    }
    return a.setValues(i), a.name = s, a;
  }
  // Parse FBX material and return parameters suitable for a three.js material
  // Also parse the texture map and return any textures associated with the material
  parseParameters(e, t, n) {
    const s = {};
    e.BumpFactor && (s.bumpScale = e.BumpFactor.value), e.Diffuse ? s.color = X.colorSpaceToWorking(new F().fromArray(e.Diffuse.value), D) : e.DiffuseColor && (e.DiffuseColor.type === "Color" || e.DiffuseColor.type === "ColorRGB") && (s.color = X.colorSpaceToWorking(new F().fromArray(e.DiffuseColor.value), D)), e.DisplacementFactor && (s.displacementScale = e.DisplacementFactor.value), e.Emissive ? s.emissive = X.colorSpaceToWorking(new F().fromArray(e.Emissive.value), D) : e.EmissiveColor && (e.EmissiveColor.type === "Color" || e.EmissiveColor.type === "ColorRGB") && (s.emissive = X.colorSpaceToWorking(new F().fromArray(e.EmissiveColor.value), D)), e.EmissiveFactor && (s.emissiveIntensity = parseFloat(e.EmissiveFactor.value)), s.opacity = 1 - (e.TransparencyFactor ? parseFloat(e.TransparencyFactor.value) : 0), (s.opacity === 1 || s.opacity === 0) && (s.opacity = e.Opacity ? parseFloat(e.Opacity.value) : null, s.opacity === null && (s.opacity = 1 - (e.TransparentColor ? parseFloat(e.TransparentColor.value[0]) : 0))), s.opacity < 1 && (s.transparent = !0), e.ReflectionFactor && (s.reflectivity = e.ReflectionFactor.value), e.Shininess && (s.shininess = e.Shininess.value), e.Specular ? s.specular = X.colorSpaceToWorking(new F().fromArray(e.Specular.value), D) : e.SpecularColor && e.SpecularColor.type === "Color" && (s.specular = X.colorSpaceToWorking(new F().fromArray(e.SpecularColor.value), D));
    const r = this;
    return I.get(n).children.forEach(function(i) {
      const a = i.relationship;
      switch (a) {
        case "Bump":
          s.bumpMap = r.getTexture(t, i.ID);
          break;
        case "Maya|TEX_ao_map":
          s.aoMap = r.getTexture(t, i.ID);
          break;
        case "DiffuseColor":
        case "Maya|TEX_color_map":
          s.map = r.getTexture(t, i.ID), s.map !== void 0 && (s.map.colorSpace = D);
          break;
        case "DisplacementColor":
          s.displacementMap = r.getTexture(t, i.ID);
          break;
        case "EmissiveColor":
          s.emissiveMap = r.getTexture(t, i.ID), s.emissiveMap !== void 0 && (s.emissiveMap.colorSpace = D);
          break;
        case "NormalMap":
        case "Maya|TEX_normal_map":
          s.normalMap = r.getTexture(t, i.ID);
          break;
        case "ReflectionColor":
          s.envMap = r.getTexture(t, i.ID), s.envMap !== void 0 && (s.envMap.mapping = cs, s.envMap.colorSpace = D);
          break;
        case "SpecularColor":
          s.specularMap = r.getTexture(t, i.ID), s.specularMap !== void 0 && (s.specularMap.colorSpace = D);
          break;
        case "TransparentColor":
        case "TransparencyFactor":
          s.alphaMap = r.getTexture(t, i.ID), s.transparent = !0;
          break;
        case "AmbientColor":
        case "ShininessExponent":
        // AKA glossiness map
        case "SpecularFactor":
        // AKA specularLevel
        case "VectorDisplacementColor":
        // NOTE: Seems to be a copy of DisplacementColor
        default:
          console.warn("THREE.FBXLoader: %s map is not supported in three.js, skipping texture.", a);
          break;
      }
    }), s;
  }
  // get a texture from the textureMap for use by a material.
  getTexture(e, t) {
    return "LayeredTexture" in A.Objects && t in A.Objects.LayeredTexture && (console.warn("THREE.FBXLoader: layered textures are not supported in three.js. Discarding all but first layer."), t = I.get(t).children[0].ID), e.get(t);
  }
  // Parse nodes in FBXTree.Objects.Deformer
  // Deformer node can contain skinning or Vertex Cache animation data, however only skinning is supported here
  // Generates map of Skeleton-like objects for use later when generating and binding skeletons.
  parseDeformers() {
    const e = {}, t = {};
    if ("Deformer" in A.Objects) {
      const n = A.Objects.Deformer;
      for (const s in n) {
        const r = n[s], i = I.get(parseInt(s));
        if (r.attrType === "Skin") {
          const a = this.parseSkeleton(i, n);
          a.ID = s, i.parents.length > 1 && console.warn("THREE.FBXLoader: skeleton attached to more than one geometry is not supported."), a.geometryID = i.parents[0].ID, e[s] = a;
        } else if (r.attrType === "BlendShape") {
          const a = {
            id: s
          };
          a.rawTargets = this.parseMorphTargets(i, n), a.id = s, i.parents.length > 1 && console.warn("THREE.FBXLoader: morph target attached to more than one geometry is not supported."), t[s] = a;
        }
      }
    }
    return {
      skeletons: e,
      morphTargets: t
    };
  }
  // Parse single nodes in FBXTree.Objects.Deformer
  // The top level skeleton node has type 'Skin' and sub nodes have type 'Cluster'
  // Each skin node represents a skeleton and each cluster node represents a bone
  parseSkeleton(e, t) {
    const n = [];
    return e.children.forEach(function(s) {
      const r = t[s.ID];
      if (r.attrType !== "Cluster") return;
      const i = {
        ID: s.ID,
        indices: [],
        weights: [],
        transformLink: new M().fromArray(r.TransformLink.a)
        // transform: new Matrix4().fromArray( boneNode.Transform.a ),
        // linkMode: boneNode.Mode,
      };
      "Indexes" in r && (i.indices = r.Indexes.a, i.weights = r.Weights.a), n.push(i);
    }), {
      rawBones: n,
      bones: []
    };
  }
  // The top level morph deformer node has type "BlendShape" and sub nodes have type "BlendShapeChannel"
  parseMorphTargets(e, t) {
    const n = [];
    for (let s = 0; s < e.children.length; s++) {
      const r = e.children[s], i = t[r.ID], a = {
        name: i.attrName,
        initialWeight: i.DeformPercent,
        id: i.id,
        fullWeights: i.FullWeights.a
      };
      if (i.attrType !== "BlendShapeChannel") return;
      a.geoID = I.get(parseInt(r.ID)).children.filter(function(c) {
        return c.relationship === void 0;
      })[0].ID, n.push(a);
    }
    return n;
  }
  // create the main Group() to be returned by the loader
  parseScene(e, t, n) {
    O = new ye();
    const s = this.parseModels(e.skeletons, t, n), r = A.Objects.Model, i = this;
    s.forEach(function(c) {
      const l = r[c.ID];
      i.setLookAtProperties(c, l), I.get(c.ID).parents.forEach(function(u) {
        const h = s.get(u.ID);
        h !== void 0 && h.add(c);
      }), c.parent === null && O.add(c);
    }), this.bindSkeleton(e.skeletons, t, s), this.addGlobalSceneSettings(), O.traverse(function(c) {
      if (c.userData.transformData) {
        c.parent && (c.userData.transformData.parentMatrix = c.parent.matrix, c.userData.transformData.parentMatrixWorld = c.parent.matrixWorld);
        const l = Wn(c.userData.transformData);
        c.applyMatrix4(l), c.updateWorldMatrix();
      }
    });
    const a = new ri().parse();
    O.children.length === 1 && O.children[0].isGroup && (O.children[0].animations = a, O = O.children[0]), O.animations = a;
  }
  // parse nodes in FBXTree.Objects.Model
  parseModels(e, t, n) {
    const s = /* @__PURE__ */ new Map(), r = A.Objects.Model;
    for (const i in r) {
      const a = parseInt(i), c = r[i], l = I.get(a);
      let f = this.buildSkeleton(l, e, a, c.attrName);
      if (!f) {
        switch (c.attrType) {
          case "Camera":
            f = this.createCamera(l);
            break;
          case "Light":
            f = this.createLight(l);
            break;
          case "Mesh":
            f = this.createMesh(l, t, n);
            break;
          case "NurbsCurve":
            f = this.createCurve(l, t);
            break;
          case "LimbNode":
          case "Root":
            f = new mt();
            break;
          case "Null":
          default:
            f = new ye();
            break;
        }
        f.name = c.attrName ? De.sanitizeNodeName(c.attrName) : "", f.userData.originalName = c.attrName, f.ID = a;
      }
      this.getTransformData(f, c), s.set(a, f);
    }
    return s;
  }
  buildSkeleton(e, t, n, s) {
    let r = null;
    return e.parents.forEach(function(i) {
      for (const a in t) {
        const c = t[a];
        c.rawBones.forEach(function(l, f) {
          if (l.ID === i.ID) {
            const u = r;
            r = new mt(), r.matrixWorld.copy(l.transformLink), r.name = s ? De.sanitizeNodeName(s) : "", r.userData.originalName = s, r.ID = n, c.bones[f] = r, u !== null && r.add(u);
          }
        });
      }
    }), r;
  }
  // create a PerspectiveCamera or OrthographicCamera
  createCamera(e) {
    let t, n;
    if (e.children.forEach(function(s) {
      const r = A.Objects.NodeAttribute[s.ID];
      r !== void 0 && (n = r);
    }), n === void 0)
      t = new pe();
    else {
      let s = 0;
      n.CameraProjectionType !== void 0 && n.CameraProjectionType.value === 1 && (s = 1);
      let r = 1;
      n.NearPlane !== void 0 && (r = n.NearPlane.value / 1e3);
      let i = 1e3;
      n.FarPlane !== void 0 && (i = n.FarPlane.value / 1e3);
      let a = window.innerWidth, c = window.innerHeight;
      n.AspectWidth !== void 0 && n.AspectHeight !== void 0 && (a = n.AspectWidth.value, c = n.AspectHeight.value);
      const l = a / c;
      let f = 45;
      n.FieldOfView !== void 0 && (f = n.FieldOfView.value);
      const u = n.FocalLength ? n.FocalLength.value : null;
      switch (s) {
        case 0:
          t = new Tn(f, l, r, i), u !== null && t.setFocalLength(u);
          break;
        case 1:
          console.warn("THREE.FBXLoader: Orthographic cameras not supported yet."), t = new pe();
          break;
        default:
          console.warn("THREE.FBXLoader: Unknown camera type " + s + "."), t = new pe();
          break;
      }
    }
    return t;
  }
  // Create a DirectionalLight, PointLight or SpotLight
  createLight(e) {
    let t, n;
    if (e.children.forEach(function(s) {
      const r = A.Objects.NodeAttribute[s.ID];
      r !== void 0 && (n = r);
    }), n === void 0)
      t = new pe();
    else {
      let s;
      n.LightType === void 0 ? s = 0 : s = n.LightType.value;
      let r = 16777215;
      n.Color !== void 0 && (r = X.colorSpaceToWorking(new F().fromArray(n.Color.value), D));
      let i = n.Intensity === void 0 ? 1 : n.Intensity.value / 100;
      n.CastLightOnObject !== void 0 && n.CastLightOnObject.value === 0 && (i = 0);
      let a = 0;
      n.FarAttenuationEnd !== void 0 && (n.EnableFarAttenuation !== void 0 && n.EnableFarAttenuation.value === 0 ? a = 0 : a = n.FarAttenuationEnd.value);
      const c = 1;
      switch (s) {
        case 0:
          t = new gt(r, i, a, c);
          break;
        case 1:
          t = new xn(r, i);
          break;
        case 2:
          let l = Math.PI / 3;
          n.InnerAngle !== void 0 && (l = k.degToRad(n.InnerAngle.value));
          let f = 0;
          n.OuterAngle !== void 0 && (f = k.degToRad(n.OuterAngle.value), f = Math.max(f, 1)), t = new wn(r, i, a, l, f, c);
          break;
        default:
          console.warn("THREE.FBXLoader: Unknown light type " + n.LightType.value + ", defaulting to a PointLight."), t = new gt(r, i);
          break;
      }
      n.CastShadows !== void 0 && n.CastShadows.value === 1 && (t.castShadow = !0);
    }
    return t;
  }
  createMesh(e, t, n) {
    let s, r = null, i = null;
    const a = [];
    if (e.children.forEach(function(c) {
      t.has(c.ID) && (r = t.get(c.ID)), n.has(c.ID) && a.push(n.get(c.ID));
    }), a.length > 1 ? i = a : a.length > 0 ? i = a[0] : (i = new Ae({
      name: He.DEFAULT_MATERIAL_NAME,
      color: 13421772
    }), a.push(i)), "color" in r.attributes && a.forEach(function(c) {
      c.vertexColors = !0;
    }), r.groups.length > 0) {
      let c = !1;
      for (let l = 0, f = r.groups.length; l < f; l++) {
        const u = r.groups[l];
        (u.materialIndex < 0 || u.materialIndex >= a.length) && (u.materialIndex = a.length, c = !0);
      }
      if (c) {
        const l = new Ae();
        a.push(l);
      }
    }
    return r.FBX_Deformer ? (s = new Pt(r, i), s.normalizeSkinWeights()) : s = new Pe(r, i), s;
  }
  createCurve(e, t) {
    const n = e.children.reduce(function(r, i) {
      return t.has(i.ID) && (r = t.get(i.ID)), r;
    }, null), s = new En({
      name: He.DEFAULT_MATERIAL_NAME,
      color: 3342591,
      linewidth: 1
    });
    return new An(n, s);
  }
  // parse the model node for transform data
  getTransformData(e, t) {
    const n = {};
    "InheritType" in t && (n.inheritType = parseInt(t.InheritType.value)), "RotationOrder" in t ? n.eulerOrder = ke(t.RotationOrder.value) : n.eulerOrder = ke(0), "Lcl_Translation" in t && (n.translation = t.Lcl_Translation.value), "PreRotation" in t && (n.preRotation = t.PreRotation.value), "Lcl_Rotation" in t && (n.rotation = t.Lcl_Rotation.value), "PostRotation" in t && (n.postRotation = t.PostRotation.value), "Lcl_Scaling" in t && (n.scale = t.Lcl_Scaling.value), "ScalingOffset" in t && (n.scalingOffset = t.ScalingOffset.value), "ScalingPivot" in t && (n.scalingPivot = t.ScalingPivot.value), "RotationOffset" in t && (n.rotationOffset = t.RotationOffset.value), "RotationPivot" in t && (n.rotationPivot = t.RotationPivot.value), e.userData.transformData = n;
  }
  setLookAtProperties(e, t) {
    "LookAtProperty" in t && I.get(e.ID).children.forEach(function(s) {
      if (s.relationship === "LookAtProperty") {
        const r = A.Objects.Model[s.ID];
        if ("Lcl_Translation" in r) {
          const i = r.Lcl_Translation.value;
          e.target !== void 0 ? (e.target.position.fromArray(i), O.add(e.target)) : e.lookAt(new L().fromArray(i));
        }
      }
    });
  }
  bindSkeleton(e, t, n) {
    const s = this.parsePoseNodes();
    for (const r in e) {
      const i = e[r];
      I.get(parseInt(i.ID)).parents.forEach(function(c) {
        if (t.has(c.ID)) {
          const l = c.ID;
          I.get(l).parents.forEach(function(u) {
            n.has(u.ID) && n.get(u.ID).bind(new bn(i.bones), s[u.ID]);
          });
        }
      });
    }
  }
  parsePoseNodes() {
    const e = {};
    if ("Pose" in A.Objects) {
      const t = A.Objects.Pose;
      for (const n in t)
        if (t[n].attrType === "BindPose" && t[n].NbPoseNodes > 0) {
          const s = t[n].PoseNode;
          Array.isArray(s) ? s.forEach(function(r) {
            e[r.Node] = new M().fromArray(r.Matrix.a);
          }) : e[s.Node] = new M().fromArray(s.Matrix.a);
        }
    }
    return e;
  }
  addGlobalSceneSettings() {
    if ("GlobalSettings" in A) {
      if ("AmbientColor" in A.GlobalSettings) {
        const e = A.GlobalSettings.AmbientColor.value, t = e[0], n = e[1], s = e[2];
        if (t !== 0 || n !== 0 || s !== 0) {
          const r = new F().setRGB(t, n, s, D);
          O.add(new ls(r, 1));
        }
      }
      "UnitScaleFactor" in A.GlobalSettings && (O.userData.unitScaleFactor = A.GlobalSettings.UnitScaleFactor.value);
    }
  }
}
class si {
  constructor() {
    this.negativeMaterialIndices = !1;
  }
  // Parse nodes in FBXTree.Objects.Geometry
  parse(e) {
    const t = /* @__PURE__ */ new Map();
    if ("Geometry" in A.Objects) {
      const n = A.Objects.Geometry;
      for (const s in n) {
        const r = I.get(parseInt(s)), i = this.parseGeometry(r, n[s], e);
        t.set(parseInt(s), i);
      }
    }
    return this.negativeMaterialIndices === !0 && console.warn("THREE.FBXLoader: The FBX file contains invalid (negative) material indices. The asset might not render as expected."), t;
  }
  // Parse single node in FBXTree.Objects.Geometry
  parseGeometry(e, t, n) {
    switch (t.attrType) {
      case "Mesh":
        return this.parseMeshGeometry(e, t, n);
      case "NurbsCurve":
        return this.parseNurbsGeometry(t);
    }
  }
  // Parse single node mesh geometry in FBXTree.Objects.Geometry
  parseMeshGeometry(e, t, n) {
    const s = n.skeletons, r = [], i = e.parents.map(function(u) {
      return A.Objects.Model[u.ID];
    });
    if (i.length === 0) return;
    const a = e.children.reduce(function(u, h) {
      return s[h.ID] !== void 0 && (u = s[h.ID]), u;
    }, null);
    e.children.forEach(function(u) {
      n.morphTargets[u.ID] !== void 0 && r.push(n.morphTargets[u.ID]);
    });
    const c = i[0], l = {};
    "RotationOrder" in c && (l.eulerOrder = ke(c.RotationOrder.value)), "InheritType" in c && (l.inheritType = parseInt(c.InheritType.value)), "GeometricTranslation" in c && (l.translation = c.GeometricTranslation.value), "GeometricRotation" in c && (l.rotation = c.GeometricRotation.value), "GeometricScaling" in c && (l.scale = c.GeometricScaling.value);
    const f = Wn(l);
    return this.genGeometry(t, a, r, f);
  }
  // Generate a BufferGeometry from a node in FBXTree.Objects.Geometry
  genGeometry(e, t, n, s) {
    const r = new Me();
    e.attrName && (r.name = e.attrName);
    const i = this.parseGeoNode(e, t), a = this.genBuffers(i), c = new fe(a.vertex, 3);
    if (c.applyMatrix4(s), r.setAttribute("position", c), a.colors.length > 0 && r.setAttribute("color", new fe(a.colors, 3)), t && (r.setAttribute("skinIndex", new us(a.weightsIndices, 4)), r.setAttribute("skinWeight", new fe(a.vertexWeights, 4)), r.FBX_Deformer = t), a.normal.length > 0) {
      const l = new fs().getNormalMatrix(s), f = new fe(a.normal, 3);
      f.applyNormalMatrix(l), r.setAttribute("normal", f);
    }
    if (a.uvs.forEach(function(l, f) {
      const u = f === 0 ? "uv" : `uv${f}`;
      r.setAttribute(u, new fe(a.uvs[f], 2));
    }), i.material && i.material.mappingType !== "AllSame") {
      let l = a.materialIndex[0], f = 0;
      if (a.materialIndex.forEach(function(u, h) {
        u !== l && (r.addGroup(f, h - f, l), l = u, f = h);
      }), r.groups.length > 0) {
        const u = r.groups[r.groups.length - 1], h = u.start + u.count;
        h !== a.materialIndex.length && r.addGroup(h, a.materialIndex.length - h, l);
      }
      r.groups.length === 0 && r.addGroup(0, a.materialIndex.length, a.materialIndex[0]);
    }
    return this.addMorphTargets(r, e, n, s), r;
  }
  parseGeoNode(e, t) {
    const n = {};
    if (n.vertexPositions = e.Vertices !== void 0 ? e.Vertices.a : [], n.vertexIndices = e.PolygonVertexIndex !== void 0 ? e.PolygonVertexIndex.a : [], e.LayerElementColor && e.LayerElementColor[0].Colors && (n.color = this.parseVertexColors(e.LayerElementColor[0])), e.LayerElementMaterial && (n.material = this.parseMaterialIndices(e.LayerElementMaterial[0])), e.LayerElementNormal && (n.normal = this.parseNormals(e.LayerElementNormal[0])), e.LayerElementUV) {
      n.uv = [];
      let s = 0;
      for (; e.LayerElementUV[s]; )
        e.LayerElementUV[s].UV && n.uv.push(this.parseUVs(e.LayerElementUV[s])), s++;
    }
    return n.weightTable = {}, t !== null && (n.skeleton = t, t.rawBones.forEach(function(s, r) {
      s.indices.forEach(function(i, a) {
        n.weightTable[i] === void 0 && (n.weightTable[i] = []), n.weightTable[i].push({
          id: r,
          weight: s.weights[a]
        });
      });
    })), n;
  }
  genBuffers(e) {
    const t = {
      vertex: [],
      normal: [],
      colors: [],
      uvs: [],
      materialIndex: [],
      vertexWeights: [],
      weightsIndices: []
    };
    let n = 0, s = 0, r = !1, i = [], a = [], c = [], l = [], f = [], u = [];
    const h = this;
    return e.vertexIndices.forEach(function(p, d) {
      let g, m = !1;
      p < 0 && (p = p ^ -1, m = !0);
      let y = [], T = [];
      if (i.push(p * 3, p * 3 + 1, p * 3 + 2), e.color) {
        const v = Ue(d, n, p, e.color);
        c.push(v[0], v[1], v[2]);
      }
      if (e.skeleton) {
        if (e.weightTable[p] !== void 0 && e.weightTable[p].forEach(function(v) {
          T.push(v.weight), y.push(v.id);
        }), T.length > 4) {
          r || (console.warn("THREE.FBXLoader: Vertex has more than 4 skinning weights assigned to vertex. Deleting additional weights."), r = !0);
          const v = [0, 0, 0, 0], x = [0, 0, 0, 0];
          T.forEach(function(w, E) {
            let S = w, C = y[E];
            x.forEach(function(P, B, R) {
              if (S > P) {
                R[B] = S, S = P;
                const ce = v[B];
                v[B] = C, C = ce;
              }
            });
          }), y = v, T = x;
        }
        for (; T.length < 4; )
          T.push(0), y.push(0);
        for (let v = 0; v < 4; ++v)
          f.push(T[v]), u.push(y[v]);
      }
      if (e.normal) {
        const v = Ue(d, n, p, e.normal);
        a.push(v[0], v[1], v[2]);
      }
      e.material && e.material.mappingType !== "AllSame" && (g = Ue(d, n, p, e.material)[0], g < 0 && (h.negativeMaterialIndices = !0, g = 0)), e.uv && e.uv.forEach(function(v, x) {
        const w = Ue(d, n, p, v);
        l[x] === void 0 && (l[x] = []), l[x].push(w[0]), l[x].push(w[1]);
      }), s++, m && (h.genFace(t, e, i, g, a, c, l, f, u, s), n++, s = 0, i = [], a = [], c = [], l = [], f = [], u = []);
    }), t;
  }
  // See https://www.khronos.org/opengl/wiki/Calculating_a_Surface_Normal
  getNormalNewell(e) {
    const t = new L(0, 0, 0);
    for (let n = 0; n < e.length; n++) {
      const s = e[n], r = e[(n + 1) % e.length];
      t.x += (s.y - r.y) * (s.z + r.z), t.y += (s.z - r.z) * (s.x + r.x), t.z += (s.x - r.x) * (s.y + r.y);
    }
    return t.normalize(), t;
  }
  getNormalTangentAndBitangent(e) {
    const t = this.getNormalNewell(e), s = (Math.abs(t.z) > 0.5 ? new L(0, 1, 0) : new L(0, 0, 1)).cross(t).normalize(), r = t.clone().cross(s).normalize();
    return {
      normal: t,
      tangent: s,
      bitangent: r
    };
  }
  flattenVertex(e, t, n) {
    return new qe(
      e.dot(t),
      e.dot(n)
    );
  }
  // Generate data for a single face in a geometry. If the face is a quad then split it into 2 tris
  genFace(e, t, n, s, r, i, a, c, l, f) {
    let u;
    if (f > 3) {
      const h = [], p = t.baseVertexPositions || t.vertexPositions;
      for (let y = 0; y < n.length; y += 3)
        h.push(
          new L(
            p[n[y]],
            p[n[y + 1]],
            p[n[y + 2]]
          )
        );
      const { tangent: d, bitangent: g } = this.getNormalTangentAndBitangent(h), m = [];
      for (const y of h)
        m.push(this.flattenVertex(y, d, g));
      u = hs.triangulateShape(m, []);
    } else
      u = [[0, 1, 2]];
    for (const [h, p, d] of u)
      e.vertex.push(t.vertexPositions[n[h * 3]]), e.vertex.push(t.vertexPositions[n[h * 3 + 1]]), e.vertex.push(t.vertexPositions[n[h * 3 + 2]]), e.vertex.push(t.vertexPositions[n[p * 3]]), e.vertex.push(t.vertexPositions[n[p * 3 + 1]]), e.vertex.push(t.vertexPositions[n[p * 3 + 2]]), e.vertex.push(t.vertexPositions[n[d * 3]]), e.vertex.push(t.vertexPositions[n[d * 3 + 1]]), e.vertex.push(t.vertexPositions[n[d * 3 + 2]]), t.skeleton && (e.vertexWeights.push(c[h * 4]), e.vertexWeights.push(c[h * 4 + 1]), e.vertexWeights.push(c[h * 4 + 2]), e.vertexWeights.push(c[h * 4 + 3]), e.vertexWeights.push(c[p * 4]), e.vertexWeights.push(c[p * 4 + 1]), e.vertexWeights.push(c[p * 4 + 2]), e.vertexWeights.push(c[p * 4 + 3]), e.vertexWeights.push(c[d * 4]), e.vertexWeights.push(c[d * 4 + 1]), e.vertexWeights.push(c[d * 4 + 2]), e.vertexWeights.push(c[d * 4 + 3]), e.weightsIndices.push(l[h * 4]), e.weightsIndices.push(l[h * 4 + 1]), e.weightsIndices.push(l[h * 4 + 2]), e.weightsIndices.push(l[h * 4 + 3]), e.weightsIndices.push(l[p * 4]), e.weightsIndices.push(l[p * 4 + 1]), e.weightsIndices.push(l[p * 4 + 2]), e.weightsIndices.push(l[p * 4 + 3]), e.weightsIndices.push(l[d * 4]), e.weightsIndices.push(l[d * 4 + 1]), e.weightsIndices.push(l[d * 4 + 2]), e.weightsIndices.push(l[d * 4 + 3])), t.color && (e.colors.push(i[h * 3]), e.colors.push(i[h * 3 + 1]), e.colors.push(i[h * 3 + 2]), e.colors.push(i[p * 3]), e.colors.push(i[p * 3 + 1]), e.colors.push(i[p * 3 + 2]), e.colors.push(i[d * 3]), e.colors.push(i[d * 3 + 1]), e.colors.push(i[d * 3 + 2])), t.material && t.material.mappingType !== "AllSame" && (e.materialIndex.push(s), e.materialIndex.push(s), e.materialIndex.push(s)), t.normal && (e.normal.push(r[h * 3]), e.normal.push(r[h * 3 + 1]), e.normal.push(r[h * 3 + 2]), e.normal.push(r[p * 3]), e.normal.push(r[p * 3 + 1]), e.normal.push(r[p * 3 + 2]), e.normal.push(r[d * 3]), e.normal.push(r[d * 3 + 1]), e.normal.push(r[d * 3 + 2])), t.uv && t.uv.forEach(function(g, m) {
        e.uvs[m] === void 0 && (e.uvs[m] = []), e.uvs[m].push(a[m][h * 2]), e.uvs[m].push(a[m][h * 2 + 1]), e.uvs[m].push(a[m][p * 2]), e.uvs[m].push(a[m][p * 2 + 1]), e.uvs[m].push(a[m][d * 2]), e.uvs[m].push(a[m][d * 2 + 1]);
      });
  }
  addMorphTargets(e, t, n, s) {
    if (n.length === 0) return;
    e.morphTargetsRelative = !0, e.morphAttributes.position = [];
    const r = this;
    n.forEach(function(i) {
      i.rawTargets.forEach(function(a) {
        const c = A.Objects.Geometry[a.geoID];
        c !== void 0 && r.genMorphGeometry(e, t, c, s, a.name);
      });
    });
  }
  // a morph geometry node is similar to a standard  node, and the node is also contained
  // in FBXTree.Objects.Geometry, however it can only have attributes for position, normal
  // and a special attribute Index defining which vertices of the original geometry are affected
  // Normal and position attributes only have data for the vertices that are affected by the morph
  genMorphGeometry(e, t, n, s, r) {
    const i = t.Vertices !== void 0 ? t.Vertices.a : [], a = t.PolygonVertexIndex !== void 0 ? t.PolygonVertexIndex.a : [], c = n.Vertices !== void 0 ? n.Vertices.a : [], l = n.Indexes !== void 0 ? n.Indexes.a : [], f = e.attributes.position.count * 3, u = new Float32Array(f);
    for (let g = 0; g < l.length; g++) {
      const m = l[g] * 3;
      u[m] = c[g * 3], u[m + 1] = c[g * 3 + 1], u[m + 2] = c[g * 3 + 2];
    }
    const h = {
      vertexIndices: a,
      vertexPositions: u,
      baseVertexPositions: i
    }, p = this.genBuffers(h), d = new fe(p.vertex, 3);
    d.name = r || n.attrName, d.applyMatrix4(s), e.morphAttributes.position.push(d);
  }
  // Parse normal from FBXTree.Objects.Geometry.LayerElementNormal if it exists
  parseNormals(e) {
    const t = e.MappingInformationType, n = e.ReferenceInformationType, s = e.Normals.a;
    let r = [];
    return n === "IndexToDirect" && ("NormalIndex" in e ? r = e.NormalIndex.a : "NormalsIndex" in e && (r = e.NormalsIndex.a)), {
      dataSize: 3,
      buffer: s,
      indices: r,
      mappingType: t,
      referenceType: n
    };
  }
  // Parse UVs from FBXTree.Objects.Geometry.LayerElementUV if it exists
  parseUVs(e) {
    const t = e.MappingInformationType, n = e.ReferenceInformationType, s = e.UV.a;
    let r = [];
    return n === "IndexToDirect" && (r = e.UVIndex.a), {
      dataSize: 2,
      buffer: s,
      indices: r,
      mappingType: t,
      referenceType: n
    };
  }
  // Parse Vertex Colors from FBXTree.Objects.Geometry.LayerElementColor if it exists
  parseVertexColors(e) {
    const t = e.MappingInformationType, n = e.ReferenceInformationType, s = e.Colors.a;
    let r = [];
    n === "IndexToDirect" && (r = e.ColorIndex.a);
    for (let i = 0, a = new F(); i < s.length; i += 4)
      a.fromArray(s, i), X.colorSpaceToWorking(a, D), a.toArray(s, i);
    return {
      dataSize: 4,
      buffer: s,
      indices: r,
      mappingType: t,
      referenceType: n
    };
  }
  // Parse mapping and material data in FBXTree.Objects.Geometry.LayerElementMaterial if it exists
  parseMaterialIndices(e) {
    const t = e.MappingInformationType, n = e.ReferenceInformationType;
    if (t === "NoMappingInformation")
      return {
        dataSize: 1,
        buffer: [0],
        indices: [0],
        mappingType: "AllSame",
        referenceType: n
      };
    const s = e.Materials.a, r = [];
    for (let i = 0; i < s.length; ++i)
      r.push(i);
    return {
      dataSize: 1,
      buffer: s,
      indices: r,
      mappingType: t,
      referenceType: n
    };
  }
  // Generate a NurbGeometry from a node in FBXTree.Objects.Geometry
  parseNurbsGeometry(e) {
    const t = parseInt(e.Order);
    if (isNaN(t))
      return console.error("THREE.FBXLoader: Invalid Order %s given for geometry ID: %s", e.Order, e.id), new Me();
    const n = t - 1, s = e.KnotVector.a, r = [], i = e.Points.a;
    for (let u = 0, h = i.length; u < h; u += 4)
      r.push(new Fe().fromArray(i, u));
    let a, c;
    if (e.Form === "Closed")
      r.push(r[0]);
    else if (e.Form === "Periodic") {
      a = n, c = s.length - 1 - a;
      for (let u = 0; u < n; ++u)
        r.push(r[u]);
    }
    const f = new ei(n, s, r, a, c).getPoints(r.length * 12);
    return new Me().setFromPoints(f);
  }
}
class ri {
  // take raw animation clips and turn them into three.js animation clips
  parse() {
    const e = [], t = this.parseClips();
    if (t !== void 0)
      for (const n in t) {
        const s = t[n], r = this.addClip(s);
        e.push(r);
      }
    return e;
  }
  parseClips() {
    if (A.Objects.AnimationCurve === void 0) return;
    const e = this.parseAnimationCurveNodes();
    this.parseAnimationCurves(e);
    const t = this.parseAnimationLayers(e);
    return this.parseAnimStacks(t);
  }
  // parse nodes in FBXTree.Objects.AnimationCurveNode
  // each AnimationCurveNode holds data for an animation transform for a model (e.g. left arm rotation )
  // and is referenced by an AnimationLayer
  parseAnimationCurveNodes() {
    const e = A.Objects.AnimationCurveNode, t = /* @__PURE__ */ new Map();
    for (const n in e) {
      const s = e[n];
      if (s.attrName.match(/S|R|T|DeformPercent/) !== null) {
        const r = {
          id: s.id,
          attr: s.attrName,
          curves: {}
        };
        t.set(r.id, r);
      }
    }
    return t;
  }
  // parse nodes in FBXTree.Objects.AnimationCurve and connect them up to
  // previously parsed AnimationCurveNodes. Each AnimationCurve holds data for a single animated
  // axis ( e.g. times and values of x rotation)
  parseAnimationCurves(e) {
    const t = A.Objects.AnimationCurve;
    for (const n in t) {
      const s = {
        id: t[n].id,
        times: t[n].KeyTime.a.map(li),
        values: t[n].KeyValueFloat.a
      }, r = I.get(s.id);
      if (r !== void 0) {
        const i = r.parents[0].ID, a = r.parents[0].relationship;
        a.match(/X/) ? e.get(i).curves.x = s : a.match(/Y/) ? e.get(i).curves.y = s : a.match(/Z/) ? e.get(i).curves.z = s : a.match(/DeformPercent/) && e.has(i) && (e.get(i).curves.morph = s);
      }
    }
  }
  // parse nodes in FBXTree.Objects.AnimationLayer. Each layers holds references
  // to various AnimationCurveNodes and is referenced by an AnimationStack node
  // note: theoretically a stack can have multiple layers, however in practice there always seems to be one per stack
  parseAnimationLayers(e) {
    const t = A.Objects.AnimationLayer, n = /* @__PURE__ */ new Map();
    for (const s in t) {
      const r = [], i = I.get(parseInt(s));
      i !== void 0 && (i.children.forEach(function(c, l) {
        if (e.has(c.ID)) {
          const f = e.get(c.ID);
          if (f.curves.x !== void 0 || f.curves.y !== void 0 || f.curves.z !== void 0) {
            if (r[l] === void 0) {
              const u = I.get(c.ID).parents.filter(function(h) {
                return h.relationship !== void 0;
              })[0].ID;
              if (u !== void 0) {
                const h = A.Objects.Model[u.toString()];
                if (h === void 0) {
                  console.warn("THREE.FBXLoader: Encountered a unused curve.", c);
                  return;
                }
                const p = {
                  modelName: h.attrName ? De.sanitizeNodeName(h.attrName) : "",
                  ID: h.id,
                  initialPosition: [0, 0, 0],
                  initialRotation: [0, 0, 0],
                  initialScale: [1, 1, 1]
                };
                O.traverse(function(d) {
                  d.ID === h.id && (p.transform = d.matrix, d.userData.transformData && (p.eulerOrder = d.userData.transformData.eulerOrder));
                }), p.transform || (p.transform = new M()), "PreRotation" in h && (p.preRotation = h.PreRotation.value), "PostRotation" in h && (p.postRotation = h.PostRotation.value), r[l] = p;
              }
            }
            r[l] && (r[l][f.attr] = f);
          } else if (f.curves.morph !== void 0) {
            if (r[l] === void 0) {
              const u = I.get(c.ID).parents.filter(function(y) {
                return y.relationship !== void 0;
              })[0].ID, h = I.get(u).parents[0].ID, p = I.get(h).parents[0].ID, d = I.get(p).parents[0].ID, g = A.Objects.Model[d], m = {
                modelName: g.attrName ? De.sanitizeNodeName(g.attrName) : "",
                morphName: A.Objects.Deformer[u].attrName
              };
              r[l] = m;
            }
            r[l][f.attr] = f;
          }
        }
      }), n.set(parseInt(s), r));
    }
    return n;
  }
  // parse nodes in FBXTree.Objects.AnimationStack. These are the top level node in the animation
  // hierarchy. Each Stack node will be used to create an AnimationClip
  parseAnimStacks(e) {
    const t = A.Objects.AnimationStack, n = {};
    for (const s in t) {
      const r = I.get(parseInt(s)).children;
      r.length > 1 && console.warn("THREE.FBXLoader: Encountered an animation stack with multiple layers, this is currently not supported. Ignoring subsequent layers.");
      const i = e.get(r[0].ID);
      n[s] = {
        name: t[s].attrName,
        layer: i
      };
    }
    return n;
  }
  addClip(e) {
    let t = [];
    const n = this;
    return e.layer.forEach(function(s) {
      t = t.concat(n.generateTracks(s));
    }), new Sn(e.name, -1, t);
  }
  generateTracks(e) {
    const t = [];
    let n = new L(), s = new L();
    if (e.transform && e.transform.decompose(n, new H(), s), n = n.toArray(), s = s.toArray(), e.T !== void 0 && Object.keys(e.T.curves).length > 0) {
      const r = this.generateVectorTrack(e.modelName, e.T.curves, n, "position");
      r !== void 0 && t.push(r);
    }
    if (e.R !== void 0 && Object.keys(e.R.curves).length > 0) {
      const r = this.generateRotationTrack(e.modelName, e.R.curves, e.preRotation, e.postRotation, e.eulerOrder);
      r !== void 0 && t.push(r);
    }
    if (e.S !== void 0 && Object.keys(e.S.curves).length > 0) {
      const r = this.generateVectorTrack(e.modelName, e.S.curves, s, "scale");
      r !== void 0 && t.push(r);
    }
    if (e.DeformPercent !== void 0) {
      const r = this.generateMorphTrack(e);
      r !== void 0 && t.push(r);
    }
    return t;
  }
  generateVectorTrack(e, t, n, s) {
    const r = this.getTimesForAllAxes(t), i = this.getKeyframeTrackValues(r, t, n);
    return new yt(e + "." + s, r, i);
  }
  generateRotationTrack(e, t, n, s, r) {
    let i, a;
    if (t.x !== void 0 && t.y !== void 0 && t.z !== void 0) {
      const h = this.interpolateRotations(t.x, t.y, t.z, r);
      i = h[0], a = h[1];
    }
    const c = ke(0);
    n !== void 0 && (n = n.map(k.degToRad), n.push(c), n = new se().fromArray(n), n = new H().setFromEuler(n)), s !== void 0 && (s = s.map(k.degToRad), s.push(c), s = new se().fromArray(s), s = new H().setFromEuler(s).invert());
    const l = new H(), f = new se(), u = [];
    if (!a || !i) return new ze(e + ".quaternion", [0], [0]);
    for (let h = 0; h < a.length; h += 3)
      f.set(a[h], a[h + 1], a[h + 2], r), l.setFromEuler(f), n !== void 0 && l.premultiply(n), s !== void 0 && l.multiply(s), h > 2 && new H().fromArray(
        u,
        (h - 3) / 3 * 4
      ).dot(l) < 0 && l.set(-l.x, -l.y, -l.z, -l.w), l.toArray(u, h / 3 * 4);
    return new ze(e + ".quaternion", i, u);
  }
  generateMorphTrack(e) {
    const t = e.DeformPercent.curves.morph, n = t.values.map(function(r) {
      return r / 100;
    }), s = O.getObjectByName(e.modelName).morphTargetDictionary[e.morphName];
    return new vt(e.modelName + ".morphTargetInfluences[" + s + "]", t.times, n);
  }
  // For all animated objects, times are defined separately for each axis
  // Here we'll combine the times into one sorted array without duplicates
  getTimesForAllAxes(e) {
    let t = [];
    if (e.x !== void 0 && (t = t.concat(e.x.times)), e.y !== void 0 && (t = t.concat(e.y.times)), e.z !== void 0 && (t = t.concat(e.z.times)), t = t.sort(function(n, s) {
      return n - s;
    }), t.length > 1) {
      let n = 1, s = t[0];
      for (let r = 1; r < t.length; r++) {
        const i = t[r];
        i !== s && (t[n] = i, s = i, n++);
      }
      t = t.slice(0, n);
    }
    return t;
  }
  getKeyframeTrackValues(e, t, n) {
    const s = n, r = [];
    let i = -1, a = -1, c = -1;
    return e.forEach(function(l) {
      if (t.x && (i = t.x.times.indexOf(l)), t.y && (a = t.y.times.indexOf(l)), t.z && (c = t.z.times.indexOf(l)), i !== -1) {
        const f = t.x.values[i];
        r.push(f), s[0] = f;
      } else
        r.push(s[0]);
      if (a !== -1) {
        const f = t.y.values[a];
        r.push(f), s[1] = f;
      } else
        r.push(s[1]);
      if (c !== -1) {
        const f = t.z.values[c];
        r.push(f), s[2] = f;
      } else
        r.push(s[2]);
    }), r;
  }
  // Rotations are defined as Euler angles which can have values  of any size
  // These will be converted to quaternions which don't support values greater than
  // PI, so we'll interpolate large rotations
  interpolateRotations(e, t, n, s) {
    const r = [], i = [];
    r.push(e.times[0]), i.push(k.degToRad(e.values[0])), i.push(k.degToRad(t.values[0])), i.push(k.degToRad(n.values[0]));
    for (let a = 1; a < e.values.length; a++) {
      const c = [
        e.values[a - 1],
        t.values[a - 1],
        n.values[a - 1]
      ];
      if (isNaN(c[0]) || isNaN(c[1]) || isNaN(c[2]))
        continue;
      const l = c.map(k.degToRad), f = [
        e.values[a],
        t.values[a],
        n.values[a]
      ];
      if (isNaN(f[0]) || isNaN(f[1]) || isNaN(f[2]))
        continue;
      const u = f.map(k.degToRad), h = [
        f[0] - c[0],
        f[1] - c[1],
        f[2] - c[2]
      ], p = [
        Math.abs(h[0]),
        Math.abs(h[1]),
        Math.abs(h[2])
      ];
      if (p[0] >= 180 || p[1] >= 180 || p[2] >= 180) {
        const g = Math.max(...p) / 180, m = new se(...l, s), y = new se(...u, s), T = new H().setFromEuler(m), v = new H().setFromEuler(y);
        T.dot(v) && v.set(-v.x, -v.y, -v.z, -v.w);
        const x = e.times[a - 1], w = e.times[a] - x, E = new H(), S = new se();
        for (let C = 0; C < 1; C += 1 / g)
          E.copy(T.clone().slerp(v.clone(), C)), r.push(x + C * w), S.setFromQuaternion(E, s), i.push(S.x), i.push(S.y), i.push(S.z);
      } else
        r.push(e.times[a]), i.push(k.degToRad(e.values[a])), i.push(k.degToRad(t.values[a])), i.push(k.degToRad(n.values[a]));
    }
    return [r, i];
  }
}
class ii {
  getPrevNode() {
    return this.nodeStack[this.currentIndent - 2];
  }
  getCurrentNode() {
    return this.nodeStack[this.currentIndent - 1];
  }
  getCurrentProp() {
    return this.currentProp;
  }
  pushStack(e) {
    this.nodeStack.push(e), this.currentIndent += 1;
  }
  popStack() {
    this.nodeStack.pop(), this.currentIndent -= 1;
  }
  setCurrentProp(e, t) {
    this.currentProp = e, this.currentPropName = t;
  }
  parse(e) {
    this.currentIndent = 0, this.allNodes = new $n(), this.nodeStack = [], this.currentProp = [], this.currentPropName = "";
    const t = this, n = e.split(/[\r\n]+/);
    return n.forEach(function(s, r) {
      const i = s.match(/^[\s\t]*;/), a = s.match(/^[\s\t]*$/);
      if (i || a) return;
      const c = s.match("^\\t{" + t.currentIndent + "}(\\w+):(.*){", ""), l = s.match("^\\t{" + t.currentIndent + "}(\\w+):[\\s\\t\\r\\n](.*)"), f = s.match("^\\t{" + (t.currentIndent - 1) + "}}");
      c ? t.parseNodeBegin(s, c) : l ? t.parseNodeProperty(s, l, n[++r]) : f ? t.popStack() : s.match(/^[^\s\t}]/) && t.parseNodePropertyContinued(s);
    }), this.allNodes;
  }
  parseNodeBegin(e, t) {
    const n = t[1].trim().replace(/^"/, "").replace(/"$/, ""), s = t[2].split(",").map(function(c) {
      return c.trim().replace(/^"/, "").replace(/"$/, "");
    }), r = { name: n }, i = this.parseNodeAttr(s), a = this.getCurrentNode();
    this.currentIndent === 0 ? this.allNodes.add(n, r) : n in a ? (n === "PoseNode" ? a.PoseNode.push(r) : a[n].id !== void 0 && (a[n] = {}, a[n][a[n].id] = a[n]), i.id !== "" && (a[n][i.id] = r)) : typeof i.id == "number" ? (a[n] = {}, a[n][i.id] = r) : n !== "Properties70" && (n === "PoseNode" ? a[n] = [r] : a[n] = r), typeof i.id == "number" && (r.id = i.id), i.name !== "" && (r.attrName = i.name), i.type !== "" && (r.attrType = i.type), this.pushStack(r);
  }
  parseNodeAttr(e) {
    let t = e[0];
    e[0] !== "" && (t = parseInt(e[0]), isNaN(t) && (t = e[0]));
    let n = "", s = "";
    return e.length > 1 && (n = e[1].replace(/^(\w+)::/, ""), s = e[2]), { id: t, name: n, type: s };
  }
  parseNodeProperty(e, t, n) {
    let s = t[1].replace(/^"/, "").replace(/"$/, "").trim(), r = t[2].replace(/^"/, "").replace(/"$/, "").trim();
    s === "Content" && r === "," && (r = n.replace(/"/g, "").replace(/,$/, "").trim());
    const i = this.getCurrentNode();
    if (i.name === "Properties70") {
      this.parseNodeSpecialProperty(e, s, r);
      return;
    }
    if (s === "C") {
      const c = r.split(",").slice(1), l = parseInt(c[0]), f = parseInt(c[1]);
      let u = r.split(",").slice(3);
      u = u.map(function(h) {
        return h.trim().replace(/^"/, "");
      }), s = "connections", r = [l, f], fi(r, u), i[s] === void 0 && (i[s] = []);
    }
    s === "Node" && (i.id = r), s in i && Array.isArray(i[s]) ? i[s].push(r) : s !== "a" ? i[s] = r : i.a = r, this.setCurrentProp(i, s), s === "a" && r.slice(-1) !== "," && (i.a = ct(r));
  }
  parseNodePropertyContinued(e) {
    const t = this.getCurrentNode();
    t.a += e, e.slice(-1) !== "," && (t.a = ct(t.a));
  }
  // parse "Property70"
  parseNodeSpecialProperty(e, t, n) {
    const s = n.split('",').map(function(f) {
      return f.trim().replace(/^\"/, "").replace(/\s/, "_");
    }), r = s[0], i = s[1], a = s[2], c = s[3];
    let l = s[4];
    switch (i) {
      case "int":
      case "enum":
      case "bool":
      case "ULongLong":
      case "double":
      case "Number":
      case "FieldOfView":
        l = parseFloat(l);
        break;
      case "Color":
      case "ColorRGB":
      case "Vector3D":
      case "Lcl_Translation":
      case "Lcl_Rotation":
      case "Lcl_Scaling":
        l = ct(l);
        break;
    }
    this.getPrevNode()[r] = {
      type: i,
      type2: a,
      flag: c,
      value: l
    }, this.setCurrentProp(this.getPrevNode(), r);
  }
}
class oi {
  parse(e) {
    const t = new ln(e);
    t.skip(23);
    const n = t.getUint32();
    if (n < 6400)
      throw new Error("THREE.FBXLoader: FBX version not supported, FileVersion: " + n);
    const s = new $n();
    for (; !this.endOfContent(t); ) {
      const r = this.parseNode(t, n);
      r !== null && s.add(r.name, r);
    }
    return s;
  }
  // Check if reader has reached the end of content.
  endOfContent(e) {
    return e.size() % 16 === 0 ? (e.getOffset() + 160 + 16 & -16) >= e.size() : e.getOffset() + 160 + 16 >= e.size();
  }
  // recursively parse nodes until the end of the file is reached
  parseNode(e, t) {
    const n = {}, s = t >= 7500 ? e.getUint64() : e.getUint32(), r = t >= 7500 ? e.getUint64() : e.getUint32();
    t >= 7500 ? e.getUint64() : e.getUint32();
    const i = e.getUint8(), a = e.getString(i);
    if (s === 0) return null;
    const c = [];
    for (let h = 0; h < r; h++)
      c.push(this.parseProperty(e));
    const l = c.length > 0 ? c[0] : "", f = c.length > 1 ? c[1] : "", u = c.length > 2 ? c[2] : "";
    for (n.singleProperty = r === 1 && e.getOffset() === s; s > e.getOffset(); ) {
      const h = this.parseNode(e, t);
      h !== null && this.parseSubNode(a, n, h);
    }
    return n.propertyList = c, typeof l == "number" && (n.id = l), f !== "" && (n.attrName = f), u !== "" && (n.attrType = u), a !== "" && (n.name = a), n;
  }
  parseSubNode(e, t, n) {
    if (n.singleProperty === !0) {
      const s = n.propertyList[0];
      Array.isArray(s) ? (t[n.name] = n, n.a = s) : t[n.name] = s;
    } else if (e === "Connections" && n.name === "C") {
      const s = [];
      n.propertyList.forEach(function(r, i) {
        i !== 0 && s.push(r);
      }), t.connections === void 0 && (t.connections = []), t.connections.push(s);
    } else if (n.name === "Properties70")
      Object.keys(n).forEach(function(r) {
        t[r] = n[r];
      });
    else if (e === "Properties70" && n.name === "P") {
      let s = n.propertyList[0], r = n.propertyList[1];
      const i = n.propertyList[2], a = n.propertyList[3];
      let c;
      s.indexOf("Lcl ") === 0 && (s = s.replace("Lcl ", "Lcl_")), r.indexOf("Lcl ") === 0 && (r = r.replace("Lcl ", "Lcl_")), r === "Color" || r === "ColorRGB" || r === "Vector" || r === "Vector3D" || r.indexOf("Lcl_") === 0 ? c = [
        n.propertyList[4],
        n.propertyList[5],
        n.propertyList[6]
      ] : c = n.propertyList[4], t[s] = {
        type: r,
        type2: i,
        flag: a,
        value: c
      };
    } else t[n.name] === void 0 ? typeof n.id == "number" ? (t[n.name] = {}, t[n.name][n.id] = n) : t[n.name] = n : n.name === "PoseNode" ? (Array.isArray(t[n.name]) || (t[n.name] = [t[n.name]]), t[n.name].push(n)) : t[n.name][n.id] === void 0 && (t[n.name][n.id] = n);
  }
  parseProperty(e) {
    const t = e.getString(1);
    let n;
    switch (t) {
      case "C":
        return e.getBoolean();
      case "D":
        return e.getFloat64();
      case "F":
        return e.getFloat32();
      case "I":
        return e.getInt32();
      case "L":
        return e.getInt64();
      case "R":
        return n = e.getUint32(), e.getArrayBuffer(n);
      case "S":
        return n = e.getUint32(), e.getString(n);
      case "Y":
        return e.getInt16();
      case "b":
      case "c":
      case "d":
      case "f":
      case "i":
      case "l":
        const s = e.getUint32(), r = e.getUint32(), i = e.getUint32();
        if (r === 0)
          switch (t) {
            case "b":
            case "c":
              return e.getBooleanArray(s);
            case "d":
              return e.getFloat64Array(s);
            case "f":
              return e.getFloat32Array(s);
            case "i":
              return e.getInt32Array(s);
            case "l":
              return e.getInt64Array(s);
          }
        const a = Kr(new Uint8Array(e.getArrayBuffer(i))), c = new ln(a.buffer);
        switch (t) {
          case "b":
          case "c":
            return c.getBooleanArray(s);
          case "d":
            return c.getFloat64Array(s);
          case "f":
            return c.getFloat32Array(s);
          case "i":
            return c.getInt32Array(s);
          case "l":
            return c.getInt64Array(s);
        }
        break;
      // cannot happen but is required by the DeepScan
      default:
        throw new Error("THREE.FBXLoader: Unknown property type " + t);
    }
  }
}
class ln {
  constructor(e, t) {
    this.dv = new DataView(e), this.offset = 0, this.littleEndian = t !== void 0 ? t : !0, this._textDecoder = new TextDecoder();
  }
  getOffset() {
    return this.offset;
  }
  size() {
    return this.dv.buffer.byteLength;
  }
  skip(e) {
    this.offset += e;
  }
  // seems like true/false representation depends on exporter.
  // true: 1 or 'Y'(=0x59), false: 0 or 'T'(=0x54)
  // then sees LSB.
  getBoolean() {
    return (this.getUint8() & 1) === 1;
  }
  getBooleanArray(e) {
    const t = [];
    for (let n = 0; n < e; n++)
      t.push(this.getBoolean());
    return t;
  }
  getUint8() {
    const e = this.dv.getUint8(this.offset);
    return this.offset += 1, e;
  }
  getInt16() {
    const e = this.dv.getInt16(this.offset, this.littleEndian);
    return this.offset += 2, e;
  }
  getInt32() {
    const e = this.dv.getInt32(this.offset, this.littleEndian);
    return this.offset += 4, e;
  }
  getInt32Array(e) {
    const t = [];
    for (let n = 0; n < e; n++)
      t.push(this.getInt32());
    return t;
  }
  getUint32() {
    const e = this.dv.getUint32(this.offset, this.littleEndian);
    return this.offset += 4, e;
  }
  // JavaScript doesn't support 64-bit integer so calculate this here
  // 1 << 32 will return 1 so using multiply operation instead here.
  // There's a possibility that this method returns wrong value if the value
  // is out of the range between Number.MAX_SAFE_INTEGER and Number.MIN_SAFE_INTEGER.
  // TODO: safely handle 64-bit integer
  getInt64() {
    let e, t;
    return this.littleEndian ? (e = this.getUint32(), t = this.getUint32()) : (t = this.getUint32(), e = this.getUint32()), t & 2147483648 ? (t = ~t & 4294967295, e = ~e & 4294967295, e === 4294967295 && (t = t + 1 & 4294967295), e = e + 1 & 4294967295, -(t * 4294967296 + e)) : t * 4294967296 + e;
  }
  getInt64Array(e) {
    const t = [];
    for (let n = 0; n < e; n++)
      t.push(this.getInt64());
    return t;
  }
  // Note: see getInt64() comment
  getUint64() {
    let e, t;
    return this.littleEndian ? (e = this.getUint32(), t = this.getUint32()) : (t = this.getUint32(), e = this.getUint32()), t * 4294967296 + e;
  }
  getFloat32() {
    const e = this.dv.getFloat32(this.offset, this.littleEndian);
    return this.offset += 4, e;
  }
  getFloat32Array(e) {
    const t = [];
    for (let n = 0; n < e; n++)
      t.push(this.getFloat32());
    return t;
  }
  getFloat64() {
    const e = this.dv.getFloat64(this.offset, this.littleEndian);
    return this.offset += 8, e;
  }
  getFloat64Array(e) {
    const t = [];
    for (let n = 0; n < e; n++)
      t.push(this.getFloat64());
    return t;
  }
  getArrayBuffer(e) {
    const t = this.dv.buffer.slice(this.offset, this.offset + e);
    return this.offset += e, t;
  }
  getString(e) {
    const t = this.offset;
    let n = new Uint8Array(this.dv.buffer, t, e);
    this.skip(e);
    const s = n.indexOf(0);
    return s >= 0 && (n = new Uint8Array(this.dv.buffer, t, s)), this._textDecoder.decode(n);
  }
}
class $n {
  add(e, t) {
    this[e] = t;
  }
}
function ai(o) {
  const e = "Kaydara FBX Binary  \0";
  return o.byteLength >= e.length && e === qn(o, 0, e.length);
}
function ci(o) {
  const e = ["K", "a", "y", "d", "a", "r", "a", "\\", "F", "B", "X", "\\", "B", "i", "n", "a", "r", "y", "\\", "\\"];
  let t = 0;
  function n(s) {
    const r = o[s - 1];
    return o = o.slice(t + s), t++, r;
  }
  for (let s = 0; s < e.length; ++s)
    if (n(1) === e[s])
      return !1;
  return !0;
}
function un(o) {
  const e = /FBXVersion: (\d+)/, t = o.match(e);
  if (t)
    return parseInt(t[1]);
  throw new Error("THREE.FBXLoader: Cannot find the version number for the file given.");
}
function li(o) {
  return o / 46186158e3;
}
const ui = [];
function Ue(o, e, t, n) {
  let s;
  switch (n.mappingType) {
    case "ByPolygonVertex":
      s = o;
      break;
    case "ByPolygon":
      s = e;
      break;
    case "ByVertice":
      s = t;
      break;
    case "AllSame":
      s = n.indices[0];
      break;
    default:
      console.warn("THREE.FBXLoader: unknown attribute mapping type " + n.mappingType);
  }
  n.referenceType === "IndexToDirect" && (s = n.indices[s]);
  const r = s * n.dataSize, i = r + n.dataSize;
  return hi(ui, n.buffer, r, i);
}
const at = new se(), he = new L();
function Wn(o) {
  const e = new M(), t = new M(), n = new M(), s = new M(), r = new M(), i = new M(), a = new M(), c = new M(), l = new M(), f = new M(), u = new M(), h = new M(), p = o.inheritType ? o.inheritType : 0;
  o.translation && e.setPosition(he.fromArray(o.translation));
  const d = ke(0);
  if (o.preRotation) {
    const R = o.preRotation.map(k.degToRad);
    R.push(d), t.makeRotationFromEuler(at.fromArray(R));
  }
  if (o.rotation) {
    const R = o.rotation.map(k.degToRad);
    R.push(o.eulerOrder || d), n.makeRotationFromEuler(at.fromArray(R));
  }
  if (o.postRotation) {
    const R = o.postRotation.map(k.degToRad);
    R.push(d), s.makeRotationFromEuler(at.fromArray(R)), s.invert();
  }
  o.scale && r.scale(he.fromArray(o.scale)), o.scalingOffset && a.setPosition(he.fromArray(o.scalingOffset)), o.scalingPivot && i.setPosition(he.fromArray(o.scalingPivot)), o.rotationOffset && c.setPosition(he.fromArray(o.rotationOffset)), o.rotationPivot && l.setPosition(he.fromArray(o.rotationPivot)), o.parentMatrixWorld && (u.copy(o.parentMatrix), f.copy(o.parentMatrixWorld));
  const g = t.clone().multiply(n).multiply(s), m = new M();
  m.extractRotation(f);
  const y = new M();
  y.copyPosition(f);
  const T = y.clone().invert().multiply(f), v = m.clone().invert().multiply(T), x = r, w = new M();
  if (p === 0)
    w.copy(m).multiply(g).multiply(v).multiply(x);
  else if (p === 1)
    w.copy(m).multiply(v).multiply(g).multiply(x);
  else {
    const ce = new M().scale(new L().setFromMatrixScale(u)).clone().invert(), Ze = v.clone().multiply(ce);
    w.copy(m).multiply(g).multiply(Ze).multiply(x);
  }
  const E = l.clone().invert(), S = i.clone().invert();
  let C = e.clone().multiply(c).multiply(l).multiply(t).multiply(n).multiply(s).multiply(E).multiply(a).multiply(i).multiply(r).multiply(S);
  const P = new M().copyPosition(C), B = f.clone().multiply(P);
  return h.copyPosition(B), C = h.clone().multiply(w), C.premultiply(f.invert()), C;
}
function ke(o) {
  o = o || 0;
  const e = [
    "ZYX",
    // -> XYZ extrinsic
    "YZX",
    // -> XZY extrinsic
    "XZY",
    // -> YZX extrinsic
    "ZXY",
    // -> YXZ extrinsic
    "YXZ",
    // -> ZXY extrinsic
    "XYZ"
    // -> ZYX extrinsic
    //'SphericXYZ', // not possible to support
  ];
  return o === 6 ? (console.warn("THREE.FBXLoader: unsupported Euler Order: Spherical XYZ. Animations and rotations may be incorrect."), e[0]) : e[o];
}
function ct(o) {
  return o.split(",").map(function(t) {
    return parseFloat(t);
  });
}
function qn(o, e, t) {
  return e === void 0 && (e = 0), t === void 0 && (t = o.byteLength), new TextDecoder().decode(new Uint8Array(o, e, t));
}
function fi(o, e) {
  for (let t = 0, n = o.length, s = e.length; t < s; t++, n++)
    o[n] = e[t];
}
function hi(o, e, t, n) {
  for (let s = t, r = 0; s < n; s++, r++)
    o[r] = e[s];
  return o;
}
function fn(o, e) {
  if (e === ps)
    return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."), o;
  if (e === Tt || e === Rn) {
    let t = o.getIndex();
    if (t === null) {
      const i = [], a = o.getAttribute("position");
      if (a !== void 0) {
        for (let c = 0; c < a.count; c++)
          i.push(c);
        o.setIndex(i), t = o.getIndex();
      } else
        return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."), o;
    }
    const n = t.count - 2, s = [];
    if (e === Tt)
      for (let i = 1; i <= n; i++)
        s.push(t.getX(0)), s.push(t.getX(i)), s.push(t.getX(i + 1));
    else
      for (let i = 0; i < n; i++)
        i % 2 === 0 ? (s.push(t.getX(i)), s.push(t.getX(i + 1)), s.push(t.getX(i + 2))) : (s.push(t.getX(i + 2)), s.push(t.getX(i + 1)), s.push(t.getX(i)));
    s.length / 3 !== n && console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");
    const r = o.clone();
    return r.setIndex(s), r.clearGroups(), r;
  } else
    return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:", e), o;
}
class pi extends He {
  /**
   * Constructs a new glTF loader.
   *
   * @param {LoadingManager} [manager] - The loading manager.
   */
  constructor(e) {
    super(e), this.dracoLoader = null, this.ktx2Loader = null, this.meshoptDecoder = null, this.pluginCallbacks = [], this.register(function(t) {
      return new vi(t);
    }), this.register(function(t) {
      return new Ti(t);
    }), this.register(function(t) {
      return new _i(t);
    }), this.register(function(t) {
      return new Ci(t);
    }), this.register(function(t) {
      return new Ii(t);
    }), this.register(function(t) {
      return new xi(t);
    }), this.register(function(t) {
      return new Ei(t);
    }), this.register(function(t) {
      return new Ai(t);
    }), this.register(function(t) {
      return new bi(t);
    }), this.register(function(t) {
      return new yi(t);
    }), this.register(function(t) {
      return new Si(t);
    }), this.register(function(t) {
      return new wi(t);
    }), this.register(function(t) {
      return new Mi(t);
    }), this.register(function(t) {
      return new Ri(t);
    }), this.register(function(t) {
      return new mi(t);
    }), this.register(function(t) {
      return new Li(t);
    }), this.register(function(t) {
      return new Fi(t);
    });
  }
  /**
   * Starts loading from the given URL and passes the loaded glTF asset
   * to the `onLoad()` callback.
   *
   * @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
   * @param {function(GLTFLoader~LoadObject)} onLoad - Executed when the loading process has been finished.
   * @param {onProgressCallback} onProgress - Executed while the loading is in progress.
   * @param {onErrorCallback} onError - Executed when errors occur.
   */
  load(e, t, n, s) {
    const r = this;
    let i;
    if (this.resourcePath !== "")
      i = this.resourcePath;
    else if (this.path !== "") {
      const l = ge.extractUrlBase(e);
      i = ge.resolveURL(l, this.path);
    } else
      i = ge.extractUrlBase(e);
    this.manager.itemStart(e);
    const a = function(l) {
      s ? s(l) : console.error(l), r.manager.itemError(e), r.manager.itemEnd(e);
    }, c = new Ft(this.manager);
    c.setPath(this.path), c.setResponseType("arraybuffer"), c.setRequestHeader(this.requestHeader), c.setWithCredentials(this.withCredentials), c.load(e, function(l) {
      try {
        r.parse(l, i, function(f) {
          t(f), r.manager.itemEnd(e);
        }, a);
      } catch (f) {
        a(f);
      }
    }, n, a);
  }
  /**
   * Sets the given Draco loader to this loader. Required for decoding assets
   * compressed with the `KHR_draco_mesh_compression` extension.
   *
   * @param {DRACOLoader} dracoLoader - The Draco loader to set.
   * @return {GLTFLoader} A reference to this loader.
   */
  setDRACOLoader(e) {
    return this.dracoLoader = e, this;
  }
  /**
   * Sets the given KTX2 loader to this loader. Required for loading KTX2
   * compressed textures.
   *
   * @param {KTX2Loader} ktx2Loader - The KTX2 loader to set.
   * @return {GLTFLoader} A reference to this loader.
   */
  setKTX2Loader(e) {
    return this.ktx2Loader = e, this;
  }
  /**
   * Sets the given meshopt decoder. Required for decoding assets
   * compressed with the `EXT_meshopt_compression` extension.
   *
   * @param {Object} meshoptDecoder - The meshopt decoder to set.
   * @return {GLTFLoader} A reference to this loader.
   */
  setMeshoptDecoder(e) {
    return this.meshoptDecoder = e, this;
  }
  /**
   * Registers a plugin callback. This API is internally used to implement the various
   * glTF extensions but can also used by third-party code to add additional logic
   * to the loader.
   *
   * @param {function(parser:GLTFParser)} callback - The callback function to register.
   * @return {GLTFLoader} A reference to this loader.
   */
  register(e) {
    return this.pluginCallbacks.indexOf(e) === -1 && this.pluginCallbacks.push(e), this;
  }
  /**
   * Unregisters a plugin callback.
   *
   * @param {Function} callback - The callback function to unregister.
   * @return {GLTFLoader} A reference to this loader.
   */
  unregister(e) {
    return this.pluginCallbacks.indexOf(e) !== -1 && this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e), 1), this;
  }
  /**
   * Parses the given FBX data and returns the resulting group.
   *
   * @param {string|ArrayBuffer} data - The raw glTF data.
   * @param {string} path - The URL base path.
   * @param {function(GLTFLoader~LoadObject)} onLoad - Executed when the loading process has been finished.
   * @param {onErrorCallback} onError - Executed when errors occur.
   */
  parse(e, t, n, s) {
    let r;
    const i = {}, a = {}, c = new TextDecoder();
    if (typeof e == "string")
      r = JSON.parse(e);
    else if (e instanceof ArrayBuffer)
      if (c.decode(new Uint8Array(e, 0, 4)) === Yn) {
        try {
          i[b.KHR_BINARY_GLTF] = new Di(e);
        } catch (u) {
          s && s(u);
          return;
        }
        r = JSON.parse(i[b.KHR_BINARY_GLTF].content);
      } else
        r = JSON.parse(c.decode(e));
    else
      r = e;
    if (r.asset === void 0 || r.asset.version[0] < 2) {
      s && s(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));
      return;
    }
    const l = new Xi(r, {
      path: t || this.resourcePath || "",
      crossOrigin: this.crossOrigin,
      requestHeader: this.requestHeader,
      manager: this.manager,
      ktx2Loader: this.ktx2Loader,
      meshoptDecoder: this.meshoptDecoder
    });
    l.fileLoader.setRequestHeader(this.requestHeader);
    for (let f = 0; f < this.pluginCallbacks.length; f++) {
      const u = this.pluginCallbacks[f](l);
      u.name || console.error("THREE.GLTFLoader: Invalid plugin found: missing name"), a[u.name] = u, i[u.name] = !0;
    }
    if (r.extensionsUsed)
      for (let f = 0; f < r.extensionsUsed.length; ++f) {
        const u = r.extensionsUsed[f], h = r.extensionsRequired || [];
        switch (u) {
          case b.KHR_MATERIALS_UNLIT:
            i[u] = new gi();
            break;
          case b.KHR_DRACO_MESH_COMPRESSION:
            i[u] = new Pi(r, this.dracoLoader);
            break;
          case b.KHR_TEXTURE_TRANSFORM:
            i[u] = new ki();
            break;
          case b.KHR_MESH_QUANTIZATION:
            i[u] = new Oi();
            break;
          default:
            h.indexOf(u) >= 0 && a[u] === void 0 && console.warn('THREE.GLTFLoader: Unknown extension "' + u + '".');
        }
      }
    l.setExtensions(i), l.setPlugins(a), l.parse(n, s);
  }
  /**
   * Async version of {@link GLTFLoader#parse}.
   *
   * @async
   * @param {string|ArrayBuffer} data - The raw glTF data.
   * @param {string} path - The URL base path.
   * @return {Promise<GLTFLoader~LoadObject>} A Promise that resolves with the loaded glTF when the parsing has been finished.
   */
  parseAsync(e, t) {
    const n = this;
    return new Promise(function(s, r) {
      n.parse(e, t, s, r);
    });
  }
}
function di() {
  let o = {};
  return {
    get: function(e) {
      return o[e];
    },
    add: function(e, t) {
      o[e] = t;
    },
    remove: function(e) {
      delete o[e];
    },
    removeAll: function() {
      o = {};
    }
  };
}
const b = {
  KHR_BINARY_GLTF: "KHR_binary_glTF",
  KHR_DRACO_MESH_COMPRESSION: "KHR_draco_mesh_compression",
  KHR_LIGHTS_PUNCTUAL: "KHR_lights_punctual",
  KHR_MATERIALS_CLEARCOAT: "KHR_materials_clearcoat",
  KHR_MATERIALS_DISPERSION: "KHR_materials_dispersion",
  KHR_MATERIALS_IOR: "KHR_materials_ior",
  KHR_MATERIALS_SHEEN: "KHR_materials_sheen",
  KHR_MATERIALS_SPECULAR: "KHR_materials_specular",
  KHR_MATERIALS_TRANSMISSION: "KHR_materials_transmission",
  KHR_MATERIALS_IRIDESCENCE: "KHR_materials_iridescence",
  KHR_MATERIALS_ANISOTROPY: "KHR_materials_anisotropy",
  KHR_MATERIALS_UNLIT: "KHR_materials_unlit",
  KHR_MATERIALS_VOLUME: "KHR_materials_volume",
  KHR_TEXTURE_BASISU: "KHR_texture_basisu",
  KHR_TEXTURE_TRANSFORM: "KHR_texture_transform",
  KHR_MESH_QUANTIZATION: "KHR_mesh_quantization",
  KHR_MATERIALS_EMISSIVE_STRENGTH: "KHR_materials_emissive_strength",
  EXT_MATERIALS_BUMP: "EXT_materials_bump",
  EXT_TEXTURE_WEBP: "EXT_texture_webp",
  EXT_TEXTURE_AVIF: "EXT_texture_avif",
  EXT_MESHOPT_COMPRESSION: "EXT_meshopt_compression",
  EXT_MESH_GPU_INSTANCING: "EXT_mesh_gpu_instancing"
};
class mi {
  constructor(e) {
    this.parser = e, this.name = b.KHR_LIGHTS_PUNCTUAL, this.cache = { refs: {}, uses: {} };
  }
  _markDefs() {
    const e = this.parser, t = this.parser.json.nodes || [];
    for (let n = 0, s = t.length; n < s; n++) {
      const r = t[n];
      r.extensions && r.extensions[this.name] && r.extensions[this.name].light !== void 0 && e._addNodeRef(this.cache, r.extensions[this.name].light);
    }
  }
  _loadLight(e) {
    const t = this.parser, n = "light:" + e;
    let s = t.cache.get(n);
    if (s) return s;
    const r = t.json, c = ((r.extensions && r.extensions[this.name] || {}).lights || [])[e];
    let l;
    const f = new F(16777215);
    c.color !== void 0 && f.setRGB(c.color[0], c.color[1], c.color[2], Q);
    const u = c.range !== void 0 ? c.range : 0;
    switch (c.type) {
      case "directional":
        l = new xn(f), l.target.position.set(0, 0, -1), l.add(l.target);
        break;
      case "point":
        l = new gt(f), l.distance = u;
        break;
      case "spot":
        l = new wn(f), l.distance = u, c.spot = c.spot || {}, c.spot.innerConeAngle = c.spot.innerConeAngle !== void 0 ? c.spot.innerConeAngle : 0, c.spot.outerConeAngle = c.spot.outerConeAngle !== void 0 ? c.spot.outerConeAngle : Math.PI / 4, l.angle = c.spot.outerConeAngle, l.penumbra = 1 - c.spot.innerConeAngle / c.spot.outerConeAngle, l.target.position.set(0, 0, -1), l.add(l.target);
        break;
      default:
        throw new Error("THREE.GLTFLoader: Unexpected light type: " + c.type);
    }
    return l.position.set(0, 0, 0), V(l, c), c.intensity !== void 0 && (l.intensity = c.intensity), l.name = t.createUniqueName(c.name || "light_" + e), s = Promise.resolve(l), t.cache.add(n, s), s;
  }
  getDependency(e, t) {
    if (e === "light")
      return this._loadLight(t);
  }
  createNodeAttachment(e) {
    const t = this, n = this.parser, r = n.json.nodes[e], a = (r.extensions && r.extensions[this.name] || {}).light;
    return a === void 0 ? null : this._loadLight(a).then(function(c) {
      return n._getNodeRef(t.cache, a, c);
    });
  }
}
class gi {
  constructor() {
    this.name = b.KHR_MATERIALS_UNLIT;
  }
  getMaterialType() {
    return be;
  }
  extendParams(e, t, n) {
    const s = [];
    e.color = new F(1, 1, 1), e.opacity = 1;
    const r = t.pbrMetallicRoughness;
    if (r) {
      if (Array.isArray(r.baseColorFactor)) {
        const i = r.baseColorFactor;
        e.color.setRGB(i[0], i[1], i[2], Q), e.opacity = i[3];
      }
      r.baseColorTexture !== void 0 && s.push(n.assignTexture(e, "map", r.baseColorTexture, D));
    }
    return Promise.all(s);
  }
}
class yi {
  constructor(e) {
    this.parser = e, this.name = b.KHR_MATERIALS_EMISSIVE_STRENGTH;
  }
  extendMaterialParams(e, t) {
    const s = this.parser.json.materials[e];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const r = s.extensions[this.name].emissiveStrength;
    return r !== void 0 && (t.emissiveIntensity = r), Promise.resolve();
  }
}
class vi {
  constructor(e) {
    this.parser = e, this.name = b.KHR_MATERIALS_CLEARCOAT;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : W;
  }
  extendMaterialParams(e, t) {
    const n = this.parser, s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const r = [], i = s.extensions[this.name];
    if (i.clearcoatFactor !== void 0 && (t.clearcoat = i.clearcoatFactor), i.clearcoatTexture !== void 0 && r.push(n.assignTexture(t, "clearcoatMap", i.clearcoatTexture)), i.clearcoatRoughnessFactor !== void 0 && (t.clearcoatRoughness = i.clearcoatRoughnessFactor), i.clearcoatRoughnessTexture !== void 0 && r.push(n.assignTexture(t, "clearcoatRoughnessMap", i.clearcoatRoughnessTexture)), i.clearcoatNormalTexture !== void 0 && (r.push(n.assignTexture(t, "clearcoatNormalMap", i.clearcoatNormalTexture)), i.clearcoatNormalTexture.scale !== void 0)) {
      const a = i.clearcoatNormalTexture.scale;
      t.clearcoatNormalScale = new qe(a, a);
    }
    return Promise.all(r);
  }
}
class Ti {
  constructor(e) {
    this.parser = e, this.name = b.KHR_MATERIALS_DISPERSION;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : W;
  }
  extendMaterialParams(e, t) {
    const s = this.parser.json.materials[e];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const r = s.extensions[this.name];
    return t.dispersion = r.dispersion !== void 0 ? r.dispersion : 0, Promise.resolve();
  }
}
class wi {
  constructor(e) {
    this.parser = e, this.name = b.KHR_MATERIALS_IRIDESCENCE;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : W;
  }
  extendMaterialParams(e, t) {
    const n = this.parser, s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const r = [], i = s.extensions[this.name];
    return i.iridescenceFactor !== void 0 && (t.iridescence = i.iridescenceFactor), i.iridescenceTexture !== void 0 && r.push(n.assignTexture(t, "iridescenceMap", i.iridescenceTexture)), i.iridescenceIor !== void 0 && (t.iridescenceIOR = i.iridescenceIor), t.iridescenceThicknessRange === void 0 && (t.iridescenceThicknessRange = [100, 400]), i.iridescenceThicknessMinimum !== void 0 && (t.iridescenceThicknessRange[0] = i.iridescenceThicknessMinimum), i.iridescenceThicknessMaximum !== void 0 && (t.iridescenceThicknessRange[1] = i.iridescenceThicknessMaximum), i.iridescenceThicknessTexture !== void 0 && r.push(n.assignTexture(t, "iridescenceThicknessMap", i.iridescenceThicknessTexture)), Promise.all(r);
  }
}
class xi {
  constructor(e) {
    this.parser = e, this.name = b.KHR_MATERIALS_SHEEN;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : W;
  }
  extendMaterialParams(e, t) {
    const n = this.parser, s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const r = [];
    t.sheenColor = new F(0, 0, 0), t.sheenRoughness = 0, t.sheen = 1;
    const i = s.extensions[this.name];
    if (i.sheenColorFactor !== void 0) {
      const a = i.sheenColorFactor;
      t.sheenColor.setRGB(a[0], a[1], a[2], Q);
    }
    return i.sheenRoughnessFactor !== void 0 && (t.sheenRoughness = i.sheenRoughnessFactor), i.sheenColorTexture !== void 0 && r.push(n.assignTexture(t, "sheenColorMap", i.sheenColorTexture, D)), i.sheenRoughnessTexture !== void 0 && r.push(n.assignTexture(t, "sheenRoughnessMap", i.sheenRoughnessTexture)), Promise.all(r);
  }
}
class Ei {
  constructor(e) {
    this.parser = e, this.name = b.KHR_MATERIALS_TRANSMISSION;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : W;
  }
  extendMaterialParams(e, t) {
    const n = this.parser, s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const r = [], i = s.extensions[this.name];
    return i.transmissionFactor !== void 0 && (t.transmission = i.transmissionFactor), i.transmissionTexture !== void 0 && r.push(n.assignTexture(t, "transmissionMap", i.transmissionTexture)), Promise.all(r);
  }
}
class Ai {
  constructor(e) {
    this.parser = e, this.name = b.KHR_MATERIALS_VOLUME;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : W;
  }
  extendMaterialParams(e, t) {
    const n = this.parser, s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const r = [], i = s.extensions[this.name];
    t.thickness = i.thicknessFactor !== void 0 ? i.thicknessFactor : 0, i.thicknessTexture !== void 0 && r.push(n.assignTexture(t, "thicknessMap", i.thicknessTexture)), t.attenuationDistance = i.attenuationDistance || 1 / 0;
    const a = i.attenuationColor || [1, 1, 1];
    return t.attenuationColor = new F().setRGB(a[0], a[1], a[2], Q), Promise.all(r);
  }
}
class bi {
  constructor(e) {
    this.parser = e, this.name = b.KHR_MATERIALS_IOR;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : W;
  }
  extendMaterialParams(e, t) {
    const s = this.parser.json.materials[e];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const r = s.extensions[this.name];
    return t.ior = r.ior !== void 0 ? r.ior : 1.5, Promise.resolve();
  }
}
class Si {
  constructor(e) {
    this.parser = e, this.name = b.KHR_MATERIALS_SPECULAR;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : W;
  }
  extendMaterialParams(e, t) {
    const n = this.parser, s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const r = [], i = s.extensions[this.name];
    t.specularIntensity = i.specularFactor !== void 0 ? i.specularFactor : 1, i.specularTexture !== void 0 && r.push(n.assignTexture(t, "specularIntensityMap", i.specularTexture));
    const a = i.specularColorFactor || [1, 1, 1];
    return t.specularColor = new F().setRGB(a[0], a[1], a[2], Q), i.specularColorTexture !== void 0 && r.push(n.assignTexture(t, "specularColorMap", i.specularColorTexture, D)), Promise.all(r);
  }
}
class Ri {
  constructor(e) {
    this.parser = e, this.name = b.EXT_MATERIALS_BUMP;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : W;
  }
  extendMaterialParams(e, t) {
    const n = this.parser, s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const r = [], i = s.extensions[this.name];
    return t.bumpScale = i.bumpFactor !== void 0 ? i.bumpFactor : 1, i.bumpTexture !== void 0 && r.push(n.assignTexture(t, "bumpMap", i.bumpTexture)), Promise.all(r);
  }
}
class Mi {
  constructor(e) {
    this.parser = e, this.name = b.KHR_MATERIALS_ANISOTROPY;
  }
  getMaterialType(e) {
    const n = this.parser.json.materials[e];
    return !n.extensions || !n.extensions[this.name] ? null : W;
  }
  extendMaterialParams(e, t) {
    const n = this.parser, s = n.json.materials[e];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const r = [], i = s.extensions[this.name];
    return i.anisotropyStrength !== void 0 && (t.anisotropy = i.anisotropyStrength), i.anisotropyRotation !== void 0 && (t.anisotropyRotation = i.anisotropyRotation), i.anisotropyTexture !== void 0 && r.push(n.assignTexture(t, "anisotropyMap", i.anisotropyTexture)), Promise.all(r);
  }
}
class _i {
  constructor(e) {
    this.parser = e, this.name = b.KHR_TEXTURE_BASISU;
  }
  loadTexture(e) {
    const t = this.parser, n = t.json, s = n.textures[e];
    if (!s.extensions || !s.extensions[this.name])
      return null;
    const r = s.extensions[this.name], i = t.options.ktx2Loader;
    if (!i) {
      if (n.extensionsRequired && n.extensionsRequired.indexOf(this.name) >= 0)
        throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");
      return null;
    }
    return t.loadTextureImage(e, r.source, i);
  }
}
class Ci {
  constructor(e) {
    this.parser = e, this.name = b.EXT_TEXTURE_WEBP;
  }
  loadTexture(e) {
    const t = this.name, n = this.parser, s = n.json, r = s.textures[e];
    if (!r.extensions || !r.extensions[t])
      return null;
    const i = r.extensions[t], a = s.images[i.source];
    let c = n.textureLoader;
    if (a.uri) {
      const l = n.options.manager.getHandler(a.uri);
      l !== null && (c = l);
    }
    return n.loadTextureImage(e, i.source, c);
  }
}
class Ii {
  constructor(e) {
    this.parser = e, this.name = b.EXT_TEXTURE_AVIF;
  }
  loadTexture(e) {
    const t = this.name, n = this.parser, s = n.json, r = s.textures[e];
    if (!r.extensions || !r.extensions[t])
      return null;
    const i = r.extensions[t], a = s.images[i.source];
    let c = n.textureLoader;
    if (a.uri) {
      const l = n.options.manager.getHandler(a.uri);
      l !== null && (c = l);
    }
    return n.loadTextureImage(e, i.source, c);
  }
}
class Li {
  constructor(e) {
    this.name = b.EXT_MESHOPT_COMPRESSION, this.parser = e;
  }
  loadBufferView(e) {
    const t = this.parser.json, n = t.bufferViews[e];
    if (n.extensions && n.extensions[this.name]) {
      const s = n.extensions[this.name], r = this.parser.getDependency("buffer", s.buffer), i = this.parser.options.meshoptDecoder;
      if (!i || !i.supported) {
        if (t.extensionsRequired && t.extensionsRequired.indexOf(this.name) >= 0)
          throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");
        return null;
      }
      return r.then(function(a) {
        const c = s.byteOffset || 0, l = s.byteLength || 0, f = s.count, u = s.byteStride, h = new Uint8Array(a, c, l);
        return i.decodeGltfBufferAsync ? i.decodeGltfBufferAsync(f, u, h, s.mode, s.filter).then(function(p) {
          return p.buffer;
        }) : i.ready.then(function() {
          const p = new ArrayBuffer(f * u);
          return i.decodeGltfBuffer(new Uint8Array(p), f, u, h, s.mode, s.filter), p;
        });
      });
    } else
      return null;
  }
}
class Fi {
  constructor(e) {
    this.name = b.EXT_MESH_GPU_INSTANCING, this.parser = e;
  }
  createNodeMesh(e) {
    const t = this.parser.json, n = t.nodes[e];
    if (!n.extensions || !n.extensions[this.name] || n.mesh === void 0)
      return null;
    const s = t.meshes[n.mesh];
    for (const l of s.primitives)
      if (l.mode !== N.TRIANGLES && l.mode !== N.TRIANGLE_STRIP && l.mode !== N.TRIANGLE_FAN && l.mode !== void 0)
        return null;
    const i = n.extensions[this.name].attributes, a = [], c = {};
    for (const l in i)
      a.push(this.parser.getDependency("accessor", i[l]).then((f) => (c[l] = f, c[l])));
    return a.length < 1 ? null : (a.push(this.parser.createNodeMesh(e)), Promise.all(a).then((l) => {
      const f = l.pop(), u = f.isGroup ? f.children : [f], h = l[0].count, p = [];
      for (const d of u) {
        const g = new M(), m = new L(), y = new H(), T = new L(1, 1, 1), v = new ds(d.geometry, d.material, h);
        for (let x = 0; x < h; x++)
          c.TRANSLATION && m.fromBufferAttribute(c.TRANSLATION, x), c.ROTATION && y.fromBufferAttribute(c.ROTATION, x), c.SCALE && T.fromBufferAttribute(c.SCALE, x), v.setMatrixAt(x, g.compose(m, y, T));
        for (const x in c)
          if (x === "_COLOR_0") {
            const w = c[x];
            v.instanceColor = new ms(w.array, w.itemSize, w.normalized);
          } else x !== "TRANSLATION" && x !== "ROTATION" && x !== "SCALE" && d.geometry.setAttribute(x, c[x]);
        pe.prototype.copy.call(v, d), this.parser.assignFinalMaterial(v), p.push(v);
      }
      return f.isGroup ? (f.clear(), f.add(...p), f) : p[0];
    }));
  }
}
const Yn = "glTF", Ee = 12, hn = { JSON: 1313821514, BIN: 5130562 };
class Di {
  constructor(e) {
    this.name = b.KHR_BINARY_GLTF, this.content = null, this.body = null;
    const t = new DataView(e, 0, Ee), n = new TextDecoder();
    if (this.header = {
      magic: n.decode(new Uint8Array(e.slice(0, 4))),
      version: t.getUint32(4, !0),
      length: t.getUint32(8, !0)
    }, this.header.magic !== Yn)
      throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");
    if (this.header.version < 2)
      throw new Error("THREE.GLTFLoader: Legacy binary file detected.");
    const s = this.header.length - Ee, r = new DataView(e, Ee);
    let i = 0;
    for (; i < s; ) {
      const a = r.getUint32(i, !0);
      i += 4;
      const c = r.getUint32(i, !0);
      if (i += 4, c === hn.JSON) {
        const l = new Uint8Array(e, Ee + i, a);
        this.content = n.decode(l);
      } else if (c === hn.BIN) {
        const l = Ee + i;
        this.body = e.slice(l, l + a);
      }
      i += a;
    }
    if (this.content === null)
      throw new Error("THREE.GLTFLoader: JSON content not found.");
  }
}
class Pi {
  constructor(e, t) {
    if (!t)
      throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");
    this.name = b.KHR_DRACO_MESH_COMPRESSION, this.json = e, this.dracoLoader = t, this.dracoLoader.preload();
  }
  decodePrimitive(e, t) {
    const n = this.json, s = this.dracoLoader, r = e.extensions[this.name].bufferView, i = e.extensions[this.name].attributes, a = {}, c = {}, l = {};
    for (const f in i) {
      const u = Ct[f] || f.toLowerCase();
      a[u] = i[f];
    }
    for (const f in e.attributes) {
      const u = Ct[f] || f.toLowerCase();
      if (i[f] !== void 0) {
        const h = n.accessors[e.attributes[f]], p = Te[h.componentType];
        l[u] = p.name, c[u] = h.normalized === !0;
      }
    }
    return t.getDependency("bufferView", r).then(function(f) {
      return new Promise(function(u, h) {
        s.decodeDracoFile(f, function(p) {
          for (const d in p.attributes) {
            const g = p.attributes[d], m = c[d];
            m !== void 0 && (g.normalized = m);
          }
          u(p);
        }, a, l, Q, h);
      });
    });
  }
}
class ki {
  constructor() {
    this.name = b.KHR_TEXTURE_TRANSFORM;
  }
  extendTexture(e, t) {
    return (t.texCoord === void 0 || t.texCoord === e.channel) && t.offset === void 0 && t.rotation === void 0 && t.scale === void 0 || (e = e.clone(), t.texCoord !== void 0 && (e.channel = t.texCoord), t.offset !== void 0 && e.offset.fromArray(t.offset), t.rotation !== void 0 && (e.rotation = t.rotation), t.scale !== void 0 && e.repeat.fromArray(t.scale), e.needsUpdate = !0), e;
  }
}
class Oi {
  constructor() {
    this.name = b.KHR_MESH_QUANTIZATION;
  }
}
class Qn extends Ls {
  constructor(e, t, n, s) {
    super(e, t, n, s);
  }
  copySampleValue_(e) {
    const t = this.resultBuffer, n = this.sampleValues, s = this.valueSize, r = e * s * 3 + s;
    for (let i = 0; i !== s; i++)
      t[i] = n[r + i];
    return t;
  }
  interpolate_(e, t, n, s) {
    const r = this.resultBuffer, i = this.sampleValues, a = this.valueSize, c = a * 2, l = a * 3, f = s - t, u = (n - t) / f, h = u * u, p = h * u, d = e * l, g = d - l, m = -2 * p + 3 * h, y = p - h, T = 1 - m, v = y - h + u;
    for (let x = 0; x !== a; x++) {
      const w = i[g + x + a], E = i[g + x + c] * f, S = i[d + x + a], C = i[d + x] * f;
      r[x] = T * w + v * E + m * S + y * C;
    }
    return r;
  }
}
const Bi = new H();
class Ni extends Qn {
  interpolate_(e, t, n, s) {
    const r = super.interpolate_(e, t, n, s);
    return Bi.fromArray(r).normalize().toArray(r), r;
  }
}
const N = {
  POINTS: 0,
  LINES: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  TRIANGLE_FAN: 6
}, Te = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
}, pn = {
  9728: _n,
  9729: wt,
  9984: xs,
  9985: ws,
  9986: Ts,
  9987: Mn
}, dn = {
  33071: pt,
  33648: Es,
  10497: oe
}, lt = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
}, Ct = {
  POSITION: "position",
  NORMAL: "normal",
  TANGENT: "tangent",
  TEXCOORD_0: "uv",
  TEXCOORD_1: "uv1",
  TEXCOORD_2: "uv2",
  TEXCOORD_3: "uv3",
  COLOR_0: "color",
  WEIGHTS_0: "skinWeight",
  JOINTS_0: "skinIndex"
}, ee = {
  scale: "scale",
  translation: "position",
  rotation: "quaternion",
  weights: "morphTargetInfluences"
}, Ui = {
  CUBICSPLINE: void 0,
  // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
  // keyframe track will be initialized with a default interpolation type, then modified.
  LINEAR: Cn,
  STEP: Cs
}, ut = {
  OPAQUE: "OPAQUE",
  MASK: "MASK",
  BLEND: "BLEND"
};
function Gi(o) {
  return o.DefaultMaterial === void 0 && (o.DefaultMaterial = new kt({
    color: 16777215,
    emissive: 0,
    metalness: 1,
    roughness: 1,
    transparent: !1,
    depthTest: !0,
    side: Is
  })), o.DefaultMaterial;
}
function ne(o, e, t) {
  for (const n in t.extensions)
    o[n] === void 0 && (e.userData.gltfExtensions = e.userData.gltfExtensions || {}, e.userData.gltfExtensions[n] = t.extensions[n]);
}
function V(o, e) {
  e.extras !== void 0 && (typeof e.extras == "object" ? Object.assign(o.userData, e.extras) : console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, " + e.extras));
}
function ji(o, e, t) {
  let n = !1, s = !1, r = !1;
  for (let l = 0, f = e.length; l < f; l++) {
    const u = e[l];
    if (u.POSITION !== void 0 && (n = !0), u.NORMAL !== void 0 && (s = !0), u.COLOR_0 !== void 0 && (r = !0), n && s && r) break;
  }
  if (!n && !s && !r) return Promise.resolve(o);
  const i = [], a = [], c = [];
  for (let l = 0, f = e.length; l < f; l++) {
    const u = e[l];
    if (n) {
      const h = u.POSITION !== void 0 ? t.getDependency("accessor", u.POSITION) : o.attributes.position;
      i.push(h);
    }
    if (s) {
      const h = u.NORMAL !== void 0 ? t.getDependency("accessor", u.NORMAL) : o.attributes.normal;
      a.push(h);
    }
    if (r) {
      const h = u.COLOR_0 !== void 0 ? t.getDependency("accessor", u.COLOR_0) : o.attributes.color;
      c.push(h);
    }
  }
  return Promise.all([
    Promise.all(i),
    Promise.all(a),
    Promise.all(c)
  ]).then(function(l) {
    const f = l[0], u = l[1], h = l[2];
    return n && (o.morphAttributes.position = f), s && (o.morphAttributes.normal = u), r && (o.morphAttributes.color = h), o.morphTargetsRelative = !0, o;
  });
}
function Hi(o, e) {
  if (o.updateMorphTargets(), e.weights !== void 0)
    for (let t = 0, n = e.weights.length; t < n; t++)
      o.morphTargetInfluences[t] = e.weights[t];
  if (e.extras && Array.isArray(e.extras.targetNames)) {
    const t = e.extras.targetNames;
    if (o.morphTargetInfluences.length === t.length) {
      o.morphTargetDictionary = {};
      for (let n = 0, s = t.length; n < s; n++)
        o.morphTargetDictionary[t[n]] = n;
    } else
      console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.");
  }
}
function zi(o) {
  let e;
  const t = o.extensions && o.extensions[b.KHR_DRACO_MESH_COMPRESSION];
  if (t ? e = "draco:" + t.bufferView + ":" + t.indices + ":" + ft(t.attributes) : e = o.indices + ":" + ft(o.attributes) + ":" + o.mode, o.targets !== void 0)
    for (let n = 0, s = o.targets.length; n < s; n++)
      e += ":" + ft(o.targets[n]);
  return e;
}
function ft(o) {
  let e = "";
  const t = Object.keys(o).sort();
  for (let n = 0, s = t.length; n < s; n++)
    e += t[n] + ":" + o[t[n]] + ";";
  return e;
}
function It(o) {
  switch (o) {
    case Int8Array:
      return 1 / 127;
    case Uint8Array:
      return 1 / 255;
    case Int16Array:
      return 1 / 32767;
    case Uint16Array:
      return 1 / 65535;
    default:
      throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.");
  }
}
function Ki(o) {
  return o.search(/\.jpe?g($|\?)/i) > 0 || o.search(/^data\:image\/jpeg/) === 0 ? "image/jpeg" : o.search(/\.webp($|\?)/i) > 0 || o.search(/^data\:image\/webp/) === 0 ? "image/webp" : o.search(/\.ktx2($|\?)/i) > 0 || o.search(/^data\:image\/ktx2/) === 0 ? "image/ktx2" : "image/png";
}
const Vi = new M();
class Xi {
  constructor(e = {}, t = {}) {
    this.json = e, this.extensions = {}, this.plugins = {}, this.options = t, this.cache = new di(), this.associations = /* @__PURE__ */ new Map(), this.primitiveCache = {}, this.nodeCache = {}, this.meshCache = { refs: {}, uses: {} }, this.cameraCache = { refs: {}, uses: {} }, this.lightCache = { refs: {}, uses: {} }, this.sourceCache = {}, this.textureCache = {}, this.nodeNamesUsed = {};
    let n = !1, s = -1, r = !1, i = -1;
    if (typeof navigator < "u") {
      const a = navigator.userAgent;
      n = /^((?!chrome|android).)*safari/i.test(a) === !0;
      const c = a.match(/Version\/(\d+)/);
      s = n && c ? parseInt(c[1], 10) : -1, r = a.indexOf("Firefox") > -1, i = r ? a.match(/Firefox\/([0-9]+)\./)[1] : -1;
    }
    typeof createImageBitmap > "u" || n && s < 17 || r && i < 98 ? this.textureLoader = new Dt(this.options.manager) : this.textureLoader = new gs(this.options.manager), this.textureLoader.setCrossOrigin(this.options.crossOrigin), this.textureLoader.setRequestHeader(this.options.requestHeader), this.fileLoader = new Ft(this.options.manager), this.fileLoader.setResponseType("arraybuffer"), this.options.crossOrigin === "use-credentials" && this.fileLoader.setWithCredentials(!0);
  }
  setExtensions(e) {
    this.extensions = e;
  }
  setPlugins(e) {
    this.plugins = e;
  }
  parse(e, t) {
    const n = this, s = this.json, r = this.extensions;
    this.cache.removeAll(), this.nodeCache = {}, this._invokeAll(function(i) {
      return i._markDefs && i._markDefs();
    }), Promise.all(this._invokeAll(function(i) {
      return i.beforeRoot && i.beforeRoot();
    })).then(function() {
      return Promise.all([
        n.getDependencies("scene"),
        n.getDependencies("animation"),
        n.getDependencies("camera")
      ]);
    }).then(function(i) {
      const a = {
        scene: i[0][s.scene || 0],
        scenes: i[0],
        animations: i[1],
        cameras: i[2],
        asset: s.asset,
        parser: n,
        userData: {}
      };
      return ne(r, a, s), V(a, s), Promise.all(n._invokeAll(function(c) {
        return c.afterRoot && c.afterRoot(a);
      })).then(function() {
        for (const c of a.scenes)
          c.updateMatrixWorld();
        e(a);
      });
    }).catch(t);
  }
  /**
   * Marks the special nodes/meshes in json for efficient parse.
   *
   * @private
   */
  _markDefs() {
    const e = this.json.nodes || [], t = this.json.skins || [], n = this.json.meshes || [];
    for (let s = 0, r = t.length; s < r; s++) {
      const i = t[s].joints;
      for (let a = 0, c = i.length; a < c; a++)
        e[i[a]].isBone = !0;
    }
    for (let s = 0, r = e.length; s < r; s++) {
      const i = e[s];
      i.mesh !== void 0 && (this._addNodeRef(this.meshCache, i.mesh), i.skin !== void 0 && (n[i.mesh].isSkinnedMesh = !0)), i.camera !== void 0 && this._addNodeRef(this.cameraCache, i.camera);
    }
  }
  /**
   * Counts references to shared node / Object3D resources. These resources
   * can be reused, or "instantiated", at multiple nodes in the scene
   * hierarchy. Mesh, Camera, and Light instances are instantiated and must
   * be marked. Non-scenegraph resources (like Materials, Geometries, and
   * Textures) can be reused directly and are not marked here.
   *
   * Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
   *
   * @private
   * @param {Object} cache
   * @param {Object3D} index
   */
  _addNodeRef(e, t) {
    t !== void 0 && (e.refs[t] === void 0 && (e.refs[t] = e.uses[t] = 0), e.refs[t]++);
  }
  /**
   * Returns a reference to a shared resource, cloning it if necessary.
   *
   * @private
   * @param {Object} cache
   * @param {number} index
   * @param {Object} object
   * @return {Object}
   */
  _getNodeRef(e, t, n) {
    if (e.refs[t] <= 1) return n;
    const s = n.clone(), r = (i, a) => {
      const c = this.associations.get(i);
      c != null && this.associations.set(a, c);
      for (const [l, f] of i.children.entries())
        r(f, a.children[l]);
    };
    return r(n, s), s.name += "_instance_" + e.uses[t]++, s;
  }
  _invokeOne(e) {
    const t = Object.values(this.plugins);
    t.push(this);
    for (let n = 0; n < t.length; n++) {
      const s = e(t[n]);
      if (s) return s;
    }
    return null;
  }
  _invokeAll(e) {
    const t = Object.values(this.plugins);
    t.unshift(this);
    const n = [];
    for (let s = 0; s < t.length; s++) {
      const r = e(t[s]);
      r && n.push(r);
    }
    return n;
  }
  /**
   * Requests the specified dependency asynchronously, with caching.
   *
   * @private
   * @param {string} type
   * @param {number} index
   * @return {Promise<Object3D|Material|Texture|AnimationClip|ArrayBuffer|Object>}
   */
  getDependency(e, t) {
    const n = e + ":" + t;
    let s = this.cache.get(n);
    if (!s) {
      switch (e) {
        case "scene":
          s = this.loadScene(t);
          break;
        case "node":
          s = this._invokeOne(function(r) {
            return r.loadNode && r.loadNode(t);
          });
          break;
        case "mesh":
          s = this._invokeOne(function(r) {
            return r.loadMesh && r.loadMesh(t);
          });
          break;
        case "accessor":
          s = this.loadAccessor(t);
          break;
        case "bufferView":
          s = this._invokeOne(function(r) {
            return r.loadBufferView && r.loadBufferView(t);
          });
          break;
        case "buffer":
          s = this.loadBuffer(t);
          break;
        case "material":
          s = this._invokeOne(function(r) {
            return r.loadMaterial && r.loadMaterial(t);
          });
          break;
        case "texture":
          s = this._invokeOne(function(r) {
            return r.loadTexture && r.loadTexture(t);
          });
          break;
        case "skin":
          s = this.loadSkin(t);
          break;
        case "animation":
          s = this._invokeOne(function(r) {
            return r.loadAnimation && r.loadAnimation(t);
          });
          break;
        case "camera":
          s = this.loadCamera(t);
          break;
        default:
          if (s = this._invokeOne(function(r) {
            return r != this && r.getDependency && r.getDependency(e, t);
          }), !s)
            throw new Error("Unknown type: " + e);
          break;
      }
      this.cache.add(n, s);
    }
    return s;
  }
  /**
   * Requests all dependencies of the specified type asynchronously, with caching.
   *
   * @private
   * @param {string} type
   * @return {Promise<Array<Object>>}
   */
  getDependencies(e) {
    let t = this.cache.get(e);
    if (!t) {
      const n = this, s = this.json[e + (e === "mesh" ? "es" : "s")] || [];
      t = Promise.all(s.map(function(r, i) {
        return n.getDependency(e, i);
      })), this.cache.add(e, t);
    }
    return t;
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
   *
   * @private
   * @param {number} bufferIndex
   * @return {Promise<ArrayBuffer>}
   */
  loadBuffer(e) {
    const t = this.json.buffers[e], n = this.fileLoader;
    if (t.type && t.type !== "arraybuffer")
      throw new Error("THREE.GLTFLoader: " + t.type + " buffer type is not supported.");
    if (t.uri === void 0 && e === 0)
      return Promise.resolve(this.extensions[b.KHR_BINARY_GLTF].body);
    const s = this.options;
    return new Promise(function(r, i) {
      n.load(ge.resolveURL(t.uri, s.path), r, void 0, function() {
        i(new Error('THREE.GLTFLoader: Failed to load buffer "' + t.uri + '".'));
      });
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
   *
   * @private
   * @param {number} bufferViewIndex
   * @return {Promise<ArrayBuffer>}
   */
  loadBufferView(e) {
    const t = this.json.bufferViews[e];
    return this.getDependency("buffer", t.buffer).then(function(n) {
      const s = t.byteLength || 0, r = t.byteOffset || 0;
      return n.slice(r, r + s);
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
   *
   * @private
   * @param {number} accessorIndex
   * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
   */
  loadAccessor(e) {
    const t = this, n = this.json, s = this.json.accessors[e];
    if (s.bufferView === void 0 && s.sparse === void 0) {
      const i = lt[s.type], a = Te[s.componentType], c = s.normalized === !0, l = new a(s.count * i);
      return Promise.resolve(new nt(l, i, c));
    }
    const r = [];
    return s.bufferView !== void 0 ? r.push(this.getDependency("bufferView", s.bufferView)) : r.push(null), s.sparse !== void 0 && (r.push(this.getDependency("bufferView", s.sparse.indices.bufferView)), r.push(this.getDependency("bufferView", s.sparse.values.bufferView))), Promise.all(r).then(function(i) {
      const a = i[0], c = lt[s.type], l = Te[s.componentType], f = l.BYTES_PER_ELEMENT, u = f * c, h = s.byteOffset || 0, p = s.bufferView !== void 0 ? n.bufferViews[s.bufferView].byteStride : void 0, d = s.normalized === !0;
      let g, m;
      if (p && p !== u) {
        const y = Math.floor(h / p), T = "InterleavedBuffer:" + s.bufferView + ":" + s.componentType + ":" + y + ":" + s.count;
        let v = t.cache.get(T);
        v || (g = new l(a, y * p, s.count * p / f), v = new ys(g, p / f), t.cache.add(T, v)), m = new vs(v, c, h % p / f, d);
      } else
        a === null ? g = new l(s.count * c) : g = new l(a, h, s.count * c), m = new nt(g, c, d);
      if (s.sparse !== void 0) {
        const y = lt.SCALAR, T = Te[s.sparse.indices.componentType], v = s.sparse.indices.byteOffset || 0, x = s.sparse.values.byteOffset || 0, w = new T(i[1], v, s.sparse.count * y), E = new l(i[2], x, s.sparse.count * c);
        a !== null && (m = new nt(m.array.slice(), m.itemSize, m.normalized)), m.normalized = !1;
        for (let S = 0, C = w.length; S < C; S++) {
          const P = w[S];
          if (m.setX(P, E[S * c]), c >= 2 && m.setY(P, E[S * c + 1]), c >= 3 && m.setZ(P, E[S * c + 2]), c >= 4 && m.setW(P, E[S * c + 3]), c >= 5) throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.");
        }
        m.normalized = d;
      }
      return m;
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
   *
   * @private
   * @param {number} textureIndex
   * @return {Promise<?Texture>}
   */
  loadTexture(e) {
    const t = this.json, n = this.options, r = t.textures[e].source, i = t.images[r];
    let a = this.textureLoader;
    if (i.uri) {
      const c = n.manager.getHandler(i.uri);
      c !== null && (a = c);
    }
    return this.loadTextureImage(e, r, a);
  }
  loadTextureImage(e, t, n) {
    const s = this, r = this.json, i = r.textures[e], a = r.images[t], c = (a.uri || a.bufferView) + ":" + i.sampler;
    if (this.textureCache[c])
      return this.textureCache[c];
    const l = this.loadImageSource(t, n).then(function(f) {
      f.flipY = !1, f.name = i.name || a.name || "", f.name === "" && typeof a.uri == "string" && a.uri.startsWith("data:image/") === !1 && (f.name = a.uri);
      const h = (r.samplers || {})[i.sampler] || {};
      return f.magFilter = pn[h.magFilter] || wt, f.minFilter = pn[h.minFilter] || Mn, f.wrapS = dn[h.wrapS] || oe, f.wrapT = dn[h.wrapT] || oe, f.generateMipmaps = !f.isCompressedTexture && f.minFilter !== _n && f.minFilter !== wt, s.associations.set(f, { textures: e }), f;
    }).catch(function() {
      return null;
    });
    return this.textureCache[c] = l, l;
  }
  loadImageSource(e, t) {
    const n = this, s = this.json, r = this.options;
    if (this.sourceCache[e] !== void 0)
      return this.sourceCache[e].then((u) => u.clone());
    const i = s.images[e], a = self.URL || self.webkitURL;
    let c = i.uri || "", l = !1;
    if (i.bufferView !== void 0)
      c = n.getDependency("bufferView", i.bufferView).then(function(u) {
        l = !0;
        const h = new Blob([u], { type: i.mimeType });
        return c = a.createObjectURL(h), c;
      });
    else if (i.uri === void 0)
      throw new Error("THREE.GLTFLoader: Image " + e + " is missing URI and bufferView");
    const f = Promise.resolve(c).then(function(u) {
      return new Promise(function(h, p) {
        let d = h;
        t.isImageBitmapLoader === !0 && (d = function(g) {
          const m = new dt(g);
          m.needsUpdate = !0, h(m);
        }), t.load(ge.resolveURL(u, r.path), d, void 0, p);
      });
    }).then(function(u) {
      return l === !0 && a.revokeObjectURL(c), V(u, i), u.userData.mimeType = i.mimeType || Ki(i.uri), u;
    }).catch(function(u) {
      throw console.error("THREE.GLTFLoader: Couldn't load texture", c), u;
    });
    return this.sourceCache[e] = f, f;
  }
  /**
   * Asynchronously assigns a texture to the given material parameters.
   *
   * @private
   * @param {Object} materialParams
   * @param {string} mapName
   * @param {Object} mapDef
   * @param {string} [colorSpace]
   * @return {Promise<Texture>}
   */
  assignTexture(e, t, n, s) {
    const r = this;
    return this.getDependency("texture", n.index).then(function(i) {
      if (!i) return null;
      if (n.texCoord !== void 0 && n.texCoord > 0 && (i = i.clone(), i.channel = n.texCoord), r.extensions[b.KHR_TEXTURE_TRANSFORM]) {
        const a = n.extensions !== void 0 ? n.extensions[b.KHR_TEXTURE_TRANSFORM] : void 0;
        if (a) {
          const c = r.associations.get(i);
          i = r.extensions[b.KHR_TEXTURE_TRANSFORM].extendTexture(i, a), r.associations.set(i, c);
        }
      }
      return s !== void 0 && (i.colorSpace = s), e[t] = i, i;
    });
  }
  /**
   * Assigns final material to a Mesh, Line, or Points instance. The instance
   * already has a material (generated from the glTF material options alone)
   * but reuse of the same glTF material may require multiple threejs materials
   * to accommodate different primitive types, defines, etc. New materials will
   * be created if necessary, and reused from a cache.
   *
   * @private
   * @param {Object3D} mesh Mesh, Line, or Points instance.
   */
  assignFinalMaterial(e) {
    const t = e.geometry;
    let n = e.material;
    const s = t.attributes.tangent === void 0, r = t.attributes.color !== void 0, i = t.attributes.normal === void 0;
    if (e.isPoints) {
      const a = "PointsMaterial:" + n.uuid;
      let c = this.cache.get(a);
      c || (c = new As(), st.prototype.copy.call(c, n), c.color.copy(n.color), c.map = n.map, c.sizeAttenuation = !1, this.cache.add(a, c)), n = c;
    } else if (e.isLine) {
      const a = "LineBasicMaterial:" + n.uuid;
      let c = this.cache.get(a);
      c || (c = new En(), st.prototype.copy.call(c, n), c.color.copy(n.color), c.map = n.map, this.cache.add(a, c)), n = c;
    }
    if (s || r || i) {
      let a = "ClonedMaterial:" + n.uuid + ":";
      s && (a += "derivative-tangents:"), r && (a += "vertex-colors:"), i && (a += "flat-shading:");
      let c = this.cache.get(a);
      c || (c = n.clone(), r && (c.vertexColors = !0), i && (c.flatShading = !0), s && (c.normalScale && (c.normalScale.y *= -1), c.clearcoatNormalScale && (c.clearcoatNormalScale.y *= -1)), this.cache.add(a, c), this.associations.set(c, this.associations.get(n))), n = c;
    }
    e.material = n;
  }
  getMaterialType() {
    return kt;
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
   *
   * @private
   * @param {number} materialIndex
   * @return {Promise<Material>}
   */
  loadMaterial(e) {
    const t = this, n = this.json, s = this.extensions, r = n.materials[e];
    let i;
    const a = {}, c = r.extensions || {}, l = [];
    if (c[b.KHR_MATERIALS_UNLIT]) {
      const u = s[b.KHR_MATERIALS_UNLIT];
      i = u.getMaterialType(), l.push(u.extendParams(a, r, t));
    } else {
      const u = r.pbrMetallicRoughness || {};
      if (a.color = new F(1, 1, 1), a.opacity = 1, Array.isArray(u.baseColorFactor)) {
        const h = u.baseColorFactor;
        a.color.setRGB(h[0], h[1], h[2], Q), a.opacity = h[3];
      }
      u.baseColorTexture !== void 0 && l.push(t.assignTexture(a, "map", u.baseColorTexture, D)), a.metalness = u.metallicFactor !== void 0 ? u.metallicFactor : 1, a.roughness = u.roughnessFactor !== void 0 ? u.roughnessFactor : 1, u.metallicRoughnessTexture !== void 0 && (l.push(t.assignTexture(a, "metalnessMap", u.metallicRoughnessTexture)), l.push(t.assignTexture(a, "roughnessMap", u.metallicRoughnessTexture))), i = this._invokeOne(function(h) {
        return h.getMaterialType && h.getMaterialType(e);
      }), l.push(Promise.all(this._invokeAll(function(h) {
        return h.extendMaterialParams && h.extendMaterialParams(e, a);
      })));
    }
    r.doubleSided === !0 && (a.side = bs);
    const f = r.alphaMode || ut.OPAQUE;
    if (f === ut.BLEND ? (a.transparent = !0, a.depthWrite = !1) : (a.transparent = !1, f === ut.MASK && (a.alphaTest = r.alphaCutoff !== void 0 ? r.alphaCutoff : 0.5)), r.normalTexture !== void 0 && i !== be && (l.push(t.assignTexture(a, "normalMap", r.normalTexture)), a.normalScale = new qe(1, 1), r.normalTexture.scale !== void 0)) {
      const u = r.normalTexture.scale;
      a.normalScale.set(u, u);
    }
    if (r.occlusionTexture !== void 0 && i !== be && (l.push(t.assignTexture(a, "aoMap", r.occlusionTexture)), r.occlusionTexture.strength !== void 0 && (a.aoMapIntensity = r.occlusionTexture.strength)), r.emissiveFactor !== void 0 && i !== be) {
      const u = r.emissiveFactor;
      a.emissive = new F().setRGB(u[0], u[1], u[2], Q);
    }
    return r.emissiveTexture !== void 0 && i !== be && l.push(t.assignTexture(a, "emissiveMap", r.emissiveTexture, D)), Promise.all(l).then(function() {
      const u = new i(a);
      return r.name && (u.name = r.name), V(u, r), t.associations.set(u, { materials: e }), r.extensions && ne(s, u, r), u;
    });
  }
  /**
   * When Object3D instances are targeted by animation, they need unique names.
   *
   * @private
   * @param {string} originalName
   * @return {string}
   */
  createUniqueName(e) {
    const t = De.sanitizeNodeName(e || "");
    return t in this.nodeNamesUsed ? t + "_" + ++this.nodeNamesUsed[t] : (this.nodeNamesUsed[t] = 0, t);
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
   *
   * Creates BufferGeometries from primitives.
   *
   * @private
   * @param {Array<GLTF.Primitive>} primitives
   * @return {Promise<Array<BufferGeometry>>}
   */
  loadGeometries(e) {
    const t = this, n = this.extensions, s = this.primitiveCache;
    function r(a) {
      return n[b.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a, t).then(function(c) {
        return mn(c, a, t);
      });
    }
    const i = [];
    for (let a = 0, c = e.length; a < c; a++) {
      const l = e[a], f = zi(l), u = s[f];
      if (u)
        i.push(u.promise);
      else {
        let h;
        l.extensions && l.extensions[b.KHR_DRACO_MESH_COMPRESSION] ? h = r(l) : h = mn(new Me(), l, t), s[f] = { primitive: l, promise: h }, i.push(h);
      }
    }
    return Promise.all(i);
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
   *
   * @private
   * @param {number} meshIndex
   * @return {Promise<Group|Mesh|SkinnedMesh|Line|Points>}
   */
  loadMesh(e) {
    const t = this, n = this.json, s = this.extensions, r = n.meshes[e], i = r.primitives, a = [];
    for (let c = 0, l = i.length; c < l; c++) {
      const f = i[c].material === void 0 ? Gi(this.cache) : this.getDependency("material", i[c].material);
      a.push(f);
    }
    return a.push(t.loadGeometries(i)), Promise.all(a).then(function(c) {
      const l = c.slice(0, c.length - 1), f = c[c.length - 1], u = [];
      for (let p = 0, d = f.length; p < d; p++) {
        const g = f[p], m = i[p];
        let y;
        const T = l[p];
        if (m.mode === N.TRIANGLES || m.mode === N.TRIANGLE_STRIP || m.mode === N.TRIANGLE_FAN || m.mode === void 0)
          y = r.isSkinnedMesh === !0 ? new Pt(g, T) : new Pe(g, T), y.isSkinnedMesh === !0 && y.normalizeSkinWeights(), m.mode === N.TRIANGLE_STRIP ? y.geometry = fn(y.geometry, Rn) : m.mode === N.TRIANGLE_FAN && (y.geometry = fn(y.geometry, Tt));
        else if (m.mode === N.LINES)
          y = new Ss(g, T);
        else if (m.mode === N.LINE_STRIP)
          y = new An(g, T);
        else if (m.mode === N.LINE_LOOP)
          y = new Rs(g, T);
        else if (m.mode === N.POINTS)
          y = new Ms(g, T);
        else
          throw new Error("THREE.GLTFLoader: Primitive mode unsupported: " + m.mode);
        Object.keys(y.geometry.morphAttributes).length > 0 && Hi(y, r), y.name = t.createUniqueName(r.name || "mesh_" + e), V(y, r), m.extensions && ne(s, y, m), t.assignFinalMaterial(y), u.push(y);
      }
      for (let p = 0, d = u.length; p < d; p++)
        t.associations.set(u[p], {
          meshes: e,
          primitives: p
        });
      if (u.length === 1)
        return r.extensions && ne(s, u[0], r), u[0];
      const h = new ye();
      r.extensions && ne(s, h, r), t.associations.set(h, { meshes: e });
      for (let p = 0, d = u.length; p < d; p++)
        h.add(u[p]);
      return h;
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
   *
   * @private
   * @param {number} cameraIndex
   * @return {Promise<Camera>|undefined}
   */
  loadCamera(e) {
    let t;
    const n = this.json.cameras[e], s = n[n.type];
    if (!s) {
      console.warn("THREE.GLTFLoader: Missing camera parameters.");
      return;
    }
    return n.type === "perspective" ? t = new Tn(k.radToDeg(s.yfov), s.aspectRatio || 1, s.znear || 1, s.zfar || 2e6) : n.type === "orthographic" && (t = new _s(-s.xmag, s.xmag, s.ymag, -s.ymag, s.znear, s.zfar)), n.name && (t.name = this.createUniqueName(n.name)), V(t, n), Promise.resolve(t);
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
   *
   * @private
   * @param {number} skinIndex
   * @return {Promise<Skeleton>}
   */
  loadSkin(e) {
    const t = this.json.skins[e], n = [];
    for (let s = 0, r = t.joints.length; s < r; s++)
      n.push(this._loadNodeShallow(t.joints[s]));
    return t.inverseBindMatrices !== void 0 ? n.push(this.getDependency("accessor", t.inverseBindMatrices)) : n.push(null), Promise.all(n).then(function(s) {
      const r = s.pop(), i = s, a = [], c = [];
      for (let l = 0, f = i.length; l < f; l++) {
        const u = i[l];
        if (u) {
          a.push(u);
          const h = new M();
          r !== null && h.fromArray(r.array, l * 16), c.push(h);
        } else
          console.warn('THREE.GLTFLoader: Joint "%s" could not be found.', t.joints[l]);
      }
      return new bn(a, c);
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
   *
   * @private
   * @param {number} animationIndex
   * @return {Promise<AnimationClip>}
   */
  loadAnimation(e) {
    const t = this.json, n = this, s = t.animations[e], r = s.name ? s.name : "animation_" + e, i = [], a = [], c = [], l = [], f = [];
    for (let u = 0, h = s.channels.length; u < h; u++) {
      const p = s.channels[u], d = s.samplers[p.sampler], g = p.target, m = g.node, y = s.parameters !== void 0 ? s.parameters[d.input] : d.input, T = s.parameters !== void 0 ? s.parameters[d.output] : d.output;
      g.node !== void 0 && (i.push(this.getDependency("node", m)), a.push(this.getDependency("accessor", y)), c.push(this.getDependency("accessor", T)), l.push(d), f.push(g));
    }
    return Promise.all([
      Promise.all(i),
      Promise.all(a),
      Promise.all(c),
      Promise.all(l),
      Promise.all(f)
    ]).then(function(u) {
      const h = u[0], p = u[1], d = u[2], g = u[3], m = u[4], y = [];
      for (let v = 0, x = h.length; v < x; v++) {
        const w = h[v], E = p[v], S = d[v], C = g[v], P = m[v];
        if (w === void 0) continue;
        w.updateMatrix && w.updateMatrix();
        const B = n._createAnimationTracks(w, E, S, C, P);
        if (B)
          for (let R = 0; R < B.length; R++)
            y.push(B[R]);
      }
      const T = new Sn(r, void 0, y);
      return V(T, s), T;
    });
  }
  createNodeMesh(e) {
    const t = this.json, n = this, s = t.nodes[e];
    return s.mesh === void 0 ? null : n.getDependency("mesh", s.mesh).then(function(r) {
      const i = n._getNodeRef(n.meshCache, s.mesh, r);
      return s.weights !== void 0 && i.traverse(function(a) {
        if (a.isMesh)
          for (let c = 0, l = s.weights.length; c < l; c++)
            a.morphTargetInfluences[c] = s.weights[c];
      }), i;
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
   *
   * @private
   * @param {number} nodeIndex
   * @return {Promise<Object3D>}
   */
  loadNode(e) {
    const t = this.json, n = this, s = t.nodes[e], r = n._loadNodeShallow(e), i = [], a = s.children || [];
    for (let l = 0, f = a.length; l < f; l++)
      i.push(n.getDependency("node", a[l]));
    const c = s.skin === void 0 ? Promise.resolve(null) : n.getDependency("skin", s.skin);
    return Promise.all([
      r,
      Promise.all(i),
      c
    ]).then(function(l) {
      const f = l[0], u = l[1], h = l[2];
      h !== null && f.traverse(function(p) {
        p.isSkinnedMesh && p.bind(h, Vi);
      });
      for (let p = 0, d = u.length; p < d; p++)
        f.add(u[p]);
      return f;
    });
  }
  // ._loadNodeShallow() parses a single node.
  // skin and child nodes are created and added in .loadNode() (no '_' prefix).
  _loadNodeShallow(e) {
    const t = this.json, n = this.extensions, s = this;
    if (this.nodeCache[e] !== void 0)
      return this.nodeCache[e];
    const r = t.nodes[e], i = r.name ? s.createUniqueName(r.name) : "", a = [], c = s._invokeOne(function(l) {
      return l.createNodeMesh && l.createNodeMesh(e);
    });
    return c && a.push(c), r.camera !== void 0 && a.push(s.getDependency("camera", r.camera).then(function(l) {
      return s._getNodeRef(s.cameraCache, r.camera, l);
    })), s._invokeAll(function(l) {
      return l.createNodeAttachment && l.createNodeAttachment(e);
    }).forEach(function(l) {
      a.push(l);
    }), this.nodeCache[e] = Promise.all(a).then(function(l) {
      let f;
      if (r.isBone === !0 ? f = new mt() : l.length > 1 ? f = new ye() : l.length === 1 ? f = l[0] : f = new pe(), f !== l[0])
        for (let u = 0, h = l.length; u < h; u++)
          f.add(l[u]);
      if (r.name && (f.userData.name = r.name, f.name = i), V(f, r), r.extensions && ne(n, f, r), r.matrix !== void 0) {
        const u = new M();
        u.fromArray(r.matrix), f.applyMatrix4(u);
      } else
        r.translation !== void 0 && f.position.fromArray(r.translation), r.rotation !== void 0 && f.quaternion.fromArray(r.rotation), r.scale !== void 0 && f.scale.fromArray(r.scale);
      if (!s.associations.has(f))
        s.associations.set(f, {});
      else if (r.mesh !== void 0 && s.meshCache.refs[r.mesh] > 1) {
        const u = s.associations.get(f);
        s.associations.set(f, { ...u });
      }
      return s.associations.get(f).nodes = e, f;
    }), this.nodeCache[e];
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
   *
   * @private
   * @param {number} sceneIndex
   * @return {Promise<Group>}
   */
  loadScene(e) {
    const t = this.extensions, n = this.json.scenes[e], s = this, r = new ye();
    n.name && (r.name = s.createUniqueName(n.name)), V(r, n), n.extensions && ne(t, r, n);
    const i = n.nodes || [], a = [];
    for (let c = 0, l = i.length; c < l; c++)
      a.push(s.getDependency("node", i[c]));
    return Promise.all(a).then(function(c) {
      for (let f = 0, u = c.length; f < u; f++)
        r.add(c[f]);
      const l = (f) => {
        const u = /* @__PURE__ */ new Map();
        for (const [h, p] of s.associations)
          (h instanceof st || h instanceof dt) && u.set(h, p);
        return f.traverse((h) => {
          const p = s.associations.get(h);
          p != null && u.set(h, p);
        }), u;
      };
      return s.associations = l(r), r;
    });
  }
  _createAnimationTracks(e, t, n, s, r) {
    const i = [], a = e.name ? e.name : e.uuid, c = [];
    ee[r.path] === ee.weights ? e.traverse(function(h) {
      h.morphTargetInfluences && c.push(h.name ? h.name : h.uuid);
    }) : c.push(a);
    let l;
    switch (ee[r.path]) {
      case ee.weights:
        l = vt;
        break;
      case ee.rotation:
        l = ze;
        break;
      case ee.translation:
      case ee.scale:
        l = yt;
        break;
      default:
        switch (n.itemSize) {
          case 1:
            l = vt;
            break;
          case 2:
          case 3:
          default:
            l = yt;
            break;
        }
        break;
    }
    const f = s.interpolation !== void 0 ? Ui[s.interpolation] : Cn, u = this._getArrayFromAccessor(n);
    for (let h = 0, p = c.length; h < p; h++) {
      const d = new l(
        c[h] + "." + ee[r.path],
        t.array,
        u,
        f
      );
      s.interpolation === "CUBICSPLINE" && this._createCubicSplineTrackInterpolant(d), i.push(d);
    }
    return i;
  }
  _getArrayFromAccessor(e) {
    let t = e.array;
    if (e.normalized) {
      const n = It(t.constructor), s = new Float32Array(t.length);
      for (let r = 0, i = t.length; r < i; r++)
        s[r] = t[r] * n;
      t = s;
    }
    return t;
  }
  _createCubicSplineTrackInterpolant(e) {
    e.createInterpolant = function(n) {
      const s = this instanceof ze ? Ni : Qn;
      return new s(this.times, this.values, this.getValueSize() / 3, n);
    }, e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = !0;
  }
}
function $i(o, e, t) {
  const n = e.attributes, s = new Fs();
  if (n.POSITION !== void 0) {
    const a = t.json.accessors[n.POSITION], c = a.min, l = a.max;
    if (c !== void 0 && l !== void 0) {
      if (s.set(
        new L(c[0], c[1], c[2]),
        new L(l[0], l[1], l[2])
      ), a.normalized) {
        const f = It(Te[a.componentType]);
        s.min.multiplyScalar(f), s.max.multiplyScalar(f);
      }
    } else {
      console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
      return;
    }
  } else
    return;
  const r = e.targets;
  if (r !== void 0) {
    const a = new L(), c = new L();
    for (let l = 0, f = r.length; l < f; l++) {
      const u = r[l];
      if (u.POSITION !== void 0) {
        const h = t.json.accessors[u.POSITION], p = h.min, d = h.max;
        if (p !== void 0 && d !== void 0) {
          if (c.setX(Math.max(Math.abs(p[0]), Math.abs(d[0]))), c.setY(Math.max(Math.abs(p[1]), Math.abs(d[1]))), c.setZ(Math.max(Math.abs(p[2]), Math.abs(d[2]))), h.normalized) {
            const g = It(Te[h.componentType]);
            c.multiplyScalar(g);
          }
          a.max(c);
        } else
          console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
      }
    }
    s.expandByVector(a);
  }
  o.boundingBox = s;
  const i = new Ds();
  s.getCenter(i.center), i.radius = s.min.distanceTo(s.max) / 2, o.boundingSphere = i;
}
function mn(o, e, t) {
  const n = e.attributes, s = [];
  function r(i, a) {
    return t.getDependency("accessor", i).then(function(c) {
      o.setAttribute(a, c);
    });
  }
  for (const i in n) {
    const a = Ct[i] || i.toLowerCase();
    a in o.attributes || s.push(r(n[i], a));
  }
  if (e.indices !== void 0 && !o.index) {
    const i = t.getDependency("accessor", e.indices).then(function(a) {
      o.setIndex(a);
    });
    s.push(i);
  }
  return X.workingColorSpace !== Q && "COLOR_0" in n && console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${X.workingColorSpace}" not supported.`), V(o, e), $i(o, e, t), Promise.all(s).then(function() {
    return e.targets !== void 0 ? ji(o, e.targets, t) : o;
  });
}
var $e;
(function(o) {
  o.FBX = "fbx", o.GLTF = "gltf";
})($e || ($e = {}));
class Wi {
  loader = new ti();
  isSupported(e) {
    return e.toLowerCase().endsWith($e.FBX);
  }
  async load(e) {
    return new Promise((t, n) => {
      this.loader.load(e, (s) => {
        const r = s.animations[0];
        t({
          object: s,
          animation: r
        });
      }, void 0, n);
    });
  }
}
class qi {
  loader = new pi();
  isSupported(e) {
    return e.toLowerCase().endsWith($e.GLTF);
  }
  async load(e) {
    return new Promise((t, n) => {
      this.loader.load(e, (s) => {
        t({
          object: s.scene,
          gltf: s
        });
      }, void 0, n);
    });
  }
}
class Zn {
  loaders = [
    new Wi(),
    new qi()
  ];
  async loadFile(e) {
    const t = this.loaders.find((n) => n.isSupported(e));
    if (!t)
      throw new Error(`Unsupported file type: ${e}`);
    return t.load(e);
  }
}
class Yi {
  target;
  _mixer = null;
  _actions = {};
  _animations = [];
  _currentAction = null;
  _pauseAtPercentage = 0;
  _isPaused = !1;
  _queuedKey = null;
  _fadeDuration = 0.5;
  _currentKey = "";
  _assetLoader = new Zn();
  constructor(e) {
    this.target = e;
  }
  async loadAnimations(e) {
    if (!e.length)
      return;
    const t = await Promise.all(e.map((n) => this._assetLoader.loadFile(n.path)));
    this._animations = t.filter((n) => !!n.animation).map((n) => n.animation), this._animations.length && (this._mixer = new Ps(this.target), this._animations.forEach((n, s) => {
      const r = e[s].key || s.toString();
      this._actions[r] = this._mixer.clipAction(n);
    }), this.playAnimation({ key: Object.keys(this._actions)[0] }));
  }
  update(e) {
    if (!this._mixer || !this._currentAction)
      return;
    this._mixer.update(e);
    const t = this._currentAction.getClip().duration * (this._pauseAtPercentage / 100);
    if (!this._isPaused && this._pauseAtPercentage > 0 && this._currentAction.time >= t && (this._currentAction.time = t, this._currentAction.paused = !0, this._isPaused = !0, this._queuedKey !== null)) {
      const n = this._actions[this._queuedKey];
      n.reset().play(), this._currentAction.crossFadeTo(n, this._fadeDuration, !1), this._currentAction = n, this._currentKey = this._queuedKey, this._queuedKey = null;
    }
  }
  playAnimation(e) {
    if (!this._mixer)
      return;
    const { key: t, pauseAtPercentage: n = 0, pauseAtEnd: s = !1, fadeToKey: r, fadeDuration: i = 0.5 } = e;
    if (t === this._currentKey)
      return;
    this._queuedKey = r || null, this._fadeDuration = i, this._pauseAtPercentage = s ? 100 : n, this._isPaused = !1;
    const a = this._currentAction;
    a && a.stop();
    const c = this._actions[t];
    c && (this._pauseAtPercentage > 0 ? (c.setLoop(ks, 1 / 0), c.clampWhenFinished = !0) : (c.setLoop(Os, 1 / 0), c.clampWhenFinished = !1), a && a.crossFadeTo(c, i, !1), c.reset().play(), this._currentAction = c, this._currentKey = t);
  }
  get currentAnimationKey() {
    return this._currentKey;
  }
  get animations() {
    return this._animations;
  }
}
const gn = /* @__PURE__ */ new Map();
let Qi = 0;
function Jn(o) {
  let e = gn.get(o);
  return e === void 0 && (e = Qi++ % 16, gn.set(o, e)), e;
}
function Zi(o) {
  let e = 0;
  return o.forEach((t) => {
    const n = Jn(t);
    e |= 1 << n;
  }), e;
}
class Ji {
  static = !1;
  sensor = !1;
  gravity = new je(0, 0, 0);
  build(e) {
    const t = this.bodyDesc({
      isDynamicBody: !this.static
    }), n = this.collider(e), s = e.collisionType;
    if (s) {
      let a = Jn(s), c = 65535;
      e.collisionFilter && (c = Zi(e.collisionFilter)), n.setCollisionGroups(a << 16 | c);
    }
    const { KINEMATIC_FIXED: r, DEFAULT: i } = yn;
    return n.activeCollisionTypes = this.sensor ? r : i, [t, n];
  }
  withCollision(e) {
    return this.sensor = e?.sensor ?? this.sensor, this.static = e?.static ?? this.static, this;
  }
  collider(e) {
    const t = e.size ?? new je(1, 1, 1), n = { x: t.x / 2, y: t.y / 2, z: t.z / 2 };
    return ht.cuboid(n.x, n.y, n.z);
  }
  bodyDesc({ isDynamicBody: e = !0 }) {
    const t = e ? Jt.Dynamic : Jt.Fixed;
    return new is(t).setTranslation(0, 0, 0).setGravityScale(1).setCanSleep(!1).setCcdEnabled(!0);
  }
}
class eo {
  _build(e, t, n) {
    const { batched: s, material: r } = e;
    s && console.warn("warning: mesh batching is not implemented");
    const i = new Pe(t, n.at(-1));
    return i.position.set(0, 0, 0), i.castShadow = !0, i.receiveShadow = !0, i;
  }
  _postBuild() {
  }
}
const Mo = new F("#0333EC");
function to(o) {
  const e = Object.keys(o).sort().reduce((t, n) => (t[n] = o[n], t), {});
  return JSON.stringify(e);
}
function no(o) {
  let e = 0;
  for (let t = 0; t < o.length; t++)
    e = Math.imul(31, e) + o.charCodeAt(t) | 0;
  return e.toString(36);
}
new je(0, 0, 0);
new je(1, 1, 1);
var so = `#include <common>

uniform vec3 iResolution;
uniform float iTime;
varying vec2 vUv;

vec3 palette( float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263,0.416,0.557);

    return a + b*cos( 6.28318*(c*t+d) );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);
    
    for (float i = 0.0; i < 4.0; i++) {
        uv = fract(uv * 1.5) - 0.5;

        float d = length(uv) * exp(-length(uv0));

        vec3 col = palette(length(uv0) + i*.4 + iTime*.4);

        d = sin(d*5. + iTime)/5.;
        d = abs(d);

        d = pow(0.01 / d, 1.2);

        finalColor += col * d;
    }
        
    fragColor = vec4(finalColor, 1.0);
}
 
void main() {
  mainImage(gl_FragColor, vUv);
}`, ro = `#include <common>
 
uniform vec3 iResolution;
uniform float iTime;
uniform vec2 iOffset;
varying vec2 vUv;

float snoise(vec3 uv, float res)
{
	const vec3 s = vec3(1e0, 1e2, 1e3);
	
	uv *= res;
	
	vec3 uv0 = floor(mod(uv, res))*s;
	vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;
	
	vec3 f = fract(uv); f = f*f*(3.0-2.0*f);

	vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,
		      	  uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);

	vec4 r = fract(sin(v*1e-1)*1e3);
	float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
	
	r = fract(sin((v + uv1.z - uv0.z)*1e-1)*1e3);
	float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
	
	return mix(r0, r1, f.z)*2.-1.;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
	vec2 p = -.5 + fragCoord.xy / iResolution.xy;
	p.x *= iResolution.x/iResolution.y;
	
	float color = 3.0 - (3.*length(2.*p));
	
	vec3 coord = vec3(atan(p.x,p.y)/6.2832+.5, length(p)*.4, .5);
	
	for(int i = 1; i <= 7; i++)
	{
		float power = pow(2.0, float(i));
		color += (1.5 / power) * snoise(coord + vec3(0.,-iTime*.05, iTime*.01), power*16.);
	}
	fragColor = vec4( color, pow(max(color,0.),2.)*0.4, pow(max(color,0.),3.)*0.15 , 1.0);
}

void main() {
  mainImage(gl_FragColor, vUv);
}`, io = `varying vec3 vBarycentric;
uniform vec3 baseColor;
uniform vec3 wireframeColor;
uniform float wireframeThickness;

float edgeFactor() {
    vec3 d = fwidth(vBarycentric);
    vec3 a3 = smoothstep(vec3(0.0), d * wireframeThickness, vBarycentric);
    return min(min(a3.x, a3.y), a3.z);
}

void main() {
    float edge = edgeFactor();

    vec3 wireColor = wireframeColor;

    vec3 finalColor = mix(wireColor, baseColor, edge);
    
    gl_FragColor = vec4(finalColor, 1.0);
}`, Kt = `uniform vec2 uvScale;
varying vec2 vUv;

void main() {
	vUv = uv;
	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
	gl_Position = projectionMatrix * mvPosition;
}`, oo = `varying vec3 vBarycentric;

void main() {
    vec3 barycentric = vec3(0.0);
    int index = gl_VertexID % 3;
    if (index == 0) barycentric = vec3(1.0, 0.0, 0.0);
    else if (index == 1) barycentric = vec3(0.0, 1.0, 0.0);
    else barycentric = vec3(0.0, 0.0, 1.0);
    vBarycentric = barycentric;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const ao = {
  fragment: so,
  vertex: Kt
}, co = {
  fragment: ro,
  vertex: Kt
}, lo = {
  fragment: Bs,
  vertex: Kt
}, uo = {
  fragment: io,
  vertex: oo
}, we = /* @__PURE__ */ new Map();
we.set("standard", lo);
we.set("fire", co);
we.set("star", ao);
we.set("debug", uo);
class We {
  static batchMaterialMap = /* @__PURE__ */ new Map();
  materials = [];
  batchMaterial(e, t) {
    const n = no(to(e)), s = We.batchMaterialMap.get(n);
    if (s) {
      const r = s.geometryMap.get(t);
      r ? s.geometryMap.set(t, r + 1) : s.geometryMap.set(t, 1);
    } else
      We.batchMaterialMap.set(n, {
        geometryMap: /* @__PURE__ */ new Map([[t, 1]]),
        material: this.materials[0]
      });
  }
  async build(e, t) {
    const { path: n, repeat: s, color: r, shader: i } = e;
    i && this.withShader(i), r && this.withColor(r), await this.setTexture(n ?? null, s), this.materials.length === 0 && this.setColor(new F("#ffffff")), this.batchMaterial(e, t);
  }
  withColor(e) {
    return this.setColor(e), this;
  }
  withShader(e) {
    return this.setShader(e), this;
  }
  async setTexture(e = null, t = new qe(1, 1)) {
    if (!e)
      return;
    const s = await new Dt().loadAsync(e);
    s.repeat = t, s.wrapS = oe, s.wrapT = oe;
    const r = new Ae({
      map: s
    });
    this.materials.push(r);
  }
  setColor(e) {
    const t = new kt({
      color: e,
      emissiveIntensity: 0.5,
      lightMapIntensity: 0.5,
      fog: !0
    });
    this.materials.push(t);
  }
  setShader(e) {
    const { fragment: t, vertex: n } = we.get(e) ?? we.get("standard"), s = new vn({
      uniforms: {
        iResolution: { value: new L(1, 1, 1) },
        iTime: { value: 0 },
        tDiffuse: { value: null },
        tDepth: { value: null },
        tNormal: { value: null }
      },
      vertexShader: n,
      fragmentShader: t
    });
    this.materials.push(s);
  }
}
class fo extends Ji {
}
class _o extends eo {
  build(e) {
    return new Me();
  }
  postBuild() {
  }
}
class ho {
  meshBuilder;
  collisionBuilder;
  materialBuilder;
  options;
  entity;
  constructor(e, t, n, s) {
    this.options = e, this.entity = t, this.meshBuilder = n, this.collisionBuilder = s, this.materialBuilder = new We();
    const r = {
      meshBuilder: this.meshBuilder,
      collisionBuilder: this.collisionBuilder,
      materialBuilder: this.materialBuilder
    };
    this.options._builders = r;
  }
  withPosition(e) {
    return this.options.position = e, this;
  }
  async withMaterial(e, t) {
    return this.materialBuilder && await this.materialBuilder.build(e, t), this;
  }
  applyMaterialToGroup(e, t) {
    e.traverse((n) => {
      n instanceof Pe && n.type === "SkinnedMesh" && t[0] && !n.material.map && (n.material = t[0]), n.castShadow = !0, n.receiveShadow = !0;
    });
  }
  async build() {
    const e = this.entity;
    if (this.materialBuilder && (e.materials = this.materialBuilder.materials), this.meshBuilder && e.materials) {
      const t = this.meshBuilder.build(this.options);
      e.mesh = this.meshBuilder._build(this.options, t, e.materials), this.meshBuilder.postBuild();
    }
    if (e.group && e.materials && this.applyMaterialToGroup(e.group, e.materials), this.collisionBuilder) {
      this.collisionBuilder.withCollision(this.options?.collision || {});
      const [t, n] = this.collisionBuilder.build(this.options);
      e.bodyDesc = t, e.colliderDesc = n;
      const { x: s, y: r, z: i } = this.options.position || { x: 0, y: 0, z: 0 };
      e.bodyDesc.setTranslation(s, r, i);
    }
    if (this.options.collisionType && (e.collisionType = this.options.collisionType), this.options.color instanceof F) {
      const t = (n) => {
        const s = n;
        s && s.color && s.color.set && s.color.set(this.options.color);
      };
      if (e.materials?.length)
        for (const n of e.materials)
          t(n);
      if (e.mesh && e.mesh.material) {
        const n = e.mesh.material;
        Array.isArray(n) ? n.forEach(t) : t(n);
      }
      e.group && e.group.traverse((n) => {
        if (n instanceof Pe && n.material) {
          const s = n.material;
          Array.isArray(s) ? s.forEach(t) : t(s);
        }
      });
    }
    return e;
  }
}
const es = {
  position: { x: 0, y: 0, z: 0 },
  collision: {
    static: !1,
    size: new L(0.5, 0.5, 0.5),
    position: new L(0, 0, 0)
  },
  material: {
    shader: "standard"
  },
  animations: [],
  models: []
};
class po extends fo {
  height = 1;
  objectModel = null;
  constructor(e) {
    super(), this.objectModel = e.objectModel;
  }
  createColliderFromObjectModel(e) {
    if (!e)
      return ht.capsule(1, 1);
    const n = e.children.find((r) => r instanceof Pt).geometry;
    if (n && (n.computeBoundingBox(), n.boundingBox)) {
      const r = n.boundingBox.max.y, i = n.boundingBox.min.y;
      this.height = r - i;
    }
    this.height = 1;
    let s = ht.capsule(this.height / 2, 1);
    return s.setSensor(!1), s.setTranslation(0, this.height + 0.5, 0), s.activeCollisionTypes = yn.DEFAULT, s;
  }
  collider(e) {
    return this.createColliderFromObjectModel(this.objectModel);
  }
}
class mo extends ho {
  createEntity(e) {
    return new Lt(e);
  }
}
const go = Symbol("Actor");
class Lt extends Mr {
  static type = go;
  _object = null;
  _animationDelegate = null;
  _modelFileNames = [];
  _assetLoader = new Zn();
  controlledRotation = !1;
  constructor(e) {
    super(), this.options = { ...es, ...e }, this.lifeCycleDelegate = {
      update: [this.actorUpdate.bind(this)]
    }, this.controlledRotation = !0;
  }
  async load() {
    this._modelFileNames = this.options.models || [], await this.loadModels(), this._object && (this._animationDelegate = new Yi(this._object), await this._animationDelegate.loadAnimations(this.options.animations || []));
  }
  async data() {
    return {
      animations: this._animationDelegate?.animations,
      objectModel: this._object
    };
  }
  async actorUpdate(e) {
    this._animationDelegate?.update(e.delta);
  }
  async loadModels() {
    if (this._modelFileNames.length === 0)
      return;
    const e = this._modelFileNames.map((n) => this._assetLoader.loadFile(n)), t = await Promise.all(e);
    t[0]?.object && (this._object = t[0].object), this._object && (this.group = new ye(), this.group.attach(this._object), this.group.scale.set(this.options.scale?.x || 1, this.options.scale?.y || 1, this.options.scale?.z || 1));
  }
  playAnimation(e) {
    this._animationDelegate?.playAnimation(e);
  }
  get object() {
    return this._object;
  }
  /**
   * Provide custom debug information for the actor
   * This will be merged with the default debug information
   */
  getDebugInfo() {
    const e = {
      type: "Actor",
      models: this._modelFileNames.length > 0 ? this._modelFileNames : "none",
      modelLoaded: !!this._object,
      scale: this.options.scale ? `${this.options.scale.x}, ${this.options.scale.y}, ${this.options.scale.z}` : "1, 1, 1"
    };
    if (this._animationDelegate && (e.currentAnimation = this._animationDelegate.currentAnimationKey || "none", e.animationsCount = this.options.animations?.length || 0), this._object) {
      let t = 0, n = 0;
      this._object.traverse((s) => {
        if (s.isMesh) {
          t++;
          const r = s.geometry;
          r && r.attributes.position && (n += r.attributes.position.count);
        }
      }), e.meshCount = t, e.vertexCount = n;
    }
    return e;
  }
}
async function Co(...o) {
  return await Ir({
    args: o,
    defaultConfig: es,
    EntityClass: Lt,
    BuilderClass: mo,
    CollisionBuilderClass: po,
    entityType: Lt.type
  });
}
export {
  ve as B,
  ho as E,
  Mr as G,
  Lt as Z,
  Co as a,
  Eo as b,
  Ir as c,
  fo as d,
  _o as e,
  xo as f,
  Jn as g,
  wo as h,
  Mo as i,
  So as j,
  Ro as k,
  Ao as l,
  bo as m,
  Us as n,
  Ln as p,
  ur as r,
  Et as s
};
