import { AspectRatio as d } from "../device/aspect-ratio.js";
class g {
  id;
  globals;
  stages;
  debug;
  time;
  input;
  aspectRatio;
  fullscreen;
  bodyBackground;
  container;
  containerId;
  canvas;
  constructor(n, o, e, i, a, c, s, l, u, m, f, p) {
    this.id = n, this.globals = o, this.stages = e, this.debug = i, this.time = a, this.input = c, this.aspectRatio = s, this.fullscreen = l, this.bodyBackground = u, this.container = m, this.containerId = f, this.canvas = p;
  }
}
function r(t, n) {
  if (n)
    return n;
  if (t) {
    const i = document.getElementById(t);
    if (i)
      return i;
  }
  const o = t || "zylem-root", e = document.createElement("main");
  return e.setAttribute("id", o), e.style.position = "relative", e.style.width = "100%", e.style.height = "100%", document.body.appendChild(e), e;
}
function b(t) {
  const n = t?.id ?? "zylem", o = r(n);
  return new g(n, t?.globals ?? {}, t?.stages ?? [], !!t?.debug, t?.time ?? 0, t?.input, d.SixteenByNine, !0, "#000000", o, n, void 0);
}
function y(t) {
  const n = b({
    id: t?.id ?? "zylem",
    debug: !!t?.debug,
    time: t?.time ?? 0,
    input: t?.input,
    stages: t?.stages ?? [],
    globals: t?.globals ?? {}
  }), o = t?.containerId ?? n.containerId, e = r(o, t?.container ?? null), i = t?.aspectRatio ?? n.aspectRatio, a = typeof i == "number" ? i : d[i] ?? d.SixteenByNine, c = t?.fullscreen ?? n.fullscreen, s = t?.bodyBackground ?? n.bodyBackground, l = t?.canvas ?? void 0;
  return new g(t?.id ?? n.id, t?.globals ?? n.globals, t?.stages ?? n.stages, !!(t?.debug ?? n.debug), t?.time ?? n.time, t?.input ?? n.input, a, c, s, e, o, l);
}
function B(t) {
  return { ...t };
}
export {
  g as GameConfig,
  b as createDefaultGameConfig,
  B as gameConfig,
  y as resolveGameConfig
};
