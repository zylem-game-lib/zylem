import { O as Re, M as g, Q as Be, V as Ue, E as u, l as q, p as b, W as Ae, X as K, Y as Ie, b as m, S as p, J as B, w as Y, Z as De, m as H, n as k, K as U, _ as C, L as _, R as w, $ as Ee, a as Fe, C as S, a0 as Oe, a1 as ze, a2 as He, c as J, e as X, a3 as Le, P as We, B as Ve, D as Q, d as je, v as $e, a4 as Ne } from "./main-81987925.mjs";
import { a as qe, S as Z, o as ee, G as te, U as re, T as L, n as W, B as Ke, c as Ye, R as se } from "./colorToUniform-299098bd.mjs";
const ae = class A extends qe {
  /**
   * @param options - The optional parameters of this filter.
   */
  constructor(e) {
    e = { ...A.defaultOptions, ...e }, super(e), this.enabled = !0, this._state = Z.for2d(), this.padding = e.padding, typeof e.antialias == "boolean" ? this.antialias = e.antialias ? "on" : "off" : this.antialias = e.antialias, this.resolution = e.resolution, this.blendRequired = e.blendRequired, this.addResource("uTexture", 0, 1);
  }
  /**
   * Applies the filter
   * @param filterManager - The renderer to retrieve the filter from
   * @param input - The input render target.
   * @param output - The target to output to.
   * @param clearMode - Should the output be cleared before rendering to it
   */
  apply(e, t, r, a) {
    e.applyFilter(this, t, r, a);
  }
  /**
   * Get the blend mode of the filter.
   * @default "normal"
   */
  get blendMode() {
    return this._state.blendMode;
  }
  /** Sets the blend mode of the filter. */
  set blendMode(e) {
    this._state.blendMode = e;
  }
  /**
   * A short hand function to create a filter based of a vertex and fragment shader src.
   * @param options
   * @returns A shiny new PixiJS filter!
   */
  static from(e) {
    const { gpu: t, gl: r, ...a } = e;
    let n, i;
    return t && (n = ee.from(t)), r && (i = te.from(r)), new A({
      gpuProgram: n,
      glProgram: i,
      ...a
    });
  }
};
ae.defaultOptions = {
  blendMode: "normal",
  resolution: 1,
  padding: 0,
  antialias: "off",
  blendRequired: !1
};
let Je = ae;
var Xe = `in vec2 vMaskCoord;
in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform sampler2D uMaskTexture;

uniform float uAlpha;
uniform vec4 uMaskClamp;

out vec4 finalColor;

void main(void)
{
    float clip = step(3.5,
        step(uMaskClamp.x, vMaskCoord.x) +
        step(uMaskClamp.y, vMaskCoord.y) +
        step(vMaskCoord.x, uMaskClamp.z) +
        step(vMaskCoord.y, uMaskClamp.w));

    // TODO look into why this is needed
    float npmAlpha = uAlpha; 
    vec4 original = texture(uTexture, vTextureCoord);
    vec4 masky = texture(uMaskTexture, vMaskCoord);
    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);

    original *= (alphaMul * masky.r * uAlpha * clip);

    finalColor = original;
}
`, Qe = `in vec2 aPosition;

out vec2 vTextureCoord;
out vec2 vMaskCoord;


uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
uniform mat3 uFilterMatrix;

vec4 filterVertexPosition(  vec2 aPosition )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
       
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(  vec2 aPosition )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

vec2 getFilterCoord( vec2 aPosition )
{
    return  ( uFilterMatrix * vec3( filterTextureCoord(aPosition), 1.0)  ).xy;
}   

void main(void)
{
    gl_Position = filterVertexPosition(aPosition);
    vTextureCoord = filterTextureCoord(aPosition);
    vMaskCoord = getFilterCoord(aPosition);
}
`, V = `struct GlobalFilterUniforms {
  uInputSize:vec4<f32>,
  uInputPixel:vec4<f32>,
  uInputClamp:vec4<f32>,
  uOutputFrame:vec4<f32>,
  uGlobalFrame:vec4<f32>,
  uOutputTexture:vec4<f32>,  
};

struct MaskUniforms {
  uFilterMatrix:mat3x3<f32>,
  uMaskClamp:vec4<f32>,
  uAlpha:f32,
};


@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler : sampler;

@group(1) @binding(0) var<uniform> filterUniforms : MaskUniforms;
@group(1) @binding(1) var uMaskTexture: texture_2d<f32>;

struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv : vec2<f32>,
    @location(1) filterUv : vec2<f32>,
  };

fn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>
{
    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;

    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

fn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>
{
    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
}

fn globalTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>
{
  return  (aPosition.xy / gfu.uGlobalFrame.zw) + (gfu.uGlobalFrame.xy / gfu.uGlobalFrame.zw);  
}

fn getFilterCoord(aPosition:vec2<f32> ) -> vec2<f32>
{
  return ( filterUniforms.uFilterMatrix * vec3( filterTextureCoord(aPosition), 1.0)  ).xy;
}

fn getSize() -> vec2<f32>
{

  
  return gfu.uGlobalFrame.zw;
}
  
@vertex
fn mainVertex(
  @location(0) aPosition : vec2<f32>, 
) -> VSOutput {
  return VSOutput(
   filterVertexPosition(aPosition),
   filterTextureCoord(aPosition),
   getFilterCoord(aPosition)
  );
}

@fragment
fn mainFragment(
  @location(0) uv: vec2<f32>,
  @location(1) filterUv: vec2<f32>,
  @builtin(position) position: vec4<f32>
) -> @location(0) vec4<f32> {

    var maskClamp = filterUniforms.uMaskClamp;

     var clip = step(3.5,
        step(maskClamp.x, filterUv.x) +
        step(maskClamp.y, filterUv.y) +
        step(filterUv.x, maskClamp.z) +
        step(filterUv.y, maskClamp.w));

    var mask = textureSample(uMaskTexture, uSampler, filterUv);
    var source = textureSample(uTexture, uSampler, uv);
    
    var npmAlpha = 0.0;

    var alphaMul = 1.0 - npmAlpha * (1.0 - mask.a);

    var a = (alphaMul * mask.r) * clip;

    return vec4(source.rgb, source.a) * a;
}`;
class Ze extends Je {
  constructor(e) {
    const { sprite: t, ...r } = e, a = new Re(t.texture), n = new re({
      uFilterMatrix: { value: new g(), type: "mat3x3<f32>" },
      uMaskClamp: { value: a.uClampFrame, type: "vec4<f32>" },
      uAlpha: { value: 1, type: "f32" }
    }), i = ee.from({
      vertex: {
        source: V,
        entryPoint: "mainVertex"
      },
      fragment: {
        source: V,
        entryPoint: "mainFragment"
      }
    }), l = te.from({
      vertex: Qe,
      fragment: Xe,
      name: "mask-filter"
    });
    super({
      ...r,
      gpuProgram: i,
      glProgram: l,
      resources: {
        filterUniforms: n,
        uMaskTexture: t.texture.source
      }
    }), this.sprite = t, this._textureMatrix = a;
  }
  apply(e, t, r, a) {
    this._textureMatrix.texture = this.sprite.texture, e.calculateSpriteMatrix(
      this.resources.filterUniforms.uniforms.uFilterMatrix,
      this.sprite
    ).prepend(this._textureMatrix.mapCoord), this.resources.uMaskTexture = this.sprite.texture.source, e.applyFilter(this, t, r, a);
  }
}
class ne {
  constructor(e, t) {
    this.state = Z.for2d(), this._batches = /* @__PURE__ */ Object.create(null), this._geometries = /* @__PURE__ */ Object.create(null), this.renderer = e, this._adaptor = t, this._adaptor.init(this);
  }
  buildStart(e) {
    if (!this._batches[e.uid]) {
      const t = new Be();
      this._batches[e.uid] = t, this._geometries[t.uid] = new Ue();
    }
    this._activeBatch = this._batches[e.uid], this._activeGeometry = this._geometries[this._activeBatch.uid], this._activeBatch.begin();
  }
  addToBatch(e) {
    this._activeBatch.add(e);
  }
  break(e) {
    this._activeBatch.break(e);
  }
  buildEnd(e) {
    const t = this._activeBatch, r = this._activeGeometry;
    t.finish(e), r.indexBuffer.setDataWithSize(t.indexBuffer, t.indexSize, !0), r.buffers[0].setDataWithSize(t.attributeBuffer.float32View, t.attributeSize, !1);
  }
  upload(e) {
    const t = this._batches[e.uid], r = this._geometries[t.uid];
    t.dirty && (t.dirty = !1, r.buffers[0].update(t.attributeSize * 4));
  }
  execute(e) {
    if (e.action === "startBatch") {
      const t = e.batcher, r = this._geometries[t.uid];
      this._adaptor.start(this, r);
    }
    this._adaptor.execute(this, e);
  }
  destroy() {
    this.state = null, this.renderer = null, this._adaptor.destroy(), this._adaptor = null;
    for (const e in this._batches)
      this._batches[e].destroy();
    this._batches = null;
    for (const e in this._geometries)
      this._geometries[e].destroy();
    this._geometries = null;
  }
}
ne.extension = {
  type: [
    u.WebGLPipes,
    u.WebGPUPipes,
    u.CanvasPipes
  ],
  name: "batch"
};
const Ct = {
  name: "texture-bit",
  vertex: {
    header: (
      /* wgsl */
      `

        struct TextureUniforms {
            uTextureMatrix:mat3x3<f32>,
        }

        @group(2) @binding(2) var<uniform> textureUniforms : TextureUniforms;
        `
    ),
    main: (
      /* wgsl */
      `
            uv = (textureUniforms.uTextureMatrix * vec3(uv, 1.0)).xy;
        `
    )
  },
  fragment: {
    header: (
      /* wgsl */
      `
            @group(2) @binding(0) var uTexture: texture_2d<f32>;
            @group(2) @binding(1) var uSampler: sampler;

         
        `
    ),
    main: (
      /* wgsl */
      `
            outColor = textureSample(uTexture, uSampler, vUV);
        `
    )
  }
}, wt = {
  name: "texture-bit",
  vertex: {
    header: (
      /* glsl */
      `
            uniform mat3 uTextureMatrix;
        `
    ),
    main: (
      /* glsl */
      `
            uv = (uTextureMatrix * vec3(uv, 1.0)).xy;
        `
    )
  },
  fragment: {
    header: (
      /* glsl */
      `
        uniform sampler2D uTexture;

         
        `
    ),
    main: (
      /* glsl */
      `
            outColor = texture(uTexture, vUV);
        `
    )
  }
};
function et(s, e) {
  const t = s.root, r = s.instructionSet;
  r.reset(), e.batch.buildStart(r), e.blendMode.buildStart(), e.colorMask.buildStart(), t.sortableChildren && t.sortChildren(), ie(t, r, e, !0), e.batch.buildEnd(r), e.blendMode.buildEnd(r);
}
function P(s, e, t) {
  s.globalDisplayStatus < 7 || !s.includeInBuild || (s.sortableChildren && s.sortChildren(), s.isSimple ? tt(s, e, t) : ie(s, e, t, !1));
}
function tt(s, e, t) {
  if (s.renderPipeId && (t.blendMode.setBlendMode(s, s.groupBlendMode, e), s.didViewUpdate = !1, t[s.renderPipeId].addRenderable(s, e)), !s.renderGroup) {
    const r = s.children, a = r.length;
    for (let n = 0; n < a; n++)
      P(r[n], e, t);
  }
}
function ie(s, e, t, r) {
  if (!r && s.renderGroup)
    t.renderGroup.addRenderGroup(s.renderGroup, e);
  else {
    for (let i = 0; i < s.effects.length; i++) {
      const l = s.effects[i];
      t[l.pipe].push(l, s, e);
    }
    const a = s.renderPipeId;
    a && (t.blendMode.setBlendMode(s, s.groupBlendMode, e), s.didViewUpdate = !1, t[a].addRenderable(s, e));
    const n = s.children;
    if (n.length)
      for (let i = 0; i < n.length; i++)
        P(n[i], e, t);
    for (let i = s.effects.length - 1; i >= 0; i--) {
      const l = s.effects[i];
      t[l.pipe].pop(l, s, e);
    }
  }
}
const rt = new q();
class st extends K {
  constructor() {
    super(), this.filters = [new Ze({
      sprite: new Ie(m.EMPTY)
    })];
  }
  get sprite() {
    return this.filters[0].sprite;
  }
  set sprite(e) {
    this.filters[0].sprite = e;
  }
}
class oe {
  constructor(e) {
    this._activeMaskStage = [], this._renderer = e;
  }
  push(e, t, r) {
    const a = this._renderer;
    if (a.renderPipes.batch.break(r), r.add({
      renderPipeId: "alphaMask",
      action: "pushMaskBegin",
      mask: e,
      canBundle: !1,
      maskedContainer: t
    }), e.renderMaskToTexture) {
      const n = e.mask;
      n.includeInBuild = !0, P(
        n,
        r,
        a.renderPipes
      ), n.includeInBuild = !1;
    }
    a.renderPipes.batch.break(r), r.add({
      renderPipeId: "alphaMask",
      action: "pushMaskEnd",
      mask: e,
      maskedContainer: t,
      canBundle: !1
    });
  }
  pop(e, t, r) {
    this._renderer.renderPipes.batch.break(r), r.add({
      renderPipeId: "alphaMask",
      action: "popMaskEnd",
      mask: e,
      canBundle: !1
    });
  }
  execute(e) {
    const t = this._renderer, r = e.mask.renderMaskToTexture;
    if (e.action === "pushMaskBegin") {
      const a = b.get(st);
      if (r) {
        e.mask.mask.measurable = !0;
        const n = Ae(e.mask.mask, !0, rt);
        e.mask.mask.measurable = !1, n.ceil();
        const i = L.getOptimalTexture(
          n.width,
          n.height,
          1,
          !1
        );
        t.renderTarget.push(i, !0), t.globalUniforms.push({
          offset: n,
          worldColor: 4294967295
        });
        const l = a.sprite;
        l.texture = i, l.worldTransform.tx = n.minX, l.worldTransform.ty = n.minY, this._activeMaskStage.push({
          filterEffect: a,
          maskedContainer: e.maskedContainer,
          filterTexture: i
        });
      } else
        a.sprite = e.mask.mask, this._activeMaskStage.push({
          filterEffect: a,
          maskedContainer: e.maskedContainer
        });
    } else if (e.action === "pushMaskEnd") {
      const a = this._activeMaskStage[this._activeMaskStage.length - 1];
      r && (t.renderTarget.pop(), t.globalUniforms.pop()), t.filter.push({
        renderPipeId: "filter",
        action: "pushFilter",
        container: a.maskedContainer,
        filterEffect: a.filterEffect,
        canBundle: !1
      });
    } else if (e.action === "popMaskEnd") {
      t.filter.pop();
      const a = this._activeMaskStage.pop();
      r && L.returnTexture(a.filterTexture), b.return(a.filterEffect);
    }
  }
  destroy() {
    this._renderer = null, this._activeMaskStage = null;
  }
}
oe.extension = {
  type: [
    u.WebGLPipes,
    u.WebGPUPipes,
    u.CanvasPipes
  ],
  name: "alphaMask"
};
class le {
  constructor(e) {
    this._colorStack = [], this._colorStackIndex = 0, this._currentColor = 0, this._renderer = e;
  }
  buildStart() {
    this._colorStack[0] = 15, this._colorStackIndex = 1, this._currentColor = 15;
  }
  push(e, t, r) {
    this._renderer.renderPipes.batch.break(r);
    const n = this._colorStack;
    n[this._colorStackIndex] = n[this._colorStackIndex - 1] & e.mask;
    const i = this._colorStack[this._colorStackIndex];
    i !== this._currentColor && (this._currentColor = i, r.add({
      renderPipeId: "colorMask",
      colorMask: i,
      canBundle: !1
    })), this._colorStackIndex++;
  }
  pop(e, t, r) {
    this._renderer.renderPipes.batch.break(r);
    const n = this._colorStack;
    this._colorStackIndex--;
    const i = n[this._colorStackIndex - 1];
    i !== this._currentColor && (this._currentColor = i, r.add({
      renderPipeId: "colorMask",
      colorMask: i,
      canBundle: !1
    }));
  }
  execute(e) {
    this._renderer.colorMask.setMask(e.colorMask);
  }
  destroy() {
    this._colorStack = null;
  }
}
le.extension = {
  type: [
    u.WebGLPipes,
    u.WebGPUPipes,
    u.CanvasPipes
  ],
  name: "colorMask"
};
class ue {
  constructor(e) {
    this._maskStackHash = {}, this._maskHash = /* @__PURE__ */ new WeakMap(), this._renderer = e;
  }
  push(e, t, r) {
    var a;
    const n = e, i = this._renderer;
    i.renderPipes.batch.break(r), i.renderPipes.blendMode.setBlendMode(n.mask, "none", r), r.add({
      renderPipeId: "stencilMask",
      action: "pushMaskBegin",
      mask: e,
      canBundle: !1
    });
    const l = n.mask;
    l.includeInBuild = !0, this._maskHash.has(n) || this._maskHash.set(n, {
      instructionsStart: 0,
      instructionsLength: 0
    });
    const o = this._maskHash.get(n);
    o.instructionsStart = r.instructionSize, P(
      l,
      r,
      i.renderPipes
    ), l.includeInBuild = !1, i.renderPipes.batch.break(r), r.add({
      renderPipeId: "stencilMask",
      action: "pushMaskEnd",
      mask: e,
      canBundle: !1
    });
    const d = r.instructionSize - o.instructionsStart - 1;
    o.instructionsLength = d;
    const c = i.renderTarget.renderTarget.uid;
    (a = this._maskStackHash)[c] ?? (a[c] = 0);
  }
  pop(e, t, r) {
    const a = e, n = this._renderer;
    n.renderPipes.batch.break(r), n.renderPipes.blendMode.setBlendMode(a.mask, "none", r), r.add({
      renderPipeId: "stencilMask",
      action: "popMaskBegin",
      canBundle: !1
    });
    const i = this._maskHash.get(e);
    for (let l = 0; l < i.instructionsLength; l++)
      r.instructions[r.instructionSize++] = r.instructions[i.instructionsStart++];
    r.add({
      renderPipeId: "stencilMask",
      action: "popMaskEnd",
      canBundle: !1
    });
  }
  execute(e) {
    var t;
    const r = this._renderer, a = r.renderTarget.renderTarget.uid;
    let n = (t = this._maskStackHash)[a] ?? (t[a] = 0);
    e.action === "pushMaskBegin" ? (r.renderTarget.ensureDepthStencil(), r.stencil.setStencilMode(p.RENDERING_MASK_ADD, n), n++, r.colorMask.setMask(0)) : e.action === "pushMaskEnd" ? (r.stencil.setStencilMode(p.MASK_ACTIVE, n), r.colorMask.setMask(15)) : e.action === "popMaskBegin" ? (r.colorMask.setMask(0), n !== 0 ? r.stencil.setStencilMode(p.RENDERING_MASK_REMOVE, n) : (r.renderTarget.clear(null, B.STENCIL), r.stencil.setStencilMode(p.DISABLED, n)), n--) : e.action === "popMaskEnd" && (r.stencil.setStencilMode(p.MASK_ACTIVE, n), r.colorMask.setMask(15)), this._maskStackHash[a] = n;
  }
  destroy() {
    this._renderer = null, this._maskStackHash = null, this._maskHash = null;
  }
}
ue.extension = {
  type: [
    u.WebGLPipes,
    u.WebGPUPipes,
    u.CanvasPipes
  ],
  name: "stencilMask"
};
function St(s, e) {
  for (const t in s.attributes) {
    const r = s.attributes[t], a = e[t];
    a ? (r.location ?? (r.location = a.location), r.format ?? (r.format = a.format), r.offset ?? (r.offset = a.offset), r.instance ?? (r.instance = a.instance)) : Y(`Attribute ${t} is not present in the shader, but is present in the geometry. Unable to infer attribute details.`);
  }
  at(s);
}
function at(s) {
  const { buffers: e, attributes: t } = s, r = {}, a = {};
  for (const n in e) {
    const i = e[n];
    r[i.uid] = 0, a[i.uid] = 0;
  }
  for (const n in t) {
    const i = t[n];
    r[i.buffer.uid] += W(i.format).stride;
  }
  for (const n in t) {
    const i = t[n];
    i.stride ?? (i.stride = r[i.buffer.uid]), i.start ?? (i.start = a[i.buffer.uid]), a[i.buffer.uid] += W(i.format).stride;
  }
}
const T = [];
T[p.NONE] = void 0;
T[p.DISABLED] = {
  stencilWriteMask: 0,
  stencilReadMask: 0
};
T[p.RENDERING_MASK_ADD] = {
  stencilFront: {
    compare: "equal",
    passOp: "increment-clamp"
  },
  stencilBack: {
    compare: "equal",
    passOp: "increment-clamp"
  }
};
T[p.RENDERING_MASK_REMOVE] = {
  stencilFront: {
    compare: "equal",
    passOp: "decrement-clamp"
  },
  stencilBack: {
    compare: "equal",
    passOp: "decrement-clamp"
  }
};
T[p.MASK_ACTIVE] = {
  stencilWriteMask: 0,
  stencilFront: {
    compare: "equal",
    passOp: "keep"
  },
  stencilBack: {
    compare: "equal",
    passOp: "keep"
  }
};
class Pt {
  constructor(e) {
    this._syncFunctionHash = /* @__PURE__ */ Object.create(null), this._adaptor = e, this._systemCheck();
  }
  /**
   * Overridable function by `pixi.js/unsafe-eval` to silence
   * throwing an error if platform doesn't support unsafe-evals.
   * @private
   */
  _systemCheck() {
    if (!De())
      throw new Error("Current environment does not allow unsafe-eval, please use pixi.js/unsafe-eval module to enable support.");
  }
  ensureUniformGroup(e) {
    const t = this.getUniformGroupData(e);
    e.buffer || (e.buffer = new H({
      data: new Float32Array(t.layout.size / 4),
      usage: k.UNIFORM | k.COPY_DST
    }));
  }
  getUniformGroupData(e) {
    return this._syncFunctionHash[e._signature] || this._initUniformGroup(e);
  }
  _initUniformGroup(e) {
    const t = e._signature;
    let r = this._syncFunctionHash[t];
    if (!r) {
      const a = Object.keys(e.uniformStructures).map((l) => e.uniformStructures[l]), n = this._adaptor.createUboElements(a), i = this._generateUboSync(n.uboElements);
      r = this._syncFunctionHash[t] = {
        layout: n,
        syncFunction: i
      };
    }
    return this._syncFunctionHash[t];
  }
  _generateUboSync(e) {
    return this._adaptor.generateUboSync(e);
  }
  syncUniformGroup(e, t, r) {
    const a = this.getUniformGroupData(e);
    return e.buffer || (e.buffer = new H({
      data: new Float32Array(a.layout.size / 4),
      usage: k.UNIFORM | k.COPY_DST
    })), t || (t = e.buffer.data), r || (r = 0), a.syncFunction(e.uniforms, t, r), !0;
  }
  updateUniformGroup(e) {
    if (e.isStatic && !e._dirtyId)
      return !1;
    e._dirtyId = 0;
    const t = this.syncUniformGroup(e);
    return e.buffer.update(), t;
  }
  destroy() {
    this._syncFunctionHash = null;
  }
}
const M = [
  // uploading pixi matrix object to mat3
  {
    type: "mat3x3<f32>",
    test: (s) => s.value.a !== void 0,
    ubo: `
            var matrix = uv[name].toArray(true);
            data[offset] = matrix[0];
            data[offset + 1] = matrix[1];
            data[offset + 2] = matrix[2];
            data[offset + 4] = matrix[3];
            data[offset + 5] = matrix[4];
            data[offset + 6] = matrix[5];
            data[offset + 8] = matrix[6];
            data[offset + 9] = matrix[7];
            data[offset + 10] = matrix[8];
        `,
    uniform: `
            gl.uniformMatrix3fv(ud[name].location, false, uv[name].toArray(true));
        `
  },
  // uploading a pixi rectangle as a vec4
  {
    type: "vec4<f32>",
    test: (s) => s.type === "vec4<f32>" && s.size === 1 && s.value.width !== void 0,
    ubo: `
            v = uv[name];
            data[offset] = v.x;
            data[offset + 1] = v.y;
            data[offset + 2] = v.width;
            data[offset + 3] = v.height;
        `,
    uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.x || cv[1] !== v.y || cv[2] !== v.width || cv[3] !== v.height) {
                cv[0] = v.x;
                cv[1] = v.y;
                cv[2] = v.width;
                cv[3] = v.height;
                gl.uniform4f(ud[name].location, v.x, v.y, v.width, v.height);
            }
        `
  },
  // uploading a pixi point as a vec2
  {
    type: "vec2<f32>",
    test: (s) => s.type === "vec2<f32>" && s.size === 1 && s.value.x !== void 0,
    ubo: `
            v = uv[name];
            data[offset] = v.x;
            data[offset + 1] = v.y;
        `,
    uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.x || cv[1] !== v.y) {
                cv[0] = v.x;
                cv[1] = v.y;
                gl.uniform2f(ud[name].location, v.x, v.y);
            }
        `
  },
  // uploading a pixi color as a vec4
  {
    type: "vec4<f32>",
    test: (s) => s.type === "vec4<f32>" && s.size === 1 && s.value.red !== void 0,
    ubo: `
            v = uv[name];
            data[offset] = v.red;
            data[offset + 1] = v.green;
            data[offset + 2] = v.blue;
            data[offset + 3] = v.alpha;
        `,
    uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue || cv[3] !== v.alpha) {
                cv[0] = v.red;
                cv[1] = v.green;
                cv[2] = v.blue;
                cv[3] = v.alpha;
                gl.uniform4f(ud[name].location, v.red, v.green, v.blue, v.alpha);
            }
        `
  },
  // uploading a pixi color as a vec3
  {
    type: "vec3<f32>",
    test: (s) => s.type === "vec3<f32>" && s.size === 1 && s.value.red !== void 0,
    ubo: `
            v = uv[name];
            data[offset] = v.red;
            data[offset + 1] = v.green;
            data[offset + 2] = v.blue;
        `,
    uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue) {
                cv[0] = v.red;
                cv[1] = v.green;
                cv[2] = v.blue;
                gl.uniform3f(ud[name].location, v.red, v.green, v.blue);
            }
        `
  }
];
function Gt(s, e, t, r) {
  const a = [`
        var v = null;
        var v2 = null;
        var t = 0;
        var index = 0;
        var name = null;
        var arrayOffset = null;
    `];
  let n = 0;
  for (let l = 0; l < s.length; l++) {
    const o = s[l], d = o.data.name;
    let c = !1, h = 0;
    for (let f = 0; f < M.length; f++)
      if (M[f].test(o.data)) {
        h = o.offset / 4, a.push(
          `name = "${d}";`,
          `offset += ${h - n};`,
          M[f][e] || M[f].ubo
        ), c = !0;
        break;
      }
    if (!c)
      if (o.data.size > 1)
        h = o.offset / 4, a.push(t(o, h - n));
      else {
        const f = r[o.data.type];
        h = o.offset / 4, a.push(
          /* wgsl */
          `
                    v = uv.${d};
                    offset += ${h - n};
                    ${f};
                `
        );
      }
    n = h;
  }
  const i = a.join(`
`);
  return new Function(
    "uv",
    "data",
    "offset",
    i
  );
}
function v(s, e) {
  return `
        for (let i = 0; i < ${s * e}; i++) {
            data[offset + (((i / ${s})|0) * 4) + (i % ${s})] = v[i];
        }
    `;
}
const nt = {
  f32: `
        data[offset] = v;`,
  i32: `
        data[offset] = v;`,
  "vec2<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];`,
  "vec3<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];`,
  "vec4<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 3] = v[3];`,
  "mat2x2<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 4] = v[2];
        data[offset + 5] = v[3];`,
  "mat3x3<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 4] = v[3];
        data[offset + 5] = v[4];
        data[offset + 6] = v[5];
        data[offset + 8] = v[6];
        data[offset + 9] = v[7];
        data[offset + 10] = v[8];`,
  "mat4x4<f32>": `
        for (let i = 0; i < 16; i++) {
            data[offset + i] = v[i];
        }`,
  "mat3x2<f32>": v(3, 2),
  "mat4x2<f32>": v(4, 2),
  "mat2x3<f32>": v(2, 3),
  "mat4x3<f32>": v(4, 3),
  "mat2x4<f32>": v(2, 4),
  "mat3x4<f32>": v(3, 4)
}, Rt = {
  ...nt,
  "mat2x2<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 3] = v[3];
    `
};
function it(s, e, t, r, a, n) {
  const i = n ? 1 : -1;
  return s.identity(), s.a = 1 / r * 2, s.d = i * (1 / a * 2), s.tx = -1 - e * s.a, s.ty = -i - t * s.d, s;
}
const x = /* @__PURE__ */ new Map();
function de(s, e) {
  if (!x.has(s)) {
    const t = new m({
      source: new U({
        resource: s,
        ...e
      })
    }), r = () => {
      x.get(s) === t && x.delete(s);
    };
    t.once("destroy", r), t.source.once("destroy", r), x.set(s, t);
  }
  return x.get(s);
}
function ot(s) {
  const e = s.colorTexture.source.resource;
  return globalThis.HTMLCanvasElement && e instanceof HTMLCanvasElement && document.body.contains(e);
}
const ce = class he {
  /**
   * @param [descriptor] - Options for creating a render target.
   */
  constructor(e = {}) {
    if (this.uid = C("renderTarget"), this.colorTextures = [], this.dirtyId = 0, this.isRoot = !1, this._size = new Float32Array(2), this._managedColorTextures = !1, e = { ...he.defaultOptions, ...e }, this.stencil = e.stencil, this.depth = e.depth, this.isRoot = e.isRoot, typeof e.colorTextures == "number") {
      this._managedColorTextures = !0;
      for (let t = 0; t < e.colorTextures; t++)
        this.colorTextures.push(
          new _({
            width: e.width,
            height: e.height,
            resolution: e.resolution,
            antialias: e.antialias
          })
        );
    } else {
      this.colorTextures = [...e.colorTextures.map((r) => r.source)];
      const t = this.colorTexture.source;
      this.resize(t.width, t.height, t._resolution);
    }
    this.colorTexture.source.on("resize", this.onSourceResize, this), (e.depthStencilTexture || this.stencil) && (e.depthStencilTexture instanceof m || e.depthStencilTexture instanceof _ ? this.depthStencilTexture = e.depthStencilTexture.source : this.ensureDepthStencilTexture());
  }
  get size() {
    const e = this._size;
    return e[0] = this.pixelWidth, e[1] = this.pixelHeight, e;
  }
  get width() {
    return this.colorTexture.source.width;
  }
  get height() {
    return this.colorTexture.source.height;
  }
  get pixelWidth() {
    return this.colorTexture.source.pixelWidth;
  }
  get pixelHeight() {
    return this.colorTexture.source.pixelHeight;
  }
  get resolution() {
    return this.colorTexture.source._resolution;
  }
  get colorTexture() {
    return this.colorTextures[0];
  }
  onSourceResize(e) {
    this.resize(e.width, e.height, e._resolution, !0);
  }
  /**
   * This will ensure a depthStencil texture is created for this render target.
   * Most likely called by the mask system to make sure we have stencil buffer added.
   * @internal
   * @ignore
   */
  ensureDepthStencilTexture() {
    this.depthStencilTexture || (this.depthStencilTexture = new _({
      width: this.width,
      height: this.height,
      resolution: this.resolution,
      format: "depth24plus-stencil8",
      autoGenerateMipmaps: !1,
      antialias: !1,
      mipLevelCount: 1
      // sampleCount: handled by the render target system..
    }));
  }
  resize(e, t, r = this.resolution, a = !1) {
    this.dirtyId++, this.colorTextures.forEach((n, i) => {
      a && i === 0 || n.source.resize(e, t, r);
    }), this.depthStencilTexture && this.depthStencilTexture.source.resize(e, t, r);
  }
  destroy() {
    this.colorTexture.source.off("resize", this.onSourceResize, this), this._managedColorTextures && this.colorTextures.forEach((e) => {
      e.destroy();
    }), this.depthStencilTexture && (this.depthStencilTexture.destroy(), delete this.depthStencilTexture);
  }
};
ce.defaultOptions = {
  /** the width of the RenderTarget */
  width: 0,
  /** the height of the RenderTarget */
  height: 0,
  /** the resolution of the RenderTarget */
  resolution: 1,
  /** an array of textures, or a number indicating how many color textures there should be */
  colorTextures: 1,
  /** should this render target have a stencil buffer? */
  stencil: !1,
  /** should this render target have a depth buffer? */
  depth: !1,
  /** should this render target be antialiased? */
  antialias: !1,
  // save on perf by default!
  /** is this a root element, true if this is gl context owners render target */
  isRoot: !1
};
let I = ce;
class Bt {
  constructor(e) {
    this.rootViewPort = new w(), this.viewport = new w(), this.onRenderTargetChange = new Ee("onRenderTargetChange"), this.projectionMatrix = new g(), this.defaultClearColor = [0, 0, 0, 0], this._renderSurfaceToRenderTargetHash = /* @__PURE__ */ new Map(), this._gpuRenderTargetHash = /* @__PURE__ */ Object.create(null), this._renderTargetStack = [], this._renderer = e;
  }
  /** called when dev wants to finish a render pass */
  finishRenderPass() {
    this.adaptor.finishRenderPass(this.renderTarget);
  }
  /**
   * called when the renderer starts to render a scene.
   * @param options
   * @param options.target - the render target to render to
   * @param options.clear - the clear mode to use. Can be true or a CLEAR number 'COLOR | DEPTH | STENCIL' 0b111
   * @param options.clearColor - the color to clear to
   * @param options.frame - the frame to render to
   */
  renderStart({
    target: e,
    clear: t,
    clearColor: r,
    frame: a
  }) {
    this._renderTargetStack.length = 0, this.push(
      e,
      t,
      r,
      a
    ), this.rootViewPort.copyFrom(this.viewport), this.rootRenderTarget = this.renderTarget, this.renderingToScreen = ot(this.rootRenderTarget);
  }
  /**
   * Binding a render surface! This is the main function of the render target system.
   * It will take the RenderSurface (which can be a texture, canvas, or render target) and bind it to the renderer.
   * Once bound all draw calls will be rendered to the render surface.
   *
   * If a frame is not provide and the render surface is a texture, the frame of the texture will be used.
   * @param renderSurface - the render surface to bind
   * @param clear - the clear mode to use. Can be true or a CLEAR number 'COLOR | DEPTH | STENCIL' 0b111
   * @param clearColor - the color to clear to
   * @param frame - the frame to render to
   * @returns the render target that was bound
   */
  bind(e, t = !0, r, a) {
    const n = this.getRenderTarget(e), i = this.renderTarget !== n;
    this.renderTarget = n, this.renderSurface = e;
    const l = this.getGpuRenderTarget(n);
    (n.pixelWidth !== l.width || n.pixelHeight !== l.height) && (this.adaptor.resizeGpuRenderTarget(n), l.width = n.pixelWidth, l.height = n.pixelHeight);
    const o = n.colorTexture, d = this.viewport, c = o.pixelWidth, h = o.pixelHeight;
    if (!a && e instanceof m && (a = e.frame), a) {
      const f = o._resolution;
      d.x = a.x * f + 0.5 | 0, d.y = a.y * f + 0.5 | 0, d.width = a.width * f + 0.5 | 0, d.height = a.height * f + 0.5 | 0;
    } else
      d.x = 0, d.y = 0, d.width = c, d.height = h;
    return it(
      this.projectionMatrix,
      0,
      0,
      d.width / o.resolution,
      d.height / o.resolution,
      !n.isRoot
    ), this.adaptor.startRenderPass(n, t, r, d), i && this.onRenderTargetChange.emit(n), n;
  }
  clear(e, t = B.ALL, r) {
    t && (e && (e = this.getRenderTarget(e)), this.adaptor.clear(
      e || this.renderTarget,
      t,
      r,
      this.viewport
    ));
  }
  contextChange() {
    this._gpuRenderTargetHash = /* @__PURE__ */ Object.create(null);
  }
  /**
   * Push a render surface to the renderer. This will bind the render surface to the renderer,
   * @param renderSurface - the render surface to push
   * @param clear - the clear mode to use. Can be true or a CLEAR number 'COLOR | DEPTH | STENCIL' 0b111
   * @param clearColor - the color to clear to
   * @param frame - the frame to use when rendering to the render surface
   */
  push(e, t = B.ALL, r, a) {
    const n = this.bind(e, t, r, a);
    return this._renderTargetStack.push({
      renderTarget: n,
      frame: a
    }), n;
  }
  /** Pops the current render target from the renderer and restores the previous render target. */
  pop() {
    this._renderTargetStack.pop();
    const e = this._renderTargetStack[this._renderTargetStack.length - 1];
    this.bind(e.renderTarget, !1, null, e.frame);
  }
  /**
   * Gets the render target from the provide render surface. Eg if its a texture,
   * it will return the render target for the texture.
   * If its a render target, it will return the same render target.
   * @param renderSurface - the render surface to get the render target for
   * @returns the render target for the render surface
   */
  getRenderTarget(e) {
    return e.isTexture && (e = e.source), this._renderSurfaceToRenderTargetHash.get(e) ?? this._initRenderTarget(e);
  }
  /**
   * Copies a render surface to another texture
   * @param sourceRenderSurfaceTexture - the render surface to copy from
   * @param destinationTexture - the texture to copy to
   * @param originSrc - the origin of the copy
   * @param originSrc.x - the x origin of the copy
   * @param originSrc.y - the y origin of the copy
   * @param size - the size of the copy
   * @param size.width - the width of the copy
   * @param size.height - the height of the copy
   * @param originDest - the destination origin (top left to paste from!)
   * @param originDest.x - the x origin of the paste
   * @param originDest.y - the y origin of the paste
   */
  copyToTexture(e, t, r, a, n) {
    r.x < 0 && (a.width += r.x, n.x -= r.x, r.x = 0), r.y < 0 && (a.height += r.y, n.y -= r.y, r.y = 0);
    const { pixelWidth: i, pixelHeight: l } = e;
    return a.width = Math.min(a.width, i - r.x), a.height = Math.min(a.height, l - r.y), this.adaptor.copyToTexture(
      e,
      t,
      r,
      a,
      n
    );
  }
  /**
   * ensures that we have a depth stencil buffer available to render to
   * This is used by the mask system to make sure we have a stencil buffer.
   */
  ensureDepthStencil() {
    this.renderTarget.stencil || (this.renderTarget.stencil = !0, this.adaptor.startRenderPass(this.renderTarget, !1, null, this.viewport));
  }
  /** nukes the render target system */
  destroy() {
    this._renderer = null, this._renderSurfaceToRenderTargetHash.forEach((e, t) => {
      e !== t && e.destroy();
    }), this._renderSurfaceToRenderTargetHash.clear(), this._gpuRenderTargetHash = /* @__PURE__ */ Object.create(null);
  }
  _initRenderTarget(e) {
    let t = null;
    return U.test(e) && (e = de(e).source), e instanceof I ? t = e : e instanceof _ && (t = new I({
      colorTextures: [e]
    }), U.test(e.source.resource) && (t.isRoot = !0), e.once("destroy", () => {
      t.destroy();
      const r = this._gpuRenderTargetHash[t.uid];
      r && (this._gpuRenderTargetHash[t.uid] = null, this.adaptor.destroyGpuRenderTarget(r));
    })), this._renderSurfaceToRenderTargetHash.set(e, t), t;
  }
  getGpuRenderTarget(e) {
    return this._gpuRenderTargetHash[e.uid] || (this._gpuRenderTargetHash[e.uid] = this.adaptor.initGpuRenderTarget(e));
  }
}
class Ut extends Fe {
  /**
   * Create a new Buffer Resource.
   * @param options - The options for the buffer resource
   * @param options.buffer - The underlying buffer that this resource is using
   * @param options.offset - The offset of the buffer this resource is using.
   * If not provided, then it will use the offset of the buffer.
   * @param options.size - The size of the buffer this resource is using.
   * If not provided, then it will use the size of the buffer.
   */
  constructor({ buffer: e, offset: t, size: r }) {
    super(), this.uid = C("buffer"), this._resourceType = "bufferResource", this._touched = 0, this._resourceId = C("resource"), this._bufferResource = !0, this.destroyed = !1, this.buffer = e, this.offset = t | 0, this.size = r, this.buffer.on("change", this.onBufferChange, this);
  }
  onBufferChange() {
    this._resourceId = C("resource"), this.emit("change", this);
  }
  /**
   * Destroys this resource. Make sure the underlying buffer is not used anywhere else
   * if you want to destroy it as well, or code will explode
   * @param destroyBuffer - Should the underlying buffer be destroyed as well?
   */
  destroy(e = !1) {
    this.destroyed = !0, e && this.buffer.destroy(), this.emit("change", this), this.buffer = null;
  }
}
class fe {
  constructor(e) {
    this._renderer = e;
  }
  addRenderable(e, t) {
    this._renderer.renderPipes.batch.break(t), t.add(e);
  }
  execute(e) {
    e.isRenderable && e.render(this._renderer);
  }
  destroy() {
    this._renderer = null;
  }
}
fe.extension = {
  type: [
    u.WebGLPipes,
    u.WebGPUPipes,
    u.CanvasPipes
  ],
  name: "customRender"
};
function pe(s, e) {
  const t = s.instructionSet, r = t.instructions;
  for (let a = 0; a < t.instructionSize; a++) {
    const n = r[a];
    e[n.renderPipeId].execute(n);
  }
}
class me {
  constructor(e) {
    this._renderer = e;
  }
  addRenderGroup(e, t) {
    this._renderer.renderPipes.batch.break(t), t.add(e);
  }
  execute(e) {
    e.isRenderable && (this._renderer.globalUniforms.push({
      worldTransformMatrix: e.worldTransform,
      worldColor: e.worldColorAlpha
    }), pe(e, this._renderer.renderPipes), this._renderer.globalUniforms.pop());
  }
  destroy() {
    this._renderer = null;
  }
}
me.extension = {
  type: [
    u.WebGLPipes,
    u.WebGPUPipes,
    u.CanvasPipes
  ],
  name: "renderGroup"
};
function ge(s, e = []) {
  e.push(s);
  for (let t = 0; t < s.renderGroupChildren.length; t++)
    ge(s.renderGroupChildren[t], e);
  return e;
}
function lt(s, e, t) {
  const r = s >> 16 & 255, a = s >> 8 & 255, n = s & 255, i = e >> 16 & 255, l = e >> 8 & 255, o = e & 255, d = r + (i - r) * t, c = a + (l - a) * t, h = n + (o - n) * t;
  return (d << 16) + (c << 8) + h;
}
const G = 16777215;
function ve(s, e) {
  return s === G || e === G ? s + e - G : lt(s, e, 0.5);
}
const ut = new S();
function xe(s, e = !1) {
  dt(s);
  const t = s.childrenToUpdate, r = s.updateTick++;
  for (const a in t) {
    const n = Number(a), i = t[a], l = i.list, o = i.index;
    for (let d = 0; d < o; d++) {
      const c = l[d];
      c.parentRenderGroup === s && c.relativeRenderGroupDepth === n && be(c, r, 0);
    }
    i.index = 0;
  }
  if (e)
    for (let a = 0; a < s.renderGroupChildren.length; a++)
      xe(s.renderGroupChildren[a], e);
}
function dt(s) {
  const e = s.root;
  let t;
  if (s.renderGroupParent) {
    const r = s.renderGroupParent;
    s.worldTransform.appendFrom(
      e.relativeGroupTransform,
      r.worldTransform
    ), s.worldColor = ve(
      e.groupColor,
      r.worldColor
    ), t = e.groupAlpha * r.worldAlpha;
  } else
    s.worldTransform.copyFrom(e.localTransform), s.worldColor = e.localColor, t = e.localAlpha;
  t = t < 0 ? 0 : t > 1 ? 1 : t, s.worldAlpha = t, s.worldColorAlpha = s.worldColor + ((t * 255 | 0) << 24);
}
function be(s, e, t) {
  if (e === s.updateTick)
    return;
  s.updateTick = e, s.didChange = !1;
  const r = s.localTransform;
  s.updateLocalTransform();
  const a = s.parent;
  if (a && !a.renderGroup ? (t = t | s._updateFlags, s.relativeGroupTransform.appendFrom(
    r,
    a.relativeGroupTransform
  ), t && j(s, a, t)) : (t = s._updateFlags, s.relativeGroupTransform.copyFrom(r), t && j(s, ut, t)), !s.renderGroup) {
    const n = s.children, i = n.length;
    for (let o = 0; o < i; o++)
      be(n[o], e, t);
    const l = s.parentRenderGroup;
    s.renderPipeId && !l.structureDidChange && l.updateRenderable(s);
  }
}
function j(s, e, t) {
  if (t & Oe) {
    s.groupColor = ve(
      s.localColor,
      e.groupColor
    );
    let r = s.localAlpha * e.groupAlpha;
    r = r < 0 ? 0 : r > 1 ? 1 : r, s.groupAlpha = r, s.groupColorAlpha = s.groupColor + ((r * 255 | 0) << 24);
  }
  t & ze && (s.groupBlendMode = s.localBlendMode === "inherit" ? e.groupBlendMode : s.localBlendMode), t & He && (s.globalDisplayStatus = s.localDisplayStatus & e.globalDisplayStatus), s._updateFlags = 0;
}
function ct(s, e) {
  const { list: t, index: r } = s.childrenRenderablesToUpdate;
  let a = !1;
  for (let n = 0; n < r; n++) {
    const i = t[n];
    if (a = e[i.renderPipeId].validateRenderable(i), a)
      break;
  }
  return s.structureDidChange = a, a;
}
const ht = new g();
class _e {
  constructor(e) {
    this._renderer = e;
  }
  render({ container: e, transform: t }) {
    e.isRenderGroup = !0;
    const r = e.parent, a = e.renderGroup.renderGroupParent;
    e.parent = null, e.renderGroup.renderGroupParent = null;
    const n = this._renderer, i = ge(e.renderGroup, []);
    let l = ht;
    t && (l = l.copyFrom(e.renderGroup.localTransform), e.renderGroup.localTransform.copyFrom(t));
    const o = n.renderPipes;
    for (let d = 0; d < i.length; d++) {
      const c = i[d];
      c.runOnRender(), c.instructionSet.renderPipes = o, c.structureDidChange || ct(c, o), xe(c), c.structureDidChange ? (c.structureDidChange = !1, et(c, o)) : ft(c), c.childrenRenderablesToUpdate.index = 0, n.renderPipes.batch.upload(c.instructionSet);
    }
    n.globalUniforms.start({
      worldTransformMatrix: t ? e.renderGroup.localTransform : e.renderGroup.worldTransform,
      worldColor: e.renderGroup.worldColorAlpha
    }), pe(e.renderGroup, o), o.uniformBatch && o.uniformBatch.renderEnd(), t && e.renderGroup.localTransform.copyFrom(l), e.parent = r, e.renderGroup.renderGroupParent = a;
  }
  destroy() {
    this._renderer = null;
  }
}
_e.extension = {
  type: [
    u.WebGLSystem,
    u.WebGPUSystem,
    u.CanvasSystem
  ],
  name: "renderGroup"
};
function ft(s) {
  const { list: e, index: t } = s.childrenRenderablesToUpdate;
  for (let r = 0; r < t; r++) {
    const a = e[r];
    a.didViewUpdate && s.updateRenderable(a);
  }
}
class ye {
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
    b.return(t), this._gpuSpriteHash[e.uid] = null;
  }
  _updateBatchableSprite(e, t) {
    e._didSpriteUpdate = !1, t.bounds = e.bounds, t.texture = e._texture;
  }
  _getGpuSprite(e) {
    return this._gpuSpriteHash[e.uid] || this._initGPUSprite(e);
  }
  _initGPUSprite(e) {
    const t = b.get(Ke);
    return t.renderable = e, t.texture = e._texture, t.bounds = e.bounds, t.roundPixels = this._renderer._roundPixels | e._roundPixels, this._gpuSpriteHash[e.uid] = t, e._didSpriteUpdate = !1, e.on("destroyed", () => {
      this.destroyRenderable(e);
    }), t;
  }
  destroy() {
    for (const e in this._gpuSpriteHash)
      b.return(this._gpuSpriteHash[e]);
    this._gpuSpriteHash = null, this._renderer = null;
  }
}
ye.extension = {
  type: [
    u.WebGLPipes,
    u.WebGPUPipes,
    u.CanvasPipes
  ],
  name: "sprite"
};
const D = class Te {
  constructor() {
    this.clearBeforeRender = !0, this._backgroundColor = new J(0), this.color = this._backgroundColor, this.alpha = 1;
  }
  /**
   * initiates the background system
   * @param options - the options for the background colors
   */
  init(e) {
    e = { ...Te.defaultOptions, ...e }, this.clearBeforeRender = e.clearBeforeRender, this.color = e.background || e.backgroundColor || this._backgroundColor, this.alpha = e.backgroundAlpha, this._backgroundColor.setAlpha(e.backgroundAlpha);
  }
  /** The background color to fill if not transparent */
  get color() {
    return this._backgroundColor;
  }
  set color(e) {
    this._backgroundColor.setValue(e);
  }
  /** The background color alpha. Setting this to 0 will make the canvas transparent. */
  get alpha() {
    return this._backgroundColor.alpha;
  }
  set alpha(e) {
    this._backgroundColor.setAlpha(e);
  }
  /** The background color as an [R, G, B, A] array. */
  get colorRgba() {
    return this._backgroundColor.toArray();
  }
  /**
   * destroys the background system
   * @internal
   * @ignore
   */
  destroy() {
  }
};
D.extension = {
  type: [
    u.WebGLSystem,
    u.WebGPUSystem,
    u.CanvasSystem
  ],
  name: "background",
  priority: 0
};
D.defaultOptions = {
  /**
   * {@link WebGLOptions.backgroundAlpha}
   * @default 1
   */
  backgroundAlpha: 1,
  /**
   * {@link WebGLOptions.backgroundColor}
   * @default 0x000000
   */
  backgroundColor: 0,
  /**
   * {@link WebGLOptions.clearBeforeRender}
   * @default true
   */
  clearBeforeRender: !0
};
let pt = D;
const y = {};
X.handle(u.BlendMode, (s) => {
  if (!s.name)
    throw new Error("BlendMode extension must have a name property");
  y[s.name] = s.ref;
}, (s) => {
  delete y[s.name];
});
class ke {
  constructor(e) {
    this._isAdvanced = !1, this._filterHash = /* @__PURE__ */ Object.create(null), this._renderer = e;
  }
  /**
   * This ensures that a blendMode switch is added to the instruction set if the blend mode has changed.
   * @param renderable - The renderable we are adding to the instruction set
   * @param blendMode - The blend mode of the renderable
   * @param instructionSet - The instruction set we are adding to
   */
  setBlendMode(e, t, r) {
    if (this._activeBlendMode === t) {
      this._isAdvanced && this._renderableList.push(e);
      return;
    }
    this._activeBlendMode = t, this._isAdvanced && this._endAdvancedBlendMode(r), this._isAdvanced = !!y[t], this._isAdvanced && (this._beginAdvancedBlendMode(r), this._renderableList.push(e));
  }
  _beginAdvancedBlendMode(e) {
    this._renderer.renderPipes.batch.break(e);
    const t = this._activeBlendMode;
    if (!y[t]) {
      Y(`Unable to assign BlendMode: '${t}'. You may want to include: import 'pixi.js/advanced-blend-modes'`);
      return;
    }
    let r = this._filterHash[t];
    r || (r = this._filterHash[t] = new K(), r.filters = [new y[t]()]);
    const a = {
      renderPipeId: "filter",
      action: "pushFilter",
      renderables: [],
      filterEffect: r,
      canBundle: !1
    };
    this._renderableList = a.renderables, e.add(a);
  }
  _endAdvancedBlendMode(e) {
    this._renderableList = null, this._renderer.renderPipes.batch.break(e), e.add({
      renderPipeId: "filter",
      action: "popFilter",
      canBundle: !1
    });
  }
  /**
   * called when the instruction build process is starting this will reset internally to the default blend mode
   * @internal
   * @ignore
   */
  buildStart() {
    this._isAdvanced = !1;
  }
  /**
   * called when the instruction build process is finished, ensuring that if there is an advanced blend mode
   * active, we add the final render instructions added to the instruction set
   * @param instructionSet - The instruction set we are adding to
   * @internal
   * @ignore
   */
  buildEnd(e) {
    this._isAdvanced && this._endAdvancedBlendMode(e);
  }
  /**
   * @internal
   * @ignore
   */
  destroy() {
    this._renderer = null, this._renderableList = null;
    for (const e in this._filterHash)
      this._filterHash[e].destroy();
    this._filterHash = null;
  }
}
ke.extension = {
  type: [
    u.WebGLPipes,
    u.WebGPUPipes,
    u.CanvasPipes
  ],
  name: "blendMode"
};
const R = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp"
}, E = class Me {
  /** @param renderer - The renderer this System works for. */
  constructor(e) {
    this._renderer = e;
  }
  _normalizeOptions(e, t = {}) {
    return e instanceof S || e instanceof m ? {
      target: e,
      ...t
    } : {
      ...t,
      ...e
    };
  }
  /**
   * Will return a HTML Image of the target
   * @param options - The options for creating the image, or the target to extract
   * @returns - HTML Image of the target
   */
  async image(e) {
    const t = new Image();
    return t.src = await this.base64(e), t;
  }
  /**
   * Will return a base64 encoded string of this target. It works by calling
   * `Extract.canvas` and then running toDataURL on that.
   * @param options - The options for creating the image, or the target to extract
   */
  async base64(e) {
    e = this._normalizeOptions(
      e,
      Me.defaultImageOptions
    );
    const { format: t, quality: r } = e, a = this.canvas(e);
    if (a.toBlob !== void 0)
      return new Promise((n, i) => {
        a.toBlob((l) => {
          if (!l) {
            i(new Error("ICanvas.toBlob failed!"));
            return;
          }
          const o = new FileReader();
          o.onload = () => n(o.result), o.onerror = i, o.readAsDataURL(l);
        }, R[t], r);
      });
    if (a.toDataURL !== void 0)
      return a.toDataURL(R[t], r);
    if (a.convertToBlob !== void 0) {
      const n = await a.convertToBlob({ type: R[t], quality: r });
      return new Promise((i, l) => {
        const o = new FileReader();
        o.onload = () => i(o.result), o.onerror = l, o.readAsDataURL(n);
      });
    }
    throw new Error("Extract.base64() requires ICanvas.toDataURL, ICanvas.toBlob, or ICanvas.convertToBlob to be implemented");
  }
  /**
   * Creates a Canvas element, renders this target to it and then returns it.
   * @param options - The options for creating the canvas, or the target to extract
   * @returns - A Canvas element with the texture rendered on.
   */
  canvas(e) {
    e = this._normalizeOptions(e);
    const t = e.target, r = this._renderer;
    if (t instanceof m)
      return r.texture.generateCanvas(t);
    const a = r.textureGenerator.generateTexture(e), n = r.texture.generateCanvas(a);
    return a.destroy(), n;
  }
  /**
   * Will return a one-dimensional array containing the pixel data of the entire texture in RGBA
   * order, with integer values between 0 and 255 (included).
   * @param options - The options for extracting the image, or the target to extract
   * @returns - One-dimensional array containing the pixel data of the entire texture
   */
  pixels(e) {
    e = this._normalizeOptions(e);
    const t = e.target, r = this._renderer, a = t instanceof m ? t : r.textureGenerator.generateTexture(e), n = r.texture.getPixels(a);
    return t instanceof S && a.destroy(), n;
  }
  /**
   * Will return a texture of the target
   * @param options - The options for creating the texture, or the target to extract
   * @returns - A texture of the target
   */
  texture(e) {
    return e = this._normalizeOptions(e), e.target instanceof m ? e.target : this._renderer.textureGenerator.generateTexture(e);
  }
  /**
   * Will extract a HTMLImage of the target and download it
   * @param options - The options for downloading and extracting the image, or the target to extract
   */
  download(e) {
    e = this._normalizeOptions(e);
    const t = this.canvas(e), r = document.createElement("a");
    r.download = e.filename ?? "image.png", r.href = t.toDataURL("image/png"), document.body.appendChild(r), r.click(), document.body.removeChild(r);
  }
  /**
   * Logs the target to the console as an image. This is a useful way to debug what's happening in the renderer.
   * @param options - The options for logging the image, or the target to log
   */
  log(e) {
    const t = e.width ?? 200;
    e = this._normalizeOptions(e);
    const r = this.canvas(e), a = r.toDataURL();
    console.log(`[Pixi Texture] ${r.width}px ${r.height}px`);
    const n = [
      "font-size: 1px;",
      `padding: ${t}px 300px;`,
      `background: url(${a}) no-repeat;`,
      "background-size: contain;"
    ].join(" ");
    console.log("%c ", n);
  }
  destroy() {
    this._renderer = null;
  }
};
E.extension = {
  type: [
    u.WebGLSystem,
    u.WebGPUSystem
  ],
  name: "extract"
};
E.defaultImageOptions = {
  /** The format of the image. */
  format: "png",
  /** The quality of the image. */
  quality: 1
};
let mt = E;
class gt extends m {
  static create(e) {
    return new m({
      source: new _(e)
    });
  }
  /**
   * Resizes the render texture.
   * @param width - The new width of the render texture.
   * @param height - The new height of the render texture.
   * @param resolution - The new resolution of the render texture.
   * @returns This texture.
   */
  resize(e, t, r) {
    return this.source.resize(e, t, r), this;
  }
}
const vt = new w(), xt = new q(), bt = [0, 0, 0, 0];
class Ce {
  constructor(e) {
    this._renderer = e;
  }
  /**
   * A Useful function that returns a texture of the display object that can then be used to create sprites
   * This can be quite useful if your container is complicated and needs to be reused multiple times.
   * @param {GenerateTextureOptions | Container} options - Generate texture options.
   * @param {Container} [options.container] - If not given, the renderer's resolution is used.
   * @param {Rectangle} options.region - The region of the container, that shall be rendered,
   * @param {number} [options.resolution] - The resolution of the texture being generated.
   *        if no region is specified, defaults to the local bounds of the container.
   * @param {GenerateTextureSourceOptions} [options.textureSourceOptions] - Texture options for GPU.
   * @returns a shiny new texture of the container passed in
   */
  generateTexture(e) {
    var d;
    e instanceof S && (e = {
      target: e,
      frame: void 0,
      textureSourceOptions: {},
      resolution: void 0
    });
    const t = e.resolution || this._renderer.resolution, r = e.antialias || this._renderer.view.antialias, a = e.target;
    let n = e.clearColor;
    n ? n = Array.isArray(n) && n.length === 4 ? n : J.shared.setValue(n).toArray() : n = bt;
    const i = ((d = e.frame) == null ? void 0 : d.copyTo(vt)) || Le(a, xt).rectangle;
    i.width = Math.max(i.width, 1 / t) | 0, i.height = Math.max(i.height, 1 / t) | 0;
    const l = gt.create({
      ...e.textureSourceOptions,
      width: i.width,
      height: i.height,
      resolution: t,
      antialias: r
    }), o = g.shared.translate(-i.x, -i.y);
    return this._renderer.render({
      container: a,
      transform: o,
      target: l,
      clearColor: n
    }), l.source.updateMipmaps(), l;
  }
  destroy() {
    this._renderer = null;
  }
}
Ce.extension = {
  type: [
    u.WebGLSystem,
    u.WebGPUSystem
  ],
  name: "textureGenerator"
};
class we {
  constructor(e) {
    this._stackIndex = 0, this._globalUniformDataStack = [], this._uniformsPool = [], this._activeUniforms = [], this._bindGroupPool = [], this._activeBindGroups = [], this._renderer = e;
  }
  reset() {
    this._stackIndex = 0;
    for (let e = 0; e < this._activeUniforms.length; e++)
      this._uniformsPool.push(this._activeUniforms[e]);
    for (let e = 0; e < this._activeBindGroups.length; e++)
      this._bindGroupPool.push(this._activeBindGroups[e]);
    this._activeUniforms.length = 0, this._activeBindGroups.length = 0;
  }
  start(e) {
    this.reset(), this.push(e);
  }
  bind({
    size: e,
    projectionMatrix: t,
    worldTransformMatrix: r,
    worldColor: a,
    offset: n
  }) {
    const i = this._renderer.renderTarget.renderTarget, l = this._stackIndex ? this._globalUniformDataStack[this._stackIndex - 1] : {
      projectionData: i,
      worldTransformMatrix: new g(),
      worldColor: 4294967295,
      offset: new We()
    }, o = {
      projectionMatrix: t || this._renderer.renderTarget.projectionMatrix,
      resolution: e || i.size,
      worldTransformMatrix: r || l.worldTransformMatrix,
      worldColor: a || l.worldColor,
      offset: n || l.offset,
      bindGroup: null
    }, d = this._uniformsPool.pop() || this._createUniforms();
    this._activeUniforms.push(d);
    const c = d.uniforms;
    c.uProjectionMatrix = o.projectionMatrix, c.uResolution = o.resolution, c.uWorldTransformMatrix.copyFrom(o.worldTransformMatrix), c.uWorldTransformMatrix.tx -= o.offset.x, c.uWorldTransformMatrix.ty -= o.offset.y, Ye(
      o.worldColor,
      c.uWorldColorAlpha,
      0
    ), d.update();
    let h;
    this._renderer.renderPipes.uniformBatch ? h = this._renderer.renderPipes.uniformBatch.getUniformBindGroup(d, !1) : (h = this._bindGroupPool.pop() || new Ve(), this._activeBindGroups.push(h), h.setResource(d, 0)), o.bindGroup = h, this._currentGlobalUniformData = o;
  }
  push(e) {
    this.bind(e), this._globalUniformDataStack[this._stackIndex++] = this._currentGlobalUniformData;
  }
  pop() {
    this._currentGlobalUniformData = this._globalUniformDataStack[--this._stackIndex - 1], this._renderer.type === se.WEBGL && this._currentGlobalUniformData.bindGroup.resources[0].update();
  }
  get bindGroup() {
    return this._currentGlobalUniformData.bindGroup;
  }
  get uniformGroup() {
    return this._currentGlobalUniformData.bindGroup.resources[0];
  }
  _createUniforms() {
    return new re({
      uProjectionMatrix: { value: new g(), type: "mat3x3<f32>" },
      uWorldTransformMatrix: { value: new g(), type: "mat3x3<f32>" },
      // TODO - someone smart - set this to be a unorm8x4 rather than a vec4<f32>
      uWorldColorAlpha: { value: new Float32Array(4), type: "vec4<f32>" },
      uResolution: { value: [0, 0], type: "vec2<f32>" }
    }, {
      isStatic: !0
    });
  }
  destroy() {
    this._renderer = null;
  }
}
we.extension = {
  type: [
    u.WebGLSystem,
    u.WebGPUSystem,
    u.CanvasSystem
  ],
  name: "globalUniforms"
};
let $ = !1;
const N = "8.2.2";
function _t(s) {
  if (!$) {
    if (Q.get().getNavigator().userAgent.toLowerCase().indexOf("chrome") > -1) {
      const e = [
        `%c  %c  %c  %c  %c PixiJS %c v${N} (${s}) http://www.pixijs.com/

`,
        "background: #E72264; padding:5px 0;",
        "background: #6CA2EA; padding:5px 0;",
        "background: #B5D33D; padding:5px 0;",
        "background: #FED23F; padding:5px 0;",
        "color: #FFFFFF; background: #E72264; padding:5px 0;",
        "color: #E72264; background: #FFFFFF; padding:5px 0;"
      ];
      globalThis.console.log(...e);
    } else
      globalThis.console && globalThis.console.log(`PixiJS ${N} - ${s} - http://www.pixijs.com/`);
    $ = !0;
  }
}
class F {
  constructor(e) {
    this._renderer = e;
  }
  /**
   * It all starts here! This initiates every system, passing in the options for any system by name.
   * @param options - the config for the renderer and all its systems
   */
  init(e) {
    if (e.hello) {
      let t = this._renderer.name;
      this._renderer.type === se.WEBGL && (t += ` ${this._renderer.context.webGLVersion}`), _t(t);
    }
  }
}
F.extension = {
  type: [
    u.WebGLSystem,
    u.WebGPUSystem,
    u.CanvasSystem
  ],
  name: "hello",
  priority: -2
};
F.defaultOptions = {
  /** {@link WebGLOptions.hello} */
  hello: !1
};
const O = class Se {
  /** @param renderer - The renderer this System works for. */
  constructor(e) {
    this._renderer = e, this.count = 0, this.checkCount = 0;
  }
  init(e) {
    e = { ...Se.defaultOptions, ...e }, this.checkCountMax = e.textureGCCheckCountMax, this.maxIdle = e.textureGCAMaxIdle, this.active = e.textureGCActive;
  }
  /**
   * Checks to see when the last time a texture was used.
   * If the texture has not been used for a specified amount of time, it will be removed from the GPU.
   */
  postrender() {
    this._renderer.renderingToScreen && (this.count++, this.active && (this.checkCount++, this.checkCount > this.checkCountMax && (this.checkCount = 0, this.run())));
  }
  /**
   * Checks to see when the last time a texture was used.
   * If the texture has not been used for a specified amount of time, it will be removed from the GPU.
   */
  run() {
    const e = this._renderer.texture.managedTextures;
    for (let t = 0; t < e.length; t++) {
      const r = e[t];
      r.autoGarbageCollect && r.resource && r._touched > -1 && this.count - r._touched > this.maxIdle && (r._touched = -1, r.unload());
    }
  }
  destroy() {
    this._renderer = null;
  }
};
O.extension = {
  type: [
    u.WebGLSystem,
    u.WebGPUSystem
  ],
  name: "textureGC"
};
O.defaultOptions = {
  /**
   * If set to true, this will enable the garbage collector on the GPU.
   * @default true
   */
  textureGCActive: !0,
  /**
   * The maximum idle frames before a texture is destroyed by garbage collection.
   * @default 60 * 60
   */
  textureGCAMaxIdle: 60 * 60,
  /**
   * Frames between two garbage collections.
   * @default 600
   */
  textureGCCheckCountMax: 600
};
let Pe = O;
X.add(Pe);
const z = class Ge {
  /** The resolution / device pixel ratio of the renderer. */
  get resolution() {
    return this.texture.source._resolution;
  }
  set resolution(e) {
    this.texture.source.resize(
      this.texture.source.width,
      this.texture.source.height,
      e
    );
  }
  /**
   * initiates the view system
   * @param options - the options for the view
   */
  init(e) {
    e = {
      ...Ge.defaultOptions,
      ...e
    }, e.view && (je($e, "ViewSystem.view has been renamed to ViewSystem.canvas"), e.canvas = e.view), this.screen = new w(0, 0, e.width, e.height), this.canvas = e.canvas || Q.get().createCanvas(), this.antialias = !!e.antialias, this.texture = de(this.canvas, e), this.renderTarget = new I({
      colorTextures: [this.texture],
      depth: !!e.depth,
      isRoot: !0
    }), this.texture.source.transparent = e.backgroundAlpha < 1, this.multiView = !!e.multiView, this.autoDensity && (this.canvas.style.width = `${this.texture.width}px`, this.canvas.style.height = `${this.texture.height}px`), this.resolution = e.resolution;
  }
  /**
   * Resizes the screen and canvas to the specified dimensions.
   * @param desiredScreenWidth - The new width of the screen.
   * @param desiredScreenHeight - The new height of the screen.
   * @param resolution
   */
  resize(e, t, r) {
    this.texture.source.resize(e, t, r), this.screen.width = this.texture.frame.width, this.screen.height = this.texture.frame.height, this.autoDensity && (this.canvas.style.width = `${e}px`, this.canvas.style.height = `${t}px`);
  }
  /**
   * Destroys this System and optionally removes the canvas from the dom.
   * @param {options | false} options - The options for destroying the view, or "false".
   * @param options.removeView - Whether to remove the view element from the DOM. Defaults to `false`.
   */
  destroy(e = !1) {
    (typeof e == "boolean" ? e : !!(e != null && e.removeView)) && this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas);
  }
};
z.extension = {
  type: [
    u.WebGLSystem,
    u.WebGPUSystem,
    u.CanvasSystem
  ],
  name: "view",
  priority: 0
};
z.defaultOptions = {
  /**
   * {@link WebGLOptions.width}
   * @default 800
   */
  width: 800,
  /**
   * {@link WebGLOptions.height}
   * @default 600
   */
  height: 600,
  /**
   * {@link WebGLOptions.autoDensity}
   * @default false
   */
  autoDensity: !1,
  /**
   * {@link WebGLOptions.antialias}
   * @default false
   */
  antialias: !1
};
let yt = z;
const At = [
  pt,
  we,
  F,
  yt,
  _e,
  Pe,
  Ce,
  mt,
  Ne
], It = [
  ke,
  ne,
  ye,
  me,
  oe,
  ue,
  le,
  fe
];
export {
  Ut as B,
  T as G,
  Bt as R,
  At as S,
  Pt as U,
  It as a,
  nt as b,
  Gt as c,
  M as d,
  St as e,
  wt as f,
  Ct as t,
  Rt as u
};
