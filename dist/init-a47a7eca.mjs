import { E as _, U as ft, T as fe, a as pt, d as U, v as H, b as k, c as W, M as A, F as gt, f as mt, w as L, g as E, h as te, i as z, R as re, I as xt, j as F, k as q, G as Ce, B as Be, P as _t, l as Pe, m as N, n as I, o as bt, p as w, q as Tt, s as Me, t as yt, u as wt, x as se, D as Fe, y as pe, e as P, z as vt } from "./main-81987925.mjs";
import { U as $, T as R, R as ie, S as Re, c as ne, a as Ue, b as ke, d as Ae, l as St, r as Ge, e as Ct, f as ze, g as Bt, h as Pt, i as Mt, j as Ft, B as He } from "./colorToUniform-299098bd.mjs";
import { C as D } from "./CanvasPool-8e806009.mjs";
import { g as Rt } from "./getBatchSamplersUniformGroup-f8f05502.mjs";
class We {
  /**
   * Initialize the plugin with scope of application instance
   * @static
   * @private
   * @param {object} [options] - See application options
   */
  static init(e) {
    Object.defineProperty(
      this,
      "resizeTo",
      /**
       * The HTML element or window to automatically resize the
       * renderer's view element to match width and height.
       * @member {Window|HTMLElement}
       * @name resizeTo
       * @memberof app.Application#
       */
      {
        set(t) {
          globalThis.removeEventListener("resize", this.queueResize), this._resizeTo = t, t && (globalThis.addEventListener("resize", this.queueResize), this.resize());
        },
        get() {
          return this._resizeTo;
        }
      }
    ), this.queueResize = () => {
      this._resizeTo && (this._cancelResize(), this._resizeId = requestAnimationFrame(() => this.resize()));
    }, this._cancelResize = () => {
      this._resizeId && (cancelAnimationFrame(this._resizeId), this._resizeId = null);
    }, this.resize = () => {
      if (!this._resizeTo)
        return;
      this._cancelResize();
      let t, r;
      if (this._resizeTo === globalThis.window)
        t = globalThis.innerWidth, r = globalThis.innerHeight;
      else {
        const { clientWidth: s, clientHeight: i } = this._resizeTo;
        t = s, r = i;
      }
      this.renderer.resize(t, r), this.render();
    }, this._resizeId = null, this._resizeTo = null, this.resizeTo = e.resizeTo || null;
  }
  /**
   * Clean up the ticker, scoped to application
   * @static
   * @private
   */
  static destroy() {
    globalThis.removeEventListener("resize", this.queueResize), this._cancelResize(), this._cancelResize = null, this.queueResize = null, this.resizeTo = null, this.resize = null;
  }
}
We.extension = _.Application;
class De {
  /**
   * Initialize the plugin with scope of application instance
   * @static
   * @private
   * @param {object} [options] - See application options
   */
  static init(e) {
    e = Object.assign({
      autoStart: !0,
      sharedTicker: !1
    }, e), Object.defineProperty(
      this,
      "ticker",
      {
        set(t) {
          this._ticker && this._ticker.remove(this.render, this), this._ticker = t, t && t.add(this.render, this, ft.LOW);
        },
        get() {
          return this._ticker;
        }
      }
    ), this.stop = () => {
      this._ticker.stop();
    }, this.start = () => {
      this._ticker.start();
    }, this._ticker = null, this.ticker = e.sharedTicker ? fe.shared : new fe(), e.autoStart && this.start();
  }
  /**
   * Clean up the ticker, scoped to application.
   * @static
   * @private
   */
  static destroy() {
    if (this._ticker) {
      const e = this._ticker;
      this.ticker = null, e.destroy();
    }
  }
}
De.extension = _.Application;
class Ut extends pt {
  constructor() {
    super(...arguments), this.chars = /* @__PURE__ */ Object.create(null), this.lineHeight = 0, this.fontFamily = "", this.fontMetrics = { fontSize: 0, ascent: 0, descent: 0 }, this.baseLineOffset = 0, this.distanceField = { type: "none", range: 0 }, this.pages = [], this.applyFillAsTint = !0, this.baseMeasurementFontSize = 100, this.baseRenderedFontSize = 100;
  }
  /**
   * The name of the font face.
   * @deprecated since 8.0.0 Use `fontFamily` instead.
   */
  get font() {
    return U(H, "BitmapFont.font is deprecated, please use BitmapFont.fontFamily instead."), this.fontFamily;
  }
  /**
   * The map of base page textures (i.e., sheets of glyphs).
   * @deprecated since 8.0.0 Use `pages` instead.
   */
  get pageTextures() {
    return U(H, "BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead."), this.pages;
  }
  /**
   * The size of the font face in pixels.
   * @deprecated since 8.0.0 Use `fontMetrics.fontSize` instead.
   */
  get size() {
    return U(H, "BitmapFont.size is deprecated, please use BitmapFont.fontMetrics.fontSize instead."), this.fontMetrics.fontSize;
  }
  /**
   * The kind of distance field for this font or "none".
   * @deprecated since 8.0.0 Use `distanceField.type` instead.
   */
  get distanceFieldRange() {
    return U(H, "BitmapFont.distanceFieldRange is deprecated, please use BitmapFont.distanceField.range instead."), this.distanceField.range;
  }
  /**
   * The range of the distance field in pixels.
   * @deprecated since 8.0.0 Use `distanceField.range` instead.
   */
  get distanceFieldType() {
    return U(H, "BitmapFont.distanceFieldType is deprecated, please use BitmapFont.distanceField.type instead."), this.distanceField.type;
  }
  destroy(e = !1) {
    var t;
    this.emit("destroy", this), this.removeAllListeners();
    for (const r in this.chars)
      (t = this.chars[r].texture) == null || t.destroy();
    this.chars = null, e && (this.pages.forEach((r) => r.texture.destroy(!0)), this.pages = null);
  }
}
function K(n, e) {
  if (n.texture === k.WHITE && !n.fill)
    return W.shared.setValue(n.color).toHex();
  if (n.fill) {
    if (n.fill instanceof gt) {
      const t = n.fill, r = e.createPattern(t.texture.source.resource, "repeat"), s = t.transform.copyTo(A.shared);
      return s.scale(
        t.texture.frame.width,
        t.texture.frame.height
      ), r.setTransform(s), r;
    } else if (n.fill instanceof mt) {
      const t = n.fill;
      if (t.type === "linear") {
        const r = e.createLinearGradient(
          t.x0,
          t.y0,
          t.x1,
          t.y1
        );
        return t.gradientStops.forEach((s) => {
          r.addColorStop(s.offset, W.shared.setValue(s.color).toHex());
        }), r;
      }
    }
  } else {
    const t = e.createPattern(n.texture.source.resource, "repeat"), r = n.matrix.copyTo(A.shared);
    return r.scale(n.texture.frame.width, n.texture.frame.height), t.setTransform(r), t;
  }
  return L("FillStyle not recognised", n), "red";
}
function Oe(n) {
  if (n === "")
    return [];
  typeof n == "string" && (n = [n]);
  const e = [];
  for (let t = 0, r = n.length; t < r; t++) {
    const s = n[t];
    if (Array.isArray(s)) {
      if (s.length !== 2)
        throw new Error(`[BitmapFont]: Invalid character range length, expecting 2 got ${s.length}.`);
      if (s[0].length === 0 || s[1].length === 0)
        throw new Error("[BitmapFont]: Invalid character delimiter.");
      const i = s[0].charCodeAt(0), a = s[1].charCodeAt(0);
      if (a < i)
        throw new Error("[BitmapFont]: Invalid character range.");
      for (let o = i, l = a; o <= l; o++)
        e.push(String.fromCharCode(o));
    } else
      e.push(...Array.from(s));
  }
  if (e.length === 0)
    throw new Error("[BitmapFont]: Empty set when resolving characters.");
  return e;
}
const Ie = class Le extends Ut {
  /**
   * @param options - The options for the dynamic bitmap font.
   */
  constructor(e) {
    super(), this.resolution = 1, this.pages = [], this._padding = 0, this._measureCache = /* @__PURE__ */ Object.create(null), this._currentChars = [], this._currentX = 0, this._currentY = 0, this._currentPageIndex = -1, this._skipKerning = !1;
    const t = { ...Le.defaultOptions, ...e };
    this._textureSize = t.textureSize, this._mipmap = t.mipmap;
    const r = t.style.clone();
    t.overrideFill && (r._fill.color = 16777215, r._fill.alpha = 1, r._fill.texture = k.WHITE, r._fill.fill = null), this.applyFillAsTint = t.overrideFill;
    const s = r.fontSize;
    r.fontSize = this.baseMeasurementFontSize;
    const i = te(r);
    t.overrideSize ? r._stroke && (r._stroke.width *= this.baseRenderedFontSize / s) : r.fontSize = this.baseRenderedFontSize = s, this._style = r, this._skipKerning = t.skipKerning ?? !1, this.resolution = t.resolution ?? 1, this._padding = t.padding ?? 4, this.fontMetrics = z.measureFont(i), this.lineHeight = r.lineHeight || this.fontMetrics.fontSize || r.fontSize;
  }
  ensureCharacters(e) {
    var p, m;
    const t = Oe(e).filter((x) => !this._currentChars.includes(x)).filter((x, T, b) => b.indexOf(x) === T);
    if (!t.length)
      return;
    this._currentChars = [...this._currentChars, ...t];
    let r;
    this._currentPageIndex === -1 ? r = this._nextPage() : r = this.pages[this._currentPageIndex];
    let { canvas: s, context: i } = r.canvasAndContext, a = r.texture.source;
    const o = this._style;
    let l = this._currentX, c = this._currentY;
    const h = this.baseRenderedFontSize / this.baseMeasurementFontSize, d = this._padding * h, g = o.fontStyle === "italic" ? 2 : 1;
    let u = 0, f = !1;
    for (let x = 0; x < t.length; x++) {
      const T = t[x], b = z.measureText(T, o, s, !1);
      b.lineHeight = b.height;
      const y = g * b.width * h, v = b.height * h, M = y + d * 2, S = v + d * 2;
      if (f = !1, T !== `
` && T !== "\r" && T !== "	" && T !== " " && (f = !0, u = Math.ceil(Math.max(S, u))), l + M > this._textureSize && (c += u, u = S, l = 0, c + u > this._textureSize)) {
        a.update();
        const G = this._nextPage();
        s = G.canvasAndContext.canvas, i = G.canvasAndContext.context, a = G.texture.source, c = 0;
      }
      const C = y / h - (((p = o.dropShadow) == null ? void 0 : p.distance) ?? 0) - (((m = o._stroke) == null ? void 0 : m.width) ?? 0);
      if (this.chars[T] = {
        id: T.codePointAt(0),
        xOffset: -this._padding,
        yOffset: -this._padding,
        xAdvance: C,
        kerning: {}
      }, f) {
        this._drawGlyph(
          i,
          b,
          l + d,
          c + d,
          h,
          o
        );
        const G = a.width * h, O = a.height * h, V = new re(
          l / G * a.width,
          c / O * a.height,
          M / G * a.width,
          S / O * a.height
        );
        this.chars[T].texture = new k({
          source: a,
          frame: V
        }), l += Math.ceil(M);
      }
    }
    a.update(), this._currentX = l, this._currentY = c, this._skipKerning && this._applyKerning(t, i);
  }
  /**
   * @deprecated since 8.0.0
   * The map of base page textures (i.e., sheets of glyphs).
   */
  get pageTextures() {
    return U(H, "BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead."), this.pages;
  }
  _applyKerning(e, t) {
    const r = this._measureCache;
    for (let s = 0; s < e.length; s++) {
      const i = e[s];
      for (let a = 0; a < this._currentChars.length; a++) {
        const o = this._currentChars[a];
        let l = r[i];
        l || (l = r[i] = t.measureText(i).width);
        let c = r[o];
        c || (c = r[o] = t.measureText(o).width);
        let h = t.measureText(i + o).width, d = h - (l + c);
        d && (this.chars[i].kerning[o] = d), h = t.measureText(i + o).width, d = h - (l + c), d && (this.chars[o].kerning[i] = d);
      }
    }
  }
  _nextPage() {
    this._currentPageIndex++;
    const e = this.resolution, t = D.getOptimalCanvasAndContext(
      this._textureSize,
      this._textureSize,
      e
    );
    this._setupContext(t.context, this._style, e);
    const r = e * (this.baseRenderedFontSize / this.baseMeasurementFontSize), s = new k({
      source: new xt({
        resource: t.canvas,
        resolution: r,
        alphaMode: "premultiply-alpha-on-upload",
        autoGenerateMipmaps: this._mipmap
      })
    }), i = {
      canvasAndContext: t,
      texture: s
    };
    return this.pages[this._currentPageIndex] = i, i;
  }
  // canvas style!
  _setupContext(e, t, r) {
    t.fontSize = this.baseRenderedFontSize, e.scale(r, r), e.font = te(t), t.fontSize = this.baseMeasurementFontSize, e.textBaseline = t.textBaseline;
    const s = t._stroke, i = (s == null ? void 0 : s.width) ?? 0;
    if (s && (e.lineWidth = i, e.lineJoin = s.join, e.miterLimit = s.miterLimit, e.strokeStyle = K(s, e)), t._fill && (e.fillStyle = K(t._fill, e)), t.dropShadow) {
      const a = t.dropShadow, o = W.shared.setValue(a.color).toArray(), l = a.blur * r, c = a.distance * r;
      e.shadowColor = `rgba(${o[0] * 255},${o[1] * 255},${o[2] * 255},${a.alpha})`, e.shadowBlur = l, e.shadowOffsetX = Math.cos(a.angle) * c, e.shadowOffsetY = Math.sin(a.angle) * c;
    } else
      e.shadowColor = "black", e.shadowBlur = 0, e.shadowOffsetX = 0, e.shadowOffsetY = 0;
  }
  _drawGlyph(e, t, r, s, i, a) {
    const o = t.text, l = t.fontProperties, c = a._stroke, h = ((c == null ? void 0 : c.width) ?? 0) * i, d = r + h / 2, g = s - h / 2, u = l.descent * i, f = t.lineHeight * i;
    a.stroke && h && e.strokeText(o, d, g + f - u), a._fill && e.fillText(o, d, g + f - u);
  }
  destroy() {
    super.destroy();
    for (let e = 0; e < this.pages.length; e++) {
      const { canvasAndContext: t, texture: r } = this.pages[e];
      t.canvas.width = t.canvas.width, D.returnCanvasAndContext(t), r.destroy(!0);
    }
    this.pages = null;
  }
};
Ie.defaultOptions = {
  textureSize: 512,
  style: new E(),
  mipmap: !0
};
let ge = Ie;
function Ee(n, e, t) {
  const r = {
    width: 0,
    height: 0,
    offsetY: 0,
    scale: e.fontSize / t.baseMeasurementFontSize,
    lines: [{
      width: 0,
      charPositions: [],
      spaceWidth: 0,
      spacesIndex: [],
      chars: []
    }]
  };
  r.offsetY = t.baseLineOffset;
  let s = r.lines[0], i = null, a = !0;
  const o = {
    spaceWord: !1,
    width: 0,
    start: 0,
    index: 0,
    // use index to not modify the array as we use it a lot!
    positions: [],
    chars: []
  }, l = (u) => {
    const f = s.width;
    for (let p = 0; p < o.index; p++) {
      const m = u.positions[p];
      s.chars.push(u.chars[p]), s.charPositions.push(m + f);
    }
    s.width += u.width, a = !1, o.width = 0, o.index = 0, o.chars.length = 0;
  }, c = () => {
    let u = s.chars.length - 1, f = s.chars[u];
    for (; f === " "; )
      s.width -= t.chars[f].xAdvance, f = s.chars[--u];
    r.width = Math.max(r.width, s.width), s = {
      width: 0,
      charPositions: [],
      chars: [],
      spaceWidth: 0,
      spacesIndex: []
    }, a = !0, r.lines.push(s), r.height += t.lineHeight;
  }, h = t.baseMeasurementFontSize / e.fontSize, d = e.letterSpacing * h, g = e.wordWrapWidth * h;
  for (let u = 0; u < n.length + 1; u++) {
    let f;
    const p = u === n.length;
    p || (f = n[u]);
    const m = t.chars[f] || t.chars[" "];
    if (/(?:\s)/.test(f) || f === "\r" || f === `
` || p) {
      if (!a && e.wordWrap && s.width + o.width - d > g ? (c(), l(o), p || s.charPositions.push(0)) : (o.start = s.width, l(o), p || s.charPositions.push(0)), f === "\r" || f === `
`)
        s.width !== 0 && c();
      else if (!p) {
        const y = m.xAdvance + (m.kerning[i] || 0) + d;
        s.width += y, s.spaceWidth = y, s.spacesIndex.push(s.charPositions.length), s.chars.push(f);
      }
    } else {
      const b = m.kerning[i] || 0, y = m.xAdvance + b + d;
      o.positions[o.index++] = o.width + b, o.chars.push(f), o.width += y;
    }
    i = f;
  }
  return c(), e.align === "center" ? kt(r) : e.align === "right" ? At(r) : e.align === "justify" && Gt(r), r;
}
function kt(n) {
  for (let e = 0; e < n.lines.length; e++) {
    const t = n.lines[e], r = n.width / 2 - t.width / 2;
    for (let s = 0; s < t.charPositions.length; s++)
      t.charPositions[s] += r;
  }
}
function At(n) {
  for (let e = 0; e < n.lines.length; e++) {
    const t = n.lines[e], r = n.width - t.width;
    for (let s = 0; s < t.charPositions.length; s++)
      t.charPositions[s] += r;
  }
}
function Gt(n) {
  const e = n.width;
  for (let t = 0; t < n.lines.length; t++) {
    const r = n.lines[t];
    let s = 0, i = r.spacesIndex[s++], a = 0;
    const o = r.spacesIndex.length, c = (e - r.width) / o;
    for (let h = 0; h < r.charPositions.length; h++)
      h === i && (i = r.spacesIndex[s++], a += c), r.charPositions[h] += a;
  }
}
let Y = 0;
class zt {
  constructor() {
    this.ALPHA = [["a", "z"], ["A", "Z"], " "], this.NUMERIC = [["0", "9"]], this.ALPHANUMERIC = [["a", "z"], ["A", "Z"], ["0", "9"], " "], this.ASCII = [[" ", "~"]], this.defaultOptions = {
      chars: this.ALPHANUMERIC,
      resolution: 1,
      padding: 4,
      skipKerning: !1
    };
  }
  /**
   * Get a font for the specified text and style.
   * @param text - The text to get the font for
   * @param style - The style to use
   */
  getFont(e, t) {
    var a;
    let r = `${t.fontFamily}-bitmap`, s = !0;
    if (t._fill.fill && !t._stroke)
      r += t._fill.fill.styleKey, s = !1;
    else if (t._stroke || t.dropShadow) {
      let o = t.styleKey;
      o = o.substring(0, o.lastIndexOf("-")), r = `${o}-bitmap`, s = !1;
    }
    if (!F.has(r)) {
      const o = new ge({
        style: t,
        overrideFill: s,
        overrideSize: !0,
        ...this.defaultOptions
      });
      Y++, Y > 50 && L("BitmapText", `You have dynamically created ${Y} bitmap fonts, this can be inefficient. Try pre installing your font styles using \`BitmapFont.install({name:"style1", style})\``), o.once("destroy", () => {
        Y--, F.remove(r);
      }), F.set(
        r,
        o
      );
    }
    const i = F.get(r);
    return (a = i.ensureCharacters) == null || a.call(i, e), i;
  }
  /**
   * Get the layout of a text for the specified style.
   * @param text - The text to get the layout for
   * @param style - The style to use
   */
  getLayout(e, t) {
    const r = this.getFont(e, t);
    return Ee([...e], t, r);
  }
  /**
   * Measure the text using the specified style.
   * @param text - The text to measure
   * @param style - The style to use
   */
  measureText(e, t) {
    return this.getLayout(e, t);
  }
  // eslint-disable-next-line max-len
  install(...e) {
    var c, h, d, g;
    let t = e[0];
    typeof t == "string" && (t = {
      name: t,
      style: e[1],
      chars: (c = e[2]) == null ? void 0 : c.chars,
      resolution: (h = e[2]) == null ? void 0 : h.resolution,
      padding: (d = e[2]) == null ? void 0 : d.padding,
      skipKerning: (g = e[2]) == null ? void 0 : g.skipKerning
    }, U(H, "BitmapFontManager.install(name, style, options) is deprecated, use BitmapFontManager.install({name, style, ...options})"));
    const r = t == null ? void 0 : t.name;
    if (!r)
      throw new Error("[BitmapFontManager] Property `name` is required.");
    t = { ...this.defaultOptions, ...t };
    const s = t.style, i = s instanceof E ? s : new E(s), a = i._fill.fill !== null && i._fill.fill !== void 0, o = new ge({
      style: i,
      overrideFill: a,
      skipKerning: t.skipKerning,
      padding: t.padding,
      resolution: t.resolution,
      overrideSize: !1
    }), l = Oe(t.chars);
    return o.ensureCharacters(l.join("")), F.set(`${r}-bitmap`, o), o.once("destroy", () => F.remove(`${r}-bitmap`)), o;
  }
  /**
   * Uninstalls a bitmap font from the cache.
   * @param {string} name - The name of the bitmap font to uninstall.
   */
  uninstall(e) {
    const t = `${e}-bitmap`, r = F.get(t);
    r && (F.remove(t), r.destroy());
  }
}
const Ht = new zt();
class $e {
  constructor(e) {
    this._renderer = e;
  }
  push(e, t, r) {
    this._renderer.renderPipes.batch.break(r), r.add({
      renderPipeId: "filter",
      canBundle: !1,
      action: "pushFilter",
      container: t,
      filterEffect: e
    });
  }
  pop(e, t, r) {
    this._renderer.renderPipes.batch.break(r), r.add({
      renderPipeId: "filter",
      action: "popFilter",
      canBundle: !1
    });
  }
  execute(e) {
    e.action === "pushFilter" ? this._renderer.filter.push(e) : e.action === "popFilter" && this._renderer.filter.pop();
  }
  destroy() {
    this._renderer = null;
  }
}
$e.extension = {
  type: [
    _.WebGLPipes,
    _.WebGPUPipes,
    _.CanvasPipes
  ],
  name: "filter"
};
const Wt = new A();
function Dt(n, e) {
  return e.clear(), Ye(n, e), e.isValid || e.set(0, 0, 0, 0), n.renderGroup ? e.applyMatrix(n.renderGroup.localTransform) : e.applyMatrix(n.parentRenderGroup.worldTransform), e;
}
function Ye(n, e) {
  if (n.localDisplayStatus !== 7 || !n.measurable)
    return;
  const t = !!n.effects.length;
  let r = e;
  if ((n.renderGroup || t) && (r = q.get().clear()), n.boundsArea)
    e.addRect(n.boundsArea, n.worldTransform);
  else {
    if (n.renderPipeId) {
      const i = n.bounds;
      r.addFrame(
        i.minX,
        i.minY,
        i.maxX,
        i.maxY,
        n.groupTransform
      );
    }
    const s = n.children;
    for (let i = 0; i < s.length; i++)
      Ye(s[i], r);
  }
  if (t) {
    let s = !1;
    for (let i = 0; i < n.effects.length; i++)
      n.effects[i].addBounds && (s || (s = !0, r.applyMatrix(n.parentRenderGroup.worldTransform)), n.effects[i].addBounds(r, !0));
    s && (r.applyMatrix(n.parentRenderGroup.worldTransform.copyTo(Wt).invert()), e.addBounds(r, n.relativeGroupTransform)), e.addBounds(r), q.return(r);
  } else
    n.renderGroup && (e.addBounds(r, n.relativeGroupTransform), q.return(r));
}
function Ot(n, e) {
  e.clear();
  const t = e.matrix;
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    s.globalDisplayStatus < 7 || (e.matrix = s.worldTransform, s.addBounds(e));
  }
  return e.matrix = t, e;
}
const It = new Ce({
  attributes: {
    aPosition: {
      buffer: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      location: 0,
      format: "float32x2",
      stride: 2 * 4,
      offset: 0
    }
  },
  indexBuffer: new Uint32Array([0, 1, 2, 0, 2, 3])
});
class Xe {
  constructor(e) {
    this._filterStackIndex = 0, this._filterStack = [], this._filterGlobalUniforms = new $({
      uInputSize: { value: new Float32Array(4), type: "vec4<f32>" },
      uInputPixel: { value: new Float32Array(4), type: "vec4<f32>" },
      uInputClamp: { value: new Float32Array(4), type: "vec4<f32>" },
      uOutputFrame: { value: new Float32Array(4), type: "vec4<f32>" },
      uGlobalFrame: { value: new Float32Array(4), type: "vec4<f32>" },
      uOutputTexture: { value: new Float32Array(4), type: "vec4<f32>" }
    }), this._globalFilterBindGroup = new Be({}), this.renderer = e;
  }
  /**
   * The back texture of the currently active filter. Requires the filter to have `blendRequired` set to true.
   * @readonly
   */
  get activeBackTexture() {
    var e;
    return (e = this._activeFilterData) == null ? void 0 : e.backTexture;
  }
  push(e) {
    var u;
    const t = this.renderer, r = e.filterEffect.filters;
    this._filterStack[this._filterStackIndex] || (this._filterStack[this._filterStackIndex] = this._getFilterData());
    const s = this._filterStack[this._filterStackIndex];
    if (this._filterStackIndex++, r.length === 0) {
      s.skip = !0;
      return;
    }
    const i = s.bounds;
    e.renderables ? Ot(e.renderables, i) : e.filterEffect.filterArea ? (i.clear(), i.addRect(e.filterEffect.filterArea), i.applyMatrix(e.container.worldTransform)) : Dt(e.container, i);
    const a = t.renderTarget.rootRenderTarget.colorTexture.source;
    let o = a._resolution, l = 0, c = a.antialias, h = !1, d = !1;
    for (let f = 0; f < r.length; f++) {
      const p = r[f];
      if (o = Math.min(o, p.resolution), l += p.padding, p.antialias !== "inherit" && (p.antialias === "on" ? c = !0 : c = !1), !!!(p.compatibleRenderers & t.type)) {
        d = !1;
        break;
      }
      if (p.blendRequired && !(((u = t.backBuffer) == null ? void 0 : u.useBackBuffer) ?? !0)) {
        L("Blend filter requires backBuffer on WebGL renderer to be enabled. Set `useBackBuffer: true` in the renderer options."), d = !1;
        break;
      }
      d = p.enabled || d, h = h || p.blendRequired;
    }
    if (!d) {
      s.skip = !0;
      return;
    }
    const g = t.renderTarget.rootViewPort;
    if (i.scale(o).fitBounds(0, g.width, 0, g.height).scale(1 / o).pad(l).ceil(), !i.isPositive) {
      s.skip = !0;
      return;
    }
    s.skip = !1, s.bounds = i, s.blendRequired = h, s.container = e.container, s.filterEffect = e.filterEffect, s.previousRenderSurface = t.renderTarget.renderSurface, s.inputTexture = R.getOptimalTexture(
      i.width,
      i.height,
      o,
      c
    ), t.renderTarget.bind(s.inputTexture, !0), t.globalUniforms.push({
      offset: i
    });
  }
  pop() {
    const e = this.renderer;
    this._filterStackIndex--;
    const t = this._filterStack[this._filterStackIndex];
    if (t.skip)
      return;
    this._activeFilterData = t;
    const r = t.inputTexture, s = t.bounds;
    let i = k.EMPTY;
    if (e.renderTarget.finishRenderPass(), t.blendRequired) {
      const o = this._filterStackIndex > 0 ? this._filterStack[this._filterStackIndex - 1].bounds : null, l = e.renderTarget.getRenderTarget(t.previousRenderSurface);
      i = this.getBackTexture(l, s, o);
    }
    t.backTexture = i;
    const a = t.filterEffect.filters;
    if (this._globalFilterBindGroup.setResource(r.source.style, 2), this._globalFilterBindGroup.setResource(i.source, 3), e.globalUniforms.pop(), a.length === 1)
      a[0].apply(this, r, t.previousRenderSurface, !1), R.returnTexture(r);
    else {
      let o = t.inputTexture, l = R.getOptimalTexture(
        s.width,
        s.height,
        o.source._resolution,
        !1
      ), c = 0;
      for (c = 0; c < a.length - 1; ++c) {
        a[c].apply(this, o, l, !0);
        const d = o;
        o = l, l = d;
      }
      a[c].apply(this, o, t.previousRenderSurface, !1), R.returnTexture(o), R.returnTexture(l);
    }
    t.blendRequired && R.returnTexture(i);
  }
  getBackTexture(e, t, r) {
    const s = e.colorTexture.source._resolution, i = R.getOptimalTexture(
      t.width,
      t.height,
      s,
      !1
    );
    let a = t.minX, o = t.minY;
    r && (a -= r.minX, o -= r.minY), a = Math.floor(a * s), o = Math.floor(o * s);
    const l = Math.ceil(t.width * s), c = Math.ceil(t.height * s);
    return this.renderer.renderTarget.copyToTexture(
      e,
      i,
      { x: a, y: o },
      { width: l, height: c },
      { x: 0, y: 0 }
    ), i;
  }
  applyFilter(e, t, r, s) {
    const i = this.renderer, a = this._filterStack[this._filterStackIndex], o = a.bounds, l = _t.shared, h = a.previousRenderSurface === r;
    let d = this.renderer.renderTarget.rootRenderTarget.colorTexture.source._resolution, g = this._filterStackIndex - 1;
    for (; g > 0 && this._filterStack[g].skip; )
      --g;
    g > 0 && (d = this._filterStack[g].inputTexture.source._resolution);
    const u = this._filterGlobalUniforms, f = u.uniforms, p = f.uOutputFrame, m = f.uInputSize, x = f.uInputPixel, T = f.uInputClamp, b = f.uGlobalFrame, y = f.uOutputTexture;
    if (h) {
      let S = this._filterStackIndex;
      for (; S > 0; ) {
        S--;
        const C = this._filterStack[this._filterStackIndex - 1];
        if (!C.skip) {
          l.x = C.bounds.minX, l.y = C.bounds.minY;
          break;
        }
      }
      p[0] = o.minX - l.x, p[1] = o.minY - l.y;
    } else
      p[0] = 0, p[1] = 0;
    p[2] = t.frame.width, p[3] = t.frame.height, m[0] = t.source.width, m[1] = t.source.height, m[2] = 1 / m[0], m[3] = 1 / m[1], x[0] = t.source.pixelWidth, x[1] = t.source.pixelHeight, x[2] = 1 / x[0], x[3] = 1 / x[1], T[0] = 0.5 * x[2], T[1] = 0.5 * x[3], T[2] = t.frame.width * m[2] - 0.5 * x[2], T[3] = t.frame.height * m[3] - 0.5 * x[3];
    const v = this.renderer.renderTarget.rootRenderTarget.colorTexture;
    b[0] = l.x * d, b[1] = l.y * d, b[2] = v.source.width * d, b[3] = v.source.height * d;
    const M = this.renderer.renderTarget.getRenderTarget(r);
    if (i.renderTarget.bind(r, !!s), r instanceof k ? (y[0] = r.frame.width, y[1] = r.frame.height) : (y[0] = M.width, y[1] = M.height), y[2] = M.isRoot ? -1 : 1, u.update(), i.renderPipes.uniformBatch) {
      const S = i.renderPipes.uniformBatch.getUboResource(u);
      this._globalFilterBindGroup.setResource(S, 0);
    } else
      this._globalFilterBindGroup.setResource(u, 0);
    this._globalFilterBindGroup.setResource(t.source, 1), this._globalFilterBindGroup.setResource(t.source.style, 2), e.groups[0] = this._globalFilterBindGroup, i.encoder.draw({
      geometry: It,
      shader: e,
      state: e._state,
      topology: "triangle-list"
    }), i.type === ie.WEBGL && i.renderTarget.finishRenderPass();
  }
  _getFilterData() {
    return {
      skip: !1,
      inputTexture: null,
      bounds: new Pe(),
      container: null,
      filterEffect: null,
      blendRequired: !1,
      previousRenderSurface: null
    };
  }
  /**
   * Multiply _input normalized coordinates_ to this matrix to get _sprite texture normalized coordinates_.
   *
   * Use `outputMatrix * vTextureCoord` in the shader.
   * @param outputMatrix - The matrix to output to.
   * @param {Sprite} sprite - The sprite to map to.
   * @returns The mapped matrix.
   */
  calculateSpriteMatrix(e, t) {
    const r = this._activeFilterData, s = e.set(
      r.inputTexture._source.width,
      0,
      0,
      r.inputTexture._source.height,
      r.bounds.minX,
      r.bounds.minY
    ), i = t.worldTransform.copyTo(A.shared);
    return i.invert(), s.prepend(i), s.scale(
      1 / t.texture.frame.width,
      1 / t.texture.frame.height
    ), s.translate(t.anchor.x, t.anchor.y), s;
  }
}
Xe.extension = {
  type: [
    _.WebGLSystem,
    _.WebGPUSystem
  ],
  name: "filter"
};
const je = class Ke extends Ce {
  constructor(...e) {
    let t = e[0] ?? {};
    t instanceof Float32Array && (U(H, "use new MeshGeometry({ positions, uvs, indices }) instead"), t = {
      positions: t,
      uvs: e[1],
      indices: e[2]
    }), t = { ...Ke.defaultOptions, ...t };
    const r = t.positions || new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), s = t.uvs || new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), i = t.indices || new Uint32Array([0, 1, 2, 0, 2, 3]), a = t.shrinkBuffersToFit, o = new N({
      data: r,
      label: "attribute-mesh-positions",
      shrinkToFit: a,
      usage: I.VERTEX | I.COPY_DST
    }), l = new N({
      data: s,
      label: "attribute-mesh-uvs",
      shrinkToFit: a,
      usage: I.VERTEX | I.COPY_DST
    }), c = new N({
      data: i,
      label: "index-mesh-buffer",
      shrinkToFit: a,
      usage: I.INDEX | I.COPY_DST
    });
    super({
      attributes: {
        aPosition: {
          buffer: o,
          format: "float32x2",
          stride: 2 * 4,
          offset: 0
        },
        aUV: {
          buffer: l,
          format: "float32x2",
          stride: 2 * 4,
          offset: 0
        }
      },
      indexBuffer: c,
      topology: t.topology
    }), this.batchMode = "auto";
  }
  /** The positions of the mesh. */
  get positions() {
    return this.attributes.aPosition.buffer.data;
  }
  set positions(e) {
    this.attributes.aPosition.buffer.data = e;
  }
  /** The UVs of the mesh. */
  get uvs() {
    return this.attributes.aUV.buffer.data;
  }
  set uvs(e) {
    this.attributes.aUV.buffer.data = e;
  }
  /** The indices of the mesh. */
  get indices() {
    return this.indexBuffer.data;
  }
  set indices(e) {
    this.indexBuffer.data = e;
  }
};
je.defaultOptions = {
  topology: "triangle-list",
  shrinkBuffersToFit: !1
};
let ae = je;
function Lt(n) {
  const e = n._stroke, t = n._fill, s = [`div { ${[
    `color: ${W.shared.setValue(t.color).toHex()}`,
    `font-size: ${n.fontSize}px`,
    `font-family: ${n.fontFamily}`,
    `font-weight: ${n.fontWeight}`,
    `font-style: ${n.fontStyle}`,
    `font-variant: ${n.fontVariant}`,
    `letter-spacing: ${n.letterSpacing}px`,
    `text-align: ${n.align}`,
    `padding: ${n.padding}px`,
    `white-space: ${n.whiteSpace === "pre" && n.wordWrap ? "pre-wrap" : n.whiteSpace}`,
    ...n.lineHeight ? [`line-height: ${n.lineHeight}px`] : [],
    ...n.wordWrap ? [
      `word-wrap: ${n.breakWords ? "break-all" : "break-word"}`,
      `max-width: ${n.wordWrapWidth}px`
    ] : [],
    ...e ? [qe(e)] : [],
    ...n.dropShadow ? [Ve(n.dropShadow)] : [],
    ...n.cssOverrides
  ].join(";")} }`];
  return Et(n.tagStyles, s), s.join(" ");
}
function Ve(n) {
  const e = W.shared.setValue(n.color).setAlpha(n.alpha).toHexa(), t = Math.round(Math.cos(n.angle) * n.distance), r = Math.round(Math.sin(n.angle) * n.distance), s = `${t}px ${r}px`;
  return n.blur > 0 ? `text-shadow: ${s} ${n.blur}px ${e}` : `text-shadow: ${s} ${e}`;
}
function qe(n) {
  return [
    `-webkit-text-stroke-width: ${n.width}px`,
    `-webkit-text-stroke-color: ${W.shared.setValue(n.color).toHex()}`,
    `text-stroke-width: ${n.width}px`,
    `text-stroke-color: ${W.shared.setValue(n.color).toHex()}`,
    "paint-order: stroke"
  ].join(";");
}
const me = {
  fontSize: "font-size: {{VALUE}}px",
  fontFamily: "font-family: {{VALUE}}",
  fontWeight: "font-weight: {{VALUE}}",
  fontStyle: "font-style: {{VALUE}}",
  fontVariant: "font-variant: {{VALUE}}",
  letterSpacing: "letter-spacing: {{VALUE}}px",
  align: "text-align: {{VALUE}}",
  padding: "padding: {{VALUE}}px",
  whiteSpace: "white-space: {{VALUE}}",
  lineHeight: "line-height: {{VALUE}}px",
  wordWrapWidth: "max-width: {{VALUE}}px"
}, xe = {
  fill: (n) => `color: ${W.shared.setValue(n).toHex()}`,
  breakWords: (n) => `word-wrap: ${n ? "break-all" : "break-word"}`,
  stroke: qe,
  dropShadow: Ve
};
function Et(n, e) {
  for (const t in n) {
    const r = n[t], s = [];
    for (const i in r)
      xe[i] ? s.push(xe[i](r[i])) : me[i] && s.push(me[i].replace("{{VALUE}}", r[i]));
    e.push(`${t} { ${s.join(";")} }`);
  }
}
class oe extends E {
  constructor(e = {}) {
    super(e), this._cssOverrides = [], this.cssOverrides ?? (this.cssOverrides = e.cssOverrides), this.tagStyles = e.tagStyles ?? {};
  }
  /** List of style overrides that will be applied to the HTML text. */
  set cssOverrides(e) {
    this._cssOverrides = e instanceof Array ? e : [e], this.update();
  }
  get cssOverrides() {
    return this._cssOverrides;
  }
  _generateKey() {
    return this._styleKey = bt(this) + this._cssOverrides.join("-"), this._styleKey;
  }
  update() {
    this._cssStyle = null, super.update();
  }
  /**
   * Creates a new HTMLTextStyle object with the same values as this one.
   * @returns New cloned HTMLTextStyle object
   */
  clone() {
    return new oe({
      align: this.align,
      breakWords: this.breakWords,
      dropShadow: this.dropShadow ? { ...this.dropShadow } : null,
      fill: this._fill,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
      fontStyle: this.fontStyle,
      fontVariant: this.fontVariant,
      fontWeight: this.fontWeight,
      letterSpacing: this.letterSpacing,
      lineHeight: this.lineHeight,
      padding: this.padding,
      stroke: this._stroke,
      whiteSpace: this.whiteSpace,
      wordWrap: this.wordWrap,
      wordWrapWidth: this.wordWrapWidth,
      cssOverrides: this.cssOverrides
    });
  }
  get cssStyle() {
    return this._cssStyle || (this._cssStyle = Lt(this)), this._cssStyle;
  }
  /**
   * Add a style override, this can be any CSS property
   * it will override any built-in style. This is the
   * property and the value as a string (e.g., `color: red`).
   * This will override any other internal style.
   * @param {string} value - CSS style(s) to add.
   * @example
   * style.addOverride('background-color: red');
   */
  addOverride(...e) {
    const t = e.filter((r) => !this.cssOverrides.includes(r));
    t.length > 0 && (this.cssOverrides.push(...t), this.update());
  }
  /**
   * Remove any overrides that match the value.
   * @param {string} value - CSS style to remove.
   * @example
   * style.removeOverride('background-color: red');
   */
  removeOverride(...e) {
    const t = e.filter((r) => this.cssOverrides.includes(r));
    t.length > 0 && (this.cssOverrides = this.cssOverrides.filter((r) => !t.includes(r)), this.update());
  }
  set fill(e) {
    typeof e != "string" && typeof e != "number" && L("[HTMLTextStyle] only color fill is not supported by HTMLText"), super.fill = e;
  }
  set stroke(e) {
    e && typeof e != "string" && typeof e != "number" && L("[HTMLTextStyle] only color stroke is not supported by HTMLText"), super.stroke = e;
  }
}
const _e = "http://www.w3.org/2000/svg", be = "http://www.w3.org/1999/xhtml";
class Ne {
  constructor() {
    this.svgRoot = document.createElementNS(_e, "svg"), this.foreignObject = document.createElementNS(_e, "foreignObject"), this.domElement = document.createElementNS(be, "div"), this.styleElement = document.createElementNS(be, "style"), this.image = new Image();
    const { foreignObject: e, svgRoot: t, styleElement: r, domElement: s } = this;
    e.setAttribute("width", "10000"), e.setAttribute("height", "10000"), e.style.overflow = "hidden", t.appendChild(e), e.appendChild(r), e.appendChild(s);
  }
}
let Te;
function $t(n, e, t, r) {
  r = r || Te || (Te = new Ne());
  const { domElement: s, styleElement: i, svgRoot: a } = r;
  s.innerHTML = `<style>${e.cssStyle}</style><div>${n}</div>`, s.setAttribute("style", "transform-origin: top left; display: inline-block"), t && (i.textContent = t), document.body.appendChild(a);
  const o = s.getBoundingClientRect();
  a.remove();
  const l = z.measureFont(e.fontStyle).descent;
  return {
    width: o.width,
    height: o.height + l
  };
}
class Je {
  constructor(e, t) {
    this.state = Re.for2d(), this._graphicsBatchesHash = /* @__PURE__ */ Object.create(null), this.renderer = e, this._adaptor = t, this._adaptor.init();
  }
  validateRenderable(e) {
    const t = e.context, r = !!this._graphicsBatchesHash[e.uid], s = this.renderer.graphicsContext.updateGpuContext(t);
    return !!(s.isBatchable || r !== s.isBatchable);
  }
  addRenderable(e, t) {
    const r = this.renderer.graphicsContext.updateGpuContext(e.context);
    e._didGraphicsUpdate && (e._didGraphicsUpdate = !1, this._rebuild(e)), r.isBatchable ? this._addToBatcher(e, t) : (this.renderer.renderPipes.batch.break(t), t.add(e));
  }
  updateRenderable(e) {
    const t = this._graphicsBatchesHash[e.uid];
    if (t)
      for (let r = 0; r < t.length; r++) {
        const s = t[r];
        s.batcher.updateElement(s);
      }
  }
  destroyRenderable(e) {
    this._graphicsBatchesHash[e.uid] && this._removeBatchForRenderable(e.uid);
  }
  execute(e) {
    if (!e.isRenderable)
      return;
    const t = this.renderer, r = e.context;
    if (!t.graphicsContext.getGpuContext(r).batches.length)
      return;
    const i = r.customShader || this._adaptor.shader;
    this.state.blendMode = e.groupBlendMode;
    const a = i.resources.localUniforms.uniforms;
    a.uTransformMatrix = e.groupTransform, a.uRound = t._roundPixels | e._roundPixels, ne(
      e.groupColorAlpha,
      a.uColor,
      0
    ), this._adaptor.execute(this, e);
  }
  _rebuild(e) {
    const t = !!this._graphicsBatchesHash[e.uid], r = this.renderer.graphicsContext.updateGpuContext(e.context);
    t && this._removeBatchForRenderable(e.uid), r.isBatchable && this._initBatchesForRenderable(e), e.batched = r.isBatchable;
  }
  _addToBatcher(e, t) {
    const r = this.renderer.renderPipes.batch, s = this._getBatchesForRenderable(e);
    for (let i = 0; i < s.length; i++) {
      const a = s[i];
      r.addToBatch(a, t);
    }
  }
  _getBatchesForRenderable(e) {
    return this._graphicsBatchesHash[e.uid] || this._initBatchesForRenderable(e);
  }
  _initBatchesForRenderable(e) {
    const t = e.context, r = this.renderer.graphicsContext.getGpuContext(t), s = this.renderer._roundPixels | e._roundPixels, i = r.batches.map((a) => {
      const o = w.get(Tt);
      return a.copyTo(o), o.renderable = e, o.roundPixels = s, o;
    });
    return this._graphicsBatchesHash[e.uid] === void 0 && e.on("destroyed", () => {
      this.destroyRenderable(e);
    }), this._graphicsBatchesHash[e.uid] = i, i;
  }
  _removeBatchForRenderable(e) {
    this._graphicsBatchesHash[e].forEach((t) => {
      w.return(t);
    }), this._graphicsBatchesHash[e] = null;
  }
  destroy() {
    this.renderer = null, this._adaptor.destroy(), this._adaptor = null, this.state = null;
    for (const e in this._graphicsBatchesHash)
      this._removeBatchForRenderable(e);
    this._graphicsBatchesHash = null;
  }
}
Je.extension = {
  type: [
    _.WebGLPipes,
    _.WebGPUPipes,
    _.CanvasPipes
  ],
  name: "graphics"
};
const Qe = class Ze extends ae {
  constructor(...e) {
    super({});
    let t = e[0] ?? {};
    typeof t == "number" && (U(H, "PlaneGeometry constructor changed please use { width, height, verticesX, verticesY } instead"), t = {
      width: t,
      height: e[1],
      verticesX: e[2],
      verticesY: e[3]
    }), this.build(t);
  }
  /**
   * Refreshes plane coordinates
   * @param options - Options to be applied to plane geometry
   */
  build(e) {
    e = { ...Ze.defaultOptions, ...e }, this.verticesX = this.verticesX ?? e.verticesX, this.verticesY = this.verticesY ?? e.verticesY, this.width = this.width ?? e.width, this.height = this.height ?? e.height;
    const t = this.verticesX * this.verticesY, r = [], s = [], i = [], a = this.verticesX - 1, o = this.verticesY - 1, l = this.width / a, c = this.height / o;
    for (let d = 0; d < t; d++) {
      const g = d % this.verticesX, u = d / this.verticesX | 0;
      r.push(g * l, u * c), s.push(g / a, u / o);
    }
    const h = a * o;
    for (let d = 0; d < h; d++) {
      const g = d % a, u = d / a | 0, f = u * this.verticesX + g, p = u * this.verticesX + g + 1, m = (u + 1) * this.verticesX + g, x = (u + 1) * this.verticesX + g + 1;
      i.push(
        f,
        p,
        m,
        p,
        x,
        m
      );
    }
    this.buffers[0].data = new Float32Array(r), this.buffers[1].data = new Float32Array(s), this.indexBuffer.data = new Uint32Array(i), this.buffers[0].update(), this.buffers[1].update(), this.indexBuffer.update();
  }
};
Qe.defaultOptions = {
  width: 100,
  height: 100,
  verticesX: 10,
  verticesY: 10
};
let Yt = Qe;
class le {
  constructor() {
    this.batcher = null, this.batch = null, this.roundPixels = 0, this._uvUpdateId = -1, this._textureMatrixUpdateId = -1;
  }
  get blendMode() {
    return this.mesh.groupBlendMode;
  }
  reset() {
    this.mesh = null, this.texture = null, this.batcher = null, this.batch = null;
  }
  packIndex(e, t, r) {
    const s = this.geometry.indices;
    for (let i = 0; i < s.length; i++)
      e[t++] = s[i] + r;
  }
  packAttributes(e, t, r, s) {
    const i = this.mesh, a = this.geometry, o = i.groupTransform, l = s << 16 | this.roundPixels & 65535, c = o.a, h = o.b, d = o.c, g = o.d, u = o.tx, f = o.ty, p = a.positions, m = a.getBuffer("aUV"), x = m.data;
    let T = x;
    const b = this.texture.textureMatrix;
    b.isSimple || (T = this._transformedUvs, (this._textureMatrixUpdateId !== b._updateID || this._uvUpdateId !== m._updateID) && ((!T || T.length < x.length) && (T = this._transformedUvs = new Float32Array(x.length)), this._textureMatrixUpdateId = b._updateID, this._uvUpdateId = m._updateID, b.multiplyUvs(x, T)));
    const y = i.groupColorAlpha;
    for (let v = 0; v < p.length; v += 2) {
      const M = p[v], S = p[v + 1];
      e[r] = c * M + d * S + u, e[r + 1] = h * M + g * S + f, e[r + 2] = T[v], e[r + 3] = T[v + 1], t[r + 4] = y, t[r + 5] = l, r += 6;
    }
  }
  get vertexSize() {
    return this.geometry.positions.length / 2;
  }
  get indexSize() {
    return this.geometry.indices.length;
  }
}
class et {
  constructor(e, t) {
    this.localUniforms = new $({
      uTransformMatrix: { value: new A(), type: "mat3x3<f32>" },
      uColor: { value: new Float32Array([1, 1, 1, 1]), type: "vec4<f32>" },
      uRound: { value: 0, type: "f32" }
    }), this.localUniformsBindGroup = new Be({
      0: this.localUniforms
    }), this._meshDataHash = /* @__PURE__ */ Object.create(null), this._gpuBatchableMeshHash = /* @__PURE__ */ Object.create(null), this.renderer = e, this._adaptor = t, this._adaptor.init();
  }
  validateRenderable(e) {
    const t = this._getMeshData(e), r = t.batched, s = e.batched;
    if (t.batched = s, r !== s)
      return !0;
    if (s) {
      const i = e._geometry;
      if (i.indices.length !== t.indexSize || i.positions.length !== t.vertexSize)
        return t.indexSize = i.indices.length, t.vertexSize = i.positions.length, !0;
      const a = this._getBatchableMesh(e), o = e.texture;
      if (a.texture._source !== o._source && a.texture._source !== o._source)
        return !a.batcher.checkAndUpdateTexture(a, o);
    }
    return !1;
  }
  addRenderable(e, t) {
    const r = this.renderer.renderPipes.batch, { batched: s } = this._getMeshData(e);
    if (s) {
      const i = this._getBatchableMesh(e);
      i.texture = e._texture, i.geometry = e._geometry, r.addToBatch(i);
    } else
      r.break(t), t.add({
        renderPipeId: "mesh",
        mesh: e
      });
  }
  updateRenderable(e) {
    if (e.batched) {
      const t = this._gpuBatchableMeshHash[e.uid];
      t.texture = e._texture, t.geometry = e._geometry, t.batcher.updateElement(t);
    }
  }
  destroyRenderable(e) {
    this._meshDataHash[e.uid] = null;
    const t = this._gpuBatchableMeshHash[e.uid];
    t && (w.return(t), this._gpuBatchableMeshHash[e.uid] = null);
  }
  execute({ mesh: e }) {
    if (!e.isRenderable)
      return;
    e.state.blendMode = Me(e.groupBlendMode, e.texture._source);
    const t = this.localUniforms;
    t.uniforms.uTransformMatrix = e.groupTransform, t.uniforms.uRound = this.renderer._roundPixels | e._roundPixels, t.update(), ne(
      e.groupColorAlpha,
      t.uniforms.uColor,
      0
    ), this._adaptor.execute(this, e);
  }
  _getMeshData(e) {
    return this._meshDataHash[e.uid] || this._initMeshData(e);
  }
  _initMeshData(e) {
    var t, r;
    return this._meshDataHash[e.uid] = {
      batched: e.batched,
      indexSize: (t = e._geometry.indices) == null ? void 0 : t.length,
      vertexSize: (r = e._geometry.positions) == null ? void 0 : r.length
    }, e.on("destroyed", () => {
      this.destroyRenderable(e);
    }), this._meshDataHash[e.uid];
  }
  _getBatchableMesh(e) {
    return this._gpuBatchableMeshHash[e.uid] || this._initBatchableMesh(e);
  }
  _initBatchableMesh(e) {
    const t = w.get(le);
    return t.mesh = e, t.texture = e._texture, t.roundPixels = this.renderer._roundPixels | e._roundPixels, this._gpuBatchableMeshHash[e.uid] = t, t.mesh = e, t;
  }
  destroy() {
    for (const e in this._gpuBatchableMeshHash)
      this._gpuBatchableMeshHash[e] && w.return(this._gpuBatchableMeshHash[e]);
    this._gpuBatchableMeshHash = null, this._meshDataHash = null, this.localUniforms = null, this.localUniformsBindGroup = null, this._adaptor.destroy(), this._adaptor = null, this.renderer = null;
  }
}
et.extension = {
  type: [
    _.WebGLPipes,
    _.WebGPUPipes,
    _.CanvasPipes
  ],
  name: "mesh"
};
const tt = class rt extends Yt {
  constructor(e = {}) {
    e = { ...rt.defaultOptions, ...e }, super({
      width: e.width,
      height: e.height,
      verticesX: 4,
      verticesY: 4
    }), this.update(e);
  }
  /**
   * Updates the NineSliceGeometry with the options.
   * @param options - The options of the NineSliceGeometry.
   */
  update(e) {
    this.width = e.width ?? this.width, this.height = e.height ?? this.height, this._originalWidth = e.originalWidth ?? this._originalWidth, this._originalHeight = e.originalHeight ?? this._originalHeight, this._leftWidth = e.leftWidth ?? this._leftWidth, this._rightWidth = e.rightWidth ?? this._rightWidth, this._topHeight = e.topHeight ?? this._topHeight, this._bottomHeight = e.bottomHeight ?? this._bottomHeight, this.updateUvs(), this.updatePositions();
  }
  /** Updates the positions of the vertices. */
  updatePositions() {
    const e = this.positions, t = this._leftWidth + this._rightWidth, r = this.width > t ? 1 : this.width / t, s = this._topHeight + this._bottomHeight, i = this.height > s ? 1 : this.height / s, a = Math.min(r, i);
    e[9] = e[11] = e[13] = e[15] = this._topHeight * a, e[17] = e[19] = e[21] = e[23] = this.height - this._bottomHeight * a, e[25] = e[27] = e[29] = e[31] = this.height, e[2] = e[10] = e[18] = e[26] = this._leftWidth * a, e[4] = e[12] = e[20] = e[28] = this.width - this._rightWidth * a, e[6] = e[14] = e[22] = e[30] = this.width, this.getBuffer("aPosition").update();
  }
  /** Updates the UVs of the vertices. */
  updateUvs() {
    const e = this.uvs;
    e[0] = e[8] = e[16] = e[24] = 0, e[1] = e[3] = e[5] = e[7] = 0, e[6] = e[14] = e[22] = e[30] = 1, e[25] = e[27] = e[29] = e[31] = 1;
    const t = 1 / this._originalWidth, r = 1 / this._originalHeight;
    e[2] = e[10] = e[18] = e[26] = t * this._leftWidth, e[9] = e[11] = e[13] = e[15] = r * this._topHeight, e[4] = e[12] = e[20] = e[28] = 1 - t * this._rightWidth, e[17] = e[19] = e[21] = e[23] = 1 - r * this._bottomHeight, this.getBuffer("aUV").update();
  }
};
tt.defaultOptions = {
  /** The width of the NineSlicePlane, setting this will actually modify the vertices and UV's of this plane. */
  width: 100,
  /** The height of the NineSlicePlane, setting this will actually modify the vertices and UV's of this plane. */
  height: 100,
  /** The width of the left column. */
  leftWidth: 10,
  /** The height of the top row. */
  topHeight: 10,
  /** The width of the right column. */
  rightWidth: 10,
  /** The height of the bottom row. */
  bottomHeight: 10,
  /** The original width of the texture */
  originalWidth: 100,
  /** The original height of the texture */
  originalHeight: 100
};
let Xt = tt;
class st {
  constructor(e) {
    this._gpuSpriteHash = /* @__PURE__ */ Object.create(null), this._renderer = e;
  }
  addRenderable(e, t) {
    const r = this._getGpuSprite(e);
    e._didSpriteUpdate && this._updateBatchableSprite(e, r), this._renderer.renderPipes.batch.addToBatch(r);
  }
  updateRenderable(e) {
    const t = this._gpuSpriteHash[e.uid];
    e._didSpriteUpdate && this._updateBatchableSprite(e, t), t.batcher.updateElement(t);
  }
  validateRenderable(e) {
    const t = e._texture, r = this._getGpuSprite(e);
    return r.texture._source !== t._source ? !r.batcher.checkAndUpdateTexture(r, t) : !1;
  }
  destroyRenderable(e) {
    const t = this._gpuSpriteHash[e.uid];
    w.return(t), this._gpuSpriteHash[e.uid] = null;
  }
  _updateBatchableSprite(e, t) {
    e._didSpriteUpdate = !1, t.geometry.update(e), t.texture = e._texture;
  }
  _getGpuSprite(e) {
    return this._gpuSpriteHash[e.uid] || this._initGPUSprite(e);
  }
  _initGPUSprite(e) {
    const t = new le();
    return t.geometry = new Xt(), t.mesh = e, t.texture = e._texture, t.roundPixels = this._renderer._roundPixels | e._roundPixels, this._gpuSpriteHash[e.uid] = t, e.on("destroyed", () => {
      this.destroyRenderable(e);
    }), t;
  }
  destroy() {
    for (const e in this._gpuSpriteHash)
      this._gpuSpriteHash[e].geometry.destroy();
    this._gpuSpriteHash = null, this._renderer = null;
  }
}
st.extension = {
  type: [
    _.WebGLPipes,
    _.WebGPUPipes,
    _.CanvasPipes
  ],
  name: "nineSliceSprite"
};
const jt = {
  name: "tiling-bit",
  vertex: {
    header: (
      /* wgsl */
      `
            struct TilingUniforms {
                uMapCoord:mat3x3<f32>,
                uClampFrame:vec4<f32>,
                uClampOffset:vec2<f32>,
                uTextureTransform:mat3x3<f32>,
                uSizeAnchor:vec4<f32>
            };

            @group(2) @binding(0) var<uniform> tilingUniforms: TilingUniforms;
            @group(2) @binding(1) var uTexture: texture_2d<f32>;
            @group(2) @binding(2) var uSampler: sampler;
        `
    ),
    main: (
      /* wgsl */
      `
            uv = (tilingUniforms.uTextureTransform * vec3(uv, 1.0)).xy;

            position = (position - tilingUniforms.uSizeAnchor.zw) * tilingUniforms.uSizeAnchor.xy;
        `
    )
  },
  fragment: {
    header: (
      /* wgsl */
      `
            struct TilingUniforms {
                uMapCoord:mat3x3<f32>,
                uClampFrame:vec4<f32>,
                uClampOffset:vec2<f32>,
                uTextureTransform:mat3x3<f32>,
                uSizeAnchor:vec4<f32>
            };

            @group(2) @binding(0) var<uniform> tilingUniforms: TilingUniforms;
            @group(2) @binding(1) var uTexture: texture_2d<f32>;
            @group(2) @binding(2) var uSampler: sampler;
        `
    ),
    main: (
      /* wgsl */
      `

            var coord = vUV + ceil(tilingUniforms.uClampOffset - vUV);
            coord = (tilingUniforms.uMapCoord * vec3(coord, 1.0)).xy;
            var unclamped = coord;
            coord = clamp(coord, tilingUniforms.uClampFrame.xy, tilingUniforms.uClampFrame.zw);

            var bias = 0.;

            if(unclamped.x == coord.x && unclamped.y == coord.y)
            {
                bias = -32.;
            } 

            outColor = textureSampleBias(uTexture, uSampler, coord, bias);
        `
    )
  }
}, Kt = {
  name: "tiling-bit",
  vertex: {
    header: (
      /* glsl */
      `
            uniform mat3 uTextureTransform;
            uniform vec4 uSizeAnchor;
        
        `
    ),
    main: (
      /* glsl */
      `
            uv = (uTextureTransform * vec3(aUV, 1.0)).xy;

            position = (position - uSizeAnchor.zw) * uSizeAnchor.xy;
        `
    )
  },
  fragment: {
    header: (
      /* glsl */
      `
            uniform sampler2D uTexture;
            uniform mat3 uMapCoord;
            uniform vec4 uClampFrame;
            uniform vec2 uClampOffset;
        `
    ),
    main: (
      /* glsl */
      `

        vec2 coord = vUV + ceil(uClampOffset - vUV);
        coord = (uMapCoord * vec3(coord, 1.0)).xy;
        vec2 unclamped = coord;
        coord = clamp(coord, uClampFrame.xy, uClampFrame.zw);
        
        outColor = texture(uTexture, coord, unclamped == coord ? 0.0 : -32.0);// lod-bias very negative to force lod 0
    
        `
    )
  }
};
let J, Q;
class Vt extends Ue {
  constructor() {
    J ?? (J = ke({
      name: "tiling-sprite-shader",
      bits: [
        St,
        jt,
        Ge
      ]
    })), Q ?? (Q = Ae({
      name: "tiling-sprite-shader",
      bits: [
        Ct,
        Kt,
        ze
      ]
    }));
    const e = new $({
      uMapCoord: { value: new A(), type: "mat3x3<f32>" },
      uClampFrame: { value: new Float32Array([0, 0, 1, 1]), type: "vec4<f32>" },
      uClampOffset: { value: new Float32Array([0, 0]), type: "vec2<f32>" },
      uTextureTransform: { value: new A(), type: "mat3x3<f32>" },
      uSizeAnchor: { value: new Float32Array([100, 100, 0.5, 0.5]), type: "vec4<f32>" }
    });
    super({
      glProgram: Q,
      gpuProgram: J,
      resources: {
        localUniforms: new $({
          uTransformMatrix: { value: new A(), type: "mat3x3<f32>" },
          uColor: { value: new Float32Array([1, 1, 1, 1]), type: "vec4<f32>" },
          uRound: { value: 0, type: "f32" }
        }),
        tilingUniforms: e,
        uTexture: k.EMPTY.source,
        uSampler: k.EMPTY.source.style
      }
    });
  }
  updateUniforms(e, t, r, s, i, a) {
    const o = this.resources.tilingUniforms, l = a.width, c = a.height, h = a.textureMatrix, d = o.uniforms.uTextureTransform;
    d.set(
      r.a * l / e,
      r.b * l / t,
      r.c * c / e,
      r.d * c / t,
      r.tx / e,
      r.ty / t
    ), d.invert(), o.uniforms.uMapCoord = h.mapCoord, o.uniforms.uClampFrame = h.uClampFrame, o.uniforms.uClampOffset = h.uClampOffset, o.uniforms.uTextureTransform = d, o.uniforms.uSizeAnchor[0] = e, o.uniforms.uSizeAnchor[1] = t, o.uniforms.uSizeAnchor[2] = s, o.uniforms.uSizeAnchor[3] = i, a && (this.resources.uTexture = a.source, this.resources.uSampler = a.source.style);
  }
}
class qt extends ae {
  constructor() {
    super({
      positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      indices: new Uint32Array([0, 1, 2, 0, 2, 3])
    });
  }
}
function Nt(n, e) {
  const t = n.anchor.x, r = n.anchor.y;
  e[0] = -t * n.width, e[1] = -r * n.height, e[2] = (1 - t) * n.width, e[3] = -r * n.height, e[4] = (1 - t) * n.width, e[5] = (1 - r) * n.height, e[6] = -t * n.width, e[7] = (1 - r) * n.height;
}
function Jt(n, e, t, r) {
  let s = 0;
  const i = n.length / (e || 2), a = r.a, o = r.b, l = r.c, c = r.d, h = r.tx, d = r.ty;
  for (t *= e; s < i; ) {
    const g = n[t], u = n[t + 1];
    n[t] = a * g + l * u + h, n[t + 1] = o * g + c * u + d, t += e, s++;
  }
}
function Qt(n, e) {
  const t = n.texture, r = t.frame.width, s = t.frame.height;
  let i = 0, a = 0;
  n._applyAnchorToTexture && (i = n.anchor.x, a = n.anchor.y), e[0] = e[6] = -i, e[2] = e[4] = 1 - i, e[1] = e[3] = -a, e[5] = e[7] = 1 - a;
  const o = A.shared;
  o.copyFrom(n._tileTransform.matrix), o.tx /= n.width, o.ty /= n.height, o.invert(), o.scale(n.width / r, n.height / s), Jt(e, 2, 0, o);
}
const X = new qt();
class it {
  constructor(e) {
    this._state = Re.default2d, this._tilingSpriteDataHash = /* @__PURE__ */ Object.create(null), this._renderer = e;
  }
  validateRenderable(e) {
    const t = this._getTilingSpriteData(e), r = t.canBatch;
    this._updateCanBatch(e);
    const s = t.canBatch;
    if (s && s === r) {
      const { batchableMesh: i } = t;
      if (i && i.texture._source !== e.texture._source)
        return !i.batcher.checkAndUpdateTexture(i, e.texture);
    }
    return r !== s;
  }
  addRenderable(e, t) {
    const r = this._renderer.renderPipes.batch;
    this._updateCanBatch(e);
    const s = this._getTilingSpriteData(e), { geometry: i, canBatch: a } = s;
    if (a) {
      s.batchableMesh || (s.batchableMesh = new le());
      const o = s.batchableMesh;
      e._didTilingSpriteUpdate && (e._didTilingSpriteUpdate = !1, this._updateBatchableMesh(e), o.geometry = i, o.mesh = e, o.texture = e._texture), o.roundPixels = this._renderer._roundPixels | e._roundPixels, r.addToBatch(o);
    } else
      r.break(t), s.shader || (s.shader = new Vt()), this.updateRenderable(e), t.add(e);
  }
  execute(e) {
    const { shader: t } = this._tilingSpriteDataHash[e.uid];
    t.groups[0] = this._renderer.globalUniforms.bindGroup;
    const r = t.resources.localUniforms.uniforms;
    r.uTransformMatrix = e.groupTransform, r.uRound = this._renderer._roundPixels | e._roundPixels, ne(
      e.groupColorAlpha,
      r.uColor,
      0
    ), this._state.blendMode = Me(e.groupBlendMode, e.texture._source), this._renderer.encoder.draw({
      geometry: X,
      shader: t,
      state: this._state
    });
  }
  updateRenderable(e) {
    const t = this._getTilingSpriteData(e), { canBatch: r } = t;
    if (r) {
      const { batchableMesh: s } = t;
      e._didTilingSpriteUpdate && this._updateBatchableMesh(e), s.batcher.updateElement(s);
    } else if (e._didTilingSpriteUpdate) {
      const { shader: s } = t;
      s.updateUniforms(
        e.width,
        e.height,
        e._tileTransform.matrix,
        e.anchor.x,
        e.anchor.y,
        e.texture
      );
    }
    e._didTilingSpriteUpdate = !1;
  }
  destroyRenderable(e) {
    var r;
    const t = this._getTilingSpriteData(e);
    t.batchableMesh = null, (r = t.shader) == null || r.destroy(), this._tilingSpriteDataHash[e.uid] = null;
  }
  _getTilingSpriteData(e) {
    return this._tilingSpriteDataHash[e.uid] || this._initTilingSpriteData(e);
  }
  _initTilingSpriteData(e) {
    const t = new ae({
      indices: X.indices,
      positions: X.positions.slice(),
      uvs: X.uvs.slice()
    });
    return this._tilingSpriteDataHash[e.uid] = {
      canBatch: !0,
      renderable: e,
      geometry: t
    }, e.on("destroyed", () => {
      this.destroyRenderable(e);
    }), this._tilingSpriteDataHash[e.uid];
  }
  _updateBatchableMesh(e) {
    const t = this._getTilingSpriteData(e), { geometry: r } = t, s = e.texture.source.style;
    s.addressMode !== "repeat" && (s.addressMode = "repeat", s.update()), Qt(e, r.uvs), Nt(e, r.positions);
  }
  destroy() {
    for (const e in this._tilingSpriteDataHash)
      this.destroyRenderable(this._tilingSpriteDataHash[e].renderable);
    this._tilingSpriteDataHash = null, this._renderer = null;
  }
  _updateCanBatch(e) {
    const t = this._getTilingSpriteData(e), r = e.texture;
    let s = !0;
    return this._renderer.type === ie.WEBGL && (s = this._renderer.context.supports.nonPowOf2wrapping), t.canBatch = r.textureMatrix.isSimple && (s || r.source.isPowerOfTwo), t.canBatch;
  }
}
it.extension = {
  type: [
    _.WebGLPipes,
    _.WebGPUPipes,
    _.CanvasPipes
  ],
  name: "tilingSprite"
};
const Zt = {
  name: "local-uniform-msdf-bit",
  vertex: {
    header: (
      /* wgsl */
      `
            struct LocalUniforms {
                uColor:vec4<f32>,
                uTransformMatrix:mat3x3<f32>,
                uDistance: f32,
                uRound:f32,
            }

            @group(2) @binding(0) var<uniform> localUniforms : LocalUniforms;
        `
    ),
    main: (
      /* wgsl */
      `
            vColor *= localUniforms.uColor;
            modelMatrix *= localUniforms.uTransformMatrix;
        `
    ),
    end: (
      /* wgsl */
      `
            if(localUniforms.uRound == 1)
            {
                vPosition = vec4(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
            }
        `
    )
  },
  fragment: {
    header: (
      /* wgsl */
      `
            struct LocalUniforms {
                uColor:vec4<f32>,
                uTransformMatrix:mat3x3<f32>,
                uDistance: f32
            }

            @group(2) @binding(0) var<uniform> localUniforms : LocalUniforms;
         `
    ),
    main: (
      /* wgsl */
      ` 
            outColor = vec4<f32>(calculateMSDFAlpha(outColor, localUniforms.uColor, localUniforms.uDistance));
        `
    )
  }
}, er = {
  name: "local-uniform-msdf-bit",
  vertex: {
    header: (
      /* glsl */
      `
            uniform mat3 uTransformMatrix;
            uniform vec4 uColor;
            uniform float uRound;
        `
    ),
    main: (
      /* glsl */
      `
            vColor *= uColor;
            modelMatrix *= uTransformMatrix;
        `
    ),
    end: (
      /* glsl */
      `
            if(uRound == 1.)
            {
                gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
            }
        `
    )
  },
  fragment: {
    header: (
      /* glsl */
      `
            uniform float uDistance;
         `
    ),
    main: (
      /* glsl */
      ` 
            outColor = vec4(calculateMSDFAlpha(outColor, vColor, uDistance));
        `
    )
  }
}, tr = {
  name: "msdf-bit",
  fragment: {
    header: (
      /* wgsl */
      `
            fn calculateMSDFAlpha(msdfColor:vec4<f32>, shapeColor:vec4<f32>, distance:f32) -> f32 {
                
                // MSDF
                var median = msdfColor.r + msdfColor.g + msdfColor.b -
                    min(msdfColor.r, min(msdfColor.g, msdfColor.b)) -
                    max(msdfColor.r, max(msdfColor.g, msdfColor.b));
            
                // SDF
                median = min(median, msdfColor.a);

                var screenPxDistance = distance * (median - 0.5);
                var alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);
                if (median < 0.01) {
                    alpha = 0.0;
                } else if (median > 0.99) {
                    alpha = 1.0;
                }

                // Gamma correction for coverage-like alpha
                var luma: f32 = dot(shapeColor.rgb, vec3<f32>(0.299, 0.587, 0.114));
                var gamma: f32 = mix(1.0, 1.0 / 2.2, luma);
                var coverage: f32 = pow(shapeColor.a * alpha, gamma);

                return coverage;
             
            }
        `
    )
  }
}, rr = {
  name: "msdf-bit",
  fragment: {
    header: (
      /* glsl */
      `
            float calculateMSDFAlpha(vec4 msdfColor, vec4 shapeColor, float distance) {
                
                // MSDF
                float median = msdfColor.r + msdfColor.g + msdfColor.b -
                                min(msdfColor.r, min(msdfColor.g, msdfColor.b)) -
                                max(msdfColor.r, max(msdfColor.g, msdfColor.b));
               
                // SDF
                median = min(median, msdfColor.a);
            
                float screenPxDistance = distance * (median - 0.5);
                float alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);
           
                if (median < 0.01) {
                    alpha = 0.0;
                } else if (median > 0.99) {
                    alpha = 1.0;
                }

                // Gamma correction for coverage-like alpha
                float luma = dot(shapeColor.rgb, vec3(0.299, 0.587, 0.114));
                float gamma = mix(1.0, 1.0 / 2.2, luma);
                float coverage = pow(shapeColor.a * alpha, gamma);  
              
                return coverage;
            }
        `
    )
  }
};
let Z, ee;
class sr extends Ue {
  constructor() {
    const e = new $({
      uColor: { value: new Float32Array([1, 1, 1, 1]), type: "vec4<f32>" },
      uTransformMatrix: { value: new A(), type: "mat3x3<f32>" },
      uDistance: { value: 4, type: "f32" },
      uRound: { value: 0, type: "f32" }
    }), t = yt();
    Z ?? (Z = ke({
      name: "sdf-shader",
      bits: [
        Bt,
        Pt(t),
        Zt,
        tr,
        Ge
      ]
    })), ee ?? (ee = Ae({
      name: "sdf-shader",
      bits: [
        Mt,
        Ft(t),
        er,
        rr,
        ze
      ]
    })), super({
      glProgram: ee,
      gpuProgram: Z,
      resources: {
        localUniforms: e,
        batchSamplers: Rt(t)
      }
    });
  }
}
class nt {
  // private _sdfShader: SdfShader;
  constructor(e) {
    this._gpuBitmapText = {}, this._renderer = e;
  }
  validateRenderable(e) {
    const t = this._getGpuBitmapText(e);
    return e._didTextUpdate && (e._didTextUpdate = !1, this._updateContext(e, t)), this._renderer.renderPipes.graphics.validateRenderable(t);
  }
  addRenderable(e, t) {
    const r = this._getGpuBitmapText(e);
    ye(e, r), e._didTextUpdate && (e._didTextUpdate = !1, this._updateContext(e, r)), this._renderer.renderPipes.graphics.addRenderable(r, t), r.context.customShader && this._updateDistanceField(e);
  }
  destroyRenderable(e) {
    this._destroyRenderableByUid(e.uid);
  }
  _destroyRenderableByUid(e) {
    const t = this._gpuBitmapText[e].context;
    t.customShader && (w.return(t.customShader), t.customShader = null), w.return(this._gpuBitmapText[e]), this._gpuBitmapText[e] = null;
  }
  updateRenderable(e) {
    const t = this._getGpuBitmapText(e);
    ye(e, t), this._renderer.renderPipes.graphics.updateRenderable(t), t.context.customShader && this._updateDistanceField(e);
  }
  _updateContext(e, t) {
    const { context: r } = t, s = Ht.getFont(e.text, e._style);
    r.clear(), s.distanceField.type !== "none" && (r.customShader || (r.customShader = w.get(sr)));
    const i = Array.from(e.text), a = e._style;
    let o = s.baseLineOffset;
    const l = Ee(i, a, s);
    let c = 0;
    const h = a.padding, d = l.scale;
    let g = l.width, u = l.height + l.offsetY;
    a._stroke && (g += a._stroke.width / d, u += a._stroke.width / d), r.translate(-e._anchor._x * g - h, -e._anchor._y * u - h).scale(d, d);
    const f = s.applyFillAsTint ? a._fill.color : 16777215;
    for (let p = 0; p < l.lines.length; p++) {
      const m = l.lines[p];
      for (let x = 0; x < m.charPositions.length; x++) {
        const T = i[c++], b = s.chars[T];
        b != null && b.texture && r.texture(
          b.texture,
          f || "black",
          Math.round(m.charPositions[x] + b.xOffset),
          Math.round(o + b.yOffset)
        );
      }
      o += s.lineHeight;
    }
  }
  _getGpuBitmapText(e) {
    return this._gpuBitmapText[e.uid] || this.initGpuText(e);
  }
  initGpuText(e) {
    const t = w.get(wt);
    return this._gpuBitmapText[e.uid] = t, this._updateContext(e, t), e.on("destroyed", () => {
      this.destroyRenderable(e);
    }), this._gpuBitmapText[e.uid];
  }
  _updateDistanceField(e) {
    const t = this._getGpuBitmapText(e).context, r = e._style.fontFamily, s = F.get(`${r}-bitmap`), { a: i, b: a, c: o, d: l } = e.groupTransform, c = Math.sqrt(i * i + a * a), h = Math.sqrt(o * o + l * l), d = (Math.abs(c) + Math.abs(h)) / 2, g = s.baseRenderedFontSize / e._style.fontSize, u = d * s.distanceField.range * (1 / g);
    t.customShader.resources.localUniforms.uniforms.uDistance = u;
  }
  destroy() {
    for (const e in this._gpuBitmapText)
      this._destroyRenderableByUid(e);
    this._gpuBitmapText = null, this._renderer = null;
  }
}
nt.extension = {
  type: [
    _.WebGLPipes,
    _.WebGPUPipes,
    _.CanvasPipes
  ],
  name: "bitmapText"
};
function ye(n, e) {
  e.groupTransform = n.groupTransform, e.groupColorAlpha = n.groupColorAlpha, e.groupColor = n.groupColor, e.groupBlendMode = n.groupBlendMode, e.globalDisplayStatus = n.globalDisplayStatus, e.groupTransform = n.groupTransform, e.localDisplayStatus = n.localDisplayStatus, e.groupAlpha = n.groupAlpha, e._roundPixels = n._roundPixels;
}
class at {
  constructor(e) {
    this._gpuText = /* @__PURE__ */ Object.create(null), this._renderer = e, this._renderer.runners.resolutionChange.add(this);
  }
  resolutionChange() {
    for (const e in this._gpuText) {
      const r = this._gpuText[e].batchableSprite.renderable;
      r._autoResolution && (r._resolution = this._renderer.resolution, r.onViewUpdate());
    }
  }
  validateRenderable(e) {
    const t = this._getGpuText(e), r = e._getKey();
    return t.textureNeedsUploading ? (t.textureNeedsUploading = !1, !0) : t.currentKey !== r;
  }
  addRenderable(e) {
    const r = this._getGpuText(e).batchableSprite;
    e._didTextUpdate && this._updateText(e), this._renderer.renderPipes.batch.addToBatch(r);
  }
  updateRenderable(e) {
    const r = this._getGpuText(e).batchableSprite;
    e._didTextUpdate && this._updateText(e), r.batcher.updateElement(r);
  }
  destroyRenderable(e) {
    this._destroyRenderableById(e.uid);
  }
  _destroyRenderableById(e) {
    const t = this._gpuText[e];
    this._renderer.htmlText.decreaseReferenceCount(t.currentKey), w.return(t.batchableSprite), this._gpuText[e] = null;
  }
  _updateText(e) {
    const t = e._getKey(), r = this._getGpuText(e), s = r.batchableSprite;
    r.currentKey !== t && this._updateGpuText(e).catch((a) => {
      console.error(a);
    }), e._didTextUpdate = !1;
    const i = e._style.padding;
    se(s.bounds, e._anchor, s.texture, i);
  }
  async _updateGpuText(e) {
    e._didTextUpdate = !1;
    const t = this._getGpuText(e);
    if (t.generatingTexture)
      return;
    const r = e._getKey();
    this._renderer.htmlText.decreaseReferenceCount(t.currentKey), t.generatingTexture = !0, t.currentKey = r;
    const s = e.resolution ?? this._renderer.resolution, i = await this._renderer.htmlText.getManagedTexture(
      e.text,
      s,
      e._style,
      e._getKey()
    ), a = t.batchableSprite;
    a.texture = t.texture = i, t.generatingTexture = !1, t.textureNeedsUploading = !0, e.onViewUpdate();
    const o = e._style.padding;
    se(a.bounds, e._anchor, a.texture, o);
  }
  _getGpuText(e) {
    return this._gpuText[e.uid] || this.initGpuText(e);
  }
  initGpuText(e) {
    const t = {
      texture: k.EMPTY,
      currentKey: "--",
      batchableSprite: w.get(He),
      textureNeedsUploading: !1,
      generatingTexture: !1
    }, r = t.batchableSprite;
    return r.renderable = e, r.texture = k.EMPTY, r.bounds = { minX: 0, maxX: 1, minY: 0, maxY: 0 }, r.roundPixels = this._renderer._roundPixels | e._roundPixels, e._resolution = e._autoResolution ? this._renderer.resolution : e.resolution, this._gpuText[e.uid] = t, e.on("destroyed", () => {
      this.destroyRenderable(e);
    }), t;
  }
  destroy() {
    for (const e in this._gpuText)
      this._destroyRenderableById(e);
    this._gpuText = null, this._renderer = null;
  }
}
at.extension = {
  type: [
    _.WebGLPipes,
    _.WebGPUPipes,
    _.CanvasPipes
  ],
  name: "htmlText"
};
function ir() {
  const { userAgent: n } = Fe.get().getNavigator();
  return /^((?!chrome|android).)*safari/i.test(n);
}
const nr = new Pe();
function ot(n, e, t, r) {
  const s = nr;
  s.minX = 0, s.minY = 0, s.maxX = n.width / r | 0, s.maxY = n.height / r | 0;
  const i = R.getOptimalTexture(
    s.width,
    s.height,
    r,
    !1
  );
  return i.source.uploadMethodId = "image", i.source.resource = n, i.source.alphaMode = "premultiply-alpha-on-upload", i.frame.width = e / r, i.frame.height = t / r, i.source.emit("update", i.source), i.updateUvs(), i;
}
function ar(n, e) {
  const t = e.fontFamily, r = [], s = {}, i = /font-family:([^;"\s]+)/g, a = n.match(i);
  function o(l) {
    s[l] || (r.push(l), s[l] = !0);
  }
  if (Array.isArray(t))
    for (let l = 0; l < t.length; l++)
      o(t[l]);
  else
    o(t);
  a && a.forEach((l) => {
    const c = l.split(":")[1].trim();
    o(c);
  });
  for (const l in e.tagStyles) {
    const c = e.tagStyles[l].fontFamily;
    o(c);
  }
  return r;
}
async function or(n) {
  const t = await (await Fe.get().fetch(n)).blob(), r = new FileReader();
  return await new Promise((i, a) => {
    r.onloadend = () => i(r.result), r.onerror = a, r.readAsDataURL(t);
  });
}
async function we(n, e) {
  const t = await or(e);
  return `@font-face {
        font-family: "${n.fontFamily}";
        src: url('${t}');
        font-weight: ${n.fontWeight};
        font-style: ${n.fontStyle};
    }`;
}
const j = /* @__PURE__ */ new Map();
async function lr(n, e, t) {
  const r = n.filter((s) => F.has(`${s}-and-url`)).map((s, i) => {
    if (!j.has(s)) {
      const { url: a } = F.get(`${s}-and-url`);
      i === 0 ? j.set(s, we({
        fontWeight: e.fontWeight,
        fontStyle: e.fontStyle,
        fontFamily: s
      }, a)) : j.set(s, we({
        fontWeight: t.fontWeight,
        fontStyle: t.fontStyle,
        fontFamily: s
      }, a));
    }
    return j.get(s);
  });
  return (await Promise.all(r)).join(`
`);
}
function cr(n, e, t, r, s) {
  const { domElement: i, styleElement: a, svgRoot: o } = s;
  i.innerHTML = `<style>${e.cssStyle}</style><div>${n}</div>`, i.setAttribute("style", `transform: scale(${t});transform-origin: top left; display: inline-block`), a.textContent = r;
  const { width: l, height: c } = s.image;
  return o.setAttribute("width", l.toString()), o.setAttribute("height", c.toString()), new XMLSerializer().serializeToString(o);
}
function hr(n, e) {
  const t = D.getOptimalCanvasAndContext(
    n.width,
    n.height,
    e
  ), { context: r } = t;
  return r.clearRect(0, 0, n.width, n.height), r.drawImage(n, 0, 0), D.returnCanvasAndContext(t), t.canvas;
}
function dr(n, e, t) {
  return new Promise(async (r) => {
    t && await new Promise((s) => setTimeout(s, 100)), n.onload = () => {
      r();
    }, n.src = `data:image/svg+xml;charset=utf8,${encodeURIComponent(e)}`, n.crossOrigin = "anonymous";
  });
}
class ce {
  constructor(e) {
    this._activeTextures = {}, this._renderer = e, this._createCanvas = e.type === ie.WEBGPU;
  }
  getTexture(e) {
    return this._buildTexturePromise(
      e.text,
      e.resolution,
      e.style
    );
  }
  getManagedTexture(e, t, r, s) {
    if (this._activeTextures[s])
      return this._increaseReferenceCount(s), this._activeTextures[s].promise;
    const i = this._buildTexturePromise(e, t, r).then((a) => (this._activeTextures[s].texture = a, a));
    return this._activeTextures[s] = {
      texture: null,
      promise: i,
      usageCount: 1
    }, i;
  }
  async _buildTexturePromise(e, t, r) {
    const s = w.get(Ne), i = ar(e, r), a = await lr(
      i,
      r,
      oe.defaultTextStyle
    ), o = $t(e, r, a, s), l = Math.ceil(Math.ceil(Math.max(1, o.width) + r.padding * 2) * t), c = Math.ceil(Math.ceil(Math.max(1, o.height) + r.padding * 2) * t), h = s.image;
    h.width = l | 0, h.height = c | 0;
    const d = cr(e, r, t, a, s);
    await dr(h, d, ir() && i.length > 0);
    let g = h;
    this._createCanvas && (g = hr(h, t));
    const u = ot(g, h.width, h.height, t);
    return this._createCanvas && this._renderer.texture.initSource(u.source), w.return(s), u;
  }
  _increaseReferenceCount(e) {
    this._activeTextures[e].usageCount++;
  }
  decreaseReferenceCount(e) {
    const t = this._activeTextures[e];
    t && (t.usageCount--, t.usageCount === 0 && (t.texture ? this._cleanUp(t) : t.promise.then((r) => {
      t.texture = r, this._cleanUp(t);
    }).catch(() => {
      L("HTMLTextSystem: Failed to clean texture");
    }), this._activeTextures[e] = null));
  }
  _cleanUp(e) {
    R.returnTexture(e.texture), e.texture.source.resource = null, e.texture.source.uploadMethodId = "unknown";
  }
  getReferenceCount(e) {
    return this._activeTextures[e].usageCount;
  }
  destroy() {
    this._activeTextures = null;
  }
}
ce.extension = {
  type: [
    _.WebGLSystem,
    _.WebGPUSystem,
    _.CanvasSystem
  ],
  name: "htmlText"
};
ce.defaultFontOptions = {
  fontFamily: "Arial",
  fontStyle: "normal",
  fontWeight: "normal"
};
class lt {
  constructor(e) {
    this._gpuText = /* @__PURE__ */ Object.create(null), this._renderer = e, this._renderer.runners.resolutionChange.add(this);
  }
  resolutionChange() {
    for (const e in this._gpuText) {
      const r = this._gpuText[e].batchableSprite.renderable;
      r._autoResolution && (r._resolution = this._renderer.resolution, r.onViewUpdate());
    }
  }
  validateRenderable(e) {
    const t = this._getGpuText(e), r = e._getKey();
    if (t.currentKey !== r) {
      const { width: s, height: i } = this._renderer.canvasText.getTextureSize(
        e.text,
        e.resolution,
        e._style
      );
      return (
        // is only being used by this text:
        !(this._renderer.canvasText.getReferenceCount(t.currentKey) === 1 && s === t.texture._source.width && i === t.texture._source.height)
      );
    }
    return !1;
  }
  addRenderable(e, t) {
    const s = this._getGpuText(e).batchableSprite;
    e._didTextUpdate && this._updateText(e), this._renderer.renderPipes.batch.addToBatch(s);
  }
  updateRenderable(e) {
    const r = this._getGpuText(e).batchableSprite;
    e._didTextUpdate && this._updateText(e), r.batcher.updateElement(r);
  }
  destroyRenderable(e) {
    this._destroyRenderableById(e.uid);
  }
  _destroyRenderableById(e) {
    const t = this._gpuText[e];
    this._renderer.canvasText.decreaseReferenceCount(t.currentKey), w.return(t.batchableSprite), this._gpuText[e] = null;
  }
  _updateText(e) {
    const t = e._getKey(), r = this._getGpuText(e), s = r.batchableSprite;
    r.currentKey !== t && this._updateGpuText(e), e._didTextUpdate = !1;
    const i = e._style.padding;
    se(s.bounds, e._anchor, s.texture, i);
  }
  _updateGpuText(e) {
    const t = this._getGpuText(e), r = t.batchableSprite;
    t.texture && this._renderer.canvasText.decreaseReferenceCount(t.currentKey), t.texture = r.texture = this._renderer.canvasText.getManagedTexture(e), t.currentKey = e._getKey(), r.texture = t.texture;
  }
  _getGpuText(e) {
    return this._gpuText[e.uid] || this.initGpuText(e);
  }
  initGpuText(e) {
    const t = {
      texture: null,
      currentKey: "--",
      batchableSprite: w.get(He)
    };
    return t.batchableSprite.renderable = e, t.batchableSprite.bounds = { minX: 0, maxX: 1, minY: 0, maxY: 0 }, t.batchableSprite.roundPixels = this._renderer._roundPixels | e._roundPixels, this._gpuText[e.uid] = t, e._resolution = e._autoResolution ? this._renderer.resolution : e.resolution, this._updateText(e), e.on("destroyed", () => {
      this.destroyRenderable(e);
    }), t;
  }
  destroy() {
    for (const e in this._gpuText)
      this._destroyRenderableById(e);
    this._gpuText = null, this._renderer = null;
  }
}
lt.extension = {
  type: [
    _.WebGLPipes,
    _.WebGPUPipes,
    _.CanvasPipes
  ],
  name: "text"
};
function ve(n, e, t) {
  for (let r = 0, s = 4 * t * e; r < e; ++r, s += 4)
    if (n[s + 3] !== 0)
      return !1;
  return !0;
}
function Se(n, e, t, r, s) {
  const i = 4 * e;
  for (let a = r, o = r * i + 4 * t; a <= s; ++a, o += i)
    if (n[o + 3] !== 0)
      return !1;
  return !0;
}
function ur(n, e = 1) {
  const { width: t, height: r } = n, s = n.getContext("2d", {
    willReadFrequently: !0
  });
  if (s === null)
    throw new TypeError("Failed to get canvas 2D context");
  const a = s.getImageData(0, 0, t, r).data;
  let o = 0, l = 0, c = t - 1, h = r - 1;
  for (; l < r && ve(a, t, l); )
    ++l;
  if (l === r)
    return re.EMPTY;
  for (; ve(a, t, h); )
    --h;
  for (; Se(a, t, o, l, h); )
    ++o;
  for (; Se(a, t, c, l, h); )
    --c;
  return ++c, ++h, new re(o / e, l / e, (c - o) / e, (h - l) / e);
}
class ct {
  constructor(e) {
    this._activeTextures = {}, this._renderer = e;
  }
  getTextureSize(e, t, r) {
    const s = z.measureText(e || " ", r);
    let i = Math.ceil(Math.ceil(Math.max(1, s.width) + r.padding * 2) * t), a = Math.ceil(Math.ceil(Math.max(1, s.height) + r.padding * 2) * t);
    return i = Math.ceil(i - 1e-6), a = Math.ceil(a - 1e-6), i = pe(i), a = pe(a), { width: i, height: a };
  }
  getTexture(e, t, r, s) {
    typeof e == "string" && (U("8.0.0", "CanvasTextSystem.getTexture: Use object TextOptions instead of separate arguments"), e = {
      text: e,
      style: r,
      resolution: t
    }), e.style instanceof E || (e.style = new E(e.style));
    const { texture: i, canvasAndContext: a } = this.createTextureAndCanvas(
      e
    );
    return this._renderer.texture.initSource(i._source), D.returnCanvasAndContext(a), i;
  }
  createTextureAndCanvas(e) {
    const { text: t, style: r } = e, s = e.resolution ?? this._renderer.resolution, i = z.measureText(t || " ", r), a = Math.ceil(Math.ceil(Math.max(1, i.width) + r.padding * 2) * s), o = Math.ceil(Math.ceil(Math.max(1, i.height) + r.padding * 2) * s), l = D.getOptimalCanvasAndContext(a, o), { canvas: c } = l;
    this.renderTextToCanvas(t, r, s, l);
    const h = ot(c, a, o, s);
    if (r.trim) {
      const d = ur(c, s);
      h.frame.copyFrom(d), h.updateUvs();
    }
    return { texture: h, canvasAndContext: l };
  }
  getManagedTexture(e) {
    e._resolution = e._autoResolution ? this._renderer.resolution : e.resolution;
    const t = e._getKey();
    if (this._activeTextures[t])
      return this._increaseReferenceCount(t), this._activeTextures[t].texture;
    const { texture: r, canvasAndContext: s } = this.createTextureAndCanvas(e);
    return this._activeTextures[t] = {
      canvasAndContext: s,
      texture: r,
      usageCount: 1
    }, r;
  }
  _increaseReferenceCount(e) {
    this._activeTextures[e].usageCount++;
  }
  decreaseReferenceCount(e) {
    const t = this._activeTextures[e];
    if (t.usageCount--, t.usageCount === 0) {
      D.returnCanvasAndContext(t.canvasAndContext), R.returnTexture(t.texture);
      const r = t.texture.source;
      r.resource = null, r.uploadMethodId = "unknown", r.alphaMode = "no-premultiply-alpha", this._activeTextures[e] = null;
    }
  }
  getReferenceCount(e) {
    return this._activeTextures[e].usageCount;
  }
  /**
   * Renders text to its canvas, and updates its texture.
   *
   * By default this is used internally to ensure the texture is correct before rendering,
   * but it can be used called externally, for example from this class to 'pre-generate' the texture from a piece of text,
   * and then shared across multiple Sprites.
   * @param text
   * @param style
   * @param resolution
   * @param canvasAndContext
   */
  renderTextToCanvas(e, t, r, s) {
    var b, y, v, M, S;
    const { canvas: i, context: a } = s, o = te(t), l = z.measureText(e || " ", t), c = l.lines, h = l.lineHeight, d = l.lineWidths, g = l.maxLineWidth, u = l.fontProperties, f = i.height;
    a.resetTransform(), a.scale(r, r);
    const p = t.padding * 2;
    if (a.clearRect(0, 0, l.width + 4 + p, l.height + 4 + p), (b = t._stroke) != null && b.width) {
      const C = t._stroke;
      a.lineWidth = C.width, a.miterLimit = C.miterLimit, a.lineJoin = C.join, a.lineCap = C.cap;
    }
    a.font = o;
    let m, x;
    const T = t.dropShadow ? 2 : 1;
    for (let C = 0; C < T; ++C) {
      const G = t.dropShadow && C === 0, O = G ? Math.ceil(Math.max(1, f) + t.padding * 2) : 0, V = O * r;
      if (G) {
        a.fillStyle = "black", a.strokeStyle = "black";
        const B = t.dropShadow, ht = B.color, dt = B.alpha;
        a.shadowColor = W.shared.setValue(ht).setAlpha(dt).toRgbaString();
        const ut = B.blur * r, ue = B.distance * r;
        a.shadowBlur = ut, a.shadowOffsetX = Math.cos(B.angle) * ue, a.shadowOffsetY = Math.sin(B.angle) * ue + V;
      } else
        a.globalAlpha = ((y = t._fill) == null ? void 0 : y.alpha) ?? 1, a.fillStyle = t._fill ? K(t._fill, a) : null, (v = t._stroke) != null && v.width && (a.strokeStyle = K(t._stroke, a)), a.shadowColor = "black";
      let he = (h - u.fontSize) / 2;
      h - u.fontSize < 0 && (he = 0);
      const de = ((M = t._stroke) == null ? void 0 : M.width) ?? 0;
      for (let B = 0; B < c.length; B++)
        m = de / 2, x = de / 2 + B * h + u.ascent + he, t.align === "right" ? m += g - d[B] : t.align === "center" && (m += (g - d[B]) / 2), (S = t._stroke) != null && S.width && this._drawLetterSpacing(
          c[B],
          t,
          s,
          m + t.padding,
          x + t.padding - O,
          !0
        ), t._fill !== void 0 && this._drawLetterSpacing(
          c[B],
          t,
          s,
          m + t.padding,
          x + t.padding - O
        );
    }
  }
  /**
   * Render the text with letter-spacing.
   * @param text - The text to draw
   * @param style
   * @param canvasAndContext
   * @param x - Horizontal position to draw the text
   * @param y - Vertical position to draw the text
   * @param isStroke - Is this drawing for the outside stroke of the
   *  text? If not, it's for the inside fill
   */
  _drawLetterSpacing(e, t, r, s, i, a = !1) {
    const { context: o } = r, l = t.letterSpacing;
    let c = !1;
    if (z.experimentalLetterSpacingSupported && (z.experimentalLetterSpacing ? (o.letterSpacing = `${l}px`, o.textLetterSpacing = `${l}px`, c = !0) : (o.letterSpacing = "0px", o.textLetterSpacing = "0px")), l === 0 || c) {
      a ? o.strokeText(e, s, i) : o.fillText(e, s, i);
      return;
    }
    let h = s;
    const d = z.graphemeSegmenter(e);
    let g = o.measureText(e).width, u = 0;
    for (let f = 0; f < d.length; ++f) {
      const p = d[f];
      a ? o.strokeText(p, h, i) : o.fillText(p, h, i);
      let m = "";
      for (let x = f + 1; x < d.length; ++x)
        m += d[x];
      u = o.measureText(m).width, h += g - u + l, g = u;
    }
  }
  destroy() {
    this._activeTextures = null;
  }
}
ct.extension = {
  type: [
    _.WebGLSystem,
    _.WebGPUSystem,
    _.CanvasSystem
  ],
  name: "canvasText"
};
P.add(We);
P.add(De);
P.add(Je);
P.add(vt);
P.add(et);
P.add(ct);
P.add(lt);
P.add(nt);
P.add(ce);
P.add(at);
P.add(it);
P.add(st);
P.add(Xe);
P.add($e);
