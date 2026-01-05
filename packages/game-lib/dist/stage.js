// src/lib/stage/zylem-stage.ts
import { addComponent, addEntity, createWorld as createECS, removeEntity } from "bitecs";
import { Color as Color7, Vector3 as Vector311 } from "three";

// src/lib/collision/world.ts
import RAPIER from "@dimforge/rapier3d-compat";

// src/lib/game/game-state.ts
import { proxy, subscribe } from "valtio/vanilla";

// src/lib/game/game-event-bus.ts
var GameEventBus = class {
  listeners = /* @__PURE__ */ new Map();
  /**
   * Subscribe to an event type.
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }
  /**
   * Unsubscribe from an event type.
   */
  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }
  /**
   * Emit an event to all subscribers.
   */
  emit(event, payload) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    for (const cb of callbacks) {
      try {
        cb(payload);
      } catch (e) {
        console.error(`Error in event handler for ${event}`, e);
      }
    }
  }
  /**
   * Clear all listeners.
   */
  dispose() {
    this.listeners.clear();
  }
};
var gameEventBus = new GameEventBus();

// src/lib/game/game-state.ts
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
  Types,
  removeQuery
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
var _tempQuaternion = new Quaternion();
function createTransformSystem(stage) {
  const queryTerms = [position, rotation];
  const transformQuery = defineQuery(queryTerms);
  const stageEntities = stage._childrenMap;
  const system = defineSystem((world) => {
    const entities = transformQuery(world);
    if (stageEntities === void 0) {
      return world;
    }
    for (const [key, stageEntity] of stageEntities) {
      if (!stageEntity?.body || stageEntity.markedForRemoval) {
        continue;
      }
      const id = entities[key];
      const body = stageEntity.body;
      const target = stageEntity.group ?? stageEntity.mesh;
      const translation = body.translation();
      position.x[id] = translation.x;
      position.y[id] = translation.y;
      position.z[id] = translation.z;
      if (target) {
        target.position.set(translation.x, translation.y, translation.z);
      }
      if (stageEntity.controlledRotation) {
        continue;
      }
      const rot = body.rotation();
      rotation.x[id] = rot.x;
      rotation.y[id] = rot.y;
      rotation.z[id] = rot.z;
      rotation.w[id] = rot.w;
      if (target) {
        _tempQuaternion.set(rot.x, rot.y, rot.z, rot.w);
        target.setRotationFromQuaternion(_tempQuaternion);
      }
    }
    return world;
  });
  const destroy = (world) => {
    removeQuery(world, transformQuery);
  };
  return { system, destroy };
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
  /**
   * Lifecycle callback arrays - use onSetup(), onUpdate(), etc. to add callbacks
   */
  lifecycleCallbacks = {
    setup: [],
    loaded: [],
    update: [],
    destroy: [],
    cleanup: []
  };
  constructor(args = []) {
    const options = args.filter((arg) => !(arg instanceof _BaseNode)).reduce((acc, opt) => ({ ...acc, ...opt }), {});
    this.options = options;
    this.uuid = nanoid();
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Fluent API for adding lifecycle callbacks
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Add setup callbacks to be executed in order during nodeSetup
   */
  onSetup(...callbacks) {
    this.lifecycleCallbacks.setup.push(...callbacks);
    return this;
  }
  /**
   * Add loaded callbacks to be executed in order during nodeLoaded
   */
  onLoaded(...callbacks) {
    this.lifecycleCallbacks.loaded.push(...callbacks);
    return this;
  }
  /**
   * Add update callbacks to be executed in order during nodeUpdate
   */
  onUpdate(...callbacks) {
    this.lifecycleCallbacks.update.push(...callbacks);
    return this;
  }
  /**
   * Add destroy callbacks to be executed in order during nodeDestroy
   */
  onDestroy(...callbacks) {
    this.lifecycleCallbacks.destroy.push(...callbacks);
    return this;
  }
  /**
   * Add cleanup callbacks to be executed in order during nodeCleanup
   */
  onCleanup(...callbacks) {
    this.lifecycleCallbacks.cleanup.push(...callbacks);
    return this;
  }
  /**
   * Prepend setup callbacks (run before existing ones)
   */
  prependSetup(...callbacks) {
    this.lifecycleCallbacks.setup.unshift(...callbacks);
    return this;
  }
  /**
   * Prepend update callbacks (run before existing ones)
   */
  prependUpdate(...callbacks) {
    this.lifecycleCallbacks.update.unshift(...callbacks);
    return this;
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Tree structure
  // ─────────────────────────────────────────────────────────────────────────────
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
  // ─────────────────────────────────────────────────────────────────────────────
  // Node lifecycle execution - runs internal + callback arrays
  // ─────────────────────────────────────────────────────────────────────────────
  nodeSetup(params) {
    if (DEBUG_FLAG) {
    }
    this.markedForRemoval = false;
    if (typeof this._setup === "function") {
      this._setup(params);
    }
    for (const callback of this.lifecycleCallbacks.setup) {
      callback(params);
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
    for (const callback of this.lifecycleCallbacks.update) {
      callback(params);
    }
    this.children.forEach((child) => child.nodeUpdate(params));
  }
  nodeDestroy(params) {
    this.children.forEach((child) => child.nodeDestroy(params));
    for (const callback of this.lifecycleCallbacks.destroy) {
      callback(params);
    }
    if (typeof this._destroy === "function") {
      this._destroy(params);
    }
    this.markedForRemoval = true;
  }
  async nodeLoaded(params) {
    if (typeof this._loaded === "function") {
      await this._loaded(params);
    }
    for (const callback of this.lifecycleCallbacks.loaded) {
      callback(params);
    }
  }
  async nodeCleanup(params) {
    for (const callback of this.lifecycleCallbacks.cleanup) {
      callback(params);
    }
    if (typeof this._cleanup === "function") {
      await this._cleanup(params);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Options
  // ─────────────────────────────────────────────────────────────────────────────
  getOptions() {
    return this.options;
  }
  setOptions(options) {
    this.options = { ...this.options, ...options };
  }
};

// ../../node_modules/.pnpm/mitt@3.0.1/node_modules/mitt/dist/mitt.mjs
function mitt_default(n) {
  return { all: n = n || /* @__PURE__ */ new Map(), on: function(t, e) {
    var i = n.get(t);
    i ? i.push(e) : n.set(t, [e]);
  }, off: function(t, e) {
    var i = n.get(t);
    i && (e ? i.splice(i.indexOf(e) >>> 0, 1) : n.set(t, []));
  }, emit: function(t, e) {
    var i = n.get(t);
    i && i.slice().map(function(n2) {
      n2(e);
    }), (i = n.get("*")) && i.slice().map(function(n2) {
      n2(t, e);
    });
  } };
}

// src/lib/events/event-emitter-delegate.ts
var EventEmitterDelegate = class {
  emitter;
  unsubscribes = [];
  constructor() {
    this.emitter = mitt_default();
  }
  /**
   * Dispatch an event to all listeners.
   */
  dispatch(event, payload) {
    this.emitter.emit(event, payload);
  }
  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  listen(event, handler) {
    this.emitter.on(event, handler);
    const unsub = () => this.emitter.off(event, handler);
    this.unsubscribes.push(unsub);
    return unsub;
  }
  /**
   * Subscribe to all events.
   */
  listenAll(handler) {
    this.emitter.on("*", handler);
    const unsub = () => this.emitter.off("*", handler);
    this.unsubscribes.push(unsub);
    return unsub;
  }
  /**
   * Clean up all subscriptions.
   */
  dispose() {
    this.unsubscribes.forEach((fn) => fn());
    this.unsubscribes = [];
    this.emitter.all.clear();
  }
};

// src/lib/events/zylem-events.ts
var zylemEventBus = mitt_default();

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
  // Event delegate for dispatch/listen API
  eventDelegate = new EventEmitterDelegate();
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
  /**
   * Add collision callbacks
   */
  onCollision(...callbacks) {
    const existing = this.collisionDelegate.collision ?? [];
    this.collisionDelegate.collision = [...existing, ...callbacks];
    return this;
  }
  /**
   * Entity-specific setup - runs behavior callbacks
   * (User callbacks are handled by BaseNode's lifecycleCallbacks.setup)
   */
  _setup(params) {
    this.behaviorCallbackMap.setup.forEach((callback) => {
      callback({ ...params, me: this });
    });
  }
  async _loaded(_params) {
  }
  /**
   * Entity-specific update - updates materials and runs behavior callbacks
   * (User callbacks are handled by BaseNode's lifecycleCallbacks.update)
   */
  _update(params) {
    this.updateMaterials(params);
    this.behaviorCallbackMap.update.forEach((callback) => {
      callback({ ...params, me: this });
    });
  }
  /**
   * Entity-specific destroy - runs behavior callbacks
   * (User callbacks are handled by BaseNode's lifecycleCallbacks.destroy)
   */
  _destroy(params) {
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
  // ─────────────────────────────────────────────────────────────────────────────
  // Events API
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Dispatch an event from this entity.
   * Events are emitted both locally and to the global event bus.
   */
  dispatch(event, payload) {
    this.eventDelegate.dispatch(event, payload);
    zylemEventBus.emit(event, payload);
  }
  /**
   * Listen for events on this entity instance.
   * @returns Unsubscribe function
   */
  listen(event, handler) {
    return this.eventDelegate.listen(event, handler);
  }
  /**
   * Clean up entity event subscriptions.
   */
  disposeEvents() {
    this.eventDelegate.dispose();
  }
};

// src/lib/core/asset-manager.ts
import { LoadingManager, Cache } from "three";

// src/lib/core/loaders/texture-loader.ts
import { TextureLoader, RepeatWrapping } from "three";
var TextureLoaderAdapter = class {
  loader;
  constructor() {
    this.loader = new TextureLoader();
  }
  isSupported(url) {
    const ext = url.split(".").pop()?.toLowerCase();
    return ["png", "jpg", "jpeg", "gif", "webp", "bmp", "tga"].includes(ext || "");
  }
  async load(url, options) {
    const texture = await this.loader.loadAsync(url, (event) => {
      if (options?.onProgress && event.lengthComputable) {
        options.onProgress(event.loaded / event.total);
      }
    });
    if (options?.repeat) {
      texture.repeat.copy(options.repeat);
    }
    texture.wrapS = options?.wrapS ?? RepeatWrapping;
    texture.wrapT = options?.wrapT ?? RepeatWrapping;
    return texture;
  }
  /**
   * Clone a texture for independent usage
   */
  clone(texture) {
    const cloned = texture.clone();
    cloned.needsUpdate = true;
    return cloned;
  }
};

// src/lib/core/loaders/gltf-loader.ts
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
var GLTFLoaderAdapter = class {
  loader;
  constructor() {
    this.loader = new GLTFLoader();
  }
  isSupported(url) {
    const ext = url.split(".").pop()?.toLowerCase();
    return ["gltf", "glb"].includes(ext || "");
  }
  async load(url, options) {
    if (options?.useAsyncFetch) {
      return this.loadWithAsyncFetch(url, options);
    }
    return this.loadMainThread(url, options);
  }
  /**
   * Load using native fetch + parseAsync
   * Both fetch and parsing are async, keeping the main thread responsive
   */
  async loadWithAsyncFetch(url, options) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      const gltf = await this.loader.parseAsync(buffer, url);
      return {
        object: gltf.scene,
        animations: gltf.animations,
        gltf
      };
    } catch (error) {
      console.error(`Async fetch GLTF load failed for ${url}, falling back to loader.load():`, error);
      return this.loadMainThread(url, options);
    }
  }
  async loadMainThread(url, options) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          resolve({
            object: gltf.scene,
            animations: gltf.animations,
            gltf
          });
        },
        (event) => {
          if (options?.onProgress && event.lengthComputable) {
            options.onProgress(event.loaded / event.total);
          }
        },
        (error) => reject(error)
      );
    });
  }
  /**
   * Clone a loaded GLTF scene for reuse
   */
  clone(result) {
    return {
      object: result.object.clone(),
      animations: result.animations?.map((anim) => anim.clone()),
      gltf: result.gltf
    };
  }
};

