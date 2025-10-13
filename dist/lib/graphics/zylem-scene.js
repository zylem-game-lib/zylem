import { Scene as d, Color as i, TextureLoader as n, AmbientLight as m, DirectionalLight as c, Vector3 as h, GridHelper as l } from "three";
import { debugState as g } from "../debug/debug-state.js";
import { getGlobalState as p } from "../game/game-state.js";
class b {
  type = "Scene";
  _setup;
  scene;
  zylemCamera;
  containerElement = null;
  update = () => {
  };
  _collision;
  _destroy;
  name;
  tag;
  constructor(e, s, a) {
    const o = new d(), t = a.backgroundColor instanceof i ? a.backgroundColor : new i(a.backgroundColor);
    if (o.background = t, a.backgroundImage) {
      const r = new n().load(a.backgroundImage);
      o.background = r;
    }
    this.scene = o, this.zylemCamera = s, this.setupLighting(o), this.setupCamera(o, s), g.on && this.debugScene();
  }
  setup() {
    this._setup && this._setup({ me: this, camera: this.zylemCamera, globals: p() });
  }
  destroy() {
    this.zylemCamera && this.zylemCamera.destroy && this.zylemCamera.destroy(), this.scene && this.scene.traverse((e) => {
      e.geometry && e.geometry.dispose?.(), e.material && (Array.isArray(e.material) ? e.material.forEach((s) => s.dispose?.()) : e.material.dispose?.());
    });
  }
  /**
   * Setup camera with the scene
   */
  setupCamera(e, s) {
    e.add(s.cameraRig), s.setup(e);
  }
  /**
   * Setup scene lighting
   */
  setupLighting(e) {
    const s = new m(16777215, 2);
    e.add(s);
    const a = new c(16777215, 2);
    a.name = "Light", a.position.set(0, 100, 0), a.castShadow = !0, a.shadow.camera.near = 0.1, a.shadow.camera.far = 2e3, a.shadow.camera.left = -100, a.shadow.camera.right = 100, a.shadow.camera.top = 100, a.shadow.camera.bottom = -100, a.shadow.mapSize.width = 2048, a.shadow.mapSize.height = 2048, e.add(a);
  }
  /**
   * Update renderer size - delegates to camera
   */
  updateRenderer(e, s) {
    this.zylemCamera.resize(e, s);
  }
  /**
   * Add object to scene
   */
  add(e, s = new h(0, 0, 0)) {
    e.position.set(s.x, s.y, s.z), this.scene.add(e);
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
  b as ZylemScene
};
