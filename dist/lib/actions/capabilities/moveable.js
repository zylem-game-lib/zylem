import { Vector3 as l } from "three";
function b(o, e) {
  if (!o.body)
    return;
  const n = o.body.linvel(), r = new l(e, n.y, n.z);
  o.body.setLinvel(r, !0);
}
function y(o, e) {
  if (!o.body)
    return;
  const n = o.body.linvel(), r = new l(n.x, e, n.z);
  o.body.setLinvel(r, !0);
}
function m(o, e) {
  if (!o.body)
    return;
  const n = o.body.linvel(), r = new l(n.x, n.y, e);
  o.body.setLinvel(r, !0);
}
function w(o, e, n) {
  if (!o.body)
    return;
  const r = o.body.linvel(), c = new l(e, n, r.z);
  o.body.setLinvel(c, !0);
}
function V(o, e, n) {
  if (!o.body)
    return;
  const r = o.body.linvel(), c = new l(e, r.y, n);
  o.body.setLinvel(c, !0);
}
function P(o, e) {
  if (!o.body)
    return;
  const n = o.body.linvel(), r = new l(n.x + e.x, n.y + e.y, n.z + e.z);
  o.body.setLinvel(r, !0);
}
function p(o) {
  o.body && (o.body.setLinvel(new l(0, 0, 0), !0), o.body.setLinearDamping(5));
}
function x(o, e, n) {
  const r = Math.sin(-n) * e, c = Math.cos(-n) * e;
  w(o, r, c);
}
function u(o) {
  return o.body ? o.body.translation() : null;
}
function X(o) {
  return o.body ? o.body.linvel() : null;
}
function f(o, e, n, r) {
  o.body && o.body.setTranslation({ x: e, y: n, z: r }, !0);
}
function z(o, e) {
  if (!o.body)
    return;
  const { y: n, z: r } = o.body.translation();
  o.body.setTranslation({ x: e, y: n, z: r }, !0);
}
function L(o, e) {
  if (!o.body)
    return;
  const { x: n, z: r } = o.body.translation();
  o.body.setTranslation({ x: n, y: e, z: r }, !0);
}
function Y(o, e) {
  if (!o.body)
    return;
  const { x: n, y: r } = o.body.translation();
  o.body.setTranslation({ x: n, y: r, z: e }, !0);
}
function g(o, e, n) {
  const r = u(o);
  if (!r)
    return;
  const { x: c, y: t } = r, i = c > e ? -e : c < -e ? e : c, s = t > n ? -n : t < -n ? n : t;
  (i !== c || s !== t) && f(o, i, s, 0);
}
function T(o, e, n, r) {
  const c = u(o);
  if (!c)
    return;
  const { x: t, y: i, z: s } = c, a = t > e ? -e : t < -e ? e : t, d = i > n ? -n : i < -n ? n : i, v = s > r ? -r : s < -r ? r : s;
  (a !== t || d !== i || v !== s) && f(o, a, d, v);
}
function A(o) {
  const e = o;
  return e.moveX = (n) => b(o, n), e.moveY = (n) => y(o, n), e.moveZ = (n) => m(o, n), e.moveXY = (n, r) => w(o, n, r), e.moveXZ = (n, r) => V(o, n, r), e.move = (n) => P(o, n), e.resetVelocity = () => p(o), e.moveForwardXY = (n, r) => x(o, n, r), e.getPosition = () => u(o), e.getVelocity = () => X(o), e.setPosition = (n, r, c) => f(o, n, r, c), e.setPositionX = (n) => z(o, n), e.setPositionY = (n) => L(o, n), e.setPositionZ = (n) => Y(o, n), e.wrapAroundXY = (n, r) => g(o, n, r), e.wrapAround3D = (n, r, c) => T(o, n, r, c), e;
}
export {
  u as getPosition,
  X as getVelocity,
  A as makeMoveable,
  P as move,
  x as moveForwardXY,
  b as moveX,
  w as moveXY,
  V as moveXZ,
  y as moveY,
  m as moveZ,
  p as resetVelocity,
  f as setPosition,
  z as setPositionX,
  L as setPositionY,
  Y as setPositionZ,
  T as wrapAround3D,
  g as wrapAroundXY
};