// src/lib/core/loaders/fbx-loader.ts
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
var FBXLoaderAdapter = class {
  loader;
  constructor() {
    this.loader = new FBXLoader();
  }
  isSupported(url) {
    const ext = url.split(".").pop()?.toLowerCase();
    return ext === "fbx";
  }
  async load(url, options) {
    if (options?.useAsyncFetch) {
      return this.loadWithAsyncFetch(url, options);
    }
    return this.loadMainThread(url, options);
  }
  /**
   * Load using native fetch + parse
   */
  async loadWithAsyncFetch(url, _options) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      const object = this.loader.parse(buffer, url);
      return {
        object,
        animations: object.animations || []
      };
    } catch (error) {
      console.error(`Async fetch FBX load failed for ${url}, falling back to loader.load():`, error);
      return this.loadMainThread(url, _options);
    }
  }
  async loadMainThread(url, options) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (object) => {
          resolve({
            object,
            animations: object.animations || []
          });
        },
        (event) => {
          if (options?.onProgress && event.lengthComputable) {
            options.onProgress(event.loaded / event.total);
          }
        },
        (error) => reject(error)
      );
    });
  }
  /**
   * Clone a loaded FBX object for reuse
   */
  clone(result) {
    return {
      object: result.object.clone(),
      animations: result.animations?.map((anim) => anim.clone())
    };
  }
};

