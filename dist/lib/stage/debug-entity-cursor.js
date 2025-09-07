import { Color as r, Box3 as h, Vector3 as s, BoxGeometry as n, Mesh as a, MeshBasicMaterial as l, EdgesGeometry as o, LineSegments as c, LineBasicMaterial as d, Group as m } from "three";
class u {
  scene;
  container;
  fillMesh;
  edgeLines;
  currentColor = new r(65280);
  bbox = new h();
  size = new s();
  center = new s();
  constructor(e) {
    this.scene = e;
    const i = new n(1, 1, 1);
    this.fillMesh = new a(i, new l({
      color: this.currentColor,
      transparent: !0,
      opacity: 0.12,
      depthWrite: !1
    }));
    const t = new o(i);
    this.edgeLines = new c(t, new d({ color: this.currentColor, linewidth: 1 })), this.container = new m(), this.container.name = "DebugEntityCursor", this.container.add(this.fillMesh), this.container.add(this.edgeLines), this.container.visible = !1, this.scene.add(this.container);
  }
  setColor(e) {
    this.currentColor.set(e), this.fillMesh.material.color.set(this.currentColor), this.edgeLines.material.color.set(this.currentColor);
  }
  /**
   * Update the cursor to enclose the provided Object3D using a world-space AABB.
   */
  updateFromObject(e) {
    if (!e) {
      this.hide();
      return;
    }
    if (this.bbox.setFromObject(e), !isFinite(this.bbox.min.x) || !isFinite(this.bbox.max.x)) {
      this.hide();
      return;
    }
    this.bbox.getSize(this.size), this.bbox.getCenter(this.center);
    const i = new n(Math.max(this.size.x, 1e-6), Math.max(this.size.y, 1e-6), Math.max(this.size.z, 1e-6));
    this.fillMesh.geometry.dispose(), this.fillMesh.geometry = i;
    const t = new o(i);
    this.edgeLines.geometry.dispose(), this.edgeLines.geometry = t, this.container.position.copy(this.center), this.container.visible = !0;
  }
  hide() {
    this.container.visible = !1;
  }
  dispose() {
    this.scene.remove(this.container), this.fillMesh.geometry.dispose(), this.fillMesh.material.dispose(), this.edgeLines.geometry.dispose(), this.edgeLines.material.dispose();
  }
}
export {
  u as DebugEntityCursor
};
