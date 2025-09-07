import { proxy as s } from "valtio/vanilla";
import { printToConsole as t } from "./console/console-state.js";
const n = {
  NONE: "NONE",
  SELECT: "SELECT",
  DELETE: "DELETE"
}, o = s({
  on: !1,
  paused: !1,
  configuration: {
    showCollisionBounds: !1,
    showModelBounds: !1,
    showSpriteBounds: !1
  },
  hovered: null,
  selected: [],
  tool: n.NONE
}), r = (e = !1) => {
  o.on = e;
}, u = (e) => {
  o.selected.push(e);
}, E = () => o.tool, a = (e) => {
  o.hovered = e;
}, c = () => {
  o.hovered = null;
}, i = () => o.hovered, f = (e) => {
  o.paused = e, t(e ? "Paused" : "Resumed");
}, p = () => o.paused;
export {
  n as DebugTools,
  o as debugState,
  E as getDebugTool,
  i as getHoveredEntity,
  p as isPaused,
  c as resetHoveredEntity,
  r as setDebugFlag,
  a as setHoveredEntity,
  f as setPaused,
  u as setSelectedEntity
};