// src/lib/core/loaders/obj-loader.ts
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
var OBJLoaderAdapter = class {
  loader;
  mtlLoader;
  constructor() {
    this.loader = new OBJLoader();
    this.mtlLoader = new MTLLoader();
  }
  isSupported(url) {
    const ext = url.split(".").pop()?.toLowerCase();
    return ext === "obj";
  }
  async load(url, options) {
    if (options?.mtlPath) {
      await this.loadMTL(options.mtlPath);
    }
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (object) => {
          resolve({
            object,
            animations: []
          });
        },
        (event) => {
          if (options?.onProgress && event.lengthComputable) {
            options.onProgress(event.loaded / event.total);
          }
        },
        (error) => reject(error)
      );
    });
  }
  async loadMTL(url) {
    return new Promise((resolve, reject) => {
      this.mtlLoader.load(
        url,
        (materials) => {
          materials.preload();
          this.loader.setMaterials(materials);
          resolve();
        },
        void 0,
        (error) => reject(error)
      );
    });
  }
  /**
   * Clone a loaded OBJ object for reuse
   */
  clone(result) {
    return {
      object: result.object.clone(),
      animations: []
    };
  }
};

// src/lib/core/loaders/audio-loader.ts
import { AudioLoader } from "three";
var AudioLoaderAdapter = class {
  loader;
  constructor() {
    this.loader = new AudioLoader();
  }
  isSupported(url) {
    const ext = url.split(".").pop()?.toLowerCase();
    return ["mp3", "ogg", "wav", "flac", "aac", "m4a"].includes(ext || "");
  }
  async load(url, options) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (buffer) => resolve(buffer),
        (event) => {
          if (options?.onProgress && event.lengthComputable) {
            options.onProgress(event.loaded / event.total);
          }
        },
        (error) => reject(error)
      );
    });
  }
};

// src/lib/core/loaders/file-loader.ts
import { FileLoader } from "three";
var FileLoaderAdapter = class {
  loader;
  constructor() {
    this.loader = new FileLoader();
  }
  isSupported(_url) {
    return true;
  }
  async load(url, options) {
    const responseType = options?.responseType ?? "text";
    this.loader.setResponseType(responseType);
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (data) => resolve(data),
        (event) => {
          if (options?.onProgress && event.lengthComputable) {
            options.onProgress(event.loaded / event.total);
          }
        },
        (error) => reject(error)
      );
    });
  }
};
var JsonLoaderAdapter = class {
  fileLoader;
  constructor() {
    this.fileLoader = new FileLoaderAdapter();
  }
  isSupported(url) {
    const ext = url.split(".").pop()?.toLowerCase();
    return ext === "json";
  }
  async load(url, options) {
    const data = await this.fileLoader.load(url, { ...options, responseType: "json" });
    return data;
  }
};

