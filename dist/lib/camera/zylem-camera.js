import { Vector3 as a, WebGLRenderer as c, Object3D as u, PerspectiveCamera as o, OrthographicCamera as n } from "three";
import { OrbitControls as l } from "three/addons/controls/OrbitControls.js";
import { Perspectives as s } from "./perspective.js";
import { ThirdPersonCamera as h } from "./third-person.js";
import { Fixed2DCamera as m } from "./fixed-2d.js";
import { EffectComposer as b } from "three/examples/jsm/postprocessing/EffectComposer.js";
import d from "../graphics/render-pass.js";
class F {
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
  debugDelegate = null;
  debugUnsubscribe = null;
  debugStateSnapshot = { enabled: !1, selected: [] };
  orbitTarget = null;
  orbitTargetWorldPos = new a();
  constructor(e, t, r = 10) {
    this._perspective = e, this.screenResolution = t, this.frustumSize = r, this.renderer = new c({ antialias: !1, alpha: !0 }), this.renderer.setSize(t.x, t.y), this.renderer.shadowMap.enabled = !0, this.composer = new b(this.renderer);
    const i = t.x / t.y;
    this.camera = this.createCameraForPerspective(i), this.cameraRig = new u(), this.cameraRig.position.set(0, 3, 10), this.cameraRig.add(this.camera), this.camera.lookAt(new a(0, 2, 0)), this.initializePerspectiveController();
  }
  /**
   * Setup the camera with a scene
   */
  async setup(e) {
    this.sceneRef = e, this.orbitControls === null && (this.orbitControls = new l(this.camera, this.renderer.domElement), this.orbitControls.enableDamping = !0, this.orbitControls.dampingFactor = 0.05, this.orbitControls.screenSpacePanning = !1, this.orbitControls.minDistance = 1, this.orbitControls.maxDistance = 500, this.orbitControls.maxPolarAngle = Math.PI / 2);
    let t = this.screenResolution.clone().divideScalar(2);
    t.x |= 0, t.y |= 0;
    const r = new d(t, e, this.camera);
    this.composer.addPass(r), this.perspectiveController && this.perspectiveController.setup({
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
    this.orbitControls && this.orbitTarget && (this.orbitTarget.getWorldPosition(this.orbitTargetWorldPos), this.orbitControls.target.copy(this.orbitTargetWorldPos)), this.orbitControls?.update(), this.perspectiveController && this.perspectiveController.update(e), this.composer.render(e);
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
      this.disableOrbitControls();
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
    this.detachDebugDelegate(), this.sceneRef = null;
  }
  /**
   * Attach a delegate to react to debug state changes.
   */
  setDebugDelegate(e) {
    if (this.debugDelegate === e)
      return;
    if (this.detachDebugDelegate(), this.debugDelegate = e, !e) {
      this.applyDebugState({ enabled: !1, selected: [] });
      return;
    }
    const t = e.subscribe((r) => {
      this.applyDebugState(r);
    });
    this.debugUnsubscribe = () => {
      t?.();
    };
  }
  /**
   * Resize camera and renderer
   */
  resize(e, t) {
    this.screenResolution.set(e, t), this.renderer.setSize(e, t, !1), this.composer.setSize(e, t), this.camera instanceof o && (this.camera.aspect = e / t, this.camera.updateProjectionMatrix()), this.perspectiveController && this.perspectiveController.resize(e, t);
  }
  /**
   * Update renderer pixel ratio (DPR)
   */
  setPixelRatio(e) {
    const t = Math.max(1, Number.isFinite(e) ? e : 1);
    this.renderer.setPixelRatio(t);
  }
  /**
   * Create camera based on perspective type
   */
  createCameraForPerspective(e) {
    switch (this._perspective) {
      case s.ThirdPerson:
        return this.createThirdPersonCamera(e);
      case s.FirstPerson:
        return this.createFirstPersonCamera(e);
      case s.Isometric:
        return this.createIsometricCamera(e);
      case s.Flat2D:
        return this.createFlat2DCamera(e);
      case s.Fixed2D:
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
      case s.ThirdPerson:
        this.perspectiveController = new h();
        break;
      case s.Fixed2D:
        this.perspectiveController = new m();
        break;
      default:
        this.perspectiveController = new h();
    }
  }
  createThirdPersonCamera(e) {
    return new o(75, e, 0.1, 1e3);
  }
  createFirstPersonCamera(e) {
    return new o(75, e, 0.1, 1e3);
  }
  createIsometricCamera(e) {
    return new n(this.frustumSize * e / -2, this.frustumSize * e / 2, this.frustumSize / 2, this.frustumSize / -2, 1, 1e3);
  }
  createFlat2DCamera(e) {
    return new n(this.frustumSize * e / -2, this.frustumSize * e / 2, this.frustumSize / 2, this.frustumSize / -2, 1, 1e3);
  }
  createFixed2DCamera(e) {
    return this.createFlat2DCamera(e);
  }
  // Movement methods
  moveCamera(e) {
    (this._perspective === s.Flat2D || this._perspective === s.Fixed2D) && (this.frustumSize = e.z), this.cameraRig.position.set(e.x, e.y, e.z);
  }
  move(e) {
    this.moveCamera(e);
  }
  rotate(e, t, r) {
    this.cameraRig.rotateX(e), this.cameraRig.rotateY(t), this.cameraRig.rotateZ(r);
  }
  /**
   * Get the DOM element for the renderer
   */
  getDomElement() {
    return this.renderer.domElement;
  }
  applyDebugState(e) {
    this.debugStateSnapshot = {
      enabled: e.enabled,
      selected: [...e.selected]
    }, e.enabled ? (this.enableOrbitControls(), this.updateOrbitTargetFromSelection(e.selected)) : (this.orbitTarget = null, this.disableOrbitControls());
  }
  enableOrbitControls() {
    this.orbitControls || (this.orbitControls = new l(this.camera, this.renderer.domElement), this.orbitControls.enableDamping = !0, this.orbitControls.dampingFactor = 0.05, this.orbitControls.screenSpacePanning = !1, this.orbitControls.minDistance = 1, this.orbitControls.maxDistance = 500, this.orbitControls.maxPolarAngle = Math.PI / 2);
  }
  disableOrbitControls() {
    this.orbitControls && (this.orbitControls.dispose(), this.orbitControls = null);
  }
  updateOrbitTargetFromSelection(e) {
    if (!this.debugDelegate || e.length === 0) {
      this.orbitTarget = null;
      return;
    }
    for (let t = e.length - 1; t >= 0; t -= 1) {
      const r = e[t], i = this.debugDelegate.resolveTarget(r);
      if (i) {
        this.orbitTarget = i, this.orbitControls && (i.getWorldPosition(this.orbitTargetWorldPos), this.orbitControls.target.copy(this.orbitTargetWorldPos));
        return;
      }
    }
    this.orbitTarget = null;
  }
  detachDebugDelegate() {
    if (this.debugUnsubscribe)
      try {
        this.debugUnsubscribe();
      } catch {
      }
    this.debugUnsubscribe = null, this.debugDelegate = null;
  }
}
export {
  F as ZylemCamera
};
