import { Vector2 as u, Group as H, CanvasTexture as w, LinearFilter as l, SpriteMaterial as k, Sprite as M, ClampToEdgeWrapping as C, Color as v } from "three";
import { GameEntity as R } from "./entity.js";
import { EntityBuilder as W } from "./builder.js";
import { createEntity as E } from "./create.js";
import { DebugDelegate as D } from "./delegates/debug.js";
const x = {
  position: void 0,
  text: "",
  fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: 18,
  fontColor: "#FFFFFF",
  backgroundColor: null,
  padding: 4,
  stickToViewport: !0,
  screenPosition: new u(24, 24),
  zDistance: 1
};
class P extends W {
  createEntity(t) {
    return new o(t);
  }
}
const z = Symbol("Text");
class o extends R {
  static type = z;
  _sprite = null;
  _texture = null;
  _canvas = null;
  _ctx = null;
  _cameraRef = null;
  _lastCanvasW = 0;
  _lastCanvasH = 0;
  constructor(t) {
    super(), this.options = { ...x, ...t }, this.group = new H(), this.createSprite(), this.lifeCycleDelegate = {
      setup: [this.textSetup.bind(this)],
      update: [this.textUpdate.bind(this)]
    };
  }
  createSprite() {
    this._canvas = document.createElement("canvas"), this._ctx = this._canvas.getContext("2d"), this._texture = new w(this._canvas), this._texture.minFilter = l, this._texture.magFilter = l;
    const t = new k({
      map: this._texture,
      transparent: !0,
      depthTest: !1,
      depthWrite: !1,
      alphaTest: 0.5
    });
    this._sprite = new M(t), this.group?.add(this._sprite), this.redrawText(this.options.text ?? "");
  }
  redrawText(t) {
    if (!this._canvas || !this._ctx)
      return;
    const e = this.options.fontSize ?? 18, r = this.options.fontFamily ?? x.fontFamily, a = this.options.padding ?? 4;
    this._ctx.font = `${e}px ${r}`;
    const p = this._ctx.measureText(t), _ = Math.ceil(p.width), h = Math.ceil(e * 1.4), n = Math.max(2, _ + a * 2), s = Math.max(2, h + a * 2), f = n !== this._lastCanvasW || s !== this._lastCanvasH;
    this._canvas.width = n, this._canvas.height = s, this._lastCanvasW = n, this._lastCanvasH = s, this._ctx.font = `${e}px ${r}`, this._ctx.textBaseline = "top", this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height), this.options.backgroundColor && (this._ctx.fillStyle = this.toCssColor(this.options.backgroundColor), this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height)), this._ctx.fillStyle = this.toCssColor(this.options.fontColor ?? "#FFFFFF"), this._ctx.fillText(t, a, a), this._texture && (f && (this._texture.dispose(), this._texture = new w(this._canvas), this._texture.minFilter = l, this._texture.magFilter = l, this._texture.wrapS = C, this._texture.wrapT = C), this._texture.image = this._canvas, this._texture.needsUpdate = !0, this._sprite && this._sprite.material && (this._sprite.material.map = this._texture, this._sprite.material.needsUpdate = !0));
  }
  toCssColor(t) {
    return typeof t == "string" ? t : `#${(t instanceof v ? t : new v(t)).getHexString()}`;
  }
  textSetup(t) {
    this._cameraRef = t.camera, this.options.stickToViewport && this._cameraRef && this._cameraRef.camera.add(this.group);
  }
  textUpdate(t) {
    this._sprite && this.options.stickToViewport && this._cameraRef && this.updateStickyTransform();
  }
  updateStickyTransform() {
    if (!this._sprite || !this._cameraRef)
      return;
    const t = this._cameraRef.camera, e = this._cameraRef.renderer.domElement, r = e.clientWidth, a = e.clientHeight, p = (this.options.screenPosition ?? new u(24, 24)).x, _ = (this.options.screenPosition ?? new u(24, 24)).y, h = Math.max(1e-3, this.options.zDistance ?? 1);
    let n = 1, s = 1;
    if (t.isPerspectiveCamera) {
      const i = t, c = Math.tan(i.fov * Math.PI / 180 / 2) * h;
      n = c * i.aspect, s = c;
    } else if (t.isOrthographicCamera) {
      const i = t;
      n = (i.right - i.left) / 2, s = (i.top - i.bottom) / 2;
    }
    const f = p / r * 2 - 1, y = 1 - _ / a * 2, T = f * n, F = y * s;
    if (this.group?.position.set(T, F, -h), this._canvas) {
      const c = s * 2 / a, m = this._canvas.height, g = Math.max(1e-4, m * c), S = this._canvas.width / this._canvas.height, b = g * S;
      this._sprite.scale.set(b, g, 1);
    }
  }
  updateText(t) {
    this.options.text = t, this.redrawText(t), this.options.stickToViewport && this._cameraRef && this.updateStickyTransform();
  }
  buildInfo() {
    return {
      ...new D(this).buildDebugInfo(),
      type: String(o.type),
      text: this.options.text ?? "",
      sticky: this.options.stickToViewport
    };
  }
}
async function X(...d) {
  return E({
    args: d,
    defaultConfig: { ...x },
    EntityClass: o,
    BuilderClass: P,
    entityType: o.type
  });
}
export {
  z as TEXT_TYPE,
  P as TextBuilder,
  o as ZylemText,
  X as text
};