// src/lib/core/asset-manager.ts
var AssetManager = class _AssetManager {
  static instance = null;
  // Caches for different asset types
  textureCache = /* @__PURE__ */ new Map();
  modelCache = /* @__PURE__ */ new Map();
  audioCache = /* @__PURE__ */ new Map();
  fileCache = /* @__PURE__ */ new Map();
  jsonCache = /* @__PURE__ */ new Map();
  // Loaders
  textureLoader;
  gltfLoader;
  fbxLoader;
  objLoader;
  audioLoader;
  fileLoader;
  jsonLoader;
  // Loading manager for progress tracking
  loadingManager;
  // Event emitter
  events;
  // Stats
  stats = {
    texturesLoaded: 0,
    modelsLoaded: 0,
    audioLoaded: 0,
    filesLoaded: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  constructor() {
    this.textureLoader = new TextureLoaderAdapter();
    this.gltfLoader = new GLTFLoaderAdapter();
    this.fbxLoader = new FBXLoaderAdapter();
    this.objLoader = new OBJLoaderAdapter();
    this.audioLoader = new AudioLoaderAdapter();
    this.fileLoader = new FileLoaderAdapter();
    this.jsonLoader = new JsonLoaderAdapter();
    this.loadingManager = new LoadingManager();
    this.loadingManager.onProgress = (url, loaded, total) => {
      this.events.emit("batch:progress", { loaded, total });
    };
    this.events = mitt_default();
    Cache.enabled = true;
  }
  /**
   * Get the singleton instance
   */
  static getInstance() {
    if (!_AssetManager.instance) {
      _AssetManager.instance = new _AssetManager();
    }
    return _AssetManager.instance;
  }
  /**
   * Reset the singleton (useful for testing)
   */
  static resetInstance() {
    if (_AssetManager.instance) {
      _AssetManager.instance.clearCache();
      _AssetManager.instance = null;
    }
  }
  // ==================== TEXTURE LOADING ====================
  /**
   * Load a texture with caching
   */
  async loadTexture(url, options) {
    return this.loadWithCache(
      url,
      "texture" /* TEXTURE */,
      this.textureCache,
      () => this.textureLoader.load(url, options),
      options,
      (texture) => options?.clone ? this.textureLoader.clone(texture) : texture
    );
  }
  // ==================== MODEL LOADING ====================
  /**
   * Load a GLTF/GLB model with caching
   */
  async loadGLTF(url, options) {
    return this.loadWithCache(
      url,
      "gltf" /* GLTF */,
      this.modelCache,
      () => this.gltfLoader.load(url, options),
      options,
      (result) => options?.clone ? this.gltfLoader.clone(result) : result
    );
  }
  /**
   * Load an FBX model with caching
   */
  async loadFBX(url, options) {
    return this.loadWithCache(
      url,
      "fbx" /* FBX */,
      this.modelCache,
      () => this.fbxLoader.load(url, options),
      options,
      (result) => options?.clone ? this.fbxLoader.clone(result) : result
    );
  }
  /**
   * Load an OBJ model with caching
   */
  async loadOBJ(url, options) {
    const cacheKey = options?.mtlPath ? `${url}:${options.mtlPath}` : url;
    return this.loadWithCache(
      cacheKey,
      "obj" /* OBJ */,
      this.modelCache,
      () => this.objLoader.load(url, options),
      options,
      (result) => options?.clone ? this.objLoader.clone(result) : result
    );
  }
  /**
   * Auto-detect model type and load
   */
  async loadModel(url, options) {
    const ext = url.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "gltf":
      case "glb":
        return this.loadGLTF(url, options);
      case "fbx":
        return this.loadFBX(url, options);
      case "obj":
        return this.loadOBJ(url, options);
      default:
        throw new Error(`Unsupported model format: ${ext}`);
    }
  }
  // ==================== AUDIO LOADING ====================
  /**
   * Load an audio buffer with caching
   */
  async loadAudio(url, options) {
    return this.loadWithCache(
      url,
      "audio" /* AUDIO */,
      this.audioCache,
      () => this.audioLoader.load(url, options),
      options
    );
  }
  // ==================== FILE LOADING ====================
  /**
   * Load a raw file with caching
   */
  async loadFile(url, options) {
    const cacheKey = options?.responseType ? `${url}:${options.responseType}` : url;
    return this.loadWithCache(
      cacheKey,
      "file" /* FILE */,
      this.fileCache,
      () => this.fileLoader.load(url, options),
      options
    );
  }
  /**
   * Load a JSON file with caching
   */
  async loadJSON(url, options) {
    return this.loadWithCache(
      url,
      "json" /* JSON */,
      this.jsonCache,
      () => this.jsonLoader.load(url, options),
      options
    );
  }
  // ==================== BATCH LOADING ====================
  /**
   * Load multiple assets in parallel
   */
  async loadBatch(items) {
    const results = /* @__PURE__ */ new Map();
    const promises = items.map(async (item) => {
      try {
        let result;
        switch (item.type) {
          case "texture" /* TEXTURE */:
            result = await this.loadTexture(item.url, item.options);
            break;
          case "gltf" /* GLTF */:
            result = await this.loadGLTF(item.url, item.options);
            break;
          case "fbx" /* FBX */:
            result = await this.loadFBX(item.url, item.options);
            break;
          case "obj" /* OBJ */:
            result = await this.loadOBJ(item.url, item.options);
            break;
          case "audio" /* AUDIO */:
            result = await this.loadAudio(item.url, item.options);
            break;
          case "file" /* FILE */:
            result = await this.loadFile(item.url, item.options);
            break;
          case "json" /* JSON */:
            result = await this.loadJSON(item.url, item.options);
            break;
          default:
            throw new Error(`Unknown asset type: ${item.type}`);
        }
        results.set(item.url, result);
      } catch (error) {
        this.events.emit("asset:error", {
          url: item.url,
          type: item.type,
          error
        });
        throw error;
      }
    });
    await Promise.all(promises);
    this.events.emit("batch:complete", { urls: items.map((i) => i.url) });
    return results;
  }
  /**
   * Preload assets without returning results
   */
  async preload(items) {
    await this.loadBatch(items);
  }
  // ==================== CACHE MANAGEMENT ====================
  /**
   * Check if an asset is cached
   */
  isCached(url) {
    return this.textureCache.has(url) || this.modelCache.has(url) || this.audioCache.has(url) || this.fileCache.has(url) || this.jsonCache.has(url);
  }
  /**
   * Clear all caches or a specific URL
   */
  clearCache(url) {
    if (url) {
      this.textureCache.delete(url);
      this.modelCache.delete(url);
      this.audioCache.delete(url);
      this.fileCache.delete(url);
      this.jsonCache.delete(url);
    } else {
      this.textureCache.clear();
      this.modelCache.clear();
      this.audioCache.clear();
      this.fileCache.clear();
      this.jsonCache.clear();
      Cache.clear();
    }
  }
  /**
   * Get cache statistics
   */
  getStats() {
    return { ...this.stats };
  }
  // ==================== EVENTS ====================
  /**
   * Subscribe to asset manager events
   */
  on(event, handler) {
    this.events.on(event, handler);
  }
  /**
   * Unsubscribe from asset manager events
   */
  off(event, handler) {
    this.events.off(event, handler);
  }
  // ==================== PRIVATE HELPERS ====================
  /**
   * Generic cache wrapper for loading assets
   */
  async loadWithCache(url, type, cache, loader, options, cloner) {
    if (options?.forceReload) {
      cache.delete(url);
    }
    const cached = cache.get(url);
    if (cached) {
      this.stats.cacheHits++;
      this.events.emit("asset:loaded", { url, type, fromCache: true });
      const result = await cached.promise;
      return cloner ? cloner(result) : result;
    }
    this.stats.cacheMisses++;
    this.events.emit("asset:loading", { url, type });
    const promise = loader();
    const entry = {
      promise,
      loadedAt: Date.now()
    };
    cache.set(url, entry);
    try {
      const result = await promise;
      entry.result = result;
      this.updateStats(type);
      this.events.emit("asset:loaded", { url, type, fromCache: false });
      return cloner ? cloner(result) : result;
    } catch (error) {
      cache.delete(url);
      this.events.emit("asset:error", { url, type, error });
      throw error;
    }
  }
  updateStats(type) {
    switch (type) {
      case "texture" /* TEXTURE */:
        this.stats.texturesLoaded++;
        break;
      case "gltf" /* GLTF */:
      case "fbx" /* FBX */:
      case "obj" /* OBJ */:
        this.stats.modelsLoaded++;
        break;
      case "audio" /* AUDIO */:
        this.stats.audioLoaded++;
        break;
      case "file" /* FILE */:
      case "json" /* JSON */:
        this.stats.filesLoaded++;
        break;
    }
  }
};
var assetManager = AssetManager.getInstance();

