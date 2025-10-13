import { AspectRatioDelegate as s } from "../device/aspect-ratio.js";
class o {
  id;
  container;
  canvas;
  bodyBackground;
  fullscreen;
  aspectRatio;
  ratioDelegate = null;
  constructor(t) {
    this.id = t.id, this.container = this.ensureContainer(t.containerId ?? t.id, t.container), this.canvas = t.canvas ?? document.createElement("canvas"), this.bodyBackground = t.bodyBackground, this.fullscreen = !!t.fullscreen, this.aspectRatio = (typeof t.aspectRatio == "number", t.aspectRatio);
  }
  applyBodyBackground() {
    this.bodyBackground && (document.body.style.background = this.bodyBackground);
  }
  mountCanvas() {
    for (; this.container.firstChild; )
      this.container.removeChild(this.container.firstChild);
    this.container.appendChild(this.canvas);
  }
  mountRenderer(t, i) {
    for (; this.container.firstChild; )
      this.container.removeChild(this.container.firstChild);
    this.container.appendChild(t), this.canvas = t, this.attachAspectRatio(i);
  }
  centerIfFullscreen() {
    if (!this.fullscreen)
      return;
    const t = this.container.style;
    t.display = "flex", t.alignItems = "center", t.justifyContent = "center", t.position = "fixed", t.inset = "0";
  }
  attachAspectRatio(t) {
    this.ratioDelegate ? this.ratioDelegate.apply() : (this.ratioDelegate = new s({
      container: this.container,
      canvas: this.canvas,
      aspectRatio: this.aspectRatio,
      onResize: t
    }), this.ratioDelegate.attach());
  }
  destroy() {
    this.ratioDelegate?.detach(), this.ratioDelegate = null;
  }
  ensureContainer(t, i) {
    if (i)
      return i;
    if (t) {
      const a = document.getElementById(t);
      if (a)
        return a;
    }
    const n = t || this.id || "zylem-root", e = document.createElement("main");
    return e.setAttribute("id", n), e.style.position = "relative", e.style.width = "100%", e.style.height = "100%", document.body.appendChild(e), e;
  }
}
export {
  o as GameCanvas
};
