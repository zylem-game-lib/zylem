import { g as Rt, a as Pt, b as zt, c as Ht, d as Xt, v as Yt } from "./chunks/global-change-CTpQyb8j.js";
import { s as Dt } from "./chunks/stage-B8WmdLRN.js";
import { e as Vt } from "./chunks/entity-spawner-Bn0ORMon.js";
import { P as Bt, c as It } from "./chunks/camera-Clk19MUu.js";
import { D as at } from "./chunks/zone-v06aEcA3.js";
import { Z as Nt, b as Ot, p as Gt, s as Ut, a as $t, z as Lt } from "./chunks/zone-v06aEcA3.js";
import { c as nt, G as it, E as ot, g as rt, b as lt } from "./chunks/actor-CDwH9h9-.js";
import { a as jt } from "./chunks/actor-CDwH9h9-.js";
import { Vector2 as j, Group as ct, CanvasTexture as Q, LinearFilter as Z, SpriteMaterial as ht, Sprite as ft, ClampToEdgeWrapping as tt, Color as et } from "three";
import * as _t from "three";
import { m as Kt, a as Qt, b as te } from "./chunks/transformable-w6tbWWdP.js";
import { Howl as se } from "howler";
import * as vt from "@dimforge/rapier3d-compat";
const J = {
  position: void 0,
  text: "",
  fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: 18,
  fontColor: "#FFFFFF",
  backgroundColor: null,
  padding: 4,
  stickToViewport: !0,
  screenPosition: new j(24, 24),
  zDistance: 1
};
class pt extends ot {
  createEntity(t) {
    return new O(t);
  }
}
const ut = Symbol("Text");
class O extends it {
  static type = ut;
  _sprite = null;
  _texture = null;
  _canvas = null;
  _ctx = null;
  _cameraRef = null;
  _lastCanvasW = 0;
  _lastCanvasH = 0;
  constructor(t) {
    super(), this.options = { ...J, ...t }, this.group = new ct(), this.createSprite(), this.lifeCycleDelegate = {
      setup: [this.textSetup.bind(this)],
      update: [this.textUpdate.bind(this)]
    };
  }
  createSprite() {
    this._canvas = document.createElement("canvas"), this._ctx = this._canvas.getContext("2d"), this._texture = new Q(this._canvas), this._texture.minFilter = Z, this._texture.magFilter = Z;
    const t = new ht({
      map: this._texture,
      transparent: !0,
      depthTest: !1,
      depthWrite: !1,
      alphaTest: 0.5
    });
    this._sprite = new ft(t), this.group?.add(this._sprite), this.redrawText(this.options.text ?? "");
  }
  redrawText(t) {
    if (!this._canvas || !this._ctx)
      return;
    const s = this.options.fontSize ?? 18, o = this.options.fontFamily ?? J.fontFamily, n = this.options.padding ?? 4;
    this._ctx.font = `${s}px ${o}`;
    const c = this._ctx.measureText(t), T = Math.ceil(c.width), h = Math.ceil(s * 1.4), m = Math.max(2, T + n * 2), l = Math.max(2, h + n * 2), d = m !== this._lastCanvasW || l !== this._lastCanvasH;
    this._canvas.width = m, this._canvas.height = l, this._lastCanvasW = m, this._lastCanvasH = l, this._ctx.font = `${s}px ${o}`, this._ctx.textBaseline = "top", this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height), this.options.backgroundColor && (this._ctx.fillStyle = this.toCssColor(this.options.backgroundColor), this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height)), this._ctx.fillStyle = this.toCssColor(this.options.fontColor ?? "#FFFFFF"), this._ctx.fillText(t, n, n), this._texture && (d && (this._texture.dispose(), this._texture = new Q(this._canvas), this._texture.minFilter = Z, this._texture.magFilter = Z, this._texture.wrapS = tt, this._texture.wrapT = tt), this._texture.image = this._canvas, this._texture.needsUpdate = !0, this._sprite && this._sprite.material && (this._sprite.material.map = this._texture, this._sprite.material.needsUpdate = !0));
  }
  toCssColor(t) {
    return typeof t == "string" ? t : `#${(t instanceof et ? t : new et(t)).getHexString()}`;
  }
  textSetup(t) {
    this._cameraRef = t.camera, this.options.stickToViewport && this._cameraRef && this._cameraRef.camera.add(this.group);
  }
  textUpdate(t) {
    this._sprite && this.options.stickToViewport && this._cameraRef && this.updateStickyTransform();
  }
  updateStickyTransform() {
    if (!this._sprite || !this._cameraRef)
      return;
    const t = this._cameraRef.camera, s = this._cameraRef.renderer.domElement, o = s.clientWidth, n = s.clientHeight, c = (this.options.screenPosition ?? new j(24, 24)).x, T = (this.options.screenPosition ?? new j(24, 24)).y, h = Math.max(1e-3, this.options.zDistance ?? 1);
    let m = 1, l = 1;
    if (t.isPerspectiveCamera) {
      const f = t, r = Math.tan(f.fov * Math.PI / 180 / 2) * h;
      m = r * f.aspect, l = r;
    } else if (t.isOrthographicCamera) {
      const f = t;
      m = (f.right - f.left) / 2, l = (f.top - f.bottom) / 2;
    }
    const d = c / o * 2 - 1, _ = 1 - T / n * 2, v = d * m, w = _ * l;
    if (this.group?.position.set(v, w, -h), this._canvas) {
      const r = l * 2 / n, g = this._canvas.height, a = Math.max(1e-4, g * r), x = this._canvas.width / this._canvas.height, y = a * x;
      this._sprite.scale.set(y, a, 1);
    }
  }
  updateText(t) {
    this.options.text = t, this.redrawText(t), this.options.stickToViewport && this._cameraRef && this.updateStickyTransform();
  }
  buildInfo() {
    return {
      ...new at(this).buildDebugInfo(),
      type: String(O.type),
      text: this.options.text ?? "",
      sticky: this.options.stickToViewport
    };
  }
}
async function wt(...i) {
  return nt({
    args: i,
    defaultConfig: { ...J },
    EntityClass: O,
    BuilderClass: pt,
    entityType: O.type
  });
}
function dt(i, t) {
  if (!t)
    return !0;
  const s = i.name ?? "";
  if ("name" in t) {
    const o = t.name;
    return o instanceof RegExp ? o.test(s) : Array.isArray(o) ? o.some((n) => n === s) : s === o;
  } else if ("mask" in t) {
    const o = t.mask;
    if (o instanceof RegExp) {
      const n = i.collisionType ?? "";
      return o.test(n);
    } else {
      const n = i.collisionType ?? "", c = rt(n);
      return (o & 1 << c) !== 0;
    }
  } else if ("test" in t)
    return !!t.test(i);
  return !0;
}
function St(i = {}, t) {
  return {
    type: "collision",
    handler: (s) => {
      xt(s, i, t);
    }
  };
}
function xt(i, t, s) {
  const { entity: o, other: n } = i, c = o;
  if (n.collider?.isSensor())
    return;
  const { minSpeed: T = 2, maxSpeed: h = 20, separation: m = 0, collisionWith: l = void 0 } = {
    ...t
  }, d = t?.reflectionMode ?? "angled", _ = t?.maxAngleDeg ?? 60, v = t?.speedUpFactor ?? 1.05, w = t?.minOffsetForAngle ?? 0.15, f = t?.centerRetentionFactor ?? 0.5;
  if (!dt(n, l))
    return;
  const r = c.getPosition(), g = n.body?.translation(), a = c.getVelocity();
  if (!r || !g || !a)
    return;
  let x = a.x, y = a.y, V = r.x, W = r.y;
  const z = r.x - g.x, H = r.y - g.y;
  let p = null, u = null;
  const F = n.collider?.shape;
  if (F && (F.halfExtents && (p = Math.abs(F.halfExtents.x ?? F.halfExtents[0] ?? null), u = Math.abs(F.halfExtents.y ?? F.halfExtents[1] ?? null)), (p == null || u == null) && typeof F.radius == "number" && (p = p ?? Math.abs(F.radius), u = u ?? Math.abs(F.radius))), (p == null || u == null) && typeof n.collider?.halfExtents == "function") {
    const e = n.collider.halfExtents();
    e && (p = p ?? Math.abs(e.x), u = u ?? Math.abs(e.y));
  }
  if ((p == null || u == null) && typeof n.collider?.radius == "function") {
    const e = n.collider.radius();
    typeof e == "number" && (p = p ?? Math.abs(e), u = u ?? Math.abs(e));
  }
  let B = 0, I = 0;
  p && u ? (B = Y(z / p, -1, 1), I = Y(H / u, -1, 1)) : (B = Math.sign(z), I = Math.sign(H));
  let K = Math.abs(H) >= Math.abs(z), b = null, M = null;
  const R = c.collider?.shape;
  if (R && (R.halfExtents && (b = Math.abs(R.halfExtents.x ?? R.halfExtents[0] ?? null), M = Math.abs(R.halfExtents.y ?? R.halfExtents[1] ?? null)), (b == null || M == null) && typeof R.radius == "number" && (b = b ?? Math.abs(R.radius), M = M ?? Math.abs(R.radius))), (b == null || M == null) && typeof c.collider?.halfExtents == "function") {
    const e = c.collider.halfExtents();
    e && (b = b ?? Math.abs(e.x), M = M ?? Math.abs(e.y));
  }
  if ((b == null || M == null) && typeof c.collider?.radius == "function") {
    const e = c.collider.radius();
    typeof e == "number" && (b = b ?? Math.abs(e), M = M ?? Math.abs(e));
  }
  if (p != null && u != null && b != null && M != null) {
    const e = b + p - Math.abs(z), S = M + u - Math.abs(H);
    !Number.isNaN(e) && !Number.isNaN(S) && (K = S <= e);
  }
  let q = !1;
  if (K) {
    const e = (u ?? 0) + (M ?? 0) + m;
    if (W = g.y + (H > 0 ? e : -e), V = r.x, p != null && u != null && p > u && d === "angled") {
      const A = _ * Math.PI / 180, X = Math.max(0, Math.min(1, w)), N = Y(B, -1, 1), U = Math.abs(N), D = Math.sqrt(a.x * a.x + a.y * a.y), C = Y(D * v, T, h);
      if (U > X) {
        const E = (U - X) / (1 - X), P = Math.sign(N) * (E * A), k = Math.cos(P), $ = Math.sin(P), L = Math.abs(C * k), st = C * $;
        y = H > 0 ? L : -L, x = st;
      } else {
        const E = a.x * f, P = Math.max(0, C * C - E * E), k = Math.sqrt(P);
        y = H > 0 ? k : -k, x = E;
      }
      q = !0;
    } else
      y = H > 0 ? Math.abs(a.y) : -Math.abs(a.y), d === "simple" && (q = !0);
  } else {
    const e = (p ?? 0) + (b ?? 0) + m;
    if (V = g.x + (z > 0 ? e : -e), W = r.y, d === "angled") {
      const S = _ * Math.PI / 180, A = Math.max(0, Math.min(1, w)), X = Y(I, -1, 1), N = Math.abs(X), U = Math.sqrt(a.x * a.x + a.y * a.y), D = Y(U * v, T, h);
      if (N > A) {
        const C = (N - A) / (1 - A), E = Math.sign(X) * (C * S), P = Math.cos(E), k = Math.sin(E), $ = Math.abs(D * P), L = D * k;
        x = z > 0 ? $ : -$, y = L;
      } else {
        const C = a.y * f, E = Math.max(0, D * D - C * C), P = Math.sqrt(E);
        x = z > 0 ? P : -P, y = C;
      }
      q = !0;
    } else
      x = z > 0 ? Math.abs(a.x) : -Math.abs(a.x), y = a.y, q = !0;
  }
  if (!q) {
    const e = Math.abs(x), S = Math.abs(y), A = Math.sign(B) * Math.abs(B) * e, X = Math.sign(I) * Math.abs(I) * S;
    x += A, y += X;
  }
  const G = Math.sqrt(x * x + y * y);
  if (G > 0) {
    const e = Y(G, T, h);
    if (e !== G) {
      const S = e / G;
      x *= S, y *= S;
    }
  }
  (V !== r.x || W !== r.y) && (c.setPosition(V, W, r.z), c.moveXY(x, y), s && c.getVelocity() && s({
    position: { x: V, y: W, z: r.z },
    ...i
  }));
}
function Y(i, t, s) {
  return Math.max(t, Math.min(s, i));
}
function Ct(i = {}, t) {
  return {
    type: "update",
    handler: (s) => {
      mt(s, i, t);
    }
  };
}
function mt(i, t, s) {
  const { me: o } = i, { restitution: n = 0, minSpeed: c = 2, maxSpeed: T = 20, boundaries: h = { top: 5, bottom: -5, left: -6.5, right: 6.5 }, separation: m = 0 } = { ...t }, l = o.getPosition(), d = o.getVelocity();
  if (!l || !d)
    return;
  let _ = d.x, v = d.y, w = l.x, f = l.y, r = null;
  l.x <= h.left ? (_ = Math.abs(d.x), w = h.left + m, r = "left") : l.x >= h.right && (_ = -Math.abs(d.x), w = h.right - m, r = "right"), l.y <= h.bottom ? (v = Math.abs(d.y), f = h.bottom + m, r = "bottom") : l.y >= h.top && (v = -Math.abs(d.y), f = h.top - m, r = "top");
  const g = Math.sqrt(_ * _ + v * v);
  if (g > 0) {
    const a = Y(g, c, T);
    if (a !== g) {
      const x = a / g;
      _ *= x, v *= x;
    }
  }
  if (n && (_ *= n, v *= n), (w !== l.x || f !== l.y) && (o.setPosition(w, f, l.z), o.moveXY(_, v), s && r)) {
    const a = o.getVelocity();
    a && s({
      boundary: r,
      position: { x: w, y: f, z: l.z },
      velocityBefore: d,
      velocityAfter: a,
      ...i
    });
  }
}
function yt(i, t, s) {
  s({
    me: i,
    globals: t
  });
}
function Et(i, t) {
  const s = t ?? lt();
  yt(i, s, i.nodeDestroy.bind(i));
}
export {
  se as Howl,
  Bt as Perspectives,
  vt as RAPIER,
  _t as THREE,
  Nt as ZylemBox,
  jt as actor,
  Ot as box,
  It as camera,
  Et as destroy,
  Vt as entitySpawner,
  Rt as game,
  Pt as globalChange,
  zt as globalChanges,
  Kt as makeMoveable,
  Qt as makeRotatable,
  te as makeTransformable,
  Gt as plane,
  St as ricochet2DCollision,
  Ct as ricochet2DInBounds,
  Ut as sphere,
  $t as sprite,
  Dt as stage,
  wt as text,
  Ht as variableChange,
  Xt as variableChanges,
  Yt as vessel,
  Lt as zone
};
