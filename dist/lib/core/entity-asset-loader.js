import { FBXLoader as d } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader as i } from "three/addons/loaders/GLTFLoader.js";
var t;
(function(r) {
  r.FBX = "fbx", r.GLTF = "gltf";
})(t || (t = {}));
class l {
  loader = new d();
  isSupported(e) {
    return e.toLowerCase().endsWith(t.FBX);
  }
  async load(e) {
    return new Promise((o, s) => {
      this.loader.load(e, (a) => {
        const n = a.animations[0];
        o({
          object: a,
          animation: n
        });
      }, void 0, s);
    });
  }
}
class p {
  loader = new i();
  isSupported(e) {
    return e.toLowerCase().endsWith(t.GLTF);
  }
  async load(e) {
    return new Promise((o, s) => {
      this.loader.load(e, (a) => {
        o({
          object: a.scene,
          gltf: a
        });
      }, void 0, s);
    });
  }
}
class u {
  loaders = [
    new l(),
    new p()
  ];
  async loadFile(e) {
    const o = this.loaders.find((s) => s.isSupported(e));
    if (!o)
      throw new Error(`Unsupported file type: ${e}`);
    return o.load(e);
  }
}
export {
  u as EntityAssetLoader,
  l as FBXAssetLoader,
  t as FileExtensionTypes,
  p as GLTFAssetLoader
};
