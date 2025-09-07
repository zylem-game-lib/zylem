import { WebGLRenderer as c, Object3D as m, Vector3 as h, PerspectiveCamera as a, OrthographicCamera as o } from "three";
import { OrbitControls as l } from "three/addons/controls/OrbitControls.js";
import { Perspectives as t } from "./perspective.js";
import { ThirdPersonCamera as n } from "./third-person.js";
import { Fixed2DCamera as p } from "./fixed-2d.js";
import { EffectComposer as u } from "three/examples/jsm/postprocessing/EffectComposer.js";
import d from "../graphics/render-pass.js";
class S {
  cameraRig;
  camera;
  screenResolution;
  renderer;
  composer;
  _perspective;
  orbitControls = null;
  target = null;
  sceneRef = null;
  frustumSize = 10;
  // Perspective controller delegation
  perspectiveController = null;
  constructor(e, r, s = 10) {
    this._perspective = e, this.screenResolution = r, this.frustumSize = s, this.renderer = new c({ antialias: !1, alpha: !0 }), this.renderer.setSize(r.x, r.y), this.renderer.shadowMap.enabled = !0, this.composer = new u(this.renderer);
    const i = r.x / r.y;
    this.camera = this.createCameraForPerspective(i), this.cameraRig = new m(), this.cameraRig.position.set(0, 3, 10), this.cameraRig.add(this.camera), this.camera.lookAt(new h(0, 2, 0)), this.initializePerspectiveController();
  }
  /**
   * Setup the camera with a scene
   */
  async setup(e) {
    this.sceneRef = e, this.orbitControls === null && (this.orbitControls = new l(this.camera, this.renderer.domElement), this.orbitControls.enableDamping = !0, this.orbitControls.dampingFactor = 0.05, this.orbitControls.screenSpacePanning = !1, this.orbitControls.minDistance = 1, this.orbitControls.maxDistance = 500, this.orbitControls.maxPolarAngle = Math.PI / 2);
    let r = this.screenResolution.clone().divideScalar(2);
    r.x |= 0, r.y |= 0;
    const s = new d(r, e, this.camera);
    this.composer.addPass(s), this.perspectiveController && this.perspectiveController.setup({
      screenResolution: this.screenResolution,
      renderer: this.renderer,
      scene: e,
      camera: this
    }), this.renderer.setAnimationLoop((i) => {
      this.update(i || 0);
    });
  }
  /**
   * Update camera and render
   */
  update(e) {
    this.orbitControls?.update(), this.perspectiveController && this.perspectiveController.update(e), this.composer.render(e);
  }
  /**
   * Dispose renderer, composer, controls, and detach from scene
   */
  destroy() {
    try {
      this.renderer.setAnimationLoop(null);
    } catch {
    }
    try {
      this.orbitControls?.dispose(), this.orbitControls = null;
    } catch {
    }
    try {
      this.composer?.passes?.forEach((e) => e.dispose?.()), this.composer?.dispose?.();
    } catch {
    }
    try {
      this.renderer.dispose();
    } catch {
    }
    this.sceneRef = null;
  }
  /**
   * Resize camera and renderer
   */
  resize(e, r) {
    this.screenResolution.set(e, r), this.renderer.setSize(e, r, !0), this.composer.setSize(e, r), this.camera instanceof a && (this.camera.aspect = e / r, this.camera.updateProjectionMatrix()), this.perspectiveController && this.perspectiveController.resize(e, r);
  }
  /**
   * Create camera based on perspective type
   */
  createCameraForPerspective(e) {
    switch (this._perspective) {
      case t.ThirdPerson:
        return this.createThirdPersonCamera(e);
      case t.FirstPerson:
        return this.createFirstPersonCamera(e);
      case t.Isometric:
        return this.createIsometricCamera(e);
      case t.Flat2D:
        return this.createFlat2DCamera(e);
      case t.Fixed2D:
        return this.createFixed2DCamera(e);
      default:
        return this.createThirdPersonCamera(e);
    }
  }
  /**
   * Initialize perspective-specific controller
   */
  initializePerspectiveController() {
    switch (this._perspective) {
      case t.ThirdPerson:
        this.perspectiveController = new n();
        break;
      case t.Fixed2D:
        this.perspectiveController = new p();
        break;
      default:
        this.perspectiveController = new n();
    }
  }
  createThirdPersonCamera(e) {
    return new a(75, e, 0.1, 1e3);
  }
  createFirstPersonCamera(e) {
    return new a(75, e, 0.1, 1e3);
  }
  createIsometricCamera(e) {
    return new o(this.frustumSize * e / -2, this.frustumSize * e / 2, this.frustumSize / 2, this.frustumSize / -2, 1, 1e3);
  }
  createFlat2DCamera(e) {
    return new o(this.frustumSize * e / -2, this.frustumSize * e / 2, this.frustumSize / 2, this.frustumSize / -2, 1, 1e3);
  }
  createFixed2DCamera(e) {
    return this.createFlat2DCamera(e);
  }
  // Movement methods
  moveCamera(e) {
    (this._perspective === t.Flat2D || this._perspective === t.Fixed2D) && (this.frustumSize = e.z), this.cameraRig.position.set(e.x, e.y, e.z);
  }
  move(e) {
    this.moveCamera(e);
  }
  rotate(e, r, s) {
    this.cameraRig.rotateX(e), this.cameraRig.rotateY(r), this.cameraRig.rotateZ(s);
  }
  /**
   * Get the DOM element for the renderer
   */
  getDomElement() {
    return this.renderer.domElement;
  }
}
export {
  S as ZylemCamera
};
