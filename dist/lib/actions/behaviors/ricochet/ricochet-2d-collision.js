import { matchesCollisionSelector as T } from "../../../collision/utils.js";
import { clamp as E } from "./ricochet.js";
function tt(O = {}, b) {
  return {
    type: "collision",
    handler: (D) => {
      Z(D, O, b);
    }
  };
}
function Z(O, b, D) {
  const { entity: K, other: y } = O, f = K;
  if (y.collider?.isSensor())
    return;
  const { minSpeed: C = 2, maxSpeed: H = 20, separation: U = 0, collisionWith: L = void 0 } = {
    ...b
  }, I = b?.reflectionMode ?? "angled", W = b?.maxAngleDeg ?? 60, _ = b?.speedUpFactor ?? 1.05, j = b?.minOffsetForAngle ?? 0.15, G = b?.centerRetentionFactor ?? 0.5;
  if (!T(y, L))
    return;
  const i = f.getPosition(), X = y.body?.translation(), e = f.getVelocity();
  if (!i || !X || !e)
    return;
  let c = e.x, o = e.y, Y = i.x, P = i.y;
  const p = i.x - X.x, m = i.y - X.y;
  let n = null, s = null;
  const u = y.collider?.shape;
  if (u && (u.halfExtents && (n = Math.abs(u.halfExtents.x ?? u.halfExtents[0] ?? null), s = Math.abs(u.halfExtents.y ?? u.halfExtents[1] ?? null)), (n == null || s == null) && typeof u.radius == "number" && (n = n ?? Math.abs(u.radius), s = s ?? Math.abs(u.radius))), (n == null || s == null) && typeof y.collider?.halfExtents == "function") {
    const t = y.collider.halfExtents();
    t && (n = n ?? Math.abs(t.x), s = s ?? Math.abs(t.y));
  }
  if ((n == null || s == null) && typeof y.collider?.radius == "function") {
    const t = y.collider.radius();
    typeof t == "number" && (n = n ?? Math.abs(t), s = s ?? Math.abs(t));
  }
  let q = 0, z = 0;
  n && s ? (q = E(p / n, -1, 1), z = E(m / s, -1, 1)) : (q = Math.sign(p), z = Math.sign(m));
  let J = Math.abs(m) >= Math.abs(p), a = null, l = null;
  const M = f.collider?.shape;
  if (M && (M.halfExtents && (a = Math.abs(M.halfExtents.x ?? M.halfExtents[0] ?? null), l = Math.abs(M.halfExtents.y ?? M.halfExtents[1] ?? null)), (a == null || l == null) && typeof M.radius == "number" && (a = a ?? Math.abs(M.radius), l = l ?? Math.abs(M.radius))), (a == null || l == null) && typeof f.collider?.halfExtents == "function") {
    const t = f.collider.halfExtents();
    t && (a = a ?? Math.abs(t.x), l = l ?? Math.abs(t.y));
  }
  if ((a == null || l == null) && typeof f.collider?.radius == "function") {
    const t = f.collider.radius();
    typeof t == "number" && (a = a ?? Math.abs(t), l = l ?? Math.abs(t));
  }
  if (n != null && s != null && a != null && l != null) {
    const t = a + n - Math.abs(p), r = l + s - Math.abs(m);
    !Number.isNaN(t) && !Number.isNaN(r) && (J = r <= t);
  }
  let F = !1;
  if (J) {
    const t = (s ?? 0) + (l ?? 0) + U;
    if (P = X.y + (m > 0 ? t : -t), Y = i.x, n != null && s != null && n > s && I === "angled") {
      const v = W * Math.PI / 180, g = Math.max(0, Math.min(1, j)), N = E(q, -1, 1), V = Math.abs(N), S = Math.sqrt(e.x * e.x + e.y * e.y), h = E(S * _, C, H);
      if (V > g) {
        const d = (V - g) / (1 - g), x = Math.sign(N) * (d * v), A = Math.cos(x), w = Math.sin(x), B = Math.abs(h * A), Q = h * w;
        o = m > 0 ? B : -B, c = Q;
      } else {
        const d = e.x * G, x = Math.max(0, h * h - d * d), A = Math.sqrt(x);
        o = m > 0 ? A : -A, c = d;
      }
      F = !0;
    } else
      o = m > 0 ? Math.abs(e.y) : -Math.abs(e.y), I === "simple" && (F = !0);
  } else {
    const t = (n ?? 0) + (a ?? 0) + U;
    if (Y = X.x + (p > 0 ? t : -t), P = i.y, I === "angled") {
      const r = W * Math.PI / 180, v = Math.max(0, Math.min(1, j)), g = E(z, -1, 1), N = Math.abs(g), V = Math.sqrt(e.x * e.x + e.y * e.y), S = E(V * _, C, H);
      if (N > v) {
        const h = (N - v) / (1 - v), d = Math.sign(g) * (h * r), x = Math.cos(d), A = Math.sin(d), w = Math.abs(S * x), B = S * A;
        c = p > 0 ? w : -w, o = B;
      } else {
        const h = e.y * G, d = Math.max(0, S * S - h * h), x = Math.sqrt(d);
        c = p > 0 ? x : -x, o = h;
      }
      F = !0;
    } else
      c = p > 0 ? Math.abs(e.x) : -Math.abs(e.x), o = e.y, F = !0;
  }
  if (!F) {
    const t = Math.abs(c), r = Math.abs(o), v = Math.sign(q) * Math.abs(q) * t, g = Math.sign(z) * Math.abs(z) * r;
    c += v, o += g;
  }
  const R = Math.sqrt(c * c + o * o);
  if (R > 0) {
    const t = E(R, C, H);
    if (t !== R) {
      const r = t / R;
      c *= r, o *= r;
    }
  }
  (Y !== i.x || P !== i.y) && (f.setPosition(Y, P, i.z), f.moveXY(c, o), D && f.getVelocity() && D({
    position: { x: Y, y: P, z: i.z },
    ...O
  }));
}
export {
  tt as ricochet2DCollision
};
