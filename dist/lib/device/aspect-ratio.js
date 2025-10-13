const h = {
  FourByThree: 1.3333333333333333,
  SixteenByNine: 1.7777777777777777,
  TwentyOneByNine: 2.3333333333333335,
  OneByOne: 1
};
class a {
  container;
  canvas;
  aspectRatio;
  onResize;
  handleResizeBound;
  constructor(t) {
    this.container = t.container, this.canvas = t.canvas, this.aspectRatio = (typeof t.aspectRatio == "number", t.aspectRatio), this.onResize = t.onResize, this.handleResizeBound = this.apply.bind(this);
  }
  /** Attach window resize listener and apply once. */
  attach() {
    window.addEventListener("resize", this.handleResizeBound), this.apply();
  }
  /** Detach window resize listener. */
  detach() {
    window.removeEventListener("resize", this.handleResizeBound);
  }
  /** Compute the largest size that fits container while preserving aspect. */
  measure() {
    const t = this.container.clientWidth || window.innerWidth, e = this.container.clientHeight || window.innerHeight;
    if (t / e > this.aspectRatio) {
      const i = e;
      return { width: Math.round(i * this.aspectRatio), height: i };
    } else {
      const i = t, n = Math.round(i / this.aspectRatio);
      return { width: i, height: n };
    }
  }
  /** Apply measured size to canvas and notify. */
  apply() {
    const { width: t, height: e } = this.measure();
    this.canvas.style.width = `${t}px`, this.canvas.style.height = `${e}px`, this.onResize?.(t, e);
  }
}
export {
  h as AspectRatio,
  a as AspectRatioDelegate
};
