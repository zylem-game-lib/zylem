import { Vector3 as g, Euler as i, MathUtils as a, Quaternion as l } from "three";
function b(o, t) {
  if (!o.body)
    return;
  const e = Math.atan2(-t.x, t.z);
  c(o, e);
}
function c(o, t) {
  f(o, new g(0, -t, 0));
}
function f(o, t) {
  if (!o.group)
    return;
  const e = new i(t.x, t.y, t.z);
  o.group.setRotationFromEuler(e);
}
function h(o, t) {
  s(o, t);
}
function D(o, t) {
  u(o, t);
}
function s(o, t) {
  if (!o.body)
    return;
  const e = t / 2, r = Math.cos(e), n = Math.sin(e);
  o.body.setRotation({ w: r, x: 0, y: n, z: 0 }, !0);
}
function w(o, t) {
  o.body && s(o, a.degToRad(t));
}
function R(o, t) {
  if (!o.body)
    return;
  const e = t / 2, r = Math.cos(e), n = Math.sin(e);
  o.body.setRotation({ w: r, x: n, y: 0, z: 0 }, !0);
}
function x(o, t) {
  o.body && R(o, a.degToRad(t));
}
function u(o, t) {
  if (!o.body)
    return;
  const e = t / 2, r = Math.cos(e), n = Math.sin(e);
  o.body.setRotation({ w: r, x: 0, y: 0, z: n }, !0);
}
function z(o, t) {
  o.body && u(o, a.degToRad(t));
}
function d(o, t, e, r) {
  if (!o.body)
    return;
  const n = new l().setFromEuler(new i(t, e, r));
  o.body.setRotation({ w: n.w, x: n.x, y: n.y, z: n.z }, !0);
}
function E(o, t, e, r) {
  o.body && d(o, a.degToRad(t), a.degToRad(e), a.degToRad(r));
}
function M(o) {
  return o.body ? o.body.rotation() : null;
}
function m(o) {
  const t = o;
  return t.rotateInDirection = (e) => b(o, e), t.rotateYEuler = (e) => c(o, e), t.rotateEuler = (e) => f(o, e), t.rotateY = (e) => h(o, e), t.rotateZ = (e) => D(o, e), t.setRotationY = (e) => s(o, e), t.setRotationX = (e) => R(o, e), t.setRotationZ = (e) => u(o, e), t.setRotationDegreesY = (e) => w(o, e), t.setRotationDegreesX = (e) => x(o, e), t.setRotationDegreesZ = (e) => z(o, e), t.setRotationDegrees = (e, r, n) => E(o, e, r, n), t.setRotation = (e, r, n) => d(o, e, r, n), t.getRotation = () => M(o), t;
}
export {
  M as getRotation,
  m as makeRotatable,
  f as rotateEuler,
  b as rotateInDirection,
  h as rotateY,
  c as rotateYEuler,
  D as rotateZ,
  d as setRotation,
  E as setRotationDegrees,
  x as setRotationDegreesX,
  w as setRotationDegreesY,
  z as setRotationDegreesZ,
  R as setRotationX,
  s as setRotationY,
  u as setRotationZ
};