// src/lib/core/entity-asset-loader.ts
var EntityAssetLoader = class {
  /**
   * Load a model file (FBX, GLTF, GLB, OBJ) using the asset manager
   */
  async loadFile(file) {
    const ext = file.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "fbx": {
        const result = await assetManager.loadFBX(file);
        return {
          object: result.object,
          animation: result.animations?.[0]
        };
      }
      case "gltf":
      case "glb": {
        const result = await assetManager.loadGLTF(file);
        return {
          object: result.object,
          gltf: result.gltf
        };
      }
      case "obj": {
        const result = await assetManager.loadOBJ(file);
        return {
          object: result.object
        };
      }
      default:
        throw new Error(`Unsupported file type: ${file}`);
    }
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
  /**
   * Dispose of all animation resources
   */
  dispose() {
    Object.values(this._actions).forEach((action) => {
      action.stop();
    });
    if (this._mixer) {
      this._mixer.stopAllAction();
      this._mixer.uncacheRoot(this.target);
      this._mixer = null;
    }
    this._actions = {};
    this._animations = [];
    this._currentAction = null;
    this._currentKey = "";
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
var ACTOR_TYPE = /* @__PURE__ */ Symbol("Actor");
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
    this.prependUpdate(this.actorUpdate.bind(this));
    this.controlledRotation = true;
  }
  async load() {
    this._modelFileNames = this.options.models || [];
    await this.loadModels();
    if (this._object) {
      this._animationDelegate = new AnimationDelegate(this._object);
      await this._animationDelegate.loadAnimations(this.options.animations || []);
      this.dispatch("entity:animation:loaded", {
        entityId: this.uuid,
        animationCount: this.options.animations?.length || 0
      });
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
  /**
   * Clean up actor resources including animations, models, and groups
   */
  actorDestroy() {
    if (this._animationDelegate) {
      this._animationDelegate.dispose();
      this._animationDelegate = null;
    }
    if (this._object) {
      this._object.traverse((child) => {
        if (child.isMesh) {
          const mesh = child;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });
      this._object = null;
    }
    if (this.group) {
      this.group.clear();
      this.group = null;
    }
    this._modelFileNames = [];
  }
  async loadModels() {
    if (this._modelFileNames.length === 0) return;
    this.dispatch("entity:model:loading", {
      entityId: this.uuid,
      files: this._modelFileNames
    });
    const promises = this._modelFileNames.map((file) => this._assetLoader.loadFile(file));
    const results = await Promise.all(promises);
    if (results[0]?.object) {
      this._object = results[0].object;
    }
    let meshCount = 0;
    if (this._object) {
      this._object.traverse((child) => {
        if (child.isMesh) meshCount++;
      });
      this.group = new Group2();
      this.group.attach(this._object);
      this.group.scale.set(
        this.options.scale?.x || 1,
        this.options.scale?.y || 1,
        this.options.scale?.z || 1
      );
    }
    this.dispatch("entity:model:loaded", {
      entityId: this.uuid,
      success: !!this._object,
      meshCount
    });
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

// src/lib/collision/world.ts
function isCollisionHandlerDelegate(obj) {
  return typeof obj?.handlePostCollision === "function" && typeof obj?.handleIntersectionEvent === "function";
}
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
      assetManager.loadTexture(state2.backgroundImage).then((texture) => {
        scene.background = texture;
      });
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
    if (camera.cameraRig) {
      scene.add(camera.cameraRig);
    } else {
      scene.add(camera.camera);
    }
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

// src/lib/stage/zylem-stage.ts
import { subscribe as subscribe4 } from "valtio/vanilla";

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

// src/lib/stage/stage-debug-delegate.ts
import { Ray } from "@dimforge/rapier3d-compat";
import { BufferAttribute, BufferGeometry as BufferGeometry2, LineBasicMaterial as LineBasicMaterial2, LineSegments as LineSegments2, Raycaster, Vector2 as Vector22 } from "three";

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
  Vector3 as Vector35
} from "three";
var DebugEntityCursor = class {
  scene;
  container;
  fillMesh;
  edgeLines;
  currentColor = new Color5(65280);
  bbox = new Box3();
  size = new Vector35();
  center = new Vector35();
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
  mouseNdc = new Vector22(-2, -2);
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

// src/lib/stage/stage-camera-debug-delegate.ts
import { subscribe as subscribe3 } from "valtio/vanilla";
var StageCameraDebugDelegate = class {
  stage;
  constructor(stage) {
    this.stage = stage;
  }
  subscribe(listener) {
    const notify = () => listener(this.snapshot());
    notify();
    return subscribe3(debugState, notify);
  }
  resolveTarget(uuid) {
    const entity = this.stage._debugMap.get(uuid) || this.stage.world?.collisionMap.get(uuid) || null;
    const target = entity?.group ?? entity?.mesh ?? null;
    return target ?? null;
  }
  snapshot() {
    return {
      enabled: debugState.enabled,
      selected: debugState.selectedEntity ? [debugState.selectedEntity.uuid] : []
    };
  }
};

// src/lib/stage/stage-camera-delegate.ts
import { Vector2 as Vector25 } from "three";

// src/lib/camera/zylem-camera.ts
import { PerspectiveCamera, Vector3 as Vector39, Object3D as Object3D7, OrthographicCamera, WebGLRenderer as WebGLRenderer3 } from "three";

// src/lib/camera/perspective.ts
var Perspectives = {
  FirstPerson: "first-person",
  ThirdPerson: "third-person",
  Isometric: "isometric",
  Flat2D: "flat-2d",
  Fixed2D: "fixed-2d"
};

// src/lib/camera/third-person.ts
import { Vector3 as Vector37 } from "three";
var ThirdPersonCamera = class {
  distance;
  screenResolution = null;
  renderer = null;
  scene = null;
  cameraRef = null;
  constructor() {
    this.distance = new Vector37(0, 5, 8);
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

// src/lib/camera/camera-debug-delegate.ts
import { Vector3 as Vector38 } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
var CameraOrbitController = class {
  camera;
  domElement;
  orbitControls = null;
  orbitTarget = null;
  orbitTargetWorldPos = new Vector38();
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
  constructor(camera, domElement) {
    this.camera = camera;
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
    const unsubscribe = delegate.subscribe((state2) => {
      this.applyDebugState(state2);
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
  applyDebugState(state2) {
    const wasEnabled = this.debugStateSnapshot.enabled;
    this.debugStateSnapshot = {
      enabled: state2.enabled,
      selected: [...state2.selected]
    };
    if (state2.enabled && !wasEnabled) {
      this.saveCameraState();
      this.enableOrbitControls();
      this.restoreDebugCameraState();
      this.updateOrbitTargetFromSelection(state2.selected);
    } else if (!state2.enabled && wasEnabled) {
      this.saveDebugCameraState();
      this.orbitTarget = null;
      this.disableOrbitControls();
      this.restoreCameraState();
    } else if (state2.enabled) {
      this.updateOrbitTargetFromSelection(state2.selected);
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
      this.cameraRig = new Object3D7();
      this.cameraRig.position.set(0, 3, 10);
      this.cameraRig.add(this.camera);
      this.camera.lookAt(new Vector39(0, 2, 0));
    } else {
      this.camera.position.set(0, 0, 10);
      this.camera.lookAt(new Vector39(0, 0, 0));
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
  moveCamera(position2) {
    if (this._perspective === Perspectives.Flat2D || this._perspective === Perspectives.Fixed2D) {
      this.frustumSize = position2.z;
    }
    if (this.cameraRig) {
      this.cameraRig.position.set(position2.x, position2.y, position2.z);
    } else {
      this.camera.position.set(position2.x, position2.y, position2.z);
    }
  }
  move(position2) {
    this.moveCamera(position2);
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

// src/lib/stage/stage-camera-delegate.ts
var StageCameraDelegate = class {
  stage;
  constructor(stage) {
    this.stage = stage;
  }
  /**
   * Create a default third-person camera based on window size.
   */
  createDefaultCamera() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const screenResolution = new Vector25(width, height);
    return new ZylemCamera(Perspectives.ThirdPerson, screenResolution);
  }
  /**
   * Resolve the camera to use for the stage.
   * Uses the provided camera, stage camera wrapper, or creates a default.
   * 
   * @param cameraOverride Optional camera override
   * @param cameraWrapper Optional camera wrapper from stage options
   * @returns The resolved ZylemCamera instance
   */
  resolveCamera(cameraOverride, cameraWrapper) {
    if (cameraOverride) {
      return cameraOverride;
    }
    if (cameraWrapper) {
      return cameraWrapper.cameraRef;
    }
    return this.createDefaultCamera();
  }
};

// src/lib/stage/stage-loading-delegate.ts
var StageLoadingDelegate = class {
  loadingHandlers = [];
  stageName;
  stageIndex;
  /**
   * Set stage context for event bus emissions.
   */
  setStageContext(stageName, stageIndex) {
    this.stageName = stageName;
    this.stageIndex = stageIndex;
  }
  /**
   * Subscribe to loading events.
   * 
   * @param callback Invoked for each loading event (start, progress, complete)
   * @returns Unsubscribe function
   */
  onLoading(callback) {
    this.loadingHandlers.push(callback);
    return () => {
      this.loadingHandlers = this.loadingHandlers.filter((h) => h !== callback);
    };
  }
  /**
   * Emit a loading event to all subscribers and to the game event bus.
   * 
   * @param event The loading event to broadcast
   */
  emit(event) {
    for (const handler of this.loadingHandlers) {
      try {
        handler(event);
      } catch (e) {
        console.error("Loading handler failed", e);
      }
    }
    const payload = {
      ...event,
      stageName: this.stageName,
      stageIndex: this.stageIndex
    };
    if (event.type === "start") {
      gameEventBus.emit("stage:loading:start", payload);
    } else if (event.type === "progress") {
      gameEventBus.emit("stage:loading:progress", payload);
    } else if (event.type === "complete") {
      gameEventBus.emit("stage:loading:complete", payload);
    }
  }
  /**
   * Emit a start loading event.
   */
  emitStart(message = "Loading stage...") {
    this.emit({ type: "start", message, progress: 0 });
  }
  /**
   * Emit a progress loading event.
   */
  emitProgress(message, current, total) {
    const progress = total > 0 ? current / total : 0;
    this.emit({ type: "progress", message, progress, current, total });
  }
  /**
   * Emit a complete loading event.
   */
  emitComplete(message = "Stage loaded") {
    this.emit({ type: "complete", message, progress: 1 });
  }
  /**
   * Clear all loading handlers.
   */
  dispose() {
    this.loadingHandlers = [];
  }
};

// src/lib/stage/stage-config.ts
import { Vector3 as Vector310 } from "three";

// src/lib/core/utility/options-parser.ts
function isBaseNode(item) {
  return !!item && typeof item === "object" && typeof item.create === "function";
}
function isThenable(item) {
  return !!item && typeof item.then === "function";
}
function isCameraWrapper(item) {
  return !!item && typeof item === "object" && item.constructor?.name === "CameraWrapper";
}
function isConfigObject(item) {
  if (!item || typeof item !== "object") return false;
  if (isBaseNode(item)) return false;
  if (isCameraWrapper(item)) return false;
  if (isThenable(item)) return false;
  if (typeof item.then === "function") return false;
  return item.constructor === Object || item.constructor?.name === "Object";
}
function isEntityInput(item) {
  if (!item) return false;
  if (isBaseNode(item)) return true;
  if (typeof item === "function") return true;
  if (isThenable(item)) return true;
  return false;
}

// src/lib/stage/stage-config.ts
var StageConfig = class {
  constructor(inputs, backgroundColor, backgroundImage, gravity, variables) {
    this.inputs = inputs;
    this.backgroundColor = backgroundColor;
    this.backgroundImage = backgroundImage;
    this.gravity = gravity;
    this.variables = variables;
  }
};
function createDefaultStageConfig() {
  return new StageConfig(
    {
      p1: ["gamepad-1", "keyboard-1"],
      p2: ["gamepad-2", "keyboard-2"]
    },
    ZylemBlueColor,
    null,
    new Vector310(0, 0, 0),
    {}
  );
}
function parseStageOptions(options = []) {
  const defaults = createDefaultStageConfig();
  let config = {};
  const entities = [];
  const asyncEntities = [];
  let camera;
  for (const item of options) {
    if (isCameraWrapper(item)) {
      camera = item;
    } else if (isBaseNode(item)) {
      entities.push(item);
    } else if (isEntityInput(item) && !isBaseNode(item)) {
      asyncEntities.push(item);
    } else if (isConfigObject(item)) {
      config = { ...config, ...item };
    }
  }
  const resolvedConfig = new StageConfig(
    config.inputs ?? defaults.inputs,
    config.backgroundColor ?? defaults.backgroundColor,
    config.backgroundImage ?? defaults.backgroundImage,
    config.gravity ?? defaults.gravity,
    config.variables ?? defaults.variables
  );
  return { config: resolvedConfig, entities, asyncEntities, camera };
}

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
    gravity: new Vector311(0, 0, 0),
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
  ecs = createECS();
  testSystem = null;
  transformSystem = null;
  debugDelegate = null;
  cameraDebugDelegate = null;
  debugStateUnsubscribe = null;
  uuid;
  wrapperRef = null;
  camera;
  cameraRef = null;
  // Delegates
  cameraDelegate;
  loadingDelegate;
  /**
   * Create a new stage.
   * @param options Stage options: partial config, camera, and initial entities or factories
   */
  constructor(options = []) {
    super();
    this.world = null;
    this.scene = null;
    this.uuid = nanoid2();
    this.cameraDelegate = new StageCameraDelegate(this);
    this.loadingDelegate = new StageLoadingDelegate();
    const parsed = parseStageOptions(options);
    this.camera = parsed.camera;
    this.children = parsed.entities;
    this.pendingEntities = parsed.asyncEntities;
    this.saveState({
      ...this.state,
      inputs: parsed.config.inputs,
      backgroundColor: parsed.config.backgroundColor,
      backgroundImage: parsed.config.backgroundImage,
      gravity: parsed.config.gravity,
      variables: parsed.config.variables,
      entities: []
    });
    this.gravity = parsed.config.gravity ?? new Vector311(0, 0, 0);
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
    const color = backgroundColor instanceof Color7 ? backgroundColor : new Color7(backgroundColor);
    setStageBackgroundColor(color);
    setStageBackgroundImage(backgroundImage);
    setStageVariables(this.state.variables ?? {});
  }
  /**
   * Load and initialize the stage's scene and world.
   * Uses generator pattern to yield control to event loop for real-time progress.
   * @param id DOM element id for the renderer container
   * @param camera Optional camera override
   */
  async load(id, camera) {
    this.setState();
    const zylemCamera = this.cameraDelegate.resolveCamera(camera, this.camera);
    this.cameraRef = zylemCamera;
    this.scene = new ZylemScene(id, zylemCamera, this.state);
    const physicsWorld = await ZylemWorld.loadPhysics(this.gravity ?? new Vector311(0, 0, 0));
    this.world = new ZylemWorld(physicsWorld);
    this.scene.setup();
    this.loadingDelegate.emitStart();
    await this.runEntityLoadGenerator();
    this.transformSystem = createTransformSystem(this);
    this.isLoaded = true;
    this.loadingDelegate.emitComplete();
  }
  /**
   * Generator that yields between entity loads for real-time progress updates.
   */
  *entityLoadGenerator() {
    const total = this.children.length + this.pendingEntities.length + this.pendingPromises.length;
    let current = 0;
    for (const child of this.children) {
      this.spawnEntity(child);
      current++;
      yield { current, total, name: child.name || "unknown" };
    }
    if (this.pendingEntities.length) {
      this.enqueue(...this.pendingEntities);
      current += this.pendingEntities.length;
      this.pendingEntities = [];
      yield { current, total, name: "pending entities" };
    }
    if (this.pendingPromises.length) {
      for (const promise of this.pendingPromises) {
        promise.then((entity) => {
          this.spawnEntity(entity);
        }).catch((e) => console.error("Failed to resolve pending stage entity", e));
      }
      current += this.pendingPromises.length;
      this.pendingPromises = [];
      yield { current, total, name: "async entities" };
    }
  }
  /**
   * Runs the entity load generator, yielding to the event loop between loads.
   * This allows the browser to process events and update the UI in real-time.
   */
  async runEntityLoadGenerator() {
    const gen = this.entityLoadGenerator();
    for (const progress of gen) {
      this.loadingDelegate.emitProgress(`Loaded ${progress.name}`, progress.current, progress.total);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  _setup(params) {
    if (!this.scene || !this.world) {
      this.logMissingEntities();
      return;
    }
    this.updateDebugDelegate();
    this.debugStateUnsubscribe = subscribe4(debugState, () => {
      this.updateDebugDelegate();
    });
  }
  updateDebugDelegate() {
    if (debugState.enabled && !this.debugDelegate && this.scene && this.world) {
      this.debugDelegate = new StageDebugDelegate(this);
      if (this.cameraRef && !this.cameraDebugDelegate) {
        this.cameraDebugDelegate = new StageCameraDebugDelegate(this);
        this.cameraRef.setDebugDelegate(this.cameraDebugDelegate);
      }
    } else if (!debugState.enabled && this.debugDelegate) {
      this.debugDelegate.dispose();
      this.debugDelegate = null;
      if (this.cameraRef) {
        this.cameraRef.setDebugDelegate(null);
      }
      this.cameraDebugDelegate = null;
    }
  }
  _update(params) {
    const { delta } = params;
    if (!this.scene || !this.world) {
      this.logMissingEntities();
      return;
    }
    this.world.update(params);
    this.transformSystem?.system(this.ecs);
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
    if (this.debugStateUnsubscribe) {
      this.debugStateUnsubscribe();
      this.debugStateUnsubscribe = null;
    }
    this.debugDelegate?.dispose();
    this.debugDelegate = null;
    this.cameraRef?.setDebugDelegate(null);
    this.cameraDebugDelegate = null;
    this.isLoaded = false;
    this.world = null;
    this.scene = null;
    this.cameraRef = null;
    this.transformSystem?.destroy(this.ecs);
    this.transformSystem = null;
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
    return this.loadingDelegate.onLoading(callback);
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
      if (isBaseNode(item)) {
        this.handleEntityImmediatelyOrQueue(item);
        continue;
      }
      if (typeof item === "function") {
        try {
          const result = item();
          if (isBaseNode(result)) {
            this.handleEntityImmediatelyOrQueue(result);
          } else if (isThenable(result)) {
            this.handlePromiseWithSpawnOnResolve(result);
          }
        } catch (error) {
          console.error("Error executing entity factory", error);
        }
        continue;
      }
      if (isThenable(item)) {
        this.handlePromiseWithSpawnOnResolve(item);
      }
    }
  }
};

// src/lib/camera/camera.ts
import { Vector2 as Vector27, Vector3 as Vector312 } from "three";
var CameraWrapper = class {
  cameraRef;
  constructor(camera) {
    this.cameraRef = camera;
  }
};

// src/lib/stage/stage-default.ts
import { proxy as proxy4 } from "valtio/vanilla";
import { Vector3 as Vector313 } from "three";
var initialDefaults = {
  backgroundColor: ZylemBlueColor,
  backgroundImage: null,
  inputs: {
    p1: ["gamepad-1", "keyboard"],
    p2: ["gamepad-2", "keyboard"]
  },
  gravity: new Vector313(0, 0, 0),
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
  // Entities added after construction, consumed on each load
  _pendingEntities = [];
  // Lifecycle callback arrays
  setupCallbacks = [];
  updateCallbacks = [];
  destroyCallbacks = [];
  pendingLoadingCallbacks = [];
  // Event delegate for dispatch/listen API
  eventDelegate = new EventEmitterDelegate();
  constructor(options) {
    this.options = options;
    this.wrappedStage = null;
  }
  async load(id, camera) {
    stageState.entities = [];
    const loadOptions = [...this.options, ...this._pendingEntities];
    this._pendingEntities = [];
    this.wrappedStage = new ZylemStage(loadOptions);
    this.wrappedStage.wrapperRef = this;
    this.pendingLoadingCallbacks.forEach((cb) => {
      this.wrappedStage.onLoading(cb);
    });
    this.pendingLoadingCallbacks = [];
    const zylemCamera = camera instanceof CameraWrapper ? camera.cameraRef : camera;
    await this.wrappedStage.load(id, zylemCamera);
    this.wrappedStage.onEntityAdded((child) => {
      const next = this.wrappedStage.buildEntityState(child);
      stageState.entities = [...stageState.entities, next];
    }, { replayExisting: true });
    this.applyLifecycleCallbacks();
  }
  applyLifecycleCallbacks() {
    if (!this.wrappedStage) return;
    if (this.setupCallbacks.length > 0) {
      this.wrappedStage.setup = (params) => {
        const extended = { ...params, stage: this };
        this.setupCallbacks.forEach((cb) => cb(extended));
      };
    }
    if (this.updateCallbacks.length > 0) {
      this.wrappedStage.update = (params) => {
        const extended = { ...params, stage: this };
        this.updateCallbacks.forEach((cb) => cb(extended));
      };
    }
    if (this.destroyCallbacks.length > 0) {
      this.wrappedStage.destroy = (params) => {
        const extended = { ...params, stage: this };
        this.destroyCallbacks.forEach((cb) => cb(extended));
      };
    }
  }
  async addEntities(entities) {
    this._pendingEntities.push(...entities);
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
  // Fluent API for adding lifecycle callbacks
  onUpdate(...callbacks) {
    this.updateCallbacks.push(...callbacks);
    if (this.wrappedStage) {
      this.wrappedStage.update = (params) => {
        const extended = { ...params, stage: this };
        this.updateCallbacks.forEach((cb) => cb(extended));
      };
    }
    return this;
  }
  onSetup(...callbacks) {
    this.setupCallbacks.push(...callbacks);
    if (this.wrappedStage) {
      this.wrappedStage.setup = (params) => {
        const extended = { ...params, stage: this };
        this.setupCallbacks.forEach((cb) => cb(extended));
      };
    }
    return this;
  }
  onDestroy(...callbacks) {
    this.destroyCallbacks.push(...callbacks);
    if (this.wrappedStage) {
      this.wrappedStage.destroy = (params) => {
        const extended = { ...params, stage: this };
        this.destroyCallbacks.forEach((cb) => cb(extended));
      };
    }
    return this;
  }
  onLoading(callback) {
    if (!this.wrappedStage) {
      this.pendingLoadingCallbacks.push(callback);
      return () => {
        this.pendingLoadingCallbacks = this.pendingLoadingCallbacks.filter((c) => c !== callback);
      };
    }
    return this.wrappedStage.onLoading(callback);
  }
  /**
   * Find an entity by name on the current stage.
   * @param name The name of the entity to find
   * @param type Optional type symbol for type inference (e.g., TEXT_TYPE, SPRITE_TYPE)
   * @returns The entity if found, or undefined
   * @example stage.getEntityByName('scoreText', TEXT_TYPE)
   */
  getEntityByName(name, type) {
    const entity = this.wrappedStage?.children.find((c) => c.name === name);
    return entity;
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Events API
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Dispatch an event from the stage.
   * Events are emitted both locally and to the global event bus.
   */
  dispatch(event, payload) {
    this.eventDelegate.dispatch(event, payload);
    zylemEventBus.emit(event, payload);
  }
  /**
   * Listen for events on this stage instance.
   * @returns Unsubscribe function
   */
  listen(event, handler) {
    return this.eventDelegate.listen(event, handler);
  }
  /**
   * Clean up stage resources including event subscriptions.
   */
  dispose() {
    this.eventDelegate.dispose();
  }
};
function createStage(...options) {
  const _options = getStageOptions(options);
  return new Stage([..._options]);
}

// src/lib/stage/entity-spawner.ts
import { Euler, Quaternion as Quaternion3, Vector2 as Vector28 } from "three";
function entitySpawner(factory) {
  return {
    spawn: async (stage, x, y) => {
      const instance = await Promise.resolve(factory(x, y));
      stage.add(instance);
      return instance;
    },
    spawnRelative: async (source, stage, offset = new Vector28(0, 1)) => {
      if (!source.body) {
        console.warn("body missing for entity during spawnRelative");
        return void 0;
      }
      const { x, y, z } = source.body.translation();
      let rz = source._rotation2DAngle ?? 0;
      try {
        const r = source.body.rotation();
        const q = new Quaternion3(r.x, r.y, r.z, r.w);
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

// src/lib/stage/stage-events.ts
import { subscribe as subscribe5 } from "valtio/vanilla";
var STAGE_STATE_CHANGE = "STAGE_STATE_CHANGE";
function initStageStateDispatcher() {
  return subscribe5(stageState, () => {
    const detail = {
      entities: stageState.entities,
      variables: stageState.variables
    };
    window.dispatchEvent(new CustomEvent(STAGE_STATE_CHANGE, { detail }));
  });
}
function dispatchStageState() {
  const detail = {
    entities: stageState.entities,
    variables: stageState.variables
  };
  window.dispatchEvent(new CustomEvent(STAGE_STATE_CHANGE, { detail }));
}
export {
  STAGE_STATE_CHANGE,
  createStage,
  dispatchStageState,
  entitySpawner,
  initStageStateDispatcher
};
//# sourceMappingURL=stage.js.map