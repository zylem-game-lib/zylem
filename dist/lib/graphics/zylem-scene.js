import { Scene as r, Color as n, TextureLoader as o, AmbientLight as m, DirectionalLight as d, Vector3 as h, GridHelper as l } from "three";
import { debugState as c } from "../debug/debug-state.js";
import { getGlobalState as p } from "../game/game-state.js";
class y {
  type = "Scene";
  _setup;
  scene;
  zylemCamera;
  containerElement = null;
  constructor(e, t, a) {
    const i = new r();
    if (i.background = new n(a.backgroundColor), a.backgroundImage) {
      const s = new o().load(a.backgroundImage);
      i.background = s;
    }
    this.scene = i, this.zylemCamera = t, this.setupContainer(e), this.setupLighting(i), this.setupCamera(i, t), c.on && this.debugScene();
  }
  /**
   * Setup the container element and append camera's renderer
   */
  setupContainer(e) {
    let t = document.getElementById(e);
    if (!t) {
      console.warn(`Could not find element with id: ${e}`);
      const a = document.createElement("main");
      a.setAttribute("id", e), document.body.appendChild(a), t = a;
    }
    t?.firstChild && t.removeChild(t.firstChild), this.containerElement = t, t?.appendChild(this.zylemCamera.getDomElement());
  }
  setup() {
    this._setup && this._setup({ me: this, camera: this.zylemCamera, globals: p() });
  }
  destroy() {
    if (this.containerElement && this.zylemCamera)
      try {
        const e = this.zylemCamera.getDomElement();
        e && e.parentElement === this.containerElement && this.containerElement.removeChild(e);
      } catch {
      }
    this.zylemCamera && this.zylemCamera.destroy && this.zylemCamera.destroy(), this.scene && this.scene.traverse((e) => {
      e.geometry && e.geometry.dispose?.(), e.material && (Array.isArray(e.material) ? e.material.forEach((t) => t.dispose?.()) : e.material.dispose?.());
    });
  }
  update({ delta: e }) {
  }
  /**
   * Setup camera with the scene
   */
  setupCamera(e, t) {
    e.add(t.cameraRig), t.setup(e);
  }
  /**
   * Setup scene lighting
   */
  setupLighting(e) {
    const t = new m(16777215, 2);
    e.add(t);
    const a = new d(16777215, 2);
    a.name = "Light", a.position.set(0, 100, 0), a.castShadow = !0, a.shadow.camera.near = 0.1, a.shadow.camera.far = 2e3, a.shadow.camera.left = -100, a.shadow.camera.right = 100, a.shadow.camera.top = 100, a.shadow.camera.bottom = -100, a.shadow.mapSize.width = 2048, a.shadow.mapSize.height = 2048, e.add(a);
  }
  /**
   * Update renderer size - delegates to camera
   */
  updateRenderer(e, t) {
    this.zylemCamera.resize(e, t);
  }
  /**
   * Add object to scene
   */
  add(e, t = new h(0, 0, 0)) {
    e.position.set(t.x, t.y, t.z), this.scene.add(e);
  }
  /**
   * Add game entity to scene
   */
  addEntity(e) {
    e.group ? this.add(e.group, e.options.position) : e.mesh && this.add(e.mesh, e.options.position);
  }
  /**
   * Add debug helpers to scene
   */
  debugScene() {
    const a = new l(1e3, 100);
    this.scene.add(a);
  }
}
export {
  y as ZylemScene
};
