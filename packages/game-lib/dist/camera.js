// src/lib/camera/camera.ts
import { Vector2 as Vector23, Vector3 as Vector34 } from "three";

// src/lib/camera/zylem-camera.ts
import { PerspectiveCamera, Vector3 as Vector33, Object3D as Object3D2, OrthographicCamera, WebGLRenderer as WebGLRenderer3 } from "three";

// src/lib/camera/perspective.ts
var Perspectives = {
  FirstPerson: "first-person",
  ThirdPerson: "third-person",
  Isometric: "isometric",
  Flat2D: "flat-2d",
  Fixed2D: "fixed-2d"
};

// src/lib/camera/third-person.ts
import { Vector3 } from "three";
var ThirdPersonCamera = class {
  distance;
  screenResolution = null;
  renderer = null;
  scene = null;
  cameraRef = null;
  constructor() {
    this.distance = new Vector3(0, 5, 8);
  }
  /**
   * Setup the third person camera controller
   */
  setup(params) {
    const { screenResolution, renderer, scene, camera: camera2 } = params;
    this.screenResolution = screenResolution;
    this.renderer = renderer;
    this.scene = scene;
    this.cameraRef = camera2;
  }
  /**
   * Update the third person camera
   */
  update(delta) {
    if (!this.cameraRef.target) {
      return;
    }
    const desiredCameraPosition = this.cameraRef.target.group.position.clone().add(this.distance);
    this.cameraRef.camera.position.lerp(desiredCameraPosition, 0.1);
    this.cameraRef.camera.lookAt(this.cameraRef.target.group.position);
  }
  /**
   * Handle resize events
   */
  resize(width, height) {
    if (this.screenResolution) {
      this.screenResolution.set(width, height);
    }
  }
  /**
   * Set the distance from the target
   */
  setDistance(distance) {
    this.distance = distance;
  }
};

// src/lib/camera/fixed-2d.ts
var Fixed2DCamera = class {
  screenResolution = null;
  renderer = null;
  scene = null;
  cameraRef = null;
  constructor() {
  }
  /**
   * Setup the fixed 2D camera controller
   */
  setup(params) {
    const { screenResolution, renderer, scene, camera: camera2 } = params;
    this.screenResolution = screenResolution;
    this.renderer = renderer;
    this.scene = scene;
    this.cameraRef = camera2;
    this.cameraRef.camera.position.set(0, 0, 10);
    this.cameraRef.camera.lookAt(0, 0, 0);
  }
  /**
   * Update the fixed 2D camera
   * Fixed cameras don't need to update position/rotation automatically
   */
  update(delta) {
  }
  /**
   * Handle resize events for 2D camera
   */
  resize(width, height) {
    if (this.screenResolution) {
      this.screenResolution.set(width, height);
    }
  }
};

// src/lib/camera/zylem-camera.ts
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";

// src/lib/graphics/render-pass.ts
import * as THREE from "three";

// src/lib/graphics/shaders/fragment/standard.glsl
var standard_default = "uniform sampler2D tDiffuse;\nvarying vec2 vUv;\n\nvoid main() {\n	vec4 texel = texture2D( tDiffuse, vUv );\n\n	gl_FragColor = texel;\n}";

// src/lib/graphics/shaders/vertex/standard.glsl
var standard_default2 = "varying vec2 vUv;\n\nvoid main() {\n	vUv = uv;\n	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}";

