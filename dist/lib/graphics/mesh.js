import { Mesh as n } from "three";
class h {
  _build(t, r, s) {
    const { batched: i, material: a } = t;
    i && console.warn("warning: mesh batching is not implemented");
    const e = new n(r, s.at(-1));
    return e.position.set(0, 0, 0), e.castShadow = !0, e.receiveShadow = !0, e;
  }
  _postBuild() {
  }
}
export {
  h as MeshBuilder
};
