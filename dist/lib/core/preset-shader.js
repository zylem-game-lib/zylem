import r from "../graphics/shaders/fragment/stars.glsl.js";
import a from "../graphics/shaders/fragment/fire.glsl.js";
import d from "../graphics/shaders/fragment/standard.glsl.js";
import f from "../graphics/shaders/fragment/debug.glsl.js";
import t from "../graphics/shaders/vertex/object-shader.glsl.js";
import o from "../graphics/shaders/vertex/debug.glsl.js";
const s = {
  fragment: r,
  vertex: t
}, m = {
  fragment: a,
  vertex: t
}, n = {
  fragment: d,
  vertex: t
}, u = {
  fragment: f,
  vertex: o
}, e = /* @__PURE__ */ new Map();
e.set("standard", n);
e.set("fire", m);
e.set("star", s);
e.set("debug", u);
export {
  e as default
};