// src/lib/graphics/render-pass.ts
import { WebGLRenderTarget } from "three";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";
var RenderPass = class extends Pass {
  fsQuad;
  resolution;
  scene;
  camera;
  rgbRenderTarget;
  normalRenderTarget;
  normalMaterial;
  constructor(resolution, scene, camera2) {
    super();
    this.resolution = resolution;
    this.fsQuad = new FullScreenQuad(this.material());
    this.scene = scene;
    this.camera = camera2;
    this.rgbRenderTarget = new WebGLRenderTarget(resolution.x * 4, resolution.y * 4);
    this.normalRenderTarget = new WebGLRenderTarget(resolution.x * 4, resolution.y * 4);
    this.normalMaterial = new THREE.MeshNormalMaterial();
  }
  render(renderer, writeBuffer) {
    renderer.setRenderTarget(this.rgbRenderTarget);
    renderer.render(this.scene, this.camera);
    const overrideMaterial_old = this.scene.overrideMaterial;
    renderer.setRenderTarget(this.normalRenderTarget);
    this.scene.overrideMaterial = this.normalMaterial;
    renderer.render(this.scene, this.camera);
    this.scene.overrideMaterial = overrideMaterial_old;
    const uniforms = this.fsQuad.material.uniforms;
    uniforms.tDiffuse.value = this.rgbRenderTarget.texture;
    uniforms.tDepth.value = this.rgbRenderTarget.depthTexture;
    uniforms.tNormal.value = this.normalRenderTarget.texture;
    uniforms.iTime.value += 0.01;
    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
    }
    this.fsQuad.render(renderer);
  }
  material() {
    return new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        tDiffuse: { value: null },
        tDepth: { value: null },
        tNormal: { value: null },
        resolution: {
          value: new THREE.Vector4(
            this.resolution.x,
            this.resolution.y,
            1 / this.resolution.x,
            1 / this.resolution.y
          )
        }
      },
      vertexShader: standard_default2,
      fragmentShader: standard_default
    });
  }
  dispose() {
    try {
      this.fsQuad?.dispose?.();
    } catch {
    }
    try {
      this.rgbRenderTarget?.dispose?.();
      this.normalRenderTarget?.dispose?.();
    } catch {
    }
    try {
      this.normalMaterial?.dispose?.();
    } catch {
    }
  }
};

