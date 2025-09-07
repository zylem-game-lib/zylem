import { Ray as b } from "@dimforge/rapier3d-compat";
import { Vector2 as E, Raycaster as f, LineSegments as L, BufferGeometry as p, LineBasicMaterial as w, BufferAttribute as m } from "three";
import { debugState as C, getDebugTool as y, setHoveredEntity as D, resetHoveredEntity as v, getHoveredEntity as R, DebugTools as d, setSelectedEntity as T } from "../debug/debug-state.js";
import { DebugEntityCursor as O } from "./debug-entity-cursor.js";
const F = 2293538, x = 16724787;
class A {
  stage;
  options;
  mouseNdc = new E(-2, -2);
  raycaster = new f();
  isMouseDown = !1;
  disposeFns = [];
  debugCursor = null;
  debugLines = null;
  constructor(e, s) {
    this.stage = e, this.options = {
      maxRayDistance: s?.maxRayDistance ?? 5e3,
      addEntityFactory: s?.addEntityFactory ?? null
    }, this.stage.scene && (this.debugLines = new L(new p(), new w({ vertexColors: !0 })), this.stage.scene.scene.add(this.debugLines), this.debugLines.visible = !0, this.debugCursor = new O(this.stage.scene.scene)), this.attachDomListeners();
  }
  update() {
    if (!C.on || !this.stage.scene || !this.stage.world || !this.stage.cameraRef)
      return;
    const { world: e, cameraRef: s } = this.stage;
    if (this.debugLines) {
      const { vertices: l, colors: c } = e.world.debugRender();
      this.debugLines.geometry.setAttribute("position", new m(l, 3)), this.debugLines.geometry.setAttribute("color", new m(c, 4));
    }
    const i = y(), n = i === d.SELECT || i === d.DELETE;
    this.raycaster.setFromCamera(this.mouseNdc, s.camera);
    const t = this.raycaster.ray.origin.clone(), o = this.raycaster.ray.direction.clone().normalize(), r = new b({ x: t.x, y: t.y, z: t.z }, { x: o.x, y: o.y, z: o.z }), a = e.world.castRay(r, this.options.maxRayDistance, !0);
    if (a && n) {
      const c = a.collider?._parent?.userData?.uuid;
      c ? D(c) : v(), this.isMouseDown && this.handleActionOnHit(c ?? null, t, o, a.toi);
    }
    this.isMouseDown = !1;
    const u = R();
    if (!u) {
      this.debugCursor?.hide();
      return;
    }
    const h = this.stage._debugMap.get(`${u}`), g = h?.group ?? h?.mesh ?? null;
    if (!g) {
      this.debugCursor?.hide();
      return;
    }
    switch (i) {
      case d.SELECT:
        this.debugCursor?.setColor(F);
        break;
      case d.DELETE:
        this.debugCursor?.setColor(x);
        break;
      default:
        this.debugCursor?.setColor(16777215);
        break;
    }
    this.debugCursor?.updateFromObject(g);
  }
  dispose() {
    this.disposeFns.forEach((e) => e()), this.disposeFns = [], this.debugCursor?.dispose(), this.debugLines && this.stage.scene && (this.stage.scene.scene.remove(this.debugLines), this.debugLines.geometry.dispose(), this.debugLines.material.dispose(), this.debugLines = null);
  }
  handleActionOnHit(e, s, i, n) {
    switch (y()) {
      case "SELECT": {
        e && T(e);
        break;
      }
      case "DELETE": {
        e && this.stage.removeEntityByUuid(e);
        break;
      }
      case "ADD": {
        if (!this.options.addEntityFactory)
          break;
        const o = s.clone().add(i.clone().multiplyScalar(n)), r = this.options.addEntityFactory({ position: o });
        r && Promise.resolve(r).then((a) => {
          a && this.stage.spawnEntity(a);
        }).catch(() => {
        });
        break;
      }
    }
  }
  attachDomListeners() {
    const e = this.stage.cameraRef?.renderer.domElement ?? this.stage.scene?.zylemCamera.renderer.domElement;
    if (!e)
      return;
    const s = (n) => {
      const t = e.getBoundingClientRect(), o = (n.clientX - t.left) / t.width * 2 - 1, r = -((n.clientY - t.top) / t.height * 2 - 1);
      this.mouseNdc.set(o, r);
    }, i = (n) => {
      this.isMouseDown = !0;
    };
    e.addEventListener("mousemove", s), e.addEventListener("mousedown", i), this.disposeFns.push(() => e.removeEventListener("mousemove", s)), this.disposeFns.push(() => e.removeEventListener("mousedown", i));
  }
}
export {
  A as StageDebugDelegate
};
