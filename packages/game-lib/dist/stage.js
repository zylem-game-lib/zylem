// src/lib/stage/zylem-stage.ts
import { addComponent, addEntity, createWorld as createECS, removeEntity } from "bitecs";
import { Color as Color6, Vector3 as Vector310, Vector2 as Vector25 } from "three";

// src/lib/collision/world.ts
import RAPIER from "@dimforge/rapier3d-compat";

// src/lib/game/game-state.ts
import { proxy, subscribe } from "valtio/vanilla";
var state = proxy({
  id: "",
  globals: {},
  time: 0
});
function getGlobals() {
  return state.globals;
}

// src/lib/entities/actor.ts
import { ActiveCollisionTypes, ColliderDesc } from "@dimforge/rapier3d-compat";
import { SkinnedMesh, Group as Group2, Vector3 } from "three";

// src/lib/entities/entity.ts
import { ShaderMaterial } from "three";

// src/lib/systems/transformable.system.ts
import {
  defineSystem,
  defineQuery,
  defineComponent,
  Types
} from "bitecs";
import { Quaternion } from "three";
var position = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32
});
var rotation = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
  w: Types.f32
});
var scale = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32
});
function createTransformSystem(stage) {
  const transformQuery = defineQuery([position, rotation]);
  const stageEntities = stage._childrenMap;
  return defineSystem((world) => {
    const entities = transformQuery(world);
    if (stageEntities === void 0) {
      return world;
    }
    ;
    for (const [key, value] of stageEntities) {
      const id = entities[key];
      const stageEntity = value;
      if (stageEntity === void 0 || !stageEntity?.body || stageEntity.markedForRemoval) {
        continue;
      }
      const { x, y, z } = stageEntity.body.translation();
      position.x[id] = x;
      position.y[id] = y;
      position.z[id] = z;
      if (stageEntity.group) {
        stageEntity.group.position.set(position.x[id], position.y[id], position.z[id]);
      } else if (stageEntity.mesh) {
        stageEntity.mesh.position.set(position.x[id], position.y[id], position.z[id]);
      }
      if (stageEntity.controlledRotation) {
        continue;
      }
      const { x: rx, y: ry, z: rz, w: rw } = stageEntity.body.rotation();
      rotation.x[id] = rx;
      rotation.y[id] = ry;
      rotation.z[id] = rz;
      rotation.w[id] = rw;
      const newRotation = new Quaternion(
        rotation.x[id],
        rotation.y[id],
        rotation.z[id],
        rotation.w[id]
      );
      if (stageEntity.group) {
        stageEntity.group.setRotationFromQuaternion(newRotation);
      } else if (stageEntity.mesh) {
        stageEntity.mesh.setRotationFromQuaternion(newRotation);
      }
    }
    return world;
  });
}

// src/lib/core/flags.ts
var DEBUG_FLAG = import.meta.env.VITE_DEBUG_FLAG === "true";

// src/lib/core/base-node.ts
import { nanoid } from "nanoid";
var BaseNode = class _BaseNode {
  parent = null;
  children = [];
  options;
  eid = 0;
  uuid = "";
  name = "";
  markedForRemoval = false;
  setup = () => {
  };
  loaded = () => {
  };
  update = () => {
  };
  destroy = () => {
  };
  cleanup = () => {
  };
  constructor(args = []) {
    const options = args.filter((arg) => !(arg instanceof _BaseNode)).reduce((acc, opt) => ({ ...acc, ...opt }), {});
    this.options = options;
    this.uuid = nanoid();
  }
  setParent(parent) {
    this.parent = parent;
  }
  getParent() {
    return this.parent;
  }
  add(baseNode) {
    this.children.push(baseNode);
    baseNode.setParent(this);
  }
  remove(baseNode) {
    const index = this.children.indexOf(baseNode);
    if (index !== -1) {
      this.children.splice(index, 1);
      baseNode.setParent(null);
    }
  }
  getChildren() {
    return this.children;
  }
  isComposite() {
    return this.children.length > 0;
  }
  nodeSetup(params) {
    if (DEBUG_FLAG) {
    }
    this.markedForRemoval = false;
    if (typeof this._setup === "function") {
      this._setup(params);
    }
    if (this.setup) {
      this.setup(params);
    }
    this.children.forEach((child) => child.nodeSetup(params));
  }
  nodeUpdate(params) {
    if (this.markedForRemoval) {
      return;
    }
    if (typeof this._update === "function") {
      this._update(params);
    }
    if (this.update) {
      this.update(params);
    }
    this.children.forEach((child) => child.nodeUpdate(params));
  }
  nodeDestroy(params) {
    this.children.forEach((child) => child.nodeDestroy(params));
    if (this.destroy) {
      this.destroy(params);
    }
    if (typeof this._destroy === "function") {
      this._destroy(params);
    }
    this.markedForRemoval = true;
  }
  getOptions() {
    return this.options;
  }
  setOptions(options) {
    this.options = { ...this.options, ...options };
  }
};

