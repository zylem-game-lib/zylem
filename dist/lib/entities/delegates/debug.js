import { MeshStandardMaterial as c, MeshBasicMaterial as u, MeshPhongMaterial as f } from "three";
function g(o) {
  return o && typeof o.getDebugInfo == "function";
}
class d {
  entity;
  constructor(t) {
    this.entity = t;
  }
  /**
   * Get formatted position string
   */
  getPositionString() {
    if (this.entity.mesh) {
      const { x: n, y: s, z: r } = this.entity.mesh.position;
      return `${n.toFixed(2)}, ${s.toFixed(2)}, ${r.toFixed(2)}`;
    }
    const { x: t, y: i, z: e } = this.entity.options.position || { x: 0, y: 0, z: 0 };
    return `${t.toFixed(2)}, ${i.toFixed(2)}, ${e.toFixed(2)}`;
  }
  /**
   * Get formatted rotation string (in degrees)
   */
  getRotationString() {
    if (this.entity.mesh) {
      const { x: s, y: r, z: y } = this.entity.mesh.rotation, a = (h) => (h * 180 / Math.PI).toFixed(1);
      return `${a(s)}°, ${a(r)}°, ${a(y)}°`;
    }
    const { x: t, y: i, z: e } = this.entity.options.rotation || { x: 0, y: 0, z: 0 }, n = (s) => (s * 180 / Math.PI).toFixed(1);
    return `${n(t)}°, ${n(i)}°, ${n(e)}°`;
  }
  /**
   * Get material information
   */
  getMaterialInfo() {
    if (!this.entity.mesh || !this.entity.mesh.material)
      return { type: "none" };
    const t = Array.isArray(this.entity.mesh.material) ? this.entity.mesh.material[0] : this.entity.mesh.material, i = {
      type: t.type
    };
    return (t instanceof c || t instanceof u || t instanceof f) && (i.color = `#${t.color.getHexString()}`, i.opacity = t.opacity, i.transparent = t.transparent), "roughness" in t && (i.roughness = t.roughness), "metalness" in t && (i.metalness = t.metalness), i;
  }
  getPhysicsInfo() {
    if (!this.entity.body)
      return null;
    const t = {
      type: this.entity.body.bodyType(),
      mass: this.entity.body.mass(),
      isEnabled: this.entity.body.isEnabled(),
      isSleeping: this.entity.body.isSleeping()
    }, i = this.entity.body.linvel();
    return t.velocity = `${i.x.toFixed(2)}, ${i.y.toFixed(2)}, ${i.z.toFixed(2)}`, t;
  }
  buildDebugInfo() {
    const t = {
      name: this.entity.name || this.entity.uuid,
      uuid: this.entity.uuid,
      position: this.getPositionString(),
      rotation: this.getRotationString(),
      material: this.getMaterialInfo()
    }, i = this.getPhysicsInfo();
    if (i && (t.physics = i), this.entity.behaviors.length > 0 && (t.behaviors = this.entity.behaviors.map((e) => e.constructor.name)), g(this.entity)) {
      const e = this.entity.getDebugInfo();
      return { ...t, ...e };
    }
    return t;
  }
}
export {
  d as DebugDelegate,
  g as hasDebugInfo
};
