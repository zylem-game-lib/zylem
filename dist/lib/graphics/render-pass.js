import * as s from "three";
import { WebGLRenderTarget as i } from "three";
import n from "./shaders/fragment/standard.glsl.js";
import l from "./shaders/vertex/standard.glsl.js";
import { Pass as o, FullScreenQuad as d } from "three/addons/postprocessing/Pass.js";
class f extends o {
  fsQuad;
  resolution;
  scene;
  camera;
  rgbRenderTarget;
  normalRenderTarget;
  normalMaterial;
  constructor(e, r, a) {
    super(), this.resolution = e, this.fsQuad = new d(this.material()), this.scene = r, this.camera = a, this.rgbRenderTarget = new i(e.x * 4, e.y * 4), this.normalRenderTarget = new i(e.x * 4, e.y * 4), this.normalMaterial = new s.MeshNormalMaterial();
  }
  render(e, r) {
    e.setRenderTarget(this.rgbRenderTarget), e.render(this.scene, this.camera);
    const a = this.scene.overrideMaterial;
    e.setRenderTarget(this.normalRenderTarget), this.scene.overrideMaterial = this.normalMaterial, e.render(this.scene, this.camera), this.scene.overrideMaterial = a;
    const t = this.fsQuad.material.uniforms;
    t.tDiffuse.value = this.rgbRenderTarget.texture, t.tDepth.value = this.rgbRenderTarget.depthTexture, t.tNormal.value = this.normalRenderTarget.texture, t.iTime.value += 0.01, this.renderToScreen ? e.setRenderTarget(null) : e.setRenderTarget(r), this.fsQuad.render(e);
  }
  material() {
    return new s.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        tDiffuse: { value: null },
        tDepth: { value: null },
        tNormal: { value: null },
        resolution: {
          value: new s.Vector4(this.resolution.x, this.resolution.y, 1 / this.resolution.x, 1 / this.resolution.y)
        }
      },
      vertexShader: l,
      fragmentShader: n
    });
  }
  dispose() {
    try {
      this.fsQuad?.dispose?.();
    } catch {
    }
    try {
      this.rgbRenderTarget?.dispose?.(), this.normalRenderTarget?.dispose?.();
    } catch {
    }
    try {
      this.normalMaterial?.dispose?.();
    } catch {
    }
  }
}
export {
  f as default
};