// src/lib/entities/entity.ts
var GameEntity = class extends BaseNode {
  behaviors = [];
  group;
  mesh;
  materials;
  bodyDesc = null;
  body = null;
  colliderDesc;
  collider;
  custom = {};
  debugInfo = {};
  debugMaterial;
  lifeCycleDelegate = {
    setup: [],
    update: [],
    destroy: []
  };
  collisionDelegate = {
    collision: []
  };
  collisionType;
  behaviorCallbackMap = {
    setup: [],
    update: [],
    destroy: [],
    collision: []
  };
  constructor() {
    super();
  }
  create() {
    const { position: setupPosition } = this.options;
    const { x, y, z } = setupPosition || { x: 0, y: 0, z: 0 };
    this.behaviors = [
      { component: position, values: { x, y, z } },
      { component: scale, values: { x: 0, y: 0, z: 0 } },
      { component: rotation, values: { x: 0, y: 0, z: 0, w: 0 } }
    ];
    this.name = this.options.name || "";
    return this;
  }
  onSetup(...callbacks) {
    const combineCallbacks = [...this.lifeCycleDelegate.setup ?? [], ...callbacks];
    this.lifeCycleDelegate = {
      ...this.lifeCycleDelegate,
      setup: combineCallbacks
    };
    return this;
  }
  onUpdate(...callbacks) {
    const combineCallbacks = [...this.lifeCycleDelegate.update ?? [], ...callbacks];
    this.lifeCycleDelegate = {
      ...this.lifeCycleDelegate,
      update: combineCallbacks
    };
    return this;
  }
  onDestroy(...callbacks) {
    this.lifeCycleDelegate = {
      ...this.lifeCycleDelegate,
      destroy: callbacks.length > 0 ? callbacks : void 0
    };
    return this;
  }
  onCollision(...callbacks) {
    this.collisionDelegate = {
      collision: callbacks.length > 0 ? callbacks : void 0
    };
    return this;
  }
  _setup(params) {
    this.behaviorCallbackMap.setup.forEach((callback) => {
      callback({ ...params, me: this });
    });
    if (this.lifeCycleDelegate.setup?.length) {
      const callbacks = this.lifeCycleDelegate.setup;
      callbacks.forEach((callback) => {
        callback({ ...params, me: this });
      });
    }
  }
  async _loaded(_params) {
  }
  _update(params) {
    this.updateMaterials(params);
    if (this.lifeCycleDelegate.update?.length) {
      const callbacks = this.lifeCycleDelegate.update;
      callbacks.forEach((callback) => {
        callback({ ...params, me: this });
      });
    }
    this.behaviorCallbackMap.update.forEach((callback) => {
      callback({ ...params, me: this });
    });
  }
  _destroy(params) {
    if (this.lifeCycleDelegate.destroy?.length) {
      const callbacks = this.lifeCycleDelegate.destroy;
      callbacks.forEach((callback) => {
        callback({ ...params, me: this });
      });
    }
    this.behaviorCallbackMap.destroy.forEach((callback) => {
      callback({ ...params, me: this });
    });
  }
  async _cleanup(_params) {
  }
  _collision(other, globals) {
    if (this.collisionDelegate.collision?.length) {
      const callbacks = this.collisionDelegate.collision;
      callbacks.forEach((callback) => {
        callback({ entity: this, other, globals });
      });
    }
    this.behaviorCallbackMap.collision.forEach((callback) => {
      callback({ entity: this, other, globals });
    });
  }
  addBehavior(behaviorCallback) {
    const handler = behaviorCallback.handler;
    if (handler) {
      this.behaviorCallbackMap[behaviorCallback.type].push(handler);
    }
    return this;
  }
  addBehaviors(behaviorCallbacks) {
    behaviorCallbacks.forEach((callback) => {
      const handler = callback.handler;
      if (handler) {
        this.behaviorCallbackMap[callback.type].push(handler);
      }
    });
    return this;
  }
  updateMaterials(params) {
    if (!this.materials?.length) {
      return;
    }
    for (const material of this.materials) {
      if (material instanceof ShaderMaterial) {
        if (material.uniforms) {
          material.uniforms.iTime && (material.uniforms.iTime.value += params.delta);
        }
      }
    }
  }
  buildInfo() {
    const info = {};
    info.name = this.name;
    info.uuid = this.uuid;
    info.eid = this.eid.toString();
    return info;
  }
};

// src/lib/core/entity-asset-loader.ts
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
var FBXAssetLoader = class {
  loader = new FBXLoader();
  isSupported(file) {
    return file.toLowerCase().endsWith("fbx" /* FBX */);
  }
  async load(file) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        file,
        (object) => {
          const animation = object.animations[0];
          resolve({
            object,
            animation
          });
        },
        void 0,
        reject
      );
    });
  }
};
var GLTFAssetLoader = class {
  loader = new GLTFLoader();
  isSupported(file) {
    return file.toLowerCase().endsWith("gltf" /* GLTF */);
  }
  async load(file) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        file,
        (gltf) => {
          resolve({
            object: gltf.scene,
            gltf
          });
        },
        void 0,
        reject
      );
    });
  }
};
var EntityAssetLoader = class {
  loaders = [
    new FBXAssetLoader(),
    new GLTFAssetLoader()
  ];
  async loadFile(file) {
    const loader = this.loaders.find((l) => l.isSupported(file));
    if (!loader) {
      throw new Error(`Unsupported file type: ${file}`);
    }
    return loader.load(file);
  }
};

// src/lib/entities/delegates/animation.ts
import {
  AnimationMixer,
  LoopOnce,
  LoopRepeat
} from "three";
var AnimationDelegate = class {
  constructor(target) {
    this.target = target;
  }
  _mixer = null;
  _actions = {};
  _animations = [];
  _currentAction = null;
  _pauseAtPercentage = 0;
  _isPaused = false;
  _queuedKey = null;
  _fadeDuration = 0.5;
  _currentKey = "";
  _assetLoader = new EntityAssetLoader();
  async loadAnimations(animations) {
    if (!animations.length) return;
    const results = await Promise.all(animations.map((a) => this._assetLoader.loadFile(a.path)));
    this._animations = results.filter((r) => !!r.animation).map((r) => r.animation);
    if (!this._animations.length) return;
    this._mixer = new AnimationMixer(this.target);
    this._animations.forEach((clip, i) => {
      const key = animations[i].key || i.toString();
      this._actions[key] = this._mixer.clipAction(clip);
    });
    this.playAnimation({ key: Object.keys(this._actions)[0] });
  }
  update(delta) {
    if (!this._mixer || !this._currentAction) return;
    this._mixer.update(delta);
    const pauseAtTime = this._currentAction.getClip().duration * (this._pauseAtPercentage / 100);
    if (!this._isPaused && this._pauseAtPercentage > 0 && this._currentAction.time >= pauseAtTime) {
      this._currentAction.time = pauseAtTime;
      this._currentAction.paused = true;
      this._isPaused = true;
      if (this._queuedKey !== null) {
        const next = this._actions[this._queuedKey];
        next.reset().play();
        this._currentAction.crossFadeTo(next, this._fadeDuration, false);
        this._currentAction = next;
        this._currentKey = this._queuedKey;
        this._queuedKey = null;
      }
    }
  }
  playAnimation(opts) {
    if (!this._mixer) return;
    const { key, pauseAtPercentage = 0, pauseAtEnd = false, fadeToKey, fadeDuration = 0.5 } = opts;
    if (key === this._currentKey) return;
    this._queuedKey = fadeToKey || null;
    this._fadeDuration = fadeDuration;
    this._pauseAtPercentage = pauseAtEnd ? 100 : pauseAtPercentage;
    this._isPaused = false;
    const prev = this._currentAction;
    if (prev) prev.stop();
    const action = this._actions[key];
    if (!action) return;
    if (this._pauseAtPercentage > 0) {
      action.setLoop(LoopOnce, Infinity);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(LoopRepeat, Infinity);
      action.clampWhenFinished = false;
    }
    if (prev) {
      prev.crossFadeTo(action, fadeDuration, false);
    }
    action.reset().play();
    this._currentAction = action;
    this._currentKey = key;
  }
  get currentAnimationKey() {
    return this._currentKey;
  }
  get animations() {
    return this._animations;
  }
};

