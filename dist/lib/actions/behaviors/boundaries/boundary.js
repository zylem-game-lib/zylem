const y = {
  boundaries: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  stopMovement: !0
};
function d(i = {}) {
  return {
    type: "update",
    handler: (n) => {
      a(n, i);
    }
  };
}
function a(i, n) {
  const { me: r } = i, { boundaries: s, onBoundary: u } = {
    ...y,
    ...n
  }, e = r.getPosition();
  if (!e)
    return;
  let t = { top: !1, bottom: !1, left: !1, right: !1 };
  if (e.x <= s.left ? t.left = !0 : e.x >= s.right && (t.right = !0), e.y <= s.bottom ? t.bottom = !0 : e.y >= s.top && (t.top = !0), (n.stopMovement ?? !0) && t) {
    const o = r.getVelocity() ?? { x: 0, y: 0 };
    let { x: f, y: l } = o;
    (o?.y < 0 && t.bottom || o?.y > 0 && t.top) && (l = 0), (o?.x < 0 && t.left || o?.x > 0 && t.right) && (f = 0), r.moveXY(f, l);
  }
  u && t && u({
    me: r,
    boundary: t,
    position: { x: e.x, y: e.y, z: e.z },
    updateContext: i
  });
}
export {
  d as boundary2d
};
