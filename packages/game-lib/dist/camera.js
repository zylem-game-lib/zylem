// src/lib/camera/camera.ts
import { Vector2 as Vector23, Vector3 as Vector33 } from "three";

// src/lib/camera/zylem-camera.ts
import { PerspectiveCamera, Vector3 as Vector32, Object3D, OrthographicCamera, WebGLRenderer as WebGLRenderer3 } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

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

// src/lib/camera/zylem-camera.ts
var ZylemCamera = class {
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
  debugStateSnapshot = { enabled: false, selected: [] };
  orbitTarget = null;
  orbitTargetWorldPos = new Vector32();
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
    this.cameraRig = new Object3D();
    this.cameraRig.position.set(0, 3, 10);
    this.cameraRig.add(this.camera);
    this.camera.lookAt(new Vector32(0, 2, 0));
    this.initializePerspectiveController();
  }
  /**
   * Setup the camera with a scene
   */
  async setup(scene) {
    this.sceneRef = scene;
    if (this.orbitControls === null) {
      this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
      this.orbitControls.enableDamping = true;
      this.orbitControls.dampingFactor = 0.05;
      this.orbitControls.screenSpacePanning = false;
      this.orbitControls.minDistance = 1;
      this.orbitControls.maxDistance = 500;
      this.orbitControls.maxPolarAngle = Math.PI / 2;
    }
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
    if (this.orbitControls && this.orbitTarget) {
      this.orbitTarget.getWorldPosition(this.orbitTargetWorldPos);
      this.orbitControls.target.copy(this.orbitTargetWorldPos);
    }
    this.orbitControls?.update();
    if (this.perspectiveController) {
      this.perspectiveController.update(delta);
    }
    this.composer.render(delta);
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
      this.composer?.passes?.forEach((p) => p.dispose?.());
      this.composer?.dispose?.();
    } catch {
    }
    try {
      this.renderer.dispose();
    } catch {
    }
    this.detachDebugDelegate();
    this.sceneRef = null;
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
    this.cameraRig.position.set(position.x, position.y, position.z);
  }
  move(position) {
    this.moveCamera(position);
  }
  rotate(pitch, yaw, roll) {
    this.cameraRig.rotateX(pitch);
    this.cameraRig.rotateY(yaw);
    this.cameraRig.rotateZ(roll);
  }
  /**
   * Get the DOM element for the renderer
   */
  getDomElement() {
    return this.renderer.domElement;
  }
  applyDebugState(state) {
    this.debugStateSnapshot = {
      enabled: state.enabled,
      selected: [...state.selected]
    };
    if (state.enabled) {
      this.enableOrbitControls();
      this.updateOrbitTargetFromSelection(state.selected);
    } else {
      this.orbitTarget = null;
      this.disableOrbitControls();
    }
  }
  enableOrbitControls() {
    if (this.orbitControls) {
      return;
    }
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.screenSpacePanning = false;
    this.orbitControls.minDistance = 1;
    this.orbitControls.maxDistance = 500;
    this.orbitControls.maxPolarAngle = Math.PI / 2;
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
  zylemCamera.move(options.position || new Vector33(0, 0, 0));
  zylemCamera.camera.lookAt(options.target || new Vector33(0, 0, 0));
  return new CameraWrapper(zylemCamera);
}
export {
  Perspectives,
  camera
};
//# sourceMappingURL=camera.js.map