// src/lib/graphics/shaders/fragment/standard.glsl
var standard_default = "uniform sampler2D tDiffuse;\nvarying vec2 vUv;\n\nvoid main() {\n	vec4 texel = texture2D( tDiffuse, vUv );\n\n	gl_FragColor = texel;\n}";

// src/lib/entities/actor.ts
var actorDefaults = {
  position: { x: 0, y: 0, z: 0 },
  collision: {
    static: false,
    size: new Vector3(0.5, 0.5, 0.5),
    position: new Vector3(0, 0, 0)
  },
  material: {
    shader: "standard"
  },
  animations: [],
  models: []
};
var ACTOR_TYPE = Symbol("Actor");
var ZylemActor = class extends GameEntity {
  static type = ACTOR_TYPE;
  _object = null;
  _animationDelegate = null;
  _modelFileNames = [];
  _assetLoader = new EntityAssetLoader();
  controlledRotation = false;
  constructor(options) {
    super();
    this.options = { ...actorDefaults, ...options };
    this.lifeCycleDelegate = {
      update: [this.actorUpdate.bind(this)]
    };
    this.controlledRotation = true;
  }
  async load() {
    this._modelFileNames = this.options.models || [];
    await this.loadModels();
    if (this._object) {
      this._animationDelegate = new AnimationDelegate(this._object);
      await this._animationDelegate.loadAnimations(this.options.animations || []);
    }
  }
  async data() {
    return {
      animations: this._animationDelegate?.animations,
      objectModel: this._object
    };
  }
  async actorUpdate(params) {
    this._animationDelegate?.update(params.delta);
  }
  async loadModels() {
    if (this._modelFileNames.length === 0) return;
    const promises = this._modelFileNames.map((file) => this._assetLoader.loadFile(file));
    const results = await Promise.all(promises);
    if (results[0]?.object) {
      this._object = results[0].object;
    }
    if (this._object) {
      this.group = new Group2();
      this.group.attach(this._object);
      this.group.scale.set(
        this.options.scale?.x || 1,
        this.options.scale?.y || 1,
        this.options.scale?.z || 1
      );
    }
  }
  playAnimation(animationOptions) {
    this._animationDelegate?.playAnimation(animationOptions);
  }
  get object() {
    return this._object;
  }
  /**
   * Provide custom debug information for the actor
   * This will be merged with the default debug information
   */
  getDebugInfo() {
    const debugInfo = {
      type: "Actor",
      models: this._modelFileNames.length > 0 ? this._modelFileNames : "none",
      modelLoaded: !!this._object,
      scale: this.options.scale ? `${this.options.scale.x}, ${this.options.scale.y}, ${this.options.scale.z}` : "1, 1, 1"
    };
    if (this._animationDelegate) {
      debugInfo.currentAnimation = this._animationDelegate.currentAnimationKey || "none";
      debugInfo.animationsCount = this.options.animations?.length || 0;
    }
    if (this._object) {
      let meshCount = 0;
      let vertexCount = 0;
      this._object.traverse((child) => {
        if (child.isMesh) {
          meshCount++;
          const geometry = child.geometry;
          if (geometry && geometry.attributes.position) {
            vertexCount += geometry.attributes.position.count;
          }
        }
      });
      debugInfo.meshCount = meshCount;
      debugInfo.vertexCount = vertexCount;
    }
    return debugInfo;
  }
};

// src/lib/collision/collision-delegate.ts
function isCollisionHandlerDelegate(obj) {
  return typeof obj?.handlePostCollision === "function" && typeof obj?.handleIntersectionEvent === "function";
}

// src/lib/collision/world.ts
var ZylemWorld = class {
  type = "World";
  world;
  collisionMap = /* @__PURE__ */ new Map();
  collisionBehaviorMap = /* @__PURE__ */ new Map();
  _removalMap = /* @__PURE__ */ new Map();
  static async loadPhysics(gravity) {
    await RAPIER.init();
    const physicsWorld = new RAPIER.World(gravity);
    return physicsWorld;
  }
  constructor(world) {
    this.world = world;
  }
  addEntity(entity) {
    const rigidBody = this.world.createRigidBody(entity.bodyDesc);
    entity.body = rigidBody;
    entity.body.userData = { uuid: entity.uuid, ref: entity };
    if (this.world.gravity.x === 0 && this.world.gravity.y === 0 && this.world.gravity.z === 0) {
      entity.body.lockTranslations(true, true);
      entity.body.lockRotations(true, true);
    }
    const collider = this.world.createCollider(entity.colliderDesc, entity.body);
    entity.collider = collider;
    if (entity.controlledRotation || entity instanceof ZylemActor) {
      entity.body.lockRotations(true, true);
      entity.characterController = this.world.createCharacterController(0.01);
      entity.characterController.setMaxSlopeClimbAngle(45 * Math.PI / 180);
      entity.characterController.setMinSlopeSlideAngle(30 * Math.PI / 180);
      entity.characterController.enableSnapToGround(0.01);
      entity.characterController.setSlideEnabled(true);
      entity.characterController.setApplyImpulsesToDynamicBodies(true);
      entity.characterController.setCharacterMass(1);
    }
    this.collisionMap.set(entity.uuid, entity);
  }
  setForRemoval(entity) {
    if (entity.body) {
      this._removalMap.set(entity.uuid, entity);
    }
  }
  destroyEntity(entity) {
    if (entity.collider) {
      this.world.removeCollider(entity.collider, true);
    }
    if (entity.body) {
      this.world.removeRigidBody(entity.body);
      this.collisionMap.delete(entity.uuid);
      this._removalMap.delete(entity.uuid);
    }
  }
  setup() {
  }
  update(params) {
    const { delta } = params;
    if (!this.world) {
      return;
    }
    this.updateColliders(delta);
    this.updatePostCollisionBehaviors(delta);
    this.world.step();
  }
  updatePostCollisionBehaviors(delta) {
    const dictionaryRef = this.collisionBehaviorMap;
    for (let [id, collider] of dictionaryRef) {
      const gameEntity = collider;
      if (!isCollisionHandlerDelegate(gameEntity)) {
        return;
      }
      const active = gameEntity.handlePostCollision({ entity: gameEntity, delta });
      if (!active) {
        this.collisionBehaviorMap.delete(id);
      }
    }
  }
  updateColliders(delta) {
    const dictionaryRef = this.collisionMap;
    for (let [id, collider] of dictionaryRef) {
      const gameEntity = collider;
      if (!gameEntity.body) {
        continue;
      }
      if (this._removalMap.get(gameEntity.uuid)) {
        this.destroyEntity(gameEntity);
        continue;
      }
      this.world.contactsWith(gameEntity.body.collider(0), (otherCollider) => {
        const uuid = otherCollider._parent.userData.uuid;
        const entity = dictionaryRef.get(uuid);
        if (!entity) {
          return;
        }
        if (gameEntity._collision) {
          gameEntity._collision(entity, state.globals);
        }
      });
      this.world.intersectionsWith(gameEntity.body.collider(0), (otherCollider) => {
        const uuid = otherCollider._parent.userData.uuid;
        const entity = dictionaryRef.get(uuid);
        if (!entity) {
          return;
        }
        if (gameEntity._collision) {
          gameEntity._collision(entity, state.globals);
        }
        if (isCollisionHandlerDelegate(entity)) {
          entity.handleIntersectionEvent({ entity, other: gameEntity, delta });
          this.collisionBehaviorMap.set(uuid, entity);
        }
      });
    }
  }
  destroy() {
    try {
      for (const [, entity] of this.collisionMap) {
        try {
          this.destroyEntity(entity);
        } catch {
        }
      }
      this.collisionMap.clear();
      this.collisionBehaviorMap.clear();
      this._removalMap.clear();
      this.world = void 0;
    } catch {
    }
  }
};