// src/lib/camera/camera-debug-delegate.ts
import { Vector3 as Vector32 } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
var CameraOrbitController = class {
  camera;
  domElement;
  orbitControls = null;
  orbitTarget = null;
  orbitTargetWorldPos = new Vector32();
  debugDelegate = null;
  debugUnsubscribe = null;
  debugStateSnapshot = { enabled: false, selected: [] };
  // Saved camera state for restoration when exiting debug mode
  savedCameraPosition = null;
  savedCameraQuaternion = null;
  savedCameraZoom = null;
  // Saved debug camera state for restoration when re-entering debug mode
  savedDebugCameraPosition = null;
  savedDebugCameraQuaternion = null;
  savedDebugCameraZoom = null;
  savedDebugOrbitTarget = null;
  constructor(camera2, domElement) {
    this.camera = camera2;
    this.domElement = domElement;
  }
  /**
   * Check if debug mode is currently active (orbit controls enabled).
   */
  get isActive() {
    return this.debugStateSnapshot.enabled;
  }
  /**
   * Update orbit controls each frame.
   * Should be called from the camera's update loop.
   */
  update() {
    if (this.orbitControls && this.orbitTarget) {
      this.orbitTarget.getWorldPosition(this.orbitTargetWorldPos);
      this.orbitControls.target.copy(this.orbitTargetWorldPos);
    }
    this.orbitControls?.update();
  }
  /**
   * Attach a delegate to react to debug state changes.
   */
  setDebugDelegate(delegate) {
    if (this.debugDelegate === delegate) {
      return;
    }
    this.detachDebugDelegate();
    this.debugDelegate = delegate;
    if (!delegate) {
      this.applyDebugState({ enabled: false, selected: [] });
      return;
    }
    const unsubscribe = delegate.subscribe((state) => {
      this.applyDebugState(state);
    });
    this.debugUnsubscribe = () => {
      unsubscribe?.();
    };
  }
  /**
   * Clean up resources.
   */
  dispose() {
    this.disableOrbitControls();
    this.detachDebugDelegate();
  }
  /**
   * Get the current debug state snapshot.
   */
  get debugState() {
    return this.debugStateSnapshot;
  }
  applyDebugState(state) {
    const wasEnabled = this.debugStateSnapshot.enabled;
    this.debugStateSnapshot = {
      enabled: state.enabled,
      selected: [...state.selected]
    };
    if (state.enabled && !wasEnabled) {
      this.saveCameraState();
      this.enableOrbitControls();
      this.restoreDebugCameraState();
      this.updateOrbitTargetFromSelection(state.selected);
    } else if (!state.enabled && wasEnabled) {
      this.saveDebugCameraState();
      this.orbitTarget = null;
      this.disableOrbitControls();
      this.restoreCameraState();
    } else if (state.enabled) {
      this.updateOrbitTargetFromSelection(state.selected);
    }
  }
  enableOrbitControls() {
    if (this.orbitControls) {
      return;
    }
    this.orbitControls = new OrbitControls(this.camera, this.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.screenSpacePanning = false;
    this.orbitControls.minDistance = 1;
    this.orbitControls.maxDistance = 500;
    this.orbitControls.maxPolarAngle = Math.PI / 2;
    this.orbitControls.target.set(0, 0, 0);
  }
  disableOrbitControls() {
    if (!this.orbitControls) {
      return;
    }
    this.orbitControls.dispose();
    this.orbitControls = null;
  }
  updateOrbitTargetFromSelection(selected) {
    if (!this.debugDelegate || selected.length === 0) {
      this.orbitTarget = null;
      if (this.orbitControls) {
        this.orbitControls.target.set(0, 0, 0);
      }
      return;
    }
    for (let i = selected.length - 1; i >= 0; i -= 1) {
      const uuid = selected[i];
      const targetObject = this.debugDelegate.resolveTarget(uuid);
      if (targetObject) {
        this.orbitTarget = targetObject;
        if (this.orbitControls) {
          targetObject.getWorldPosition(this.orbitTargetWorldPos);
          this.orbitControls.target.copy(this.orbitTargetWorldPos);
        }
        return;
      }
    }
    this.orbitTarget = null;
  }
  detachDebugDelegate() {
    if (this.debugUnsubscribe) {
      try {
        this.debugUnsubscribe();
      } catch {
      }
    }
    this.debugUnsubscribe = null;
    this.debugDelegate = null;
  }
  /**
   * Save camera position, rotation, and zoom before entering debug mode.
   */
  saveCameraState() {
    this.savedCameraPosition = this.camera.position.clone();
    this.savedCameraQuaternion = this.camera.quaternion.clone();
    if ("zoom" in this.camera) {
      this.savedCameraZoom = this.camera.zoom;
    }
  }
  /**
   * Restore camera position, rotation, and zoom when exiting debug mode.
   */
  restoreCameraState() {
    if (this.savedCameraPosition) {
      this.camera.position.copy(this.savedCameraPosition);
      this.savedCameraPosition = null;
    }
    if (this.savedCameraQuaternion) {
      this.camera.quaternion.copy(this.savedCameraQuaternion);
      this.savedCameraQuaternion = null;
    }
    if (this.savedCameraZoom !== null && "zoom" in this.camera) {
      this.camera.zoom = this.savedCameraZoom;
      this.camera.updateProjectionMatrix?.();
      this.savedCameraZoom = null;
    }
  }
  /**
   * Save debug camera state when exiting debug mode.
   */
  saveDebugCameraState() {
    this.savedDebugCameraPosition = this.camera.position.clone();
    this.savedDebugCameraQuaternion = this.camera.quaternion.clone();
    if ("zoom" in this.camera) {
      this.savedDebugCameraZoom = this.camera.zoom;
    }
    if (this.orbitControls) {
      this.savedDebugOrbitTarget = this.orbitControls.target.clone();
    }
  }
  /**
   * Restore debug camera state when re-entering debug mode.
   */
  restoreDebugCameraState() {
    if (this.savedDebugCameraPosition) {
      this.camera.position.copy(this.savedDebugCameraPosition);
    }
    if (this.savedDebugCameraQuaternion) {
      this.camera.quaternion.copy(this.savedDebugCameraQuaternion);
    }
    if (this.savedDebugCameraZoom !== null && "zoom" in this.camera) {
      this.camera.zoom = this.savedDebugCameraZoom;
      this.camera.updateProjectionMatrix?.();
    }
    if (this.savedDebugOrbitTarget && this.orbitControls) {
      this.orbitControls.target.copy(this.savedDebugOrbitTarget);
    }
  }
};

// src/lib/camera/zylem-camera.ts
var ZylemCamera = class {
  cameraRig = null;
  camera;
  screenResolution;
  renderer;
  composer;
  _perspective;
  target = null;
  sceneRef = null;
  frustumSize = 10;
  // Perspective controller delegation
  perspectiveController = null;
  // Debug/orbit controls delegation
  orbitController = null;
  constructor(perspective, screenResolution, frustumSize = 10) {
    this._perspective = perspective;
    this.screenResolution = screenResolution;
    this.frustumSize = frustumSize;
    this.renderer = new WebGLRenderer3({ antialias: false, alpha: true });
    this.renderer.setSize(screenResolution.x, screenResolution.y);
    this.renderer.shadowMap.enabled = true;
    this.composer = new EffectComposer(this.renderer);
    const aspectRatio = screenResolution.x / screenResolution.y;
    this.camera = this.createCameraForPerspective(aspectRatio);
    if (this.needsRig()) {
      this.cameraRig = new Object3D2();
      this.cameraRig.position.set(0, 3, 10);
      this.cameraRig.add(this.camera);
      this.camera.lookAt(new Vector33(0, 2, 0));
    } else {
      this.camera.position.set(0, 0, 10);
      this.camera.lookAt(new Vector33(0, 0, 0));
    }
    this.initializePerspectiveController();
    this.orbitController = new CameraOrbitController(this.camera, this.renderer.domElement);
  }
  /**
   * Setup the camera with a scene
   */
  async setup(scene) {
    this.sceneRef = scene;
    let renderResolution = this.screenResolution.clone().divideScalar(2);
    renderResolution.x |= 0;
    renderResolution.y |= 0;
    const pass = new RenderPass(renderResolution, scene, this.camera);
    this.composer.addPass(pass);
    if (this.perspectiveController) {
      this.perspectiveController.setup({
        screenResolution: this.screenResolution,
        renderer: this.renderer,
        scene,
        camera: this
      });
    }
    this.renderer.setAnimationLoop((delta) => {
      this.update(delta || 0);
    });
  }
  /**
   * Update camera and render
   */
  update(delta) {
    this.orbitController?.update();
    if (this.perspectiveController && !this.isDebugModeActive()) {
      this.perspectiveController.update(delta);
    }
    this.composer.render(delta);
  }
  /**
   * Check if debug mode is active (orbit controls taking over camera)
   */
  isDebugModeActive() {
    return this.orbitController?.isActive ?? false;
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
      this.orbitController?.dispose();
    } catch {
    }
    try {
      this.composer?.passes?.forEach((p) => p.dispose?.());
      this.composer?.dispose?.();
    } catch {
    }
    try {
      this.renderer.dispose();
    } catch {
    }
    this.sceneRef = null;
  }
  /**
   * Attach a delegate to react to debug state changes.
   */
  setDebugDelegate(delegate) {
    this.orbitController?.setDebugDelegate(delegate);
  }
  /**
   * Resize camera and renderer
   */
  resize(width, height) {
    this.screenResolution.set(width, height);
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    if (this.perspectiveController) {
      this.perspectiveController.resize(width, height);
    }
  }
  /**
   * Update renderer pixel ratio (DPR)
   */
  setPixelRatio(dpr) {
    const safe = Math.max(1, Number.isFinite(dpr) ? dpr : 1);
    this.renderer.setPixelRatio(safe);
  }
  /**
   * Create camera based on perspective type
   */
  createCameraForPerspective(aspectRatio) {
    switch (this._perspective) {
      case Perspectives.ThirdPerson:
        return this.createThirdPersonCamera(aspectRatio);
      case Perspectives.FirstPerson:
        return this.createFirstPersonCamera(aspectRatio);
      case Perspectives.Isometric:
        return this.createIsometricCamera(aspectRatio);
      case Perspectives.Flat2D:
        return this.createFlat2DCamera(aspectRatio);
      case Perspectives.Fixed2D:
        return this.createFixed2DCamera(aspectRatio);
      default:
        return this.createThirdPersonCamera(aspectRatio);
    }
  }
  /**
   * Initialize perspective-specific controller
   */
  initializePerspectiveController() {
    switch (this._perspective) {
      case Perspectives.ThirdPerson:
        this.perspectiveController = new ThirdPersonCamera();
        break;
      case Perspectives.Fixed2D:
        this.perspectiveController = new Fixed2DCamera();
        break;
      default:
        this.perspectiveController = new ThirdPersonCamera();
    }
  }
  createThirdPersonCamera(aspectRatio) {
    return new PerspectiveCamera(75, aspectRatio, 0.1, 1e3);
  }
  createFirstPersonCamera(aspectRatio) {
    return new PerspectiveCamera(75, aspectRatio, 0.1, 1e3);
  }
  createIsometricCamera(aspectRatio) {
    return new OrthographicCamera(
      this.frustumSize * aspectRatio / -2,
      this.frustumSize * aspectRatio / 2,
      this.frustumSize / 2,
      this.frustumSize / -2,
      1,
      1e3
    );
  }
  createFlat2DCamera(aspectRatio) {
    return new OrthographicCamera(
      this.frustumSize * aspectRatio / -2,
      this.frustumSize * aspectRatio / 2,
      this.frustumSize / 2,
      this.frustumSize / -2,
      1,
      1e3
    );
  }
  createFixed2DCamera(aspectRatio) {
    return this.createFlat2DCamera(aspectRatio);
  }
  // Movement methods
  moveCamera(position) {
    if (this._perspective === Perspectives.Flat2D || this._perspective === Perspectives.Fixed2D) {
      this.frustumSize = position.z;
    }
    if (this.cameraRig) {
      this.cameraRig.position.set(position.x, position.y, position.z);
    } else {
      this.camera.position.set(position.x, position.y, position.z);
    }
  }
  move(position) {
    this.moveCamera(position);
  }
  rotate(pitch, yaw, roll) {
    if (this.cameraRig) {
      this.cameraRig.rotateX(pitch);
      this.cameraRig.rotateY(yaw);
      this.cameraRig.rotateZ(roll);
    } else {
      this.camera.rotateX(pitch);
      this.camera.rotateY(yaw);
      this.camera.rotateZ(roll);
    }
  }
  /**
   * Check if this perspective type needs a camera rig
   */
  needsRig() {
    return this._perspective === Perspectives.ThirdPerson;
  }
  /**
   * Get the DOM element for the renderer
   */
  getDomElement() {
    return this.renderer.domElement;
  }
};

// src/lib/camera/camera.ts
var CameraWrapper = class {
  cameraRef;
  constructor(camera2) {
    this.cameraRef = camera2;
  }
};
function camera(options) {
  const screenResolution = options.screenResolution || new Vector23(window.innerWidth, window.innerHeight);
  let frustumSize = 10;
  if (options.perspective === "fixed-2d") {
    frustumSize = options.zoom || 10;
  }
  const zylemCamera = new ZylemCamera(options.perspective || "third-person", screenResolution, frustumSize);
  zylemCamera.move(options.position || new Vector34(0, 0, 0));
  zylemCamera.camera.lookAt(options.target || new Vector34(0, 0, 0));
  return new CameraWrapper(zylemCamera);
}
export {
  Perspectives,
  camera
};
//# sourceMappingURL=camera.js.map