import { Color as n, Vector2 as m, TextureLoader as c, RepeatWrapping as o, MeshPhongMaterial as p, MeshStandardMaterial as u, ShaderMaterial as f, Vector3 as d } from "three";
import { shortHash as M, sortedStringify as w } from "../core/utility.js";
import h from "../core/preset-shader.js";
class i {
  static batchMaterialMap = /* @__PURE__ */ new Map();
  materials = [];
  batchMaterial(t, a) {
    const r = M(w(t)), e = i.batchMaterialMap.get(r);
    if (e) {
      const s = e.geometryMap.get(a);
      s ? e.geometryMap.set(a, s + 1) : e.geometryMap.set(a, 1);
    } else
      i.batchMaterialMap.set(r, {
        geometryMap: /* @__PURE__ */ new Map([[a, 1]]),
        material: this.materials[0]
      });
  }
  async build(t, a) {
    const { path: r, repeat: e, color: s, shader: l } = t;
    l && this.withShader(l), s && this.withColor(s), await this.setTexture(r ?? null, e), this.materials.length === 0 && this.setColor(new n("#ffffff")), this.batchMaterial(t, a);
  }
  withColor(t) {
    return this.setColor(t), this;
  }
  withShader(t) {
    return this.setShader(t), this;
  }
  async setTexture(t = null, a = new m(1, 1)) {
    if (!t)
      return;
    const e = await new c().loadAsync(t);
    e.repeat = a, e.wrapS = o, e.wrapT = o;
    const s = new p({
      map: e
    });
    this.materials.push(s);
  }
  setColor(t) {
    const a = new u({
      color: t,
      emissiveIntensity: 0.5,
      lightMapIntensity: 0.5,
      fog: !0
    });
    this.materials.push(a);
  }
  setShader(t) {
    const { fragment: a, vertex: r } = h.get(t) ?? h.get("standard"), e = new f({
      uniforms: {
        iResolution: { value: new d(1, 1, 1) },
        iTime: { value: 0 },
        tDiffuse: { value: null },
        tDepth: { value: null },
        tNormal: { value: null }
      },
      vertexShader: r,
      fragmentShader: a
    });
    this.materials.push(e);
  }
}
export {
  i as MaterialBuilder
};