// src/lib/graphics/zylem-scene.ts
import {
  Scene,
  Color as Color2,
  AmbientLight,
  DirectionalLight,
  Vector3 as Vector32,
  TextureLoader,
  GridHelper
} from "three";

// src/lib/debug/debug-state.ts
import { proxy as proxy2 } from "valtio";
var debugState = proxy2({
  enabled: false,
  paused: false,
  tool: "none",
  selectedEntity: null,
  hoveredEntity: null,
  flags: /* @__PURE__ */ new Set()
});
function getDebugTool() {
  return debugState.tool;
}
function setSelectedEntity(entity) {
  debugState.selectedEntity = entity;
}
function getHoveredEntity() {
  return debugState.hoveredEntity;
}
function setHoveredEntity(entity) {
  debugState.hoveredEntity = entity;
}
function resetHoveredEntity() {
  debugState.hoveredEntity = null;
}

// src/lib/graphics/zylem-scene.ts
var ZylemScene = class {
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
  constructor(id, camera, state2) {
    const scene = new Scene();
    const isColor = state2.backgroundColor instanceof Color2;
    const backgroundColor = isColor ? state2.backgroundColor : new Color2(state2.backgroundColor);
    scene.background = backgroundColor;
    if (state2.backgroundImage) {
      const loader = new TextureLoader();
      const texture = loader.load(state2.backgroundImage);
      scene.background = texture;
    }
    this.scene = scene;
    this.zylemCamera = camera;
    this.setupLighting(scene);
    this.setupCamera(scene, camera);
    if (debugState.enabled) {
      this.debugScene();
    }
  }
  setup() {
    if (this._setup) {
      this._setup({ me: this, camera: this.zylemCamera, globals: getGlobals() });
    }
  }
  destroy() {
    if (this.zylemCamera && this.zylemCamera.destroy) {
      this.zylemCamera.destroy();
    }
    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj.geometry) {
          obj.geometry.dispose?.();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose?.());
          } else {
            obj.material.dispose?.();
          }
        }
      });
    }
  }
  /**
   * Setup camera with the scene
   */
  setupCamera(scene, camera) {
    scene.add(camera.cameraRig);
    camera.setup(scene);
  }
  /**
   * Setup scene lighting
   */
  setupLighting(scene) {
    const ambientLight = new AmbientLight(16777215, 2);
    scene.add(ambientLight);
    const directionalLight = new DirectionalLight(16777215, 2);
    directionalLight.name = "Light";
    directionalLight.position.set(0, 100, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 2e3;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
  }
  /**
   * Update renderer size - delegates to camera
   */
  updateRenderer(width, height) {
    this.zylemCamera.resize(width, height);
  }
  /**
   * Add object to scene
   */
  add(object, position2 = new Vector32(0, 0, 0)) {
    object.position.set(position2.x, position2.y, position2.z);
    this.scene.add(object);
  }
  /**
   * Add game entity to scene
   */
  addEntity(entity) {
    if (entity.group) {
      this.add(entity.group, entity.options.position);
    } else if (entity.mesh) {
      this.add(entity.mesh, entity.options.position);
    }
  }
  /**
   * Add debug helpers to scene
   */
  debugScene() {
    const size = 1e3;
    const divisions = 100;
    const gridHelper = new GridHelper(size, divisions);
    this.scene.add(gridHelper);
  }
};

// src/lib/stage/stage-state.ts
import { Color as Color3, Vector3 as Vector33 } from "three";
import { proxy as proxy3, subscribe as subscribe2 } from "valtio/vanilla";
var stageState = proxy3({
  backgroundColor: new Color3(Color3.NAMES.cornflowerblue),
  backgroundImage: null,
  inputs: {
    p1: ["gamepad-1", "keyboard-1"],
    p2: ["gamepad-2", "keyboard-2"]
  },
  variables: {},
  gravity: new Vector33(0, 0, 0),
  entities: []
});
var setStageBackgroundColor = (value) => {
  stageState.backgroundColor = value;
};
var setStageBackgroundImage = (value) => {
  stageState.backgroundImage = value;
};
var setStageVariables = (variables) => {
  stageState.variables = { ...variables };
};
var resetStageVariables = () => {
  stageState.variables = {};
};
var variableProxyStore = /* @__PURE__ */ new Map();
function clearVariables(target) {
  variableProxyStore.delete(target);
}

// src/lib/core/utility/vector.ts
import { Color as Color4 } from "three";
import { Vector3 as Vector34 } from "@dimforge/rapier3d-compat";
var ZylemBlueColor = new Color4("#0333EC");
var Vec0 = new Vector34(0, 0, 0);
var Vec1 = new Vector34(1, 1, 1);

// src/lib/core/lifecycle-base.ts
var LifeCycleBase = class {
  update = () => {
  };
  setup = () => {
  };
  destroy = () => {
  };
  nodeSetup(context) {
    if (typeof this._setup === "function") {
      this._setup(context);
    }
    if (this.setup) {
      this.setup(context);
    }
  }
  nodeUpdate(context) {
    if (typeof this._update === "function") {
      this._update(context);
    }
    if (this.update) {
      this.update(context);
    }
  }
  nodeDestroy(context) {
    if (this.destroy) {
      this.destroy(context);
    }
    if (typeof this._destroy === "function") {
      this._destroy(context);
    }
  }
};

// src/lib/stage/zylem-stage.ts
import { nanoid as nanoid2 } from "nanoid";

// src/lib/camera/perspective.ts
var Perspectives = {
  FirstPerson: "first-person",
  ThirdPerson: "third-person",
  Isometric: "isometric",
  Flat2D: "flat-2d",
  Fixed2D: "fixed-2d"
};

