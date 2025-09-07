import { Mesh as l, Color as n, BufferGeometry as u } from "three";
import { CollisionBuilder as h } from "../collision/collision-builder.js";
import { MeshBuilder as m } from "../graphics/mesh.js";
import { MaterialBuilder as d } from "../graphics/material.js";
class y extends h {
}
class b extends m {
  build(i) {
    return new u();
  }
  postBuild() {
  }
}
class M {
  meshBuilder;
  collisionBuilder;
  materialBuilder;
  options;
  entity;
  constructor(i, s, t, e) {
    this.options = i, this.entity = s, this.meshBuilder = t, this.collisionBuilder = e, this.materialBuilder = new d();
    const o = {
      meshBuilder: this.meshBuilder,
      collisionBuilder: this.collisionBuilder,
      materialBuilder: this.materialBuilder
    };
    this.options._builders = o;
  }
  withPosition(i) {
    return this.options.position = i, this;
  }
  async withMaterial(i, s) {
    return this.materialBuilder && await this.materialBuilder.build(i, s), this;
  }
  applyMaterialToGroup(i, s) {
    i.traverse((t) => {
      t instanceof l && t.type === "SkinnedMesh" && s[0] && !t.material.map && (t.material = s[0]), t.castShadow = !0, t.receiveShadow = !0;
    });
  }
  async build() {
    const i = this.entity;
    if (this.materialBuilder && (i.materials = this.materialBuilder.materials), this.meshBuilder && i.materials) {
      const s = this.meshBuilder.build(this.options);
      i.mesh = this.meshBuilder._build(this.options, s, i.materials), this.meshBuilder.postBuild();
    }
    if (i.group && i.materials && this.applyMaterialToGroup(i.group, i.materials), this.collisionBuilder) {
      this.collisionBuilder.withCollision(this.options?.collision || {});
      const [s, t] = this.collisionBuilder.build(this.options);
      i.bodyDesc = s, i.colliderDesc = t;
      const { x: e, y: o, z: a } = this.options.position || { x: 0, y: 0, z: 0 };
      i.bodyDesc.setTranslation(e, o, a);
    }
    if (this.options.collisionType && (i.collisionType = this.options.collisionType), this.options.color instanceof n) {
      const s = (t) => {
        const e = t;
        e && e.color && e.color.set && e.color.set(this.options.color);
      };
      if (i.materials?.length)
        for (const t of i.materials)
          s(t);
      if (i.mesh && i.mesh.material) {
        const t = i.mesh.material;
        Array.isArray(t) ? t.forEach(s) : s(t);
      }
      i.group && i.group.traverse((t) => {
        if (t instanceof l && t.material) {
          const e = t.material;
          Array.isArray(e) ? e.forEach(s) : s(e);
        }
      });
    }
    return i;
  }
}
export {
  M as EntityBuilder,
  y as EntityCollisionBuilder,
  b as EntityMeshBuilder
};
