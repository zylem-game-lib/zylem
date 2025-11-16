import { AspectRatio as p } from "../device/aspect-ratio.js";
import { getDisplayAspect as b, parseResolution as y, getPresetResolution as R } from "./game-retro-resolutions.js";
class f {
  id;
  globals;
  stages;
  debug;
  time;
  input;
  aspectRatio;
  internalResolution;
  fullscreen;
  bodyBackground;
  container;
  containerId;
  canvas;
  constructor(i, o, n, e, l, d, r, a, g, c, s, h, m) {
    this.id = i, this.globals = o, this.stages = n, this.debug = e, this.time = l, this.input = d, this.aspectRatio = r, this.internalResolution = a, this.fullscreen = g, this.bodyBackground = c, this.container = s, this.containerId = h, this.canvas = m;
  }
}
function u(t, i) {
  if (i)
    return i;
  if (t) {
    const e = document.getElementById(t);
    if (e)
      return e;
  }
  const o = t || "zylem-root", n = document.createElement("main");
  return n.setAttribute("id", o), n.style.position = "relative", n.style.width = "100%", n.style.height = "100%", document.body.appendChild(n), n;
}
function B(t) {
  const i = t?.id ?? "zylem", o = u(i);
  return new f(i, t?.globals ?? {}, t?.stages ?? [], !!t?.debug, t?.time ?? 0, t?.input, p.SixteenByNine, void 0, !0, "#000000", o, i, void 0);
}
function C(t) {
  const i = B({
    id: t?.id ?? "zylem",
    debug: !!t?.debug,
    time: t?.time ?? 0,
    input: t?.input,
    stages: t?.stages ?? [],
    globals: t?.globals ?? {}
  }), o = t?.containerId ?? i.containerId, n = u(o, t?.container ?? null), e = t?.aspectRatio;
  let l = i.aspectRatio;
  if (typeof e == "number" || e && typeof e == "string")
    l = typeof e == "number" ? e : p[e] ?? i.aspectRatio;
  else if (t?.preset)
    try {
      l = b(t.preset) || i.aspectRatio;
    } catch {
      l = i.aspectRatio;
    }
  const d = t?.fullscreen ?? i.fullscreen, r = t?.bodyBackground ?? i.bodyBackground;
  let a;
  if (t?.resolution) {
    if (typeof t.resolution == "string") {
      const c = y(t.resolution);
      if (c && (a = c), !a && t.preset) {
        const s = R(t.preset, t.resolution);
        s && (a = { width: s.width, height: s.height });
      }
    } else if (typeof t.resolution == "object") {
      const c = t.resolution.width, s = t.resolution.height;
      Number.isFinite(c) && Number.isFinite(s) && (a = { width: c, height: s });
    }
  }
  const g = t?.canvas ?? void 0;
  return new f(t?.id ?? i.id, t?.globals ?? i.globals, t?.stages ?? i.stages, !!(t?.debug ?? i.debug), t?.time ?? i.time, t?.input ?? i.input, l, a, d, r, n, o, g);
}
function k(t) {
  return { ...t };
}
export {
  f as GameConfig,
  k as gameConfig,
  C as resolveGameConfig
};
