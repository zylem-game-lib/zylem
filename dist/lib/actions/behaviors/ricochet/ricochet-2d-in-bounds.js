import { clamp as g } from "./ricochet.js";
function w(a = {}, u) {
  return {
    type: "update",
    handler: (y) => {
      M(y, a, u);
    }
  };
}
function M(a, u, y) {
  const { me: r } = a, { restitution: d = 0, minSpeed: b = 2, maxSpeed: x = 20, boundaries: e = { top: 5, bottom: -5, left: -6.5, right: 6.5 }, separation: p = 0 } = { ...u }, t = r.getPosition(), o = r.getVelocity();
  if (!t || !o)
    return;
  let i = o.x, n = o.y, c = t.x, l = t.y, s = null;
  t.x <= e.left ? (i = Math.abs(o.x), c = e.left + p, s = "left") : t.x >= e.right && (i = -Math.abs(o.x), c = e.right - p, s = "right"), t.y <= e.bottom ? (n = Math.abs(o.y), l = e.bottom + p, s = "bottom") : t.y >= e.top && (n = -Math.abs(o.y), l = e.top - p, s = "top");
  const h = Math.sqrt(i * i + n * n);
  if (h > 0) {
    const f = g(h, b, x);
    if (f !== h) {
      const m = f / h;
      i *= m, n *= m;
    }
  }
  if (d && (i *= d, n *= d), (c !== t.x || l !== t.y) && (r.setPosition(c, l, t.z), r.moveXY(i, n), y && s)) {
    const f = r.getVelocity();
    f && y({
      boundary: s,
      position: { x: c, y: l, z: t.z },
      velocityBefore: o,
      velocityAfter: f,
      ...a
    });
  }
}
export {
  w as ricochet2DInBounds
};
