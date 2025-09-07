import { Vector3 as c, Euler as v, MathUtils as u, Quaternion as V } from "three";
function Y(o, n) {
  if (!o.body)
    return;
  const t = o.body.linvel(), e = new c(n, t.y, t.z);
  o.body.setLinvel(e, !0);
}
function p(o, n) {
  if (!o.body)
    return;
  const t = o.body.linvel(), e = new c(t.x, n, t.z);
  o.body.setLinvel(e, !0);
}
function X(o, n) {
  if (!o.body)
    return;
  const t = o.body.linvel(), e = new c(t.x, t.y, n);
  o.body.setLinvel(e, !0);
}
function g(o, n, t) {
  if (!o.body)
    return;
  const e = o.body.linvel(), r = new c(n, t, e.z);
  o.body.setLinvel(r, !0);
}
function D(o, n, t) {
  if (!o.body)
    return;
  const e = o.body.linvel(), r = new c(n, e.y, t);
  o.body.setLinvel(r, !0);
}
function M(o, n) {
  if (!o.body)
    return;
  const t = o.body.linvel(), e = new c(t.x + n.x, t.y + n.y, t.z + n.z);
  o.body.setLinvel(e, !0);
}
function T(o) {
  o.body && (o.body.setLinvel(new c(0, 0, 0), !0), o.body.setLinearDamping(5));
}
function P(o, n, t) {
  const e = Math.sin(-t) * n, r = Math.cos(-t) * n;
  g(o, e, r);
}
function l(o) {
  return o.body ? o.body.translation() : null;
}
function Z(o) {
  return o.body ? o.body.linvel() : null;
}
function f(o, n, t, e) {
  o.body && o.body.setTranslation({ x: n, y: t, z: e }, !0);
}
function E(o, n) {
  if (!o.body)
    return;
  const { y: t, z: e } = o.body.translation();
  o.body.setTranslation({ x: n, y: t, z: e }, !0);
}
function L(o, n) {
  if (!o.body)
    return;
  const { x: t, z: e } = o.body.translation();
  o.body.setTranslation({ x: t, y: n, z: e }, !0);
}
function A(o, n) {
  if (!o.body)
    return;
  const { x: t, y: e } = o.body.translation();
  o.body.setTranslation({ x: t, y: e, z: n }, !0);
}
function F(o, n, t) {
  const e = l(o);
  if (!e)
    return;
  const { x: r, y: s } = e, a = r > n ? -n : r < -n ? n : r, i = s > t ? -t : s < -t ? t : s;
  (a !== r || i !== s) && f(o, a, i, 0);
}
function k(o, n, t, e) {
  const r = l(o);
  if (!r)
    return;
  const { x: s, y: a, z: i } = r, w = s > n ? -n : s < -n ? n : s, R = a > t ? -t : a < -t ? t : a, m = i > e ? -e : i < -e ? e : i;
  (w !== s || R !== a || m !== i) && f(o, w, R, m);
}
function C(o) {
  const n = o;
  return n.moveX = (t) => Y(o, t), n.moveY = (t) => p(o, t), n.moveZ = (t) => X(o, t), n.moveXY = (t, e) => g(o, t, e), n.moveXZ = (t, e) => D(o, t, e), n.move = (t) => M(o, t), n.resetVelocity = () => T(o), n.moveForwardXY = (t, e) => P(o, t, e), n.getPosition = () => l(o), n.getVelocity = () => Z(o), n.setPosition = (t, e, r) => f(o, t, e, r), n.setPositionX = (t) => E(o, t), n.setPositionY = (t) => L(o, t), n.setPositionZ = (t) => A(o, t), n.wrapAroundXY = (t, e) => F(o, t, e), n.wrapAround3D = (t, e, r) => k(o, t, e, r), n;
}
function I(o, n) {
  if (!o.body)
    return;
  const t = Math.atan2(-n.x, n.z);
  y(o, t);
}
function y(o, n) {
  x(o, new c(0, -n, 0));
}
function x(o, n) {
  if (!o.group)
    return;
  const t = new v(n.x, n.y, n.z);
  o.group.setRotationFromEuler(t);
}
function q(o, n) {
  d(o, n);
}
function Q(o, n) {
  b(o, n);
}
function d(o, n) {
  if (!o.body)
    return;
  const t = n / 2, e = Math.cos(t), r = Math.sin(t);
  o.body.setRotation({ w: e, x: 0, y: r, z: 0 }, !0);
}
function U(o, n) {
  o.body && d(o, u.degToRad(n));
}
function h(o, n) {
  if (!o.body)
    return;
  const t = n / 2, e = Math.cos(t), r = Math.sin(t);
  o.body.setRotation({ w: e, x: r, y: 0, z: 0 }, !0);
}
function j(o, n) {
  o.body && h(o, u.degToRad(n));
}
function b(o, n) {
  if (!o.body)
    return;
  const t = n / 2, e = Math.cos(t), r = Math.sin(t);
  o.body.setRotation({ w: e, x: 0, y: 0, z: r }, !0);
}
function B(o, n) {
  o.body && b(o, u.degToRad(n));
}
function z(o, n, t, e) {
  if (!o.body)
    return;
  const r = new V().setFromEuler(new v(n, t, e));
  o.body.setRotation({ w: r.w, x: r.x, y: r.y, z: r.z }, !0);
}
function G(o, n, t, e) {
  o.body && z(o, u.degToRad(n), u.degToRad(t), u.degToRad(e));
}
function H(o) {
  return o.body ? o.body.rotation() : null;
}
function J(o) {
  const n = o;
  return n.rotateInDirection = (t) => I(o, t), n.rotateYEuler = (t) => y(o, t), n.rotateEuler = (t) => x(o, t), n.rotateY = (t) => q(o, t), n.rotateZ = (t) => Q(o, t), n.setRotationY = (t) => d(o, t), n.setRotationX = (t) => h(o, t), n.setRotationZ = (t) => b(o, t), n.setRotationDegreesY = (t) => U(o, t), n.setRotationDegreesX = (t) => j(o, t), n.setRotationDegreesZ = (t) => B(o, t), n.setRotationDegrees = (t, e, r) => G(o, t, e, r), n.setRotation = (t, e, r) => z(o, t, e, r), n.getRotation = () => H(o), n;
}
function N(o) {
  const n = C(o);
  return J(n);
}
export {
  J as a,
  N as b,
  C as m
};