// src/lib/camera/camera.ts
import { Vector2 as Vector23, Vector3 as Vector37 } from "three";

// src/lib/camera/zylem-camera.ts
import { PerspectiveCamera, Vector3 as Vector36, Object3D as Object3D4, OrthographicCamera, WebGLRenderer as WebGLRenderer3 } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// src/lib/camera/third-person.ts
import { Vector3 as Vector35 } from "three";
var ThirdPersonCamera = class {
  distance;
  screenResolution = null;
  renderer = null;
  scene = null;
  cameraRef = null;
  constructor() {
    this.distance = new Vector35(0, 5, 8);
  }
  /**
   * Setup the third person camera controller
   */
  setup(params) {
    const { screenResolution, renderer, scene, camera } = params;
    this.screenResolution = screenResolution;
    this.renderer = renderer;
    this.scene = scene;
    this.cameraRef = camera;
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
    const { screenResolution, renderer, scene, camera } = params;
    this.screenResolution = screenResolution;
    this.renderer = renderer;
    this.scene = scene;
    this.cameraRef = camera;
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
  constructor(resolution, scene, camera) {
    super();
    this.resolution = resolution;
    this.fsQuad = new FullScreenQuad(this.material());
    this.scene = scene;
    this.camera = camera;
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
  orbitTargetWorldPos = new Vector36();
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
    this.cameraRig = new Object3D4();
    this.cameraRig.position.set(0, 3, 10);
    this.cameraRig.add(this.camera);
    this.camera.lookAt(new Vector36(0, 2, 0));
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
    const unsubscribe = delegate.subscribe((state2) => {
      this.applyDebugState(state2);
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
  moveCamera(position2) {
    if (this._perspective === Perspectives.Flat2D || this._perspective === Perspectives.Fixed2D) {
      this.frustumSize = position2.z;
    }
    this.cameraRig.position.set(position2.x, position2.y, position2.z);
  }
  move(position2) {
    this.moveCamera(position2);
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
  applyDebugState(state2) {
    this.debugStateSnapshot = {
      enabled: state2.enabled,
      selected: [...state2.selected]
    };
    if (state2.enabled) {
      this.enableOrbitControls();
      this.updateOrbitTargetFromSelection(state2.selected);
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
  constructor(camera) {
    this.cameraRef = camera;
  }
};

// src/lib/stage/stage-debug-delegate.ts
import { Ray } from "@dimforge/rapier3d-compat";
import { BufferAttribute, BufferGeometry as BufferGeometry2, LineBasicMaterial as LineBasicMaterial2, LineSegments as LineSegments2, Raycaster, Vector2 as Vector24 } from "three";

// src/lib/stage/debug-entity-cursor.ts
import {
  Box3,
  BoxGeometry,
  Color as Color5,
  EdgesGeometry,
  Group as Group3,
  LineBasicMaterial,
  LineSegments,
  Mesh as Mesh2,
  MeshBasicMaterial,
  Vector3 as Vector38
} from "three";
var DebugEntityCursor = class {
  scene;
  container;
  fillMesh;
  edgeLines;
  currentColor = new Color5(65280);
  bbox = new Box3();
  size = new Vector38();
  center = new Vector38();
  constructor(scene) {
    this.scene = scene;
    const initialGeometry = new BoxGeometry(1, 1, 1);
    this.fillMesh = new Mesh2(
      initialGeometry,
      new MeshBasicMaterial({
        color: this.currentColor,
        transparent: true,
        opacity: 0.12,
        depthWrite: false
      })
    );
    const edges = new EdgesGeometry(initialGeometry);
    this.edgeLines = new LineSegments(
      edges,
      new LineBasicMaterial({ color: this.currentColor, linewidth: 1 })
    );
    this.container = new Group3();
    this.container.name = "DebugEntityCursor";
    this.container.add(this.fillMesh);
    this.container.add(this.edgeLines);
    this.container.visible = false;
    this.scene.add(this.container);
  }
  setColor(color) {
    this.currentColor.set(color);
    this.fillMesh.material.color.set(this.currentColor);
    this.edgeLines.material.color.set(this.currentColor);
  }
  /**
   * Update the cursor to enclose the provided Object3D using a world-space AABB.
   */
  updateFromObject(object) {
    if (!object) {
      this.hide();
      return;
    }
    this.bbox.setFromObject(object);
    if (!isFinite(this.bbox.min.x) || !isFinite(this.bbox.max.x)) {
      this.hide();
      return;
    }
    this.bbox.getSize(this.size);
    this.bbox.getCenter(this.center);
    const newGeom = new BoxGeometry(
      Math.max(this.size.x, 1e-6),
      Math.max(this.size.y, 1e-6),
      Math.max(this.size.z, 1e-6)
    );
    this.fillMesh.geometry.dispose();
    this.fillMesh.geometry = newGeom;
    const newEdges = new EdgesGeometry(newGeom);
    this.edgeLines.geometry.dispose();
    this.edgeLines.geometry = newEdges;
    this.container.position.copy(this.center);
    this.container.visible = true;
  }
  hide() {
    this.container.visible = false;
  }
  dispose() {
    this.scene.remove(this.container);
    this.fillMesh.geometry.dispose();
    this.fillMesh.material.dispose();
    this.edgeLines.geometry.dispose();
    this.edgeLines.material.dispose();
  }
};

// src/lib/stage/stage-debug-delegate.ts
var SELECT_TOOL_COLOR = 2293538;
var DELETE_TOOL_COLOR = 16724787;
var StageDebugDelegate = class {
  stage;
  options;
  mouseNdc = new Vector24(-2, -2);
  raycaster = new Raycaster();
  isMouseDown = false;
  disposeFns = [];
  debugCursor = null;
  debugLines = null;
  constructor(stage, options) {
    this.stage = stage;
    this.options = {
      maxRayDistance: options?.maxRayDistance ?? 5e3,
      addEntityFactory: options?.addEntityFactory ?? null
    };
    if (this.stage.scene) {
      this.debugLines = new LineSegments2(
        new BufferGeometry2(),
        new LineBasicMaterial2({ vertexColors: true })
      );
      this.stage.scene.scene.add(this.debugLines);
      this.debugLines.visible = true;
      this.debugCursor = new DebugEntityCursor(this.stage.scene.scene);
    }
    this.attachDomListeners();
  }
  update() {
    if (!debugState.enabled) return;
    if (!this.stage.scene || !this.stage.world || !this.stage.cameraRef) return;
    const { world, cameraRef } = this.stage;
    if (this.debugLines) {
      const { vertices, colors } = world.world.debugRender();
      this.debugLines.geometry.setAttribute("position", new BufferAttribute(vertices, 3));
      this.debugLines.geometry.setAttribute("color", new BufferAttribute(colors, 4));
    }
    const tool = getDebugTool();
    const isCursorTool = tool === "select" || tool === "delete";
    this.raycaster.setFromCamera(this.mouseNdc, cameraRef.camera);
    const origin = this.raycaster.ray.origin.clone();
    const direction = this.raycaster.ray.direction.clone().normalize();
    const rapierRay = new Ray(
      { x: origin.x, y: origin.y, z: origin.z },
      { x: direction.x, y: direction.y, z: direction.z }
    );
    const hit = world.world.castRay(rapierRay, this.options.maxRayDistance, true);
    if (hit && isCursorTool) {
      const rigidBody = hit.collider?._parent;
      const hoveredUuid2 = rigidBody?.userData?.uuid;
      if (hoveredUuid2) {
        const entity = this.stage._debugMap.get(hoveredUuid2);
        if (entity) setHoveredEntity(entity);
      } else {
        resetHoveredEntity();
      }
      if (this.isMouseDown) {
        this.handleActionOnHit(hoveredUuid2 ?? null, origin, direction, hit.toi);
      }
    }
    this.isMouseDown = false;
    const hoveredUuid = getHoveredEntity();
    if (!hoveredUuid) {
      this.debugCursor?.hide();
      return;
    }
    const hoveredEntity = this.stage._debugMap.get(`${hoveredUuid}`);
    const targetObject = hoveredEntity?.group ?? hoveredEntity?.mesh ?? null;
    if (!targetObject) {
      this.debugCursor?.hide();
      return;
    }
    switch (tool) {
      case "select":
        this.debugCursor?.setColor(SELECT_TOOL_COLOR);
        break;
      case "delete":
        this.debugCursor?.setColor(DELETE_TOOL_COLOR);
        break;
      default:
        this.debugCursor?.setColor(16777215);
        break;
    }
    this.debugCursor?.updateFromObject(targetObject);
  }
  dispose() {
    this.disposeFns.forEach((fn) => fn());
    this.disposeFns = [];
    this.debugCursor?.dispose();
    if (this.debugLines && this.stage.scene) {
      this.stage.scene.scene.remove(this.debugLines);
      this.debugLines.geometry.dispose();
      this.debugLines.material.dispose();
      this.debugLines = null;
    }
  }
  handleActionOnHit(hoveredUuid, origin, direction, toi) {
    const tool = getDebugTool();
    switch (tool) {
      case "select": {
        if (hoveredUuid) {
          const entity = this.stage._debugMap.get(hoveredUuid);
          if (entity) setSelectedEntity(entity);
        }
        break;
      }
      case "delete": {
        if (hoveredUuid) {
          this.stage.removeEntityByUuid(hoveredUuid);
        }
        break;
      }
      case "scale": {
        if (!this.options.addEntityFactory) break;
        const hitPosition = origin.clone().add(direction.clone().multiplyScalar(toi));
        const newNode = this.options.addEntityFactory({ position: hitPosition });
        if (newNode) {
          Promise.resolve(newNode).then((node) => {
            if (node) this.stage.spawnEntity(node);
          }).catch(() => {
          });
        }
        break;
      }
      default:
        break;
    }
  }
  attachDomListeners() {
    const canvas = this.stage.cameraRef?.renderer.domElement ?? this.stage.scene?.zylemCamera.renderer.domElement;
    if (!canvas) return;
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height * 2 - 1);
      this.mouseNdc.set(x, y);
    };
    const onMouseDown = (e) => {
      this.isMouseDown = true;
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    this.disposeFns.push(() => canvas.removeEventListener("mousemove", onMouseMove));
    this.disposeFns.push(() => canvas.removeEventListener("mousedown", onMouseDown));
  }
};

// src/lib/stage/zylem-stage.ts
var STAGE_TYPE = "Stage";
var ZylemStage = class extends LifeCycleBase {
  type = STAGE_TYPE;
  state = {
    backgroundColor: ZylemBlueColor,
    backgroundImage: null,
    inputs: {
      p1: ["gamepad-1", "keyboard"],
      p2: ["gamepad-2", "keyboard"]
    },
    gravity: new Vector310(0, 0, 0),
    variables: {},
    entities: []
  };
  gravity;
  world;
  scene;
  children = [];
  _childrenMap = /* @__PURE__ */ new Map();
  _removalMap = /* @__PURE__ */ new Map();
  pendingEntities = [];
  pendingPromises = [];
  isLoaded = false;
  _debugMap = /* @__PURE__ */ new Map();
  entityAddedHandlers = [];
  loadingHandlers = [];
  ecs = createECS();
  testSystem = null;
  transformSystem = null;
  debugDelegate = null;
  cameraDebugDelegate = null;
  uuid;
  wrapperRef = null;
  camera;
  cameraRef = null;
  /**
   * Create a new stage.
   * @param options Stage options: partial config, camera, and initial entities or factories
   */
  constructor(options = []) {
    super();
    this.world = null;
    this.scene = null;
    this.uuid = nanoid2();
    const { config, entities, asyncEntities, camera } = this.parseOptions(options);
    this.camera = camera;
    this.children = entities;
    this.pendingEntities = asyncEntities;
    this.saveState({ ...this.state, ...config, entities: [] });
    this.gravity = config.gravity ?? new Vector310(0, 0, 0);
  }
  parseOptions(options) {
    let config = {};
    const entities = [];
    const asyncEntities = [];
    let camera;
    for (const item of options) {
      if (this.isCameraWrapper(item)) {
        camera = item;
      } else if (this.isBaseNode(item)) {
        entities.push(item);
      } else if (this.isEntityInput(item)) {
        asyncEntities.push(item);
      } else if (this.isZylemStageConfig(item)) {
        config = { ...config, ...item };
      }
    }
    return { config, entities, asyncEntities, camera };
  }
  isZylemStageConfig(item) {
    return item && typeof item === "object" && !(item instanceof BaseNode) && !(item instanceof CameraWrapper);
  }
  isBaseNode(item) {
    return item && typeof item === "object" && typeof item.create === "function";
  }
  isCameraWrapper(item) {
    return item && typeof item === "object" && item.constructor.name === "CameraWrapper";
  }
  isEntityInput(item) {
    if (!item) return false;
    if (this.isBaseNode(item)) return true;
    if (typeof item === "function") return true;
    if (typeof item === "object" && typeof item.then === "function") return true;
    return false;
  }
  isThenable(value) {
    return !!value && typeof value.then === "function";
  }
  handleEntityImmediatelyOrQueue(entity) {
    if (this.isLoaded) {
      this.spawnEntity(entity);
    } else {
      this.children.push(entity);
    }
  }
  handlePromiseWithSpawnOnResolve(promise) {
    if (this.isLoaded) {
      promise.then((entity) => this.spawnEntity(entity)).catch((e) => console.error("Failed to build async entity", e));
    } else {
      this.pendingPromises.push(promise);
    }
  }
  saveState(state2) {
    this.state = state2;
  }
  setState() {
    const { backgroundColor, backgroundImage } = this.state;
    const color = backgroundColor instanceof Color6 ? backgroundColor : new Color6(backgroundColor);
    setStageBackgroundColor(color);
    setStageBackgroundImage(backgroundImage);
    setStageVariables(this.state.variables ?? {});
  }
  /**
   * Load and initialize the stage's scene and world.
   * @param id DOM element id for the renderer container
   * @param camera Optional camera override
   */
  async load(id, camera) {
    this.setState();
    const zylemCamera = camera || (this.camera ? this.camera.cameraRef : this.createDefaultCamera());
    this.cameraRef = zylemCamera;
    this.scene = new ZylemScene(id, zylemCamera, this.state);
    const physicsWorld = await ZylemWorld.loadPhysics(this.gravity ?? new Vector310(0, 0, 0));
    this.world = new ZylemWorld(physicsWorld);
    this.scene.setup();
    this.emitLoading({ type: "start", message: "Loading stage...", progress: 0 });
    const total = this.children.length + this.pendingEntities.length + this.pendingPromises.length;
    let current = 0;
    for (let child of this.children) {
      this.spawnEntity(child);
      current++;
      this.emitLoading({
        type: "progress",
        message: `Loaded entity ${child.name || "unknown"}`,
        progress: current / total,
        current,
        total
      });
    }
    if (this.pendingEntities.length) {
      this.enqueue(...this.pendingEntities);
      current += this.pendingEntities.length;
      this.pendingEntities = [];
    }
    if (this.pendingPromises.length) {
      for (const promise of this.pendingPromises) {
        promise.then((entity) => {
          this.spawnEntity(entity);
        }).catch((e) => console.error("Failed to resolve pending stage entity", e));
      }
      current += this.pendingPromises.length;
      this.pendingPromises = [];
    }
    this.transformSystem = createTransformSystem(this);
    this.isLoaded = true;
    this.emitLoading({ type: "complete", message: "Stage loaded", progress: 1 });
  }
  createDefaultCamera() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const screenResolution = new Vector25(width, height);
    return new ZylemCamera(Perspectives.ThirdPerson, screenResolution);
  }
  _setup(params) {
    if (!this.scene || !this.world) {
      this.logMissingEntities();
      return;
    }
    if (debugState.enabled) {
      this.debugDelegate = new StageDebugDelegate(this);
    }
  }
  _update(params) {
    const { delta } = params;
    if (!this.scene || !this.world) {
      this.logMissingEntities();
      return;
    }
    this.world.update(params);
    this.transformSystem(this.ecs);
    this._childrenMap.forEach((child, eid) => {
      child.nodeUpdate({
        ...params,
        me: child
      });
      if (child.markedForRemoval) {
        this.removeEntityByUuid(child.uuid);
      }
    });
    this.scene.update({ delta });
  }
  outOfLoop() {
    this.debugUpdate();
  }
  /** Update debug overlays and helpers if enabled. */
  debugUpdate() {
    if (debugState.enabled) {
      this.debugDelegate?.update();
    }
  }
  /** Cleanup owned resources when the stage is destroyed. */
  _destroy(params) {
    this._childrenMap.forEach((child) => {
      try {
        child.nodeDestroy({ me: child, globals: getGlobals() });
      } catch {
      }
    });
    this._childrenMap.clear();
    this._removalMap.clear();
    this._debugMap.clear();
    this.world?.destroy();
    this.scene?.destroy();
    this.debugDelegate?.dispose();
    this.cameraRef?.setDebugDelegate(null);
    this.cameraDebugDelegate = null;
    this.isLoaded = false;
    this.world = null;
    this.scene = null;
    this.cameraRef = null;
    resetStageVariables();
    clearVariables(this);
  }
  /**
   * Create, register, and add an entity to the scene/world.
   * Safe to call only after `load` when scene/world exist.
   */
  async spawnEntity(child) {
    if (!this.scene || !this.world) {
      return;
    }
    const entity = child.create();
    const eid = addEntity(this.ecs);
    entity.eid = eid;
    this.scene.addEntity(entity);
    if (child.behaviors) {
      for (let behavior of child.behaviors) {
        addComponent(this.ecs, behavior.component, entity.eid);
        const keys = Object.keys(behavior.values);
        for (const key of keys) {
          behavior.component[key][entity.eid] = behavior.values[key];
        }
      }
    }
    if (entity.colliderDesc) {
      this.world.addEntity(entity);
    }
    child.nodeSetup({
      me: child,
      globals: getGlobals(),
      camera: this.scene.zylemCamera
    });
    this.addEntityToStage(entity);
  }
  buildEntityState(child) {
    if (child instanceof GameEntity) {
      return { ...child.buildInfo() };
    }
    return {
      uuid: child.uuid,
      name: child.name,
      eid: child.eid
    };
  }
  /** Add the entity to internal maps and notify listeners. */
  addEntityToStage(entity) {
    this._childrenMap.set(entity.eid, entity);
    if (debugState.enabled) {
      this._debugMap.set(entity.uuid, entity);
    }
    for (const handler of this.entityAddedHandlers) {
      try {
        handler(entity);
      } catch (e) {
        console.error("onEntityAdded handler failed", e);
      }
    }
  }
  /**
   * Subscribe to entity-added events.
   * @param callback Invoked for each entity when added
   * @param options.replayExisting If true and stage already loaded, replays existing entities
   * @returns Unsubscribe function
   */
  onEntityAdded(callback, options) {
    this.entityAddedHandlers.push(callback);
    if (options?.replayExisting && this.isLoaded) {
      this._childrenMap.forEach((entity) => {
        try {
          callback(entity);
        } catch (e) {
          console.error("onEntityAdded replay failed", e);
        }
      });
    }
    return () => {
      this.entityAddedHandlers = this.entityAddedHandlers.filter((h) => h !== callback);
    };
  }
  onLoading(callback) {
    this.loadingHandlers.push(callback);
    return () => {
      this.loadingHandlers = this.loadingHandlers.filter((h) => h !== callback);
    };
  }
  emitLoading(event) {
    this.loadingHandlers.forEach((h) => h(event));
  }
  /**
   * Remove an entity and its resources by its UUID.
   * @returns true if removed, false if not found or stage not ready
   */
  removeEntityByUuid(uuid) {
    if (!this.scene || !this.world) return false;
    const mapEntity = this.world.collisionMap.get(uuid);
    const entity = mapEntity ?? this._debugMap.get(uuid);
    if (!entity) return false;
    this.world.destroyEntity(entity);
    if (entity.group) {
      this.scene.scene.remove(entity.group);
    } else if (entity.mesh) {
      this.scene.scene.remove(entity.mesh);
    }
    removeEntity(this.ecs, entity.eid);
    let foundKey = null;
    this._childrenMap.forEach((value, key) => {
      if (value.uuid === uuid) {
        foundKey = key;
      }
    });
    if (foundKey !== null) {
      this._childrenMap.delete(foundKey);
    }
    this._debugMap.delete(uuid);
    return true;
  }
  /** Get an entity by its name; returns null if not found. */
  getEntityByName(name) {
    const arr = Object.entries(Object.fromEntries(this._childrenMap)).map((entry) => entry[1]);
    const entity = arr.find((child) => child.name === name);
    if (!entity) {
      console.warn(`Entity ${name} not found`);
    }
    return entity ?? null;
  }
  logMissingEntities() {
    console.warn("Zylem world or scene is null");
  }
  /** Resize renderer viewport. */
  resize(width, height) {
    if (this.scene) {
      this.scene.updateRenderer(width, height);
    }
  }
  /**
   * Enqueue items to be spawned. Items can be:
   * - BaseNode instances (immediate or deferred until load)
   * - Factory functions returning BaseNode or Promise<BaseNode>
   * - Promises resolving to BaseNode
   */
  enqueue(...items) {
    for (const item of items) {
      if (!item) continue;
      if (this.isBaseNode(item)) {
        this.handleEntityImmediatelyOrQueue(item);
        continue;
      }
      if (typeof item === "function") {
        try {
          const result = item();
          if (this.isBaseNode(result)) {
            this.handleEntityImmediatelyOrQueue(result);
          } else if (this.isThenable(result)) {
            this.handlePromiseWithSpawnOnResolve(result);
          }
        } catch (error) {
          console.error("Error executing entity factory", error);
        }
        continue;
      }
      if (this.isThenable(item)) {
        this.handlePromiseWithSpawnOnResolve(item);
      }
    }
  }
};

// src/lib/stage/stage-default.ts
import { proxy as proxy4 } from "valtio/vanilla";
import { Vector3 as Vector311 } from "three";
var initialDefaults = {
  backgroundColor: ZylemBlueColor,
  backgroundImage: null,
  inputs: {
    p1: ["gamepad-1", "keyboard"],
    p2: ["gamepad-2", "keyboard"]
  },
  gravity: new Vector311(0, 0, 0),
  variables: {}
};
var stageDefaultsState = proxy4({
  ...initialDefaults
});
function getStageOptions(options) {
  const defaults = getStageDefaultConfig();
  let originalConfig = {};
  if (typeof options[0] === "object") {
    originalConfig = options.shift() ?? {};
  }
  const combinedConfig = { ...defaults, ...originalConfig };
  return [combinedConfig, ...options];
}
function getStageDefaultConfig() {
  return {
    backgroundColor: stageDefaultsState.backgroundColor,
    backgroundImage: stageDefaultsState.backgroundImage ?? null,
    inputs: stageDefaultsState.inputs ? { ...stageDefaultsState.inputs } : void 0,
    gravity: stageDefaultsState.gravity,
    variables: stageDefaultsState.variables ? { ...stageDefaultsState.variables } : void 0
  };
}

// src/lib/stage/stage.ts
var Stage = class {
  wrappedStage;
  options = [];
  // TODO: these shouldn't be here maybe more like nextFrame(stageInstance, () => {})
  update = () => {
  };
  setup = () => {
  };
  destroy = () => {
  };
  constructor(options) {
    this.options = options;
    this.wrappedStage = null;
  }
  async load(id, camera) {
    stageState.entities = [];
    this.wrappedStage = new ZylemStage(this.options);
    this.wrappedStage.wrapperRef = this;
    const zylemCamera = camera instanceof CameraWrapper ? camera.cameraRef : camera;
    await this.wrappedStage.load(id, zylemCamera);
    this.wrappedStage.onEntityAdded((child) => {
      const next = this.wrappedStage.buildEntityState(child);
      stageState.entities = [...stageState.entities, next];
    }, { replayExisting: true });
  }
  async addEntities(entities) {
    this.options.push(...entities);
    if (!this.wrappedStage) {
      return;
    }
    this.wrappedStage.enqueue(...entities);
  }
  add(...inputs) {
    this.addToBlueprints(...inputs);
    this.addToStage(...inputs);
  }
  addToBlueprints(...inputs) {
    if (this.wrappedStage) {
      return;
    }
    this.options.push(...inputs);
  }
  addToStage(...inputs) {
    if (!this.wrappedStage) {
      return;
    }
    this.wrappedStage.enqueue(...inputs);
  }
  start(params) {
    this.wrappedStage?.nodeSetup(params);
  }
  onUpdate(...callbacks) {
    if (!this.wrappedStage) {
      return;
    }
    this.wrappedStage.update = (params) => {
      const extended = { ...params, stage: this };
      callbacks.forEach((cb) => cb(extended));
    };
  }
  onSetup(callback) {
    this.wrappedStage.setup = callback;
  }
  onDestroy(callback) {
    this.wrappedStage.destroy = callback;
  }
  onLoading(callback) {
    if (!this.wrappedStage) {
      return () => {
      };
    }
    return this.wrappedStage.onLoading(callback);
  }
};
function createStage(...options) {
  const _options = getStageOptions(options);
  return new Stage([..._options]);
}

// src/lib/stage/entity-spawner.ts
import { Euler, Quaternion as Quaternion2, Vector2 as Vector26 } from "three";
function entitySpawner(factory) {
  return {
    spawn: async (stage, x, y) => {
      const instance = await Promise.resolve(factory(x, y));
      stage.add(instance);
      return instance;
    },
    spawnRelative: async (source, stage, offset = new Vector26(0, 1)) => {
      if (!source.body) {
        console.warn("body missing for entity during spawnRelative");
        return void 0;
      }
      const { x, y, z } = source.body.translation();
      let rz = source._rotation2DAngle ?? 0;
      try {
        const r = source.body.rotation();
        const q = new Quaternion2(r.x, r.y, r.z, r.w);
        const e = new Euler().setFromQuaternion(q, "XYZ");
        rz = e.z;
      } catch {
      }
      const offsetX = Math.sin(-rz) * (offset.x ?? 0);
      const offsetY = Math.cos(-rz) * (offset.y ?? 0);
      const instance = await Promise.resolve(factory(x + offsetX, y + offsetY));
      stage.add(instance);
      return instance;
    }
  };
}
export {
  createStage,
  entitySpawner
};
//# sourceMappingURL=stage.js.map