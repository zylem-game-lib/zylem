import { D as c, y as n } from "./main-9294d1ef.mjs";
class l {
  constructor(a) {
    this._canvasPool = /* @__PURE__ */ Object.create(null), this.canvasOptions = a || {}, this.enableFullScreen = !1;
  }
  /**
   * Creates texture with params that were specified in pool constructor.
   * @param pixelWidth - Width of texture in pixels.
   * @param pixelHeight - Height of texture in pixels.
   */
  _createCanvasAndContext(a, s) {
    const t = c.get().createCanvas();
    t.width = a, t.height = s;
    const o = t.getContext("2d");
    return { canvas: t, context: o };
  }
  /**
   * Gets a Power-of-Two render texture or fullScreen texture
   * @param minWidth - The minimum width of the render texture.
   * @param minHeight - The minimum height of the render texture.
   * @param resolution - The resolution of the render texture.
   * @returns The new render texture.
   */
  getOptimalCanvasAndContext(a, s, t = 1) {
    a = Math.ceil(a * t - 1e-6), s = Math.ceil(s * t - 1e-6), a = n(a), s = n(s);
    const o = (a << 17) + (s << 1);
    this._canvasPool[o] || (this._canvasPool[o] = []);
    let e = this._canvasPool[o].pop();
    return e || (e = this._createCanvasAndContext(a, s)), e;
  }
  /**
   * Place a render texture back into the pool.
   * @param canvasAndContext
   */
  returnCanvasAndContext(a) {
    const s = a.canvas, { width: t, height: o } = s, e = (t << 17) + (o << 1);
    this._canvasPool[e].push(a);
  }
  clear() {
    this._canvasPool = {};
  }
}
const C = new l();
export {
  C
};
