import { Vector2 as m, Group as v, CanvasTexture as d, LinearFilter as l, SpriteMaterial as y, Sprite as T, ClampToEdgeWrapping as _, Color as f } from "three";
import { GameEntity as S } from "./entity.js";
import { EntityBuilder as F } from "./builder.js";
import { createEntity as R } from "./create.js";
import { DebugDelegate as H } from "./delegates/debug.js";
const u = {
  position: void 0,
  text: "",
  fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: 18,
  fontColor: "#FFFFFF",
  backgroundColor: null,
  padding: 4,
  stickToViewport: !0,
  screenPosition: new m(24, 24),
  zDistance: 1
};
class k extends F {
  createEntity(t) {
    return new c(t);
  }
}
const b = Symbol("Text");
class c extends S {
  static type = b;
  _sprite = null;
  _texture = null;
  _canvas = null;
  _ctx = null;
  _cameraRef = null;
  _lastCanvasW = 0;
  _lastCanvasH = 0;
  constructor(t) {
    super(), this.options = { ...u, ...t }, this.group = new v(), this.createSprite(), this.lifeCycleDelegate = {
      setup: [this.textSetup.bind(this)],
      update: [this.textUpdate.bind(this)]
    };
  }
  createSprite() {
    this._canvas = document.createElement("canvas"), this._ctx = this._canvas.getContext("2d"), this._texture = new d(this._canvas), this._texture.minFilter = l, this._texture.magFilter = l;
    const t = new y({
      map: this._texture,
      transparent: !0,
      depthTest: !1,
      depthWrite: !1,
      alphaTest: 0.5
    });
    this._sprite = new T(t), this.group?.add(this._sprite), this.redrawText(this.options.text ?? "");
  }
  measureAndResizeCanvas(t, e, s, a) {
    if (!this._canvas || !this._ctx)
      return { sizeChanged: !1 };
    this._ctx.font = `${e}px ${s}`;
    const i = this._ctx.measureText(t), n = Math.ceil(i.width), r = Math.ceil(e * 1.4), o = Math.max(2, n + a * 2), h = Math.max(2, r + a * 2), p = o !== this._lastCanvasW || h !== this._lastCanvasH;
    return this._canvas.width = o, this._canvas.height = h, this._lastCanvasW = o, this._lastCanvasH = h, { sizeChanged: p };
  }
  drawCenteredText(t, e, s) {
    !this._canvas || !this._ctx || (this._ctx.font = `${e}px ${s}`, this._ctx.textAlign = "center", this._ctx.textBaseline = "middle", this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height), this.options.backgroundColor && (this._ctx.fillStyle = this.toCssColor(this.options.backgroundColor), this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height)), this._ctx.fillStyle = this.toCssColor(this.options.fontColor ?? "#FFFFFF"), this._ctx.fillText(t, this._canvas.width / 2, this._canvas.height / 2));
  }
  updateTexture(t) {
    !this._texture || !this._canvas || (t && (this._texture.dispose(), this._texture = new d(this._canvas), this._texture.minFilter = l, this._texture.magFilter = l, this._texture.wrapS = _, this._texture.wrapT = _), this._texture.image = this._canvas, this._texture.needsUpdate = !0, this._sprite && this._sprite.material && (this._sprite.material.map = this._texture, this._sprite.material.needsUpdate = !0));
  }
  redrawText(t) {
    if (!this._canvas || !this._ctx)
      return;
    const e = this.options.fontSize ?? 18, s = this.options.fontFamily ?? u.fontFamily, a = this.options.padding ?? 4, { sizeChanged: i } = this.measureAndResizeCanvas(t, e, s, a);
    this.drawCenteredText(t, e, s), this.updateTexture(!!i), this.options.stickToViewport && this._cameraRef && this.updateStickyTransform();
  }
  toCssColor(t) {
    return typeof t == "string" ? t : `#${(t instanceof f ? t : new f(t)).getHexString()}`;
  }
  textSetup(t) {
    this._cameraRef = t.camera, this.options.stickToViewport && this._cameraRef && (this._cameraRef.camera.add(this.group), this.updateStickyTransform());
  }
  textUpdate(t) {
    this._sprite && this.options.stickToViewport && this._cameraRef && this.updateStickyTransform();
  }
  getResolution() {
    return {
      width: this._cameraRef?.screenResolution.x ?? 1,
      height: this._cameraRef?.screenResolution.y ?? 1
    };
  }
  getScreenPixels(t, e, s) {
    const a = t.x >= 0 && t.x <= 1, i = t.y >= 0 && t.y <= 1;
    return {
      px: a ? t.x * e : t.x,
      py: i ? t.y * s : t.y
    };
  }
  computeWorldExtents(t, e) {
    let s = 1, a = 1;
    if (t.isPerspectiveCamera) {
      const i = t, n = Math.tan(i.fov * Math.PI / 180 / 2) * e;
      s = n * i.aspect, a = n;
    } else if (t.isOrthographicCamera) {
      const i = t;
      s = (i.right - i.left) / 2, a = (i.top - i.bottom) / 2;
    }
    return { worldHalfW: s, worldHalfH: a };
  }
  updateSpriteScale(t, e) {
    if (!this._canvas || !this._sprite)
      return;
    const a = t * 2 / e, i = this._canvas.height, n = Math.max(1e-4, i * a), r = this._canvas.width / this._canvas.height, o = n * r;
    this._sprite.scale.set(o, n, 1);
  }
  updateStickyTransform() {
    if (!this._sprite || !this._cameraRef)
      return;
    const t = this._cameraRef.camera, { width: e, height: s } = this.getResolution(), a = this.options.screenPosition ?? new m(24, 24), { px: i, py: n } = this.getScreenPixels(a, e, s), r = Math.max(1e-3, this.options.zDistance ?? 1), { worldHalfW: o, worldHalfH: h } = this.computeWorldExtents(t, r), p = i / e * 2 - 1, g = 1 - n / s * 2, w = p * o, C = g * h;
    this.group?.position.set(w, C, -r), this.updateSpriteScale(h, s);
  }
  updateText(t) {
    this.options.text = t, this.redrawText(t), this.options.stickToViewport && this._cameraRef && this.updateStickyTransform();
  }
  buildInfo() {
    return {
      ...new H(this).buildDebugInfo(),
      type: String(c.type),
      text: this.options.text ?? "",
      sticky: this.options.stickToViewport
    };
  }
}
async function D(...x) {
  return R({
    args: x,
    defaultConfig: { ...u },
    EntityClass: c,
    BuilderClass: k,
    entityType: c.type
  });
}
export {
  b as TEXT_TYPE,
  k as TextBuilder,
  c as ZylemText,
  D as text
};
