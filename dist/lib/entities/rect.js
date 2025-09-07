import { Vector2 as f, Group as D, CanvasTexture as R, LinearFilter as x, SpriteMaterial as V, Sprite as Y, ClampToEdgeWrapping as T, ShaderMaterial as y, Color as S, Mesh as z, PlaneGeometry as B, Vector3 as W } from "three";
import { GameEntity as I } from "./entity.js";
import { EntityBuilder as X } from "./builder.js";
import { createEntity as q } from "./create.js";
import { DebugDelegate as U } from "./delegates/debug.js";
const k = {
  position: void 0,
  width: 120,
  height: 48,
  fillColor: "#FFFFFF",
  strokeColor: null,
  strokeWidth: 0,
  radius: 0,
  padding: 0,
  stickToViewport: !0,
  screenPosition: new f(24, 24),
  zDistance: 1,
  anchor: new f(0, 0)
};
class G extends X {
  createEntity(t) {
    return new _(t);
  }
}
const O = Symbol("Rect");
class _ extends I {
  static type = O;
  _sprite = null;
  _mesh = null;
  _texture = null;
  _canvas = null;
  _ctx = null;
  _cameraRef = null;
  _lastCanvasW = 0;
  _lastCanvasH = 0;
  constructor(t) {
    super(), this.options = { ...k, ...t }, this.group = new D(), this.createSprite(), this.lifeCycleDelegate = {
      setup: [this.rectSetup.bind(this)],
      update: [this.rectUpdate.bind(this)]
    };
  }
  createSprite() {
    this._canvas = document.createElement("canvas"), this._ctx = this._canvas.getContext("2d"), this._texture = new R(this._canvas), this._texture.minFilter = x, this._texture.magFilter = x;
    const t = new V({
      map: this._texture,
      transparent: !0,
      depthTest: !1,
      depthWrite: !1,
      alphaTest: 0.5
    });
    this._sprite = new Y(t), this.group?.add(this._sprite), this.redrawRect();
  }
  redrawRect() {
    if (!this._canvas || !this._ctx)
      return;
    const t = Math.max(2, Math.floor(this.options.width ?? 120)), e = Math.max(2, Math.floor(this.options.height ?? 48)), s = this.options.padding ?? 0, i = this.options.strokeWidth ?? 0, a = t + s * 2 + i, r = e + s * 2 + i, o = Math.max(2, a), n = Math.max(2, r), h = o !== this._lastCanvasW || n !== this._lastCanvasH;
    this._canvas.width = o, this._canvas.height = n, this._lastCanvasW = o, this._lastCanvasH = n, this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    const u = Math.max(0, this.options.radius ?? 0), d = Math.floor(s + i / 2), m = Math.floor(s + i / 2), g = Math.floor(t), p = Math.floor(e);
    if (this._ctx.beginPath(), u > 0 ? this.roundedRectPath(this._ctx, d, m, g, p, u) : this._ctx.rect(d, m, g, p), this.options.fillColor && (this._ctx.fillStyle = this.toCssColor(this.options.fillColor), this._ctx.fill()), this.options.strokeColor && i > 0 && (this._ctx.lineWidth = i, this._ctx.strokeStyle = this.toCssColor(this.options.strokeColor), this._ctx.stroke()), this._texture) {
      if (h && (this._texture.dispose(), this._texture = new R(this._canvas), this._texture.minFilter = x, this._texture.magFilter = x, this._texture.wrapS = T, this._texture.wrapT = T, this._sprite && this._sprite.material instanceof y)) {
        const c = this._sprite.material;
        c.uniforms?.tDiffuse && (c.uniforms.tDiffuse.value = this._texture), c.uniforms?.iResolution && c.uniforms.iResolution.value.set(this._canvas.width, this._canvas.height, 1);
      }
      this._texture.image = this._canvas, this._texture.needsUpdate = !0, this._sprite && this._sprite.material && (this._sprite.material.map = this._texture, this._sprite.material.needsUpdate = !0);
    }
  }
  roundedRectPath(t, e, s, i, a, r) {
    const o = Math.min(r, Math.floor(Math.min(i, a) / 2));
    t.moveTo(e + o, s), t.lineTo(e + i - o, s), t.quadraticCurveTo(e + i, s, e + i, s + o), t.lineTo(e + i, s + a - o), t.quadraticCurveTo(e + i, s + a, e + i - o, s + a), t.lineTo(e + o, s + a), t.quadraticCurveTo(e, s + a, e, s + a - o), t.lineTo(e, s + o), t.quadraticCurveTo(e, s, e + o, s);
  }
  toCssColor(t) {
    return typeof t == "string" ? t : `#${(t instanceof S ? t : new S(t)).getHexString()}`;
  }
  rectSetup(t) {
    if (this._cameraRef = t.camera, this.options.stickToViewport && this._cameraRef && this._cameraRef.camera.add(this.group), this.materials?.length && this._sprite) {
      const e = this.materials[0];
      e instanceof y && (e.transparent = !0, e.depthTest = !1, e.depthWrite = !1, this._texture && (e.uniforms?.tDiffuse && (e.uniforms.tDiffuse.value = this._texture), e.uniforms?.iResolution && this._canvas && e.uniforms.iResolution.value.set(this._canvas.width, this._canvas.height, 1)), this._mesh = new z(new B(1, 1), e), this.group?.add(this._mesh), this._sprite.visible = !1);
    }
  }
  rectUpdate(t) {
    if (this._sprite) {
      if (this._cameraRef && this.options.bounds) {
        this._cameraRef.renderer.domElement;
        const e = this.computeScreenBoundsFromOptions(this.options.bounds);
        if (e) {
          const { x: s, y: i, width: a, height: r } = e, o = Math.max(2, Math.floor(a)), n = Math.max(2, Math.floor(r)), h = o !== (this.options.width ?? 0) || n !== (this.options.height ?? 0);
          this.options.screenPosition = new f(Math.floor(s), Math.floor(i)), this.options.width = o, this.options.height = n, this.options.anchor = new f(0, 0), h && this.redrawRect();
        }
      }
      this.options.stickToViewport && this._cameraRef && this.updateStickyTransform();
    }
  }
  updateStickyTransform() {
    if (!this._sprite || !this._cameraRef)
      return;
    const t = this._cameraRef.camera, e = this._cameraRef.renderer.domElement, s = e.clientWidth, i = e.clientHeight, a = (this.options.screenPosition ?? new f(24, 24)).x, r = (this.options.screenPosition ?? new f(24, 24)).y, o = Math.max(1e-3, this.options.zDistance ?? 1);
    let n = 1, h = 1;
    if (t.isPerspectiveCamera) {
      const l = t, w = Math.tan(l.fov * Math.PI / 180 / 2) * o;
      n = w * l.aspect, h = w;
    } else if (t.isOrthographicCamera) {
      const l = t;
      n = (l.right - l.left) / 2, h = (l.top - l.bottom) / 2;
    }
    const u = a / s * 2 - 1, d = 1 - r / i * 2, m = u * n, g = d * h;
    let p = 1, c = 1;
    if (this._canvas) {
      const w = h * 2 / i, C = this._canvas.height;
      c = Math.max(1e-4, C * w);
      const P = this._canvas.width / this._canvas.height;
      p = c * P, this._sprite.scale.set(p, c, 1), this._mesh && this._mesh.scale.set(p, c, 1);
    }
    const M = this.options.anchor ?? new f(0, 0), H = Math.min(100, Math.max(0, M.x)) / 100, b = Math.min(100, Math.max(0, M.y)) / 100, E = (0.5 - H) * p, F = (b - 0.5) * c;
    this.group?.position.set(m + E, g + F, -o);
  }
  worldToScreen(t) {
    if (!this._cameraRef)
      return { x: 0, y: 0 };
    const e = this._cameraRef.camera, s = this._cameraRef.renderer.domElement, i = t.clone().project(e), a = (i.x + 1) / 2 * s.clientWidth, r = (1 - i.y) / 2 * s.clientHeight;
    return { x: a, y: r };
  }
  computeScreenBoundsFromOptions(t) {
    if (!this._cameraRef)
      return null;
    if (this._cameraRef.renderer.domElement, t.screen)
      return { ...t.screen };
    if (t.world) {
      const { left: e, right: s, top: i, bottom: a, z: r = 0 } = t.world, o = this.worldToScreen(new W(e, i, r)), n = this.worldToScreen(new W(s, a, r)), h = Math.min(o.x, n.x), u = Math.min(o.y, n.y), d = Math.abs(n.x - o.x), m = Math.abs(n.y - o.y);
      return { x: h, y: u, width: d, height: m };
    }
    return null;
  }
  updateRect(t) {
    this.options = { ...this.options, ...t }, this.redrawRect(), this.options.stickToViewport && this._cameraRef && this.updateStickyTransform();
  }
  buildInfo() {
    return {
      ...new U(this).buildDebugInfo(),
      type: String(_.type),
      width: this.options.width ?? 0,
      height: this.options.height ?? 0,
      sticky: this.options.stickToViewport
    };
  }
}
async function K(...v) {
  return q({
    args: v,
    defaultConfig: { ...k },
    EntityClass: _,
    BuilderClass: G,
    entityType: _.type
  });
}
export {
  O as RECT_TYPE,
  G as RectBuilder,
  _ as ZylemRect,
  K as rect
};
