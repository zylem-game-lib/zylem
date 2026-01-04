var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/core/utility/path-utils.ts
function getByPath(obj, path) {
  if (!path) return void 0;
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") {
      return void 0;
    }
    current = current[key];
  }
  return current;
}
function setByPath(obj, path, value) {
  if (!path) return;
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] == null || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}
var init_path_utils = __esm({
  "src/lib/core/utility/path-utils.ts"() {
    "use strict";
  }
});

// src/lib/game/game-event-bus.ts
var GameEventBus, gameEventBus;
var init_game_event_bus = __esm({
  "src/lib/game/game-event-bus.ts"() {
    "use strict";
    GameEventBus = class {
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
    gameEventBus = new GameEventBus();
  }
});

// src/lib/game/game-state.ts
import { proxy, subscribe } from "valtio/vanilla";
function setGlobal(path, value) {
  const previousValue = getByPath(state.globals, path);
  setByPath(state.globals, path, value);
  gameEventBus.emit("game:state:updated", {
    path,
    value,
    previousValue
  });
}
function onGlobalChange(path, callback) {
  let previous = getByPath(state.globals, path);
  const unsub = subscribe(state.globals, () => {
    const current = getByPath(state.globals, path);
    if (current !== previous) {
      previous = current;
      callback(current);
    }
  });
  activeSubscriptions.add(unsub);
  return () => {
    unsub();
    activeSubscriptions.delete(unsub);
  };
}
function onGlobalChanges(paths, callback) {
  let previousValues = paths.map((p) => getByPath(state.globals, p));
  const unsub = subscribe(state.globals, () => {
    const currentValues = paths.map((p) => getByPath(state.globals, p));
    const hasChange = currentValues.some((val, i) => val !== previousValues[i]);
    if (hasChange) {
      previousValues = currentValues;
      callback(currentValues);
    }
  });
  activeSubscriptions.add(unsub);
  return () => {
    unsub();
    activeSubscriptions.delete(unsub);
  };
}
function getGlobals() {
  return state.globals;
}
function initGlobals(globals) {
  for (const [key, value] of Object.entries(globals)) {
    setByPath(state.globals, key, value);
  }
}
function resetGlobals() {
  state.globals = {};
}
function clearGlobalSubscriptions() {
  for (const unsub of activeSubscriptions) {
    unsub();
  }
  activeSubscriptions.clear();
}
var state, activeSubscriptions;
var init_game_state = __esm({
  "src/lib/game/game-state.ts"() {
    "use strict";
    init_path_utils();
    init_game_event_bus();
    state = proxy({
      id: "",
      globals: {},
      time: 0
    });
    activeSubscriptions = /* @__PURE__ */ new Set();
  }
});

// src/lib/debug/debug-state.ts
import { proxy as proxy2 } from "valtio";
function isPaused() {
  return debugState.paused;
}
function setPaused(paused) {
  debugState.paused = paused;
}
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
var debugState;
var init_debug_state = __esm({
  "src/lib/debug/debug-state.ts"() {
    "use strict";
    debugState = proxy2({
      enabled: false,
      paused: false,
      tool: "none",
      selectedEntity: null,
      hoveredEntity: null,
      flags: /* @__PURE__ */ new Set()
    });
  }
});

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
var init_mitt = __esm({
  "../../node_modules/.pnpm/mitt@3.0.1/node_modules/mitt/dist/mitt.mjs"() {
    "use strict";
  }
});

// src/lib/events/event-emitter-delegate.ts
var EventEmitterDelegate;
var init_event_emitter_delegate = __esm({
  "src/lib/events/event-emitter-delegate.ts"() {
    "use strict";
    init_mitt();
    EventEmitterDelegate = class {
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
  }
});

// src/lib/events/zylem-events.ts
var zylemEventBus;
var init_zylem_events = __esm({
  "src/lib/events/zylem-events.ts"() {
    "use strict";
    init_mitt();
    zylemEventBus = mitt_default();
  }
});

// src/lib/events/index.ts
var init_events = __esm({
  "src/lib/events/index.ts"() {
    "use strict";
    init_event_emitter_delegate();
    init_zylem_events();
  }
});

// src/lib/core/flags.ts
var DEBUG_FLAG;
var init_flags = __esm({
  "src/lib/core/flags.ts"() {
    "use strict";
    DEBUG_FLAG = import.meta.env.VITE_DEBUG_FLAG === "true";
  }
});

// src/lib/core/base-node.ts
import { nanoid } from "nanoid";
var BaseNode;
var init_base_node = __esm({
  "src/lib/core/base-node.ts"() {
    "use strict";
    init_flags();
    BaseNode = class _BaseNode {
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
  }
});

// src/lib/systems/transformable.system.ts
import {
  defineSystem,
  defineQuery,
  defineComponent,
  Types,
  removeQuery
} from "bitecs";
import { Quaternion } from "three";
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
var position, rotation, scale, _tempQuaternion;
var init_transformable_system = __esm({
  "src/lib/systems/transformable.system.ts"() {
    "use strict";
    position = defineComponent({
      x: Types.f32,
      y: Types.f32,
      z: Types.f32
    });
    rotation = defineComponent({
      x: Types.f32,
      y: Types.f32,
      z: Types.f32,
      w: Types.f32
    });
    scale = defineComponent({
      x: Types.f32,
      y: Types.f32,
      z: Types.f32
    });
    _tempQuaternion = new Quaternion();
  }
});

// src/lib/entities/entity.ts
import { ShaderMaterial } from "three";
var GameEntity;
var init_entity = __esm({
  "src/lib/entities/entity.ts"() {
    "use strict";
    init_transformable_system();
    init_base_node();
    init_events();
    GameEntity = class extends BaseNode {
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
  }
});

// src/lib/entities/delegates/loader.ts
function isLoadable(obj) {
  return typeof obj?.load === "function" && typeof obj?.data === "function";
}
var EntityLoader;
var init_loader = __esm({
  "src/lib/entities/delegates/loader.ts"() {
    "use strict";
    EntityLoader = class {
      entityReference;
      constructor(entity) {
        this.entityReference = entity;
      }
      async load() {
        if (this.entityReference.load) {
          await this.entityReference.load();
        }
      }
      async data() {
        if (this.entityReference.data) {
          return this.entityReference.data();
        }
        return null;
      }
    };
  }
});

// src/lib/entities/create.ts
async function createEntity(params) {
  const {
    args,
    defaultConfig,
    EntityClass,
    BuilderClass,
    entityType,
    MeshBuilderClass,
    CollisionBuilderClass
  } = params;
  let builder = null;
  let configuration;
  const configurationIndex = args.findIndex((node) => !(node instanceof BaseNode));
  if (configurationIndex !== -1) {
    const subArgs = args.splice(configurationIndex, 1);
    configuration = subArgs.find((node) => !(node instanceof BaseNode));
  }
  const mergedConfiguration = configuration ? { ...defaultConfig, ...configuration } : defaultConfig;
  args.push(mergedConfiguration);
  for (const arg of args) {
    if (arg instanceof BaseNode) {
      continue;
    }
    let entityData = null;
    const entity = new EntityClass(arg);
    try {
      if (isLoadable(entity)) {
        const loader = new EntityLoader(entity);
        await loader.load();
        entityData = await loader.data();
      }
    } catch (error) {
      console.error("Error creating entity with loader:", error);
    }
    builder = new BuilderClass(
      arg,
      entity,
      MeshBuilderClass ? new MeshBuilderClass(entityData) : null,
      CollisionBuilderClass ? new CollisionBuilderClass(entityData) : null
    );
    if (arg.material) {
      await builder.withMaterial(arg.material, entityType);
    }
  }
  if (!builder) {
    throw new Error(`missing options for ${String(entityType)}, builder is not initialized.`);
  }
  return await builder.build();
}
var init_create = __esm({
  "src/lib/entities/create.ts"() {
    "use strict";
    init_base_node();
    init_loader();
  }
});

// src/lib/core/entity-asset-loader.ts
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
var FBXAssetLoader, GLTFAssetLoader, EntityAssetLoader;
var init_entity_asset_loader = __esm({
  "src/lib/core/entity-asset-loader.ts"() {
    "use strict";
    FBXAssetLoader = class {
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
    GLTFAssetLoader = class {
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
    EntityAssetLoader = class {
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
  }
});

// src/lib/entities/delegates/animation.ts
import {
  AnimationMixer,
  LoopOnce,
  LoopRepeat
} from "three";
var AnimationDelegate;
var init_animation = __esm({
  "src/lib/entities/delegates/animation.ts"() {
    "use strict";
    init_entity_asset_loader();
    AnimationDelegate = class {
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
  }
});

// src/lib/collision/collision-builder.ts
import { ActiveCollisionTypes, ColliderDesc, RigidBodyDesc, RigidBodyType, Vector3 } from "@dimforge/rapier3d-compat";
function getOrCreateCollisionGroupId(type) {
  let groupId = typeToGroup.get(type);
  if (groupId === void 0) {
    groupId = nextGroupId++ % 16;
    typeToGroup.set(type, groupId);
  }
  return groupId;
}
function createCollisionFilter(allowedTypes) {
  let filter = 0;
  allowedTypes.forEach((type) => {
    const groupId = getOrCreateCollisionGroupId(type);
    filter |= 1 << groupId;
  });
  return filter;
}
var typeToGroup, nextGroupId, CollisionBuilder;
var init_collision_builder = __esm({
  "src/lib/collision/collision-builder.ts"() {
    "use strict";
    typeToGroup = /* @__PURE__ */ new Map();
    nextGroupId = 0;
    CollisionBuilder = class {
      static = false;
      sensor = false;
      gravity = new Vector3(0, 0, 0);
      build(options) {
        const bodyDesc = this.bodyDesc({
          isDynamicBody: !this.static
        });
        const collider = this.collider(options);
        const type = options.collisionType;
        if (type) {
          let groupId = getOrCreateCollisionGroupId(type);
          let filter = 65535;
          if (options.collisionFilter) {
            filter = createCollisionFilter(options.collisionFilter);
          }
          collider.setCollisionGroups(groupId << 16 | filter);
        }
        const { KINEMATIC_FIXED, DEFAULT } = ActiveCollisionTypes;
        collider.activeCollisionTypes = this.sensor ? KINEMATIC_FIXED : DEFAULT;
        return [bodyDesc, collider];
      }
      withCollision(collisionOptions) {
        this.sensor = collisionOptions?.sensor ?? this.sensor;
        this.static = collisionOptions?.static ?? this.static;
        return this;
      }
      collider(options) {
        const size = options.size ?? new Vector3(1, 1, 1);
        const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
        let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
        return colliderDesc;
      }
      bodyDesc({ isDynamicBody = true }) {
        const type = isDynamicBody ? RigidBodyType.Dynamic : RigidBodyType.Fixed;
        const bodyDesc = new RigidBodyDesc(type).setTranslation(0, 0, 0).setGravityScale(1).setCanSleep(false).setCcdEnabled(true);
        return bodyDesc;
      }
    };
  }
});

// src/lib/core/utility/strings.ts
function sortedStringify(obj) {
  const sortedObj = Object.keys(obj).sort().reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {});
  return JSON.stringify(sortedObj);
}
function shortHash(objString) {
  let hash = 0;
  for (let i = 0; i < objString.length; i++) {
    hash = Math.imul(31, hash) + objString.charCodeAt(i) | 0;
  }
  return hash.toString(36);
}
var init_strings = __esm({
  "src/lib/core/utility/strings.ts"() {
    "use strict";
  }
});

// src/lib/graphics/shaders/fragment/stars.glsl
var stars_default;
var init_stars = __esm({
  "src/lib/graphics/shaders/fragment/stars.glsl"() {
    "use strict";
    stars_default = "#include <common>\n\nuniform vec3 iResolution;\nuniform float iTime;\nvarying vec2 vUv;\n\n// Credit goes to:\n// https://www.shadertoy.com/view/mtyGWy\n\nvec3 palette( float t ) {\n    vec3 a = vec3(0.5, 0.5, 0.5);\n    vec3 b = vec3(0.5, 0.5, 0.5);\n    vec3 c = vec3(1.0, 1.0, 1.0);\n    vec3 d = vec3(0.263,0.416,0.557);\n\n    return a + b*cos( 6.28318*(c*t+d) );\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;\n    vec2 uv0 = uv;\n    vec3 finalColor = vec3(0.0);\n    \n    for (float i = 0.0; i < 4.0; i++) {\n        uv = fract(uv * 1.5) - 0.5;\n\n        float d = length(uv) * exp(-length(uv0));\n\n        vec3 col = palette(length(uv0) + i*.4 + iTime*.4);\n\n        d = sin(d*5. + iTime)/5.;\n        d = abs(d);\n\n        d = pow(0.01 / d, 1.2);\n\n        finalColor += col * d;\n    }\n        \n    fragColor = vec4(finalColor, 1.0);\n}\n \nvoid main() {\n  mainImage(gl_FragColor, vUv);\n}";
  }
});

// src/lib/graphics/shaders/fragment/fire.glsl
var fire_default;
var init_fire = __esm({
  "src/lib/graphics/shaders/fragment/fire.glsl"() {
    "use strict";
    fire_default = "#include <common>\n \nuniform vec3 iResolution;\nuniform float iTime;\nuniform vec2 iOffset;\nvarying vec2 vUv;\n\nfloat snoise(vec3 uv, float res)\n{\n	const vec3 s = vec3(1e0, 1e2, 1e3);\n	\n	uv *= res;\n	\n	vec3 uv0 = floor(mod(uv, res))*s;\n	vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;\n	\n	vec3 f = fract(uv); f = f*f*(3.0-2.0*f);\n\n	vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,\n		      	  uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);\n\n	vec4 r = fract(sin(v*1e-1)*1e3);\n	float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);\n	\n	r = fract(sin((v + uv1.z - uv0.z)*1e-1)*1e3);\n	float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);\n	\n	return mix(r0, r1, f.z)*2.-1.;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n	vec2 p = -.5 + fragCoord.xy / iResolution.xy;\n	p.x *= iResolution.x/iResolution.y;\n	\n	float color = 3.0 - (3.*length(2.*p));\n	\n	vec3 coord = vec3(atan(p.x,p.y)/6.2832+.5, length(p)*.4, .5);\n	\n	for(int i = 1; i <= 7; i++)\n	{\n		float power = pow(2.0, float(i));\n		color += (1.5 / power) * snoise(coord + vec3(0.,-iTime*.05, iTime*.01), power*16.);\n	}\n	fragColor = vec4( color, pow(max(color,0.),2.)*0.4, pow(max(color,0.),3.)*0.15 , 1.0);\n}\n\nvoid main() {\n  mainImage(gl_FragColor, vUv);\n}";
  }
});

// src/lib/graphics/shaders/fragment/standard.glsl
var standard_default;
var init_standard = __esm({
  "src/lib/graphics/shaders/fragment/standard.glsl"() {
    "use strict";
    standard_default = "uniform sampler2D tDiffuse;\nvarying vec2 vUv;\n\nvoid main() {\n	vec4 texel = texture2D( tDiffuse, vUv );\n\n	gl_FragColor = texel;\n}";
  }
});

// src/lib/graphics/shaders/fragment/debug.glsl
var debug_default;
var init_debug = __esm({
  "src/lib/graphics/shaders/fragment/debug.glsl"() {
    "use strict";
    debug_default = "varying vec3 vBarycentric;\nuniform vec3 baseColor;\nuniform vec3 wireframeColor;\nuniform float wireframeThickness;\n\nfloat edgeFactor() {\n    vec3 d = fwidth(vBarycentric);\n    vec3 a3 = smoothstep(vec3(0.0), d * wireframeThickness, vBarycentric);\n    return min(min(a3.x, a3.y), a3.z);\n}\n\nvoid main() {\n    float edge = edgeFactor();\n\n    vec3 wireColor = wireframeColor;\n\n    vec3 finalColor = mix(wireColor, baseColor, edge);\n    \n    gl_FragColor = vec4(finalColor, 1.0);\n}\n";
  }
});

// src/lib/graphics/shaders/vertex/object-shader.glsl
var object_shader_default;
var init_object_shader = __esm({
  "src/lib/graphics/shaders/vertex/object-shader.glsl"() {
    "use strict";
    object_shader_default = "uniform vec2 uvScale;\nvarying vec2 vUv;\n\nvoid main() {\n	vUv = uv;\n	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n	gl_Position = projectionMatrix * mvPosition;\n}";
  }
});

// src/lib/graphics/shaders/vertex/debug.glsl
var debug_default2;
var init_debug2 = __esm({
  "src/lib/graphics/shaders/vertex/debug.glsl"() {
    "use strict";
    debug_default2 = "varying vec3 vBarycentric;\n\nvoid main() {\n    vec3 barycentric = vec3(0.0);\n    int index = gl_VertexID % 3;\n    if (index == 0) barycentric = vec3(1.0, 0.0, 0.0);\n    else if (index == 1) barycentric = vec3(0.0, 1.0, 0.0);\n    else barycentric = vec3(0.0, 0.0, 1.0);\n    vBarycentric = barycentric;\n    \n    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}\n";
  }
});

// src/lib/core/preset-shader.ts
var starShader, fireShader, standardShader, debugShader, shaderMap, preset_shader_default;
var init_preset_shader = __esm({
  "src/lib/core/preset-shader.ts"() {
    "use strict";
    init_stars();
    init_fire();
    init_standard();
    init_debug();
    init_object_shader();
    init_debug2();
    starShader = {
      fragment: stars_default,
      vertex: object_shader_default
    };
    fireShader = {
      fragment: fire_default,
      vertex: object_shader_default
    };
    standardShader = {
      fragment: standard_default,
      vertex: object_shader_default
    };
    debugShader = {
      fragment: debug_default,
      vertex: debug_default2
    };
    shaderMap = /* @__PURE__ */ new Map();
    shaderMap.set("standard", standardShader);
    shaderMap.set("fire", fireShader);
    shaderMap.set("star", starShader);
    shaderMap.set("debug", debugShader);
    preset_shader_default = shaderMap;
  }
});

// src/lib/graphics/material.ts
import {
  Color as Color2,
  MeshPhongMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  ShaderMaterial as ShaderMaterial2,
  TextureLoader,
  Vector2,
  Vector3 as Vector32
} from "three";
var MaterialBuilder;
var init_material = __esm({
  "src/lib/graphics/material.ts"() {
    "use strict";
    init_strings();
    init_preset_shader();
    MaterialBuilder = class _MaterialBuilder {
      static batchMaterialMap = /* @__PURE__ */ new Map();
      materials = [];
      batchMaterial(options, entityType) {
        const batchKey = shortHash(sortedStringify(options));
        const mappedObject = _MaterialBuilder.batchMaterialMap.get(batchKey);
        if (mappedObject) {
          const count = mappedObject.geometryMap.get(entityType);
          if (count) {
            mappedObject.geometryMap.set(entityType, count + 1);
          } else {
            mappedObject.geometryMap.set(entityType, 1);
          }
        } else {
          _MaterialBuilder.batchMaterialMap.set(
            batchKey,
            {
              geometryMap: /* @__PURE__ */ new Map([[entityType, 1]]),
              material: this.materials[0]
            }
          );
        }
      }
      async build(options, entityType) {
        const { path, repeat, color, shader } = options;
        if (shader) this.withShader(shader);
        if (color) this.withColor(color);
        await this.setTexture(path ?? null, repeat);
        if (this.materials.length === 0) {
          this.setColor(new Color2("#ffffff"));
        }
        this.batchMaterial(options, entityType);
      }
      withColor(color) {
        this.setColor(color);
        return this;
      }
      withShader(shaderType) {
        this.setShader(shaderType);
        return this;
      }
      async setTexture(texturePath = null, repeat = new Vector2(1, 1)) {
        if (!texturePath) {
          return;
        }
        const loader = new TextureLoader();
        const texture = await loader.loadAsync(texturePath);
        texture.repeat = repeat;
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        const material = new MeshPhongMaterial({
          map: texture
        });
        this.materials.push(material);
      }
      setColor(color) {
        const material = new MeshStandardMaterial({
          color,
          emissiveIntensity: 0.5,
          lightMapIntensity: 0.5,
          fog: true
        });
        this.materials.push(material);
      }
      setShader(customShader) {
        const { fragment, vertex } = preset_shader_default.get(customShader) ?? preset_shader_default.get("standard");
        const shader = new ShaderMaterial2({
          uniforms: {
            iResolution: { value: new Vector32(1, 1, 1) },
            iTime: { value: 0 },
            tDiffuse: { value: null },
            tDepth: { value: null },
            tNormal: { value: null }
          },
          vertexShader: vertex,
          fragmentShader: fragment
        });
        this.materials.push(shader);
      }
    };
  }
});

// src/lib/entities/builder.ts
import { BufferGeometry, Mesh as Mesh2, Color as Color3 } from "three";
var EntityCollisionBuilder, EntityBuilder;
var init_builder = __esm({
  "src/lib/entities/builder.ts"() {
    "use strict";
    init_collision_builder();
    init_material();
    EntityCollisionBuilder = class extends CollisionBuilder {
    };
    EntityBuilder = class {
      meshBuilder;
      collisionBuilder;
      materialBuilder;
      options;
      entity;
      constructor(options, entity, meshBuilder, collisionBuilder) {
        this.options = options;
        this.entity = entity;
        this.meshBuilder = meshBuilder;
        this.collisionBuilder = collisionBuilder;
        this.materialBuilder = new MaterialBuilder();
        const builders = {
          meshBuilder: this.meshBuilder,
          collisionBuilder: this.collisionBuilder,
          materialBuilder: this.materialBuilder
        };
        this.options._builders = builders;
      }
      withPosition(setupPosition) {
        this.options.position = setupPosition;
        return this;
      }
      async withMaterial(options, entityType) {
        if (this.materialBuilder) {
          await this.materialBuilder.build(options, entityType);
        }
        return this;
      }
      applyMaterialToGroup(group, materials) {
        group.traverse((child) => {
          if (child instanceof Mesh2) {
            if (child.type === "SkinnedMesh" && materials[0] && !child.material.map) {
              child.material = materials[0];
            }
          }
          child.castShadow = true;
          child.receiveShadow = true;
        });
      }
      async build() {
        const entity = this.entity;
        if (this.materialBuilder) {
          entity.materials = this.materialBuilder.materials;
        }
        if (this.meshBuilder && entity.materials) {
          const geometry = this.meshBuilder.build(this.options);
          entity.mesh = this.meshBuilder._build(this.options, geometry, entity.materials);
          this.meshBuilder.postBuild();
        }
        if (entity.group && entity.materials) {
          this.applyMaterialToGroup(entity.group, entity.materials);
        }
        if (this.collisionBuilder) {
          this.collisionBuilder.withCollision(this.options?.collision || {});
          const [bodyDesc, colliderDesc] = this.collisionBuilder.build(this.options);
          entity.bodyDesc = bodyDesc;
          entity.colliderDesc = colliderDesc;
          const { x, y, z } = this.options.position || { x: 0, y: 0, z: 0 };
          entity.bodyDesc.setTranslation(x, y, z);
        }
        if (this.options.collisionType) {
          entity.collisionType = this.options.collisionType;
        }
        if (this.options.color instanceof Color3) {
          const applyColor = (material) => {
            const anyMat = material;
            if (anyMat && anyMat.color && anyMat.color.set) {
              anyMat.color.set(this.options.color);
            }
          };
          if (entity.materials?.length) {
            for (const mat of entity.materials) applyColor(mat);
          }
          if (entity.mesh && entity.mesh.material) {
            const mat = entity.mesh.material;
            if (Array.isArray(mat)) mat.forEach(applyColor);
            else applyColor(mat);
          }
          if (entity.group) {
            entity.group.traverse((child) => {
              if (child instanceof Mesh2 && child.material) {
                const mat = child.material;
                if (Array.isArray(mat)) mat.forEach(applyColor);
                else applyColor(mat);
              }
            });
          }
        }
        return entity;
      }
    };
  }
});

// src/lib/entities/actor.ts
import { ActiveCollisionTypes as ActiveCollisionTypes2, ColliderDesc as ColliderDesc2 } from "@dimforge/rapier3d-compat";
import { SkinnedMesh, Group as Group3, Vector3 as Vector33 } from "three";
var actorDefaults, ACTOR_TYPE, ZylemActor;
var init_actor = __esm({
  "src/lib/entities/actor.ts"() {
    "use strict";
    init_entity();
    init_entity_asset_loader();
    init_animation();
    actorDefaults = {
      position: { x: 0, y: 0, z: 0 },
      collision: {
        static: false,
        size: new Vector33(0.5, 0.5, 0.5),
        position: new Vector33(0, 0, 0)
      },
      material: {
        shader: "standard"
      },
      animations: [],
      models: []
    };
    ACTOR_TYPE = /* @__PURE__ */ Symbol("Actor");
    ZylemActor = class extends GameEntity {
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
          this.group = new Group3();
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
  }
});

// src/lib/collision/world.ts
import RAPIER from "@dimforge/rapier3d-compat";
function isCollisionHandlerDelegate(obj) {
  return typeof obj?.handlePostCollision === "function" && typeof obj?.handleIntersectionEvent === "function";
}
var ZylemWorld;
var init_world = __esm({
  "src/lib/collision/world.ts"() {
    "use strict";
    init_game_state();
    init_actor();
    ZylemWorld = class {
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
  }
});

// src/lib/graphics/zylem-scene.ts
import {
  Scene,
  Color as Color4,
  AmbientLight,
  DirectionalLight,
  Vector3 as Vector34,
  TextureLoader as TextureLoader2,
  GridHelper
} from "three";
var ZylemScene;
var init_zylem_scene = __esm({
  "src/lib/graphics/zylem-scene.ts"() {
    "use strict";
    init_debug_state();
    init_game_state();
    ZylemScene = class {
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
        const isColor = state2.backgroundColor instanceof Color4;
        const backgroundColor = isColor ? state2.backgroundColor : new Color4(state2.backgroundColor);
        scene.background = backgroundColor;
        if (state2.backgroundImage) {
          const loader = new TextureLoader2();
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
      add(object, position2 = new Vector34(0, 0, 0)) {
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
  }
});

// src/lib/stage/stage-state.ts
import { Color as Color5, Vector3 as Vector35 } from "three";
import { proxy as proxy3, subscribe as subscribe3 } from "valtio/vanilla";
function clearVariables(target) {
  variableProxyStore.delete(target);
}
var stageState, setStageBackgroundColor, setStageBackgroundImage, setStageVariables, resetStageVariables, variableProxyStore;
var init_stage_state = __esm({
  "src/lib/stage/stage-state.ts"() {
    "use strict";
    stageState = proxy3({
      backgroundColor: new Color5(Color5.NAMES.cornflowerblue),
      backgroundImage: null,
      inputs: {
        p1: ["gamepad-1", "keyboard-1"],
        p2: ["gamepad-2", "keyboard-2"]
      },
      variables: {},
      gravity: new Vector35(0, 0, 0),
      entities: []
    });
    setStageBackgroundColor = (value) => {
      stageState.backgroundColor = value;
    };
    setStageBackgroundImage = (value) => {
      stageState.backgroundImage = value;
    };
    setStageVariables = (variables) => {
      stageState.variables = { ...variables };
    };
    resetStageVariables = () => {
      stageState.variables = {};
    };
    variableProxyStore = /* @__PURE__ */ new Map();
  }
});

// src/lib/core/utility/vector.ts
import { Color as Color6 } from "three";
import { Vector3 as Vector36 } from "@dimforge/rapier3d-compat";
var ZylemBlueColor, Vec0, Vec1;
var init_vector = __esm({
  "src/lib/core/utility/vector.ts"() {
    "use strict";
    ZylemBlueColor = new Color6("#0333EC");
    Vec0 = new Vector36(0, 0, 0);
    Vec1 = new Vector36(1, 1, 1);
  }
});

// src/lib/core/lifecycle-base.ts
var LifeCycleBase;
var init_lifecycle_base = __esm({
  "src/lib/core/lifecycle-base.ts"() {
    "use strict";
    LifeCycleBase = class {
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
  }
});

// src/lib/stage/debug-entity-cursor.ts
import {
  Box3,
  BoxGeometry,
  Color as Color7,
  EdgesGeometry,
  Group as Group4,
  LineBasicMaterial,
  LineSegments,
  Mesh as Mesh3,
  MeshBasicMaterial,
  Vector3 as Vector37
} from "three";
var DebugEntityCursor;
var init_debug_entity_cursor = __esm({
  "src/lib/stage/debug-entity-cursor.ts"() {
    "use strict";
    DebugEntityCursor = class {
      scene;
      container;
      fillMesh;
      edgeLines;
      currentColor = new Color7(65280);
      bbox = new Box3();
      size = new Vector37();
      center = new Vector37();
      constructor(scene) {
        this.scene = scene;
        const initialGeometry = new BoxGeometry(1, 1, 1);
        this.fillMesh = new Mesh3(
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
        this.container = new Group4();
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
  }
});

// src/lib/stage/stage-debug-delegate.ts
import { Ray } from "@dimforge/rapier3d-compat";
import { BufferAttribute, BufferGeometry as BufferGeometry3, LineBasicMaterial as LineBasicMaterial2, LineSegments as LineSegments2, Raycaster, Vector2 as Vector22 } from "three";
var SELECT_TOOL_COLOR, DELETE_TOOL_COLOR, StageDebugDelegate;
var init_stage_debug_delegate = __esm({
  "src/lib/stage/stage-debug-delegate.ts"() {
    "use strict";
    init_debug_state();
    init_debug_entity_cursor();
    SELECT_TOOL_COLOR = 2293538;
    DELETE_TOOL_COLOR = 16724787;
    StageDebugDelegate = class {
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
            new BufferGeometry3(),
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
  }
});

// src/lib/stage/stage-camera-debug-delegate.ts
import { subscribe as subscribe4 } from "valtio/vanilla";
var StageCameraDebugDelegate;
var init_stage_camera_debug_delegate = __esm({
  "src/lib/stage/stage-camera-debug-delegate.ts"() {
    "use strict";
    init_debug_state();
    StageCameraDebugDelegate = class {
      stage;
      constructor(stage) {
        this.stage = stage;
      }
      subscribe(listener) {
        const notify = () => listener(this.snapshot());
        notify();
        return subscribe4(debugState, notify);
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
  }
});

// src/lib/camera/perspective.ts
var Perspectives;
var init_perspective = __esm({
  "src/lib/camera/perspective.ts"() {
    "use strict";
    Perspectives = {
      FirstPerson: "first-person",
      ThirdPerson: "third-person",
      Isometric: "isometric",
      Flat2D: "flat-2d",
      Fixed2D: "fixed-2d"
    };
  }
});

// src/lib/camera/third-person.ts
import { Vector3 as Vector39 } from "three";
var ThirdPersonCamera;
var init_third_person = __esm({
  "src/lib/camera/third-person.ts"() {
    "use strict";
    ThirdPersonCamera = class {
      distance;
      screenResolution = null;
      renderer = null;
      scene = null;
      cameraRef = null;
      constructor() {
        this.distance = new Vector39(0, 5, 8);
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
  }
});

// src/lib/camera/fixed-2d.ts
var Fixed2DCamera;
var init_fixed_2d = __esm({
  "src/lib/camera/fixed-2d.ts"() {
    "use strict";
    Fixed2DCamera = class {
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
  }
});

// src/lib/graphics/shaders/vertex/standard.glsl
var standard_default2;
var init_standard2 = __esm({
  "src/lib/graphics/shaders/vertex/standard.glsl"() {
    "use strict";
    standard_default2 = "varying vec2 vUv;\n\nvoid main() {\n	vUv = uv;\n	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}";
  }
});

// src/lib/graphics/render-pass.ts
import * as THREE from "three";
import { WebGLRenderTarget } from "three";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";
var RenderPass;
var init_render_pass = __esm({
  "src/lib/graphics/render-pass.ts"() {
    "use strict";
    init_standard();
    init_standard2();
    RenderPass = class extends Pass {
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
  }
});

// src/lib/camera/camera-debug-delegate.ts
import { Vector3 as Vector310 } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
var CameraOrbitController;
var init_camera_debug_delegate = __esm({
  "src/lib/camera/camera-debug-delegate.ts"() {
    "use strict";
    CameraOrbitController = class {
      camera;
      domElement;
      orbitControls = null;
      orbitTarget = null;
      orbitTargetWorldPos = new Vector310();
      debugDelegate = null;
      debugUnsubscribe = null;
      debugStateSnapshot = { enabled: false, selected: [] };
      // Saved camera state for restoration when exiting debug mode
      savedCameraPosition = null;
      savedCameraQuaternion = null;
      savedCameraZoom = null;
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
          this.updateOrbitTargetFromSelection(state2.selected);
        } else if (!state2.enabled && wasEnabled) {
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
    };
  }
});

// src/lib/camera/zylem-camera.ts
import { PerspectiveCamera, Vector3 as Vector311, Object3D as Object3D6, OrthographicCamera, WebGLRenderer as WebGLRenderer3 } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
var ZylemCamera;
var init_zylem_camera = __esm({
  "src/lib/camera/zylem-camera.ts"() {
    "use strict";
    init_perspective();
    init_third_person();
    init_fixed_2d();
    init_render_pass();
    init_camera_debug_delegate();
    ZylemCamera = class {
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
          this.cameraRig = new Object3D6();
          this.cameraRig.position.set(0, 3, 10);
          this.cameraRig.add(this.camera);
          this.camera.lookAt(new Vector311(0, 2, 0));
        } else {
          this.camera.position.set(0, 0, 10);
          this.camera.lookAt(new Vector311(0, 0, 0));
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
  }
});

// src/lib/stage/stage-camera-delegate.ts
import { Vector2 as Vector25 } from "three";
var StageCameraDelegate;
var init_stage_camera_delegate = __esm({
  "src/lib/stage/stage-camera-delegate.ts"() {
    "use strict";
    init_zylem_camera();
    init_perspective();
    StageCameraDelegate = class {
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
  }
});

// src/lib/stage/stage-loading-delegate.ts
var StageLoadingDelegate;
var init_stage_loading_delegate = __esm({
  "src/lib/stage/stage-loading-delegate.ts"() {
    "use strict";
    init_game_event_bus();
    StageLoadingDelegate = class {
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
  }
});

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
var init_options_parser = __esm({
  "src/lib/core/utility/options-parser.ts"() {
    "use strict";
  }
});

// src/lib/stage/stage-config.ts
import { Vector3 as Vector312 } from "three";
function createDefaultStageConfig() {
  return new StageConfig(
    {
      p1: ["gamepad-1", "keyboard-1"],
      p2: ["gamepad-2", "keyboard-2"]
    },
    ZylemBlueColor,
    null,
    new Vector312(0, 0, 0),
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
var StageConfig;
var init_stage_config = __esm({
  "src/lib/stage/stage-config.ts"() {
    "use strict";
    init_options_parser();
    init_vector();
    StageConfig = class {
      constructor(inputs, backgroundColor, backgroundImage, gravity, variables) {
        this.inputs = inputs;
        this.backgroundColor = backgroundColor;
        this.backgroundImage = backgroundImage;
        this.gravity = gravity;
        this.variables = variables;
      }
    };
  }
});

// src/lib/stage/zylem-stage.ts
import { addComponent, addEntity, createWorld as createECS, removeEntity } from "bitecs";
import { Color as Color9, Vector3 as Vector313 } from "three";
import { subscribe as subscribe5 } from "valtio/vanilla";
import { nanoid as nanoid2 } from "nanoid";
var STAGE_TYPE, ZylemStage;
var init_zylem_stage = __esm({
  "src/lib/stage/zylem-stage.ts"() {
    "use strict";
    init_world();
    init_zylem_scene();
    init_stage_state();
    init_vector();
    init_debug_state();
    init_game_state();
    init_lifecycle_base();
    init_transformable_system();
    init_stage_debug_delegate();
    init_stage_camera_debug_delegate();
    init_stage_camera_delegate();
    init_stage_loading_delegate();
    init_entity();
    init_stage_config();
    init_options_parser();
    STAGE_TYPE = "Stage";
    ZylemStage = class extends LifeCycleBase {
      type = STAGE_TYPE;
      state = {
        backgroundColor: ZylemBlueColor,
        backgroundImage: null,
        inputs: {
          p1: ["gamepad-1", "keyboard"],
          p2: ["gamepad-2", "keyboard"]
        },
        gravity: new Vector313(0, 0, 0),
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
        this.gravity = parsed.config.gravity ?? new Vector313(0, 0, 0);
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
        const color = backgroundColor instanceof Color9 ? backgroundColor : new Color9(backgroundColor);
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
        const physicsWorld = await ZylemWorld.loadPhysics(this.gravity ?? new Vector313(0, 0, 0));
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
        this.debugStateUnsubscribe = subscribe5(debugState, () => {
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
  }
});

// src/lib/camera/camera.ts
import { Vector2 as Vector27, Vector3 as Vector314 } from "three";
var CameraWrapper;
var init_camera = __esm({
  "src/lib/camera/camera.ts"() {
    "use strict";
    CameraWrapper = class {
      cameraRef;
      constructor(camera) {
        this.cameraRef = camera;
      }
    };
  }
});

// src/lib/stage/stage-default.ts
import { proxy as proxy4 } from "valtio/vanilla";
import { Vector3 as Vector315 } from "three";
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
var initialDefaults, stageDefaultsState;
var init_stage_default = __esm({
  "src/lib/stage/stage-default.ts"() {
    "use strict";
    init_vector();
    initialDefaults = {
      backgroundColor: ZylemBlueColor,
      backgroundImage: null,
      inputs: {
        p1: ["gamepad-1", "keyboard"],
        p2: ["gamepad-2", "keyboard"]
      },
      gravity: new Vector315(0, 0, 0),
      variables: {}
    };
    stageDefaultsState = proxy4({
      ...initialDefaults
    });
  }
});

// src/lib/stage/stage.ts
function createStage(...options) {
  const _options = getStageOptions(options);
  return new Stage([..._options]);
}
var Stage;
var init_stage = __esm({
  "src/lib/stage/stage.ts"() {
    "use strict";
    init_zylem_stage();
    init_camera();
    init_stage_state();
    init_stage_default();
    init_events();
    Stage = class {
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
  }
});

// src/lib/game/game-default.ts
var game_default_exports = {};
__export(game_default_exports, {
  getGameDefaultConfig: () => getGameDefaultConfig
});
import { proxy as proxy5 } from "valtio/vanilla";
function getGameDefaultConfig() {
  return {
    id: gameDefaultsState.id ?? "zylem",
    globals: gameDefaultsState.globals ?? {},
    stages: gameDefaultsState.stages ?? [createStage()],
    debug: gameDefaultsState.debug,
    time: gameDefaultsState.time,
    input: gameDefaultsState.input
  };
}
var initialDefaults2, gameDefaultsState;
var init_game_default = __esm({
  "src/lib/game/game-default.ts"() {
    "use strict";
    init_stage();
    initialDefaults2 = () => {
      return {
        id: "zylem",
        globals: {},
        stages: [createStage()],
        debug: false,
        time: 0,
        input: void 0
      };
    };
    gameDefaultsState = proxy5(
      { ...initialDefaults2() }
    );
  }
});

// src/lib/game/zylem-game.ts
init_game_state();
init_debug_state();

// src/lib/input/keyboard-provider.ts
var KeyboardProvider = class {
  keyStates = /* @__PURE__ */ new Map();
  keyButtonStates = /* @__PURE__ */ new Map();
  mapping = null;
  includeDefaultBase = true;
  constructor(mapping, options) {
    this.mapping = mapping ?? null;
    this.includeDefaultBase = options?.includeDefaultBase ?? true;
    window.addEventListener("keydown", ({ key }) => this.keyStates.set(key, true));
    window.addEventListener("keyup", ({ key }) => this.keyStates.set(key, false));
  }
  isKeyPressed(key) {
    return this.keyStates.get(key) || false;
  }
  handleButtonState(key, delta) {
    let buttonState = this.keyButtonStates.get(key);
    const isPressed = this.isKeyPressed(key);
    if (!buttonState) {
      buttonState = { pressed: false, released: false, held: 0 };
      this.keyButtonStates.set(key, buttonState);
    }
    if (isPressed) {
      if (buttonState.held === 0) {
        buttonState.pressed = true;
      } else {
        buttonState.pressed = false;
      }
      buttonState.held += delta;
      buttonState.released = false;
    } else {
      if (buttonState.held > 0) {
        buttonState.released = true;
        buttonState.held = 0;
      } else {
        buttonState.released = false;
      }
      buttonState.pressed = false;
    }
    return buttonState;
  }
  handleAnalogState(negativeKey, positiveKey, delta) {
    const value = this.getAxisValue(negativeKey, positiveKey);
    return { value, held: delta };
  }
  mergeButtonState(a, b) {
    return {
      pressed: a?.pressed || b?.pressed || false,
      released: a?.released || b?.released || false,
      held: (a?.held || 0) + (b?.held || 0)
    };
  }
  applyCustomMapping(input, delta) {
    if (!this.mapping) return input;
    for (const [key, targets] of Object.entries(this.mapping)) {
      if (!targets || targets.length === 0) continue;
      const state2 = this.handleButtonState(key, delta);
      for (const target of targets) {
        const [rawCategory, rawName] = (target || "").split(".");
        if (!rawCategory || !rawName) continue;
        const category = rawCategory.toLowerCase();
        const nameKey = rawName.toLowerCase();
        if (category === "buttons") {
          const map = {
            "a": "A",
            "b": "B",
            "x": "X",
            "y": "Y",
            "start": "Start",
            "select": "Select",
            "l": "L",
            "r": "R"
          };
          const prop = map[nameKey];
          if (!prop) continue;
          const nextButtons = input.buttons || {};
          nextButtons[prop] = this.mergeButtonState(nextButtons[prop], state2);
          input.buttons = nextButtons;
          continue;
        }
        if (category === "directions") {
          const map = {
            "up": "Up",
            "down": "Down",
            "left": "Left",
            "right": "Right"
          };
          const prop = map[nameKey];
          if (!prop) continue;
          const nextDirections = input.directions || {};
          nextDirections[prop] = this.mergeButtonState(nextDirections[prop], state2);
          input.directions = nextDirections;
          continue;
        }
        if (category === "shoulders") {
          const map = {
            "ltrigger": "LTrigger",
            "rtrigger": "RTrigger"
          };
          const prop = map[nameKey];
          if (!prop) continue;
          const nextShoulders = input.shoulders || {};
          nextShoulders[prop] = this.mergeButtonState(nextShoulders[prop], state2);
          input.shoulders = nextShoulders;
          continue;
        }
      }
    }
    return input;
  }
  getInput(delta) {
    const base = {};
    if (this.includeDefaultBase) {
      base.buttons = {
        A: this.handleButtonState("z", delta),
        B: this.handleButtonState("x", delta),
        X: this.handleButtonState("a", delta),
        Y: this.handleButtonState("s", delta),
        Start: this.handleButtonState(" ", delta),
        Select: this.handleButtonState("Enter", delta),
        L: this.handleButtonState("q", delta),
        R: this.handleButtonState("e", delta)
      };
      base.directions = {
        Up: this.handleButtonState("ArrowUp", delta),
        Down: this.handleButtonState("ArrowDown", delta),
        Left: this.handleButtonState("ArrowLeft", delta),
        Right: this.handleButtonState("ArrowRight", delta)
      };
      base.axes = {
        Horizontal: this.handleAnalogState("ArrowLeft", "ArrowRight", delta),
        Vertical: this.handleAnalogState("ArrowUp", "ArrowDown", delta)
      };
      base.shoulders = {
        LTrigger: this.handleButtonState("Q", delta),
        RTrigger: this.handleButtonState("E", delta)
      };
    }
    return this.applyCustomMapping(base, delta);
  }
  getName() {
    return "keyboard";
  }
  getAxisValue(negativeKey, positiveKey) {
    return (this.isKeyPressed(positiveKey) ? 1 : 0) - (this.isKeyPressed(negativeKey) ? 1 : 0);
  }
  isConnected() {
    return true;
  }
};

// src/lib/input/gamepad-provider.ts
var GamepadProvider = class {
  gamepadIndex;
  connected = false;
  buttonStates = {};
  constructor(gamepadIndex) {
    this.gamepadIndex = gamepadIndex;
    window.addEventListener("gamepadconnected", (e) => {
      if (e.gamepad.index === this.gamepadIndex) {
        this.connected = true;
      }
    });
    window.addEventListener("gamepaddisconnected", (e) => {
      if (e.gamepad.index === this.gamepadIndex) {
        this.connected = false;
      }
    });
  }
  handleButtonState(index, gamepad, delta) {
    const isPressed = gamepad.buttons[index].pressed;
    let buttonState = this.buttonStates[index];
    if (!buttonState) {
      buttonState = { pressed: false, released: false, held: 0 };
      this.buttonStates[index] = buttonState;
    }
    if (isPressed) {
      if (buttonState.held === 0) {
        buttonState.pressed = true;
      } else {
        buttonState.pressed = false;
      }
      buttonState.held += delta;
      buttonState.released = false;
    } else {
      if (buttonState.held > 0) {
        buttonState.released = true;
        buttonState.held = 0;
      } else {
        buttonState.released = false;
      }
      buttonState.pressed = false;
    }
    return buttonState;
  }
  handleAnalogState(index, gamepad, delta) {
    const value = gamepad.axes[index];
    return { value, held: delta };
  }
  getInput(delta) {
    const gamepad = navigator.getGamepads()[this.gamepadIndex];
    if (!gamepad) return {};
    return {
      buttons: {
        A: this.handleButtonState(0, gamepad, delta),
        B: this.handleButtonState(1, gamepad, delta),
        X: this.handleButtonState(2, gamepad, delta),
        Y: this.handleButtonState(3, gamepad, delta),
        Start: this.handleButtonState(9, gamepad, delta),
        Select: this.handleButtonState(8, gamepad, delta),
        L: this.handleButtonState(4, gamepad, delta),
        R: this.handleButtonState(5, gamepad, delta)
      },
      directions: {
        Up: this.handleButtonState(12, gamepad, delta),
        Down: this.handleButtonState(13, gamepad, delta),
        Left: this.handleButtonState(14, gamepad, delta),
        Right: this.handleButtonState(15, gamepad, delta)
      },
      axes: {
        Horizontal: this.handleAnalogState(0, gamepad, delta),
        Vertical: this.handleAnalogState(1, gamepad, delta)
      },
      shoulders: {
        LTrigger: this.handleButtonState(6, gamepad, delta),
        RTrigger: this.handleButtonState(7, gamepad, delta)
      }
    };
  }
  getName() {
    return `gamepad-${this.gamepadIndex + 1}`;
  }
  isConnected() {
    return this.connected;
  }
};

// src/lib/input/input-manager.ts
var InputManager = class {
  inputMap = /* @__PURE__ */ new Map();
  currentInputs = {};
  previousInputs = {};
  constructor(config) {
    if (config?.p1?.key) {
      this.addInputProvider(1, new KeyboardProvider(config.p1.key, { includeDefaultBase: false }));
    } else {
      this.addInputProvider(1, new KeyboardProvider());
    }
    this.addInputProvider(1, new GamepadProvider(0));
    if (config?.p2?.key) {
      this.addInputProvider(2, new KeyboardProvider(config.p2.key, { includeDefaultBase: false }));
    }
    this.addInputProvider(2, new GamepadProvider(1));
    if (config?.p3?.key) {
      this.addInputProvider(3, new KeyboardProvider(config.p3.key, { includeDefaultBase: false }));
    }
    this.addInputProvider(3, new GamepadProvider(2));
    if (config?.p4?.key) {
      this.addInputProvider(4, new KeyboardProvider(config.p4.key, { includeDefaultBase: false }));
    }
    this.addInputProvider(4, new GamepadProvider(3));
    if (config?.p5?.key) {
      this.addInputProvider(5, new KeyboardProvider(config.p5.key, { includeDefaultBase: false }));
    }
    this.addInputProvider(5, new GamepadProvider(4));
    if (config?.p6?.key) {
      this.addInputProvider(6, new KeyboardProvider(config.p6.key, { includeDefaultBase: false }));
    }
    this.addInputProvider(6, new GamepadProvider(5));
    if (config?.p7?.key) {
      this.addInputProvider(7, new KeyboardProvider(config.p7.key, { includeDefaultBase: false }));
    }
    this.addInputProvider(7, new GamepadProvider(6));
    if (config?.p8?.key) {
      this.addInputProvider(8, new KeyboardProvider(config.p8.key, { includeDefaultBase: false }));
    }
    this.addInputProvider(8, new GamepadProvider(7));
  }
  addInputProvider(playerNumber, provider) {
    if (!this.inputMap.has(playerNumber)) {
      this.inputMap.set(playerNumber, []);
    }
    this.inputMap.get(playerNumber)?.push(provider);
  }
  getInputs(delta) {
    const inputs = {};
    this.inputMap.forEach((providers, playerNumber) => {
      const playerKey = `p${playerNumber}`;
      const mergedInput = providers.reduce((acc, provider) => {
        const input = provider.getInput(delta);
        return this.mergeInputs(acc, input);
      }, {});
      inputs[playerKey] = {
        playerNumber,
        ...mergedInput
      };
    });
    return inputs;
  }
  mergeButtonState(a, b) {
    return {
      pressed: a?.pressed || b?.pressed || false,
      released: a?.released || b?.released || false,
      held: (a?.held || 0) + (b?.held || 0)
    };
  }
  mergeAnalogState(a, b) {
    return {
      value: (a?.value || 0) + (b?.value || 0),
      held: (a?.held || 0) + (b?.held || 0)
    };
  }
  mergeInputs(a, b) {
    return {
      buttons: {
        A: this.mergeButtonState(a.buttons?.A, b.buttons?.A),
        B: this.mergeButtonState(a.buttons?.B, b.buttons?.B),
        X: this.mergeButtonState(a.buttons?.X, b.buttons?.X),
        Y: this.mergeButtonState(a.buttons?.Y, b.buttons?.Y),
        Start: this.mergeButtonState(a.buttons?.Start, b.buttons?.Start),
        Select: this.mergeButtonState(a.buttons?.Select, b.buttons?.Select),
        L: this.mergeButtonState(a.buttons?.L, b.buttons?.L),
        R: this.mergeButtonState(a.buttons?.R, b.buttons?.R)
      },
      directions: {
        Up: this.mergeButtonState(a.directions?.Up, b.directions?.Up),
        Down: this.mergeButtonState(a.directions?.Down, b.directions?.Down),
        Left: this.mergeButtonState(a.directions?.Left, b.directions?.Left),
        Right: this.mergeButtonState(a.directions?.Right, b.directions?.Right)
      },
      axes: {
        Horizontal: this.mergeAnalogState(a.axes?.Horizontal, b.axes?.Horizontal),
        Vertical: this.mergeAnalogState(a.axes?.Vertical, b.axes?.Vertical)
      },
      shoulders: {
        LTrigger: this.mergeButtonState(a.shoulders?.LTrigger, b.shoulders?.LTrigger),
        RTrigger: this.mergeButtonState(a.shoulders?.RTrigger, b.shoulders?.RTrigger)
      }
    };
  }
};

// src/lib/core/three-addons/Timer.ts
var Timer = class {
  _previousTime;
  _currentTime;
  _startTime;
  _delta;
  _elapsed;
  _timescale;
  _document;
  _pageVisibilityHandler;
  /**
   * Constructs a new timer.
   */
  constructor() {
    this._previousTime = 0;
    this._currentTime = 0;
    this._startTime = now();
    this._delta = 0;
    this._elapsed = 0;
    this._timescale = 1;
    this._document = null;
    this._pageVisibilityHandler = null;
  }
  /**
   * Connect the timer to the given document.Calling this method is not mandatory to
   * use the timer but enables the usage of the Page Visibility API to avoid large time
   * delta values.
   *
   * @param {Document} document - The document.
   */
  connect(document2) {
    this._document = document2;
    if (document2.hidden !== void 0) {
      this._pageVisibilityHandler = handleVisibilityChange.bind(this);
      document2.addEventListener("visibilitychange", this._pageVisibilityHandler, false);
    }
  }
  /**
   * Disconnects the timer from the DOM and also disables the usage of the Page Visibility API.
   */
  disconnect() {
    if (this._pageVisibilityHandler !== null) {
      this._document.removeEventListener("visibilitychange", this._pageVisibilityHandler);
      this._pageVisibilityHandler = null;
    }
    this._document = null;
  }
  /**
   * Returns the time delta in seconds.
   *
   * @return {number} The time delta in second.
   */
  getDelta() {
    return this._delta / 1e3;
  }
  /**
   * Returns the elapsed time in seconds.
   *
   * @return {number} The elapsed time in second.
   */
  getElapsed() {
    return this._elapsed / 1e3;
  }
  /**
   * Returns the timescale.
   *
   * @return {number} The timescale.
   */
  getTimescale() {
    return this._timescale;
  }
  /**
   * Sets the given timescale which scale the time delta computation
   * in `update()`.
   *
   * @param {number} timescale - The timescale to set.
   * @return {Timer} A reference to this timer.
   */
  setTimescale(timescale) {
    this._timescale = timescale;
    return this;
  }
  /**
   * Resets the time computation for the current simulation step.
   *
   * @return {Timer} A reference to this timer.
   */
  reset() {
    this._currentTime = now() - this._startTime;
    return this;
  }
  /**
   * Can be used to free all internal resources. Usually called when
   * the timer instance isn't required anymore.
   */
  dispose() {
    this.disconnect();
  }
  /**
   * Updates the internal state of the timer. This method should be called
   * once per simulation step and before you perform queries against the timer
   * (e.g. via `getDelta()`).
   *
   * @param {number} timestamp - The current time in milliseconds. Can be obtained
   * from the `requestAnimationFrame` callback argument. If not provided, the current
   * time will be determined with `performance.now`.
   * @return {Timer} A reference to this timer.
   */
  update(timestamp) {
    if (this._pageVisibilityHandler !== null && this._document.hidden === true) {
      this._delta = 0;
    } else {
      this._previousTime = this._currentTime;
      this._currentTime = (timestamp !== void 0 ? timestamp : now()) - this._startTime;
      this._delta = (this._currentTime - this._previousTime) * this._timescale;
      this._elapsed += this._delta;
    }
    return this;
  }
};
function now() {
  return performance.now();
}
function handleVisibilityChange() {
  if (this._document.hidden === false) this.reset();
}

// src/lib/device/aspect-ratio.ts
var AspectRatio = {
  FourByThree: 4 / 3,
  SixteenByNine: 16 / 9,
  TwentyOneByNine: 21 / 9,
  OneByOne: 1 / 1
};
var AspectRatioDelegate = class {
  container;
  canvas;
  aspectRatio;
  onResize;
  handleResizeBound;
  constructor(params) {
    this.container = params.container;
    this.canvas = params.canvas;
    this.aspectRatio = typeof params.aspectRatio === "number" ? params.aspectRatio : params.aspectRatio;
    this.onResize = params.onResize;
    this.handleResizeBound = this.apply.bind(this);
  }
  /** Attach window resize listener and apply once. */
  attach() {
    window.addEventListener("resize", this.handleResizeBound);
    this.apply();
  }
  /** Detach window resize listener. */
  detach() {
    window.removeEventListener("resize", this.handleResizeBound);
  }
  /** Compute the largest size that fits container while preserving aspect. */
  measure() {
    const containerWidth = this.container.clientWidth || window.innerWidth;
    const containerHeight = this.container.clientHeight || window.innerHeight;
    const containerRatio = containerWidth / containerHeight;
    if (containerRatio > this.aspectRatio) {
      const height = containerHeight;
      const width = Math.round(height * this.aspectRatio);
      return { width, height };
    } else {
      const width = containerWidth;
      const height = Math.round(width / this.aspectRatio);
      return { width, height };
    }
  }
  /** Apply measured size to canvas and notify. */
  apply() {
    const { width, height } = this.measure();
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.onResize?.(width, height);
  }
};

// src/lib/game/game-retro-resolutions.ts
var RetroPresets = {
  NES: {
    displayAspect: 4 / 3,
    resolutions: [
      { key: "256x240", width: 256, height: 240, notes: "Standard NTSC; effective 240p." }
    ]
  },
  SNES: {
    displayAspect: 4 / 3,
    resolutions: [
      { key: "256x224", width: 256, height: 224, notes: "Common 240p-equivalent mode." },
      { key: "512x448", width: 512, height: 448, notes: "Hi-res interlaced (480i)." }
    ]
  },
  N64: {
    displayAspect: 4 / 3,
    resolutions: [
      { key: "320x240", width: 320, height: 240, notes: "Common 240p mode." },
      { key: "640x480", width: 640, height: 480, notes: "Higher resolution (480i)." }
    ]
  },
  PS1: {
    displayAspect: 4 / 3,
    resolutions: [
      { key: "320x240", width: 320, height: 240, notes: "Progressive 240p common." },
      { key: "640x480", width: 640, height: 480, notes: "Interlaced 480i for higher detail." }
    ]
  },
  PS2: {
    displayAspect: 4 / 3,
    resolutions: [
      { key: "640x480", width: 640, height: 480, notes: "480i/480p baseline." },
      { key: "720x480", width: 720, height: 480, notes: "480p (widescreen capable in some titles)." },
      { key: "1280x720", width: 1280, height: 720, notes: "720p (select titles)." }
    ]
  },
  PS5: {
    displayAspect: 16 / 9,
    resolutions: [
      { key: "720x480", width: 720, height: 480, notes: "Legacy compatibility." },
      { key: "1280x720", width: 1280, height: 720, notes: "720p." },
      { key: "1920x1080", width: 1920, height: 1080, notes: "1080p." },
      { key: "2560x1440", width: 2560, height: 1440, notes: "1440p." },
      { key: "3840x2160", width: 3840, height: 2160, notes: "4K (up to 120Hz)." },
      { key: "7680x4320", width: 7680, height: 4320, notes: "8K (limited)." }
    ]
  },
  XboxOne: {
    displayAspect: 16 / 9,
    resolutions: [
      { key: "1280x720", width: 1280, height: 720, notes: "720p (original)." },
      { key: "1920x1080", width: 1920, height: 1080, notes: "1080p (original)." },
      { key: "3840x2160", width: 3840, height: 2160, notes: "4K UHD (S/X models)." }
    ]
  }
};
function getDisplayAspect(preset) {
  return RetroPresets[preset].displayAspect;
}
function getPresetResolution(preset, key) {
  const list = RetroPresets[preset]?.resolutions || [];
  if (!key) return list[0];
  const normalized = key.toLowerCase().replace(/\s+/g, "").replace("\xD7", "x");
  return list.find((r) => r.key.toLowerCase() === normalized);
}
function parseResolution(text2) {
  if (!text2) return null;
  const normalized = String(text2).toLowerCase().trim().replace(/\s+/g, "").replace("\xD7", "x");
  const match = normalized.match(/^(\d+)x(\d+)$/);
  if (!match) return null;
  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  return { width, height };
}

// src/lib/game/game-config.ts
var GameConfig = class {
  constructor(id, globals, stages, debug, time, input, aspectRatio, internalResolution, fullscreen, bodyBackground, container, containerId, canvas) {
    this.id = id;
    this.globals = globals;
    this.stages = stages;
    this.debug = debug;
    this.time = time;
    this.input = input;
    this.aspectRatio = aspectRatio;
    this.internalResolution = internalResolution;
    this.fullscreen = fullscreen;
    this.bodyBackground = bodyBackground;
    this.container = container;
    this.containerId = containerId;
    this.canvas = canvas;
  }
};
function ensureContainer(containerId, existing) {
  if (existing) return existing;
  if (containerId) {
    const found = document.getElementById(containerId);
    if (found) return found;
  }
  const id = containerId || "zylem-root";
  const el = document.createElement("main");
  el.setAttribute("id", id);
  el.style.position = "relative";
  el.style.width = "100%";
  el.style.height = "100%";
  document.body.appendChild(el);
  return el;
}
function createDefaultGameConfig(base) {
  const id = base?.id ?? "zylem";
  const container = ensureContainer(id);
  return new GameConfig(
    id,
    base?.globals ?? {},
    base?.stages ?? [],
    Boolean(base?.debug),
    base?.time ?? 0,
    base?.input,
    AspectRatio.SixteenByNine,
    void 0,
    true,
    "#000000",
    container,
    id,
    void 0
  );
}
function resolveGameConfig(user) {
  const defaults = createDefaultGameConfig({
    id: user?.id ?? "zylem",
    debug: Boolean(user?.debug),
    time: user?.time ?? 0,
    input: user?.input,
    stages: user?.stages ?? [],
    globals: user?.globals ?? {}
  });
  const containerId = user?.containerId ?? defaults.containerId;
  const container = ensureContainer(containerId, user?.container ?? null);
  const explicitAspect = user?.aspectRatio;
  let aspectRatio = defaults.aspectRatio;
  if (typeof explicitAspect === "number" || explicitAspect && typeof explicitAspect === "string") {
    aspectRatio = typeof explicitAspect === "number" ? explicitAspect : AspectRatio[explicitAspect] ?? defaults.aspectRatio;
  } else if (user?.preset) {
    try {
      aspectRatio = getDisplayAspect(user.preset) || defaults.aspectRatio;
    } catch {
      aspectRatio = defaults.aspectRatio;
    }
  }
  const fullscreen = user?.fullscreen ?? defaults.fullscreen;
  const bodyBackground = user?.bodyBackground ?? defaults.bodyBackground;
  let internalResolution;
  if (user?.resolution) {
    if (typeof user.resolution === "string") {
      const parsed = parseResolution(user.resolution);
      if (parsed) internalResolution = parsed;
      if (!internalResolution && user.preset) {
        const res = getPresetResolution(user.preset, user.resolution);
        if (res) internalResolution = { width: res.width, height: res.height };
      }
    } else if (typeof user.resolution === "object") {
      const w = user.resolution.width;
      const h = user.resolution.height;
      if (Number.isFinite(w) && Number.isFinite(h)) {
        internalResolution = { width: w, height: h };
      }
    }
  }
  const canvas = user?.canvas ?? void 0;
  return new GameConfig(
    user?.id ?? defaults.id,
    user?.globals ?? defaults.globals,
    user?.stages ?? defaults.stages,
    Boolean(user?.debug ?? defaults.debug),
    user?.time ?? defaults.time,
    user?.input ?? defaults.input,
    aspectRatio,
    internalResolution,
    fullscreen,
    bodyBackground,
    container,
    containerId,
    canvas
  );
}

// src/lib/game/game-canvas.ts
var GameCanvas = class {
  id;
  container;
  canvas;
  bodyBackground;
  fullscreen;
  aspectRatio;
  ratioDelegate = null;
  constructor(options) {
    this.id = options.id;
    this.container = this.ensureContainer(options.containerId ?? options.id, options.container);
    this.canvas = options.canvas ?? document.createElement("canvas");
    this.bodyBackground = options.bodyBackground;
    this.fullscreen = Boolean(options.fullscreen);
    this.aspectRatio = typeof options.aspectRatio === "number" ? options.aspectRatio : options.aspectRatio;
  }
  applyBodyBackground() {
    if (this.bodyBackground) {
      document.body.style.background = this.bodyBackground;
    }
  }
  mountCanvas() {
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.container.appendChild(this.canvas);
  }
  mountRenderer(rendererDom, onResize) {
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.container.appendChild(rendererDom);
    this.canvas = rendererDom;
    this.attachAspectRatio(onResize);
  }
  centerIfFullscreen() {
    if (!this.fullscreen) return;
    const style = this.container.style;
    style.display = "flex";
    style.alignItems = "center";
    style.justifyContent = "center";
    style.position = "relative";
    style.inset = "0";
  }
  attachAspectRatio(onResize) {
    if (!this.ratioDelegate) {
      this.ratioDelegate = new AspectRatioDelegate({
        container: this.container,
        canvas: this.canvas,
        aspectRatio: this.aspectRatio,
        onResize
      });
      this.ratioDelegate.attach();
    } else {
      this.ratioDelegate.canvas = this.canvas;
      this.ratioDelegate.onResize = onResize;
      this.ratioDelegate.aspectRatio = this.aspectRatio;
      this.ratioDelegate.apply();
    }
  }
  destroy() {
    this.ratioDelegate?.detach();
    this.ratioDelegate = null;
  }
  ensureContainer(containerId, existing) {
    if (existing) return existing;
    if (containerId) {
      const found = document.getElementById(containerId);
      if (found) return found;
    }
    const id = containerId || this.id || "zylem-root";
    const el = document.createElement("main");
    el.setAttribute("id", id);
    el.style.position = "relative";
    el.style.width = "100%";
    el.style.height = "100%";
    document.body.appendChild(el);
    return el;
  }
};

// src/lib/game/game-debug-delegate.ts
init_debug_state();
import Stats from "stats.js";
import { subscribe as subscribe2 } from "valtio/vanilla";
var GameDebugDelegate = class {
  statsRef = null;
  unsubscribe = null;
  constructor() {
    this.updateDebugUI();
    this.unsubscribe = subscribe2(debugState, () => {
      this.updateDebugUI();
    });
  }
  /**
   * Called every frame - wraps stats.begin()
   */
  begin() {
    this.statsRef?.begin();
  }
  /**
   * Called every frame - wraps stats.end()
   */
  end() {
    this.statsRef?.end();
  }
  updateDebugUI() {
    if (debugState.enabled && !this.statsRef) {
      this.statsRef = new Stats();
      this.statsRef.showPanel(0);
      this.statsRef.dom.style.position = "absolute";
      this.statsRef.dom.style.bottom = "0";
      this.statsRef.dom.style.right = "0";
      this.statsRef.dom.style.top = "auto";
      this.statsRef.dom.style.left = "auto";
      document.body.appendChild(this.statsRef.dom);
    } else if (!debugState.enabled && this.statsRef) {
      if (this.statsRef.dom.parentNode) {
        this.statsRef.dom.parentNode.removeChild(this.statsRef.dom);
      }
      this.statsRef = null;
    }
  }
  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.statsRef?.dom?.parentNode) {
      this.statsRef.dom.parentNode.removeChild(this.statsRef.dom);
    }
    this.statsRef = null;
  }
};

// src/lib/game/game-loading-delegate.ts
init_events();
var GAME_LOADING_EVENT = "GAME_LOADING_EVENT";
var GameLoadingDelegate = class {
  loadingHandlers = [];
  stageLoadingUnsubscribes = [];
  /**
   * Subscribe to loading events from the game.
   * Events include stage context (stageName, stageIndex).
   * 
   * @param callback Invoked for each loading event
   * @returns Unsubscribe function
   */
  onLoading(callback) {
    this.loadingHandlers.push(callback);
    return () => {
      this.loadingHandlers = this.loadingHandlers.filter((h) => h !== callback);
    };
  }
  /**
   * Emit a loading event to all subscribers and to zylemEventBus.
   */
  emit(event) {
    for (const handler of this.loadingHandlers) {
      try {
        handler(event);
      } catch (e) {
        console.error("Game loading handler failed", e);
      }
    }
    const eventName = `loading:${event.type}`;
    zylemEventBus.emit(eventName, event);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(GAME_LOADING_EVENT, { detail: event }));
    }
  }
  /**
   * Wire up a stage's loading events to this delegate.
   * 
   * @param stage The stage to wire up
   * @param stageIndex The index of the stage
   */
  wireStageLoading(stage, stageIndex) {
    const unsub = stage.onLoading((event) => {
      this.emit({
        type: event.type,
        message: event.message ?? "",
        progress: event.progress ?? 0,
        current: event.current,
        total: event.total,
        stageName: stage.uuid ?? `Stage ${stageIndex}`,
        stageIndex
      });
    });
    if (typeof unsub === "function") {
      this.stageLoadingUnsubscribes.push(unsub);
    }
  }
  /**
   * Unsubscribe from all stage loading events.
   */
  unwireAllStages() {
    for (const unsub of this.stageLoadingUnsubscribes) {
      try {
        unsub();
      } catch {
      }
    }
    this.stageLoadingUnsubscribes = [];
  }
  /**
   * Clean up all handlers.
   */
  dispose() {
    this.unwireAllStages();
    this.loadingHandlers = [];
  }
};

// src/lib/game/zylem-game.ts
init_game_event_bus();

// src/lib/game/game-renderer-observer.ts
var GameRendererObserver = class {
  container = null;
  camera = null;
  gameCanvas = null;
  config = null;
  mounted = false;
  setGameCanvas(canvas) {
    this.gameCanvas = canvas;
    this.tryMount();
  }
  setConfig(config) {
    this.config = config;
    this.tryMount();
  }
  setContainer(container) {
    this.container = container;
    this.tryMount();
  }
  setCamera(camera) {
    this.camera = camera;
    this.tryMount();
  }
  /**
   * Attempt to mount renderer if all dependencies are available.
   */
  tryMount() {
    if (this.mounted) return;
    if (!this.container || !this.camera || !this.gameCanvas) return;
    const dom = this.camera.getDomElement();
    const internal = this.config?.internalResolution;
    this.gameCanvas.mountRenderer(dom, (cssW, cssH) => {
      if (!this.camera) return;
      if (internal) {
        this.camera.setPixelRatio(1);
        this.camera.resize(internal.width, internal.height);
      } else {
        const dpr = window.devicePixelRatio || 1;
        this.camera.setPixelRatio(dpr);
        this.camera.resize(cssW, cssH);
      }
    });
    this.mounted = true;
  }
  /**
   * Reset state for stage transitions.
   */
  reset() {
    this.camera = null;
    this.mounted = false;
  }
  dispose() {
    this.container = null;
    this.camera = null;
    this.gameCanvas = null;
    this.config = null;
    this.mounted = false;
  }
};

// src/lib/game/zylem-game.ts
var ZYLEM_STATE_DISPATCH = "zylem:state:dispatch";
var ZylemGame = class _ZylemGame {
  id;
  initialGlobals = {};
  customSetup = null;
  customUpdate = null;
  customDestroy = null;
  stages = [];
  stageMap = /* @__PURE__ */ new Map();
  currentStageId = "";
  previousTimeStamp = 0;
  totalTime = 0;
  timer;
  inputManager;
  wrapperRef;
  defaultCamera = null;
  container = null;
  canvas = null;
  aspectRatioDelegate = null;
  resolvedConfig = null;
  gameCanvas = null;
  animationFrameId = null;
  isDisposed = false;
  debugDelegate = null;
  loadingDelegate = new GameLoadingDelegate();
  rendererObserver = new GameRendererObserver();
  eventBusUnsubscribes = [];
  static FRAME_LIMIT = 120;
  static FRAME_DURATION = 1e3 / _ZylemGame.FRAME_LIMIT;
  static MAX_DELTA_SECONDS = 1 / 30;
  constructor(options, wrapperRef) {
    this.wrapperRef = wrapperRef;
    this.inputManager = new InputManager(options.input);
    this.timer = new Timer();
    this.timer.connect(document);
    const config = resolveGameConfig(options);
    this.id = config.id;
    this.stages = config.stages || [];
    this.container = config.container;
    this.canvas = config.canvas ?? null;
    this.resolvedConfig = config;
    this.loadGameCanvas(config);
    this.loadDebugOptions(options);
    this.setGlobals(options);
  }
  loadGameCanvas(config) {
    this.gameCanvas = new GameCanvas({
      id: config.id,
      container: config.container,
      containerId: config.containerId,
      canvas: this.canvas ?? void 0,
      bodyBackground: config.bodyBackground,
      fullscreen: config.fullscreen,
      aspectRatio: config.aspectRatio
    });
    this.gameCanvas.applyBodyBackground();
    this.gameCanvas.mountCanvas();
    this.gameCanvas.centerIfFullscreen();
    this.rendererObserver.setGameCanvas(this.gameCanvas);
    if (this.resolvedConfig) {
      this.rendererObserver.setConfig(this.resolvedConfig);
    }
    if (this.container) {
      this.rendererObserver.setContainer(this.container);
    }
    this.subscribeToEventBus();
  }
  loadDebugOptions(options) {
    if (options.debug !== void 0) {
      debugState.enabled = Boolean(options.debug);
    }
    this.debugDelegate = new GameDebugDelegate();
  }
  loadStage(stage, stageIndex = 0) {
    this.unloadCurrentStage();
    const config = stage.options[0];
    this.loadingDelegate.wireStageLoading(stage, stageIndex);
    return stage.load(this.id, config?.camera).then(() => {
      this.stageMap.set(stage.wrappedStage.uuid, stage);
      this.currentStageId = stage.wrappedStage.uuid;
      this.defaultCamera = stage.wrappedStage.cameraRef;
      if (this.defaultCamera) {
        this.rendererObserver.setCamera(this.defaultCamera);
      }
    });
  }
  unloadCurrentStage() {
    if (!this.currentStageId) return;
    const current = this.getStage(this.currentStageId);
    if (!current) return;
    if (current?.wrappedStage) {
      try {
        current.wrappedStage.nodeDestroy({
          me: current.wrappedStage,
          globals: state.globals
        });
      } catch (e) {
        console.error("Failed to destroy previous stage", e);
      }
      current.wrappedStage = null;
    }
    this.stageMap.delete(this.currentStageId);
    this.currentStageId = "";
    this.defaultCamera = null;
    this.rendererObserver.reset();
  }
  setGlobals(options) {
    this.initialGlobals = { ...options.globals };
    for (const variable in this.initialGlobals) {
      const value = this.initialGlobals[variable];
      if (value === void 0) {
        console.error(`global ${variable} is undefined`);
      }
      setGlobal(variable, value);
    }
  }
  params() {
    const stage = this.currentStage();
    const delta = this.timer.getDelta();
    const inputs = this.inputManager.getInputs(delta);
    const camera = stage?.wrappedStage?.cameraRef || this.defaultCamera;
    return {
      delta,
      inputs,
      globals: getGlobals(),
      me: this,
      camera
    };
  }
  start() {
    const stage = this.currentStage();
    const params = this.params();
    stage.start({ ...params, me: stage.wrappedStage });
    if (this.customSetup) {
      this.customSetup(params);
    }
    this.loop(0);
  }
  loop(timestamp) {
    this.debugDelegate?.begin();
    if (!isPaused()) {
      this.timer.update(timestamp);
      const stage = this.currentStage();
      const params = this.params();
      const clampedDelta = Math.min(Math.max(params.delta, 0), _ZylemGame.MAX_DELTA_SECONDS);
      const clampedParams = { ...params, delta: clampedDelta };
      if (this.customUpdate) {
        this.customUpdate(clampedParams);
      }
      if (stage && stage.wrappedStage) {
        stage.wrappedStage.nodeUpdate({ ...clampedParams, me: stage.wrappedStage });
      }
      this.totalTime += clampedParams.delta;
      state.time = this.totalTime;
      this.previousTimeStamp = timestamp;
    }
    this.debugDelegate?.end();
    this.outOfLoop();
    if (!this.isDisposed) {
      this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
    }
  }
  dispose() {
    this.isDisposed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.unloadCurrentStage();
    if (this.debugDelegate) {
      this.debugDelegate.dispose();
      this.debugDelegate = null;
    }
    this.eventBusUnsubscribes.forEach((unsub) => unsub());
    this.eventBusUnsubscribes = [];
    this.rendererObserver.dispose();
    this.timer.dispose();
    if (this.customDestroy) {
      this.customDestroy({
        me: this,
        globals: state.globals
      });
    }
    resetGlobals();
  }
  outOfLoop() {
    const currentStage = this.currentStage();
    if (!currentStage) return;
    currentStage.wrappedStage.outOfLoop();
  }
  getStage(id) {
    return this.stageMap.get(id);
  }
  currentStage() {
    return this.getStage(this.currentStageId);
  }
  /**
   * Subscribe to loading events from the game.
   * Events include stage context (stageName, stageIndex).
   * @param callback Invoked for each loading event
   * @returns Unsubscribe function
   */
  onLoading(callback) {
    return this.loadingDelegate.onLoading(callback);
  }
  /**
   * Subscribe to the game event bus for stage loading and state events.
   * Emits window events for cross-application communication.
   */
  subscribeToEventBus() {
    const emitLoadingWindowEvent = (payload) => {
      if (typeof window !== "undefined") {
        const event = {
          type: payload.type,
          message: payload.message ?? "",
          progress: payload.progress ?? 0,
          current: payload.current,
          total: payload.total,
          stageName: payload.stageName,
          stageIndex: payload.stageIndex
        };
        window.dispatchEvent(new CustomEvent(GAME_LOADING_EVENT, { detail: event }));
      }
    };
    const emitStateDispatchEvent = (payload) => {
      if (typeof window !== "undefined") {
        const detail = {
          scope: "game",
          path: payload.path,
          value: payload.value,
          previousValue: payload.previousValue
        };
        window.dispatchEvent(new CustomEvent(ZYLEM_STATE_DISPATCH, { detail }));
      }
    };
    this.eventBusUnsubscribes.push(
      gameEventBus.on("stage:loading:start", emitLoadingWindowEvent),
      gameEventBus.on("stage:loading:progress", emitLoadingWindowEvent),
      gameEventBus.on("stage:loading:complete", emitLoadingWindowEvent),
      gameEventBus.on("game:state:updated", emitStateDispatchEvent)
    );
  }
};

// src/lib/game/game.ts
init_debug_state();

// src/lib/core/utility/nodes.ts
init_base_node();
init_stage();
init_entity();
async function convertNodes(_options) {
  const { getGameDefaultConfig: getGameDefaultConfig2 } = await Promise.resolve().then(() => (init_game_default(), game_default_exports));
  let converted = { ...getGameDefaultConfig2() };
  const configurations = [];
  const stages = [];
  const entities = [];
  Object.values(_options).forEach((node) => {
    if (node instanceof Stage) {
      stages.push(node);
    } else if (node instanceof GameEntity) {
      entities.push(node);
    } else if (node instanceof BaseNode) {
      entities.push(node);
    } else if (node?.constructor?.name === "Object" && typeof node === "object") {
      const configuration = Object.assign({ ...getGameDefaultConfig2() }, { ...node });
      configurations.push(configuration);
    }
  });
  configurations.forEach((configuration) => {
    converted = Object.assign(converted, { ...configuration });
  });
  stages.forEach((stageInstance) => {
    stageInstance.addEntities(entities);
  });
  if (stages.length) {
    converted.stages = stages;
  } else {
    converted.stages[0].addEntities(entities);
  }
  return converted;
}
function hasStages(_options) {
  const stage = _options.find((option) => option instanceof Stage);
  return Boolean(stage);
}
function extractGlobalsFromOptions(_options) {
  for (const option of _options) {
    if (option && typeof option === "object" && !(option instanceof Stage) && !(option instanceof BaseNode) && !(option instanceof GameEntity)) {
      const config = option;
      if (config.globals) {
        return config.globals;
      }
    }
  }
  return void 0;
}

// src/lib/game/game.ts
init_stage();

// src/lib/stage/stage-manager.ts
import { proxy as proxy6 } from "valtio/vanilla";
import { get, set } from "idb-keyval";
import { pack, unpack } from "msgpackr";
var stageState2 = proxy6({
  previous: null,
  current: null,
  next: null,
  isLoading: false
});
var StageManager = {
  staticRegistry: /* @__PURE__ */ new Map(),
  registerStaticStage(id, blueprint) {
    this.staticRegistry.set(id, blueprint);
  },
  async loadStageData(stageId) {
    try {
      const saved = await get(stageId);
      if (saved) {
        return unpack(saved);
      }
    } catch (e) {
      console.warn(`Failed to load stage ${stageId} from storage`, e);
    }
    if (this.staticRegistry.has(stageId)) {
      return this.staticRegistry.get(stageId);
    }
    throw new Error(`Stage ${stageId} not found in storage and static loading not fully implemented.`);
  },
  async transitionForward(nextStageId, loadStaticStage) {
    if (stageState2.isLoading) return;
    stageState2.isLoading = true;
    try {
      if (stageState2.current) {
        await set(stageState2.current.id, pack(stageState2.current));
      }
      stageState2.previous = stageState2.current;
      stageState2.current = stageState2.next;
      if (stageState2.current?.id !== nextStageId) {
        if (loadStaticStage) {
          stageState2.current = await loadStaticStage(nextStageId);
        } else {
          stageState2.current = await this.loadStageData(nextStageId);
        }
      }
      stageState2.next = null;
    } catch (error) {
      console.error("Failed to transition stage:", error);
    } finally {
      stageState2.isLoading = false;
    }
  },
  /**
   * Manually set the next stage to pre-load it.
   */
  async preloadNext(stageId, loadStaticStage) {
    if (loadStaticStage) {
      stageState2.next = await loadStaticStage(stageId);
    } else {
      stageState2.next = await this.loadStageData(stageId);
    }
  }
};

// src/lib/stage/stage-factory.ts
init_stage();

// src/lib/entities/text.ts
init_entity();
init_builder();
init_create();
import { Color as Color10, Group as Group5, Sprite as ThreeSprite, SpriteMaterial, CanvasTexture, LinearFilter, Vector2 as Vector28, ClampToEdgeWrapping } from "three";

// src/lib/entities/delegates/debug.ts
import { MeshStandardMaterial as MeshStandardMaterial2, MeshBasicMaterial as MeshBasicMaterial2, MeshPhongMaterial as MeshPhongMaterial2 } from "three";
function hasDebugInfo(obj) {
  return obj && typeof obj.getDebugInfo === "function";
}
var DebugDelegate = class {
  entity;
  constructor(entity) {
    this.entity = entity;
  }
  /**
   * Get formatted position string
   */
  getPositionString() {
    if (this.entity.mesh) {
      const { x: x2, y: y2, z: z2 } = this.entity.mesh.position;
      return `${x2.toFixed(2)}, ${y2.toFixed(2)}, ${z2.toFixed(2)}`;
    }
    const { x, y, z } = this.entity.options.position || { x: 0, y: 0, z: 0 };
    return `${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`;
  }
  /**
   * Get formatted rotation string (in degrees)
   */
  getRotationString() {
    if (this.entity.mesh) {
      const { x: x2, y: y2, z: z2 } = this.entity.mesh.rotation;
      const toDeg2 = (rad) => (rad * 180 / Math.PI).toFixed(1);
      return `${toDeg2(x2)}\xB0, ${toDeg2(y2)}\xB0, ${toDeg2(z2)}\xB0`;
    }
    const { x, y, z } = this.entity.options.rotation || { x: 0, y: 0, z: 0 };
    const toDeg = (rad) => (rad * 180 / Math.PI).toFixed(1);
    return `${toDeg(x)}\xB0, ${toDeg(y)}\xB0, ${toDeg(z)}\xB0`;
  }
  /**
   * Get material information
   */
  getMaterialInfo() {
    if (!this.entity.mesh || !this.entity.mesh.material) {
      return { type: "none" };
    }
    const material = Array.isArray(this.entity.mesh.material) ? this.entity.mesh.material[0] : this.entity.mesh.material;
    const info = {
      type: material.type
    };
    if (material instanceof MeshStandardMaterial2 || material instanceof MeshBasicMaterial2 || material instanceof MeshPhongMaterial2) {
      info.color = `#${material.color.getHexString()}`;
      info.opacity = material.opacity;
      info.transparent = material.transparent;
    }
    if ("roughness" in material) {
      info.roughness = material.roughness;
    }
    if ("metalness" in material) {
      info.metalness = material.metalness;
    }
    return info;
  }
  getPhysicsInfo() {
    if (!this.entity.body) {
      return null;
    }
    const info = {
      type: this.entity.body.bodyType(),
      mass: this.entity.body.mass(),
      isEnabled: this.entity.body.isEnabled(),
      isSleeping: this.entity.body.isSleeping()
    };
    const velocity = this.entity.body.linvel();
    info.velocity = `${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}, ${velocity.z.toFixed(2)}`;
    return info;
  }
  buildDebugInfo() {
    const defaultInfo = {
      name: this.entity.name || this.entity.uuid,
      uuid: this.entity.uuid,
      position: this.getPositionString(),
      rotation: this.getRotationString(),
      material: this.getMaterialInfo()
    };
    const physicsInfo = this.getPhysicsInfo();
    if (physicsInfo) {
      defaultInfo.physics = physicsInfo;
    }
    if (this.entity.behaviors.length > 0) {
      defaultInfo.behaviors = this.entity.behaviors.map((b) => b.constructor.name);
    }
    if (hasDebugInfo(this.entity)) {
      const customInfo = this.entity.getDebugInfo();
      return { ...defaultInfo, ...customInfo };
    }
    return defaultInfo;
  }
};

// src/lib/entities/text.ts
var textDefaults = {
  position: void 0,
  text: "",
  fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: 18,
  fontColor: "#FFFFFF",
  backgroundColor: null,
  padding: 4,
  stickToViewport: true,
  screenPosition: new Vector28(24, 24),
  zDistance: 1
};
var TextBuilder = class extends EntityBuilder {
  createEntity(options) {
    return new ZylemText(options);
  }
};
var TEXT_TYPE = /* @__PURE__ */ Symbol("Text");
var ZylemText = class _ZylemText extends GameEntity {
  static type = TEXT_TYPE;
  _sprite = null;
  _texture = null;
  _canvas = null;
  _ctx = null;
  _cameraRef = null;
  _lastCanvasW = 0;
  _lastCanvasH = 0;
  constructor(options) {
    super();
    this.options = { ...textDefaults, ...options };
    this.prependSetup(this.textSetup.bind(this));
    this.prependUpdate(this.textUpdate.bind(this));
    this.onDestroy(this.textDestroy.bind(this));
  }
  create() {
    this._sprite = null;
    this._texture = null;
    this._canvas = null;
    this._ctx = null;
    this._lastCanvasW = 0;
    this._lastCanvasH = 0;
    this.group = new Group5();
    this.createSprite();
    return super.create();
  }
  createSprite() {
    this._canvas = document.createElement("canvas");
    this._ctx = this._canvas.getContext("2d");
    this._texture = new CanvasTexture(this._canvas);
    this._texture.minFilter = LinearFilter;
    this._texture.magFilter = LinearFilter;
    const material = new SpriteMaterial({
      map: this._texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      alphaTest: 0.5
    });
    this._sprite = new ThreeSprite(material);
    this.group?.add(this._sprite);
    this.redrawText(this.options.text ?? "");
  }
  measureAndResizeCanvas(text2, fontSize, fontFamily, padding) {
    if (!this._canvas || !this._ctx) return { sizeChanged: false };
    this._ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = this._ctx.measureText(text2);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = Math.ceil(fontSize * 1.4);
    const nextW = Math.max(2, textWidth + padding * 2);
    const nextH = Math.max(2, textHeight + padding * 2);
    const sizeChanged = nextW !== this._lastCanvasW || nextH !== this._lastCanvasH;
    this._canvas.width = nextW;
    this._canvas.height = nextH;
    this._lastCanvasW = nextW;
    this._lastCanvasH = nextH;
    return { sizeChanged };
  }
  drawCenteredText(text2, fontSize, fontFamily) {
    if (!this._canvas || !this._ctx) return;
    this._ctx.font = `${fontSize}px ${fontFamily}`;
    this._ctx.textAlign = "center";
    this._ctx.textBaseline = "middle";
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    if (this.options.backgroundColor) {
      this._ctx.fillStyle = this.toCssColor(this.options.backgroundColor);
      this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }
    this._ctx.fillStyle = this.toCssColor(this.options.fontColor ?? "#FFFFFF");
    this._ctx.fillText(text2, this._canvas.width / 2, this._canvas.height / 2);
  }
  updateTexture(sizeChanged) {
    if (!this._texture || !this._canvas) return;
    if (sizeChanged) {
      this._texture.dispose();
      this._texture = new CanvasTexture(this._canvas);
      this._texture.minFilter = LinearFilter;
      this._texture.magFilter = LinearFilter;
      this._texture.wrapS = ClampToEdgeWrapping;
      this._texture.wrapT = ClampToEdgeWrapping;
    }
    this._texture.image = this._canvas;
    this._texture.needsUpdate = true;
    if (this._sprite && this._sprite.material) {
      this._sprite.material.map = this._texture;
      this._sprite.material.needsUpdate = true;
    }
  }
  redrawText(_text) {
    if (!this._canvas || !this._ctx) return;
    const fontSize = this.options.fontSize ?? 18;
    const fontFamily = this.options.fontFamily ?? textDefaults.fontFamily;
    const padding = this.options.padding ?? 4;
    const { sizeChanged } = this.measureAndResizeCanvas(_text, fontSize, fontFamily, padding);
    this.drawCenteredText(_text, fontSize, fontFamily);
    this.updateTexture(Boolean(sizeChanged));
    if (this.options.stickToViewport && this._cameraRef) {
      this.updateStickyTransform();
    }
  }
  toCssColor(color) {
    if (typeof color === "string") return color;
    const c = color instanceof Color10 ? color : new Color10(color);
    return `#${c.getHexString()}`;
  }
  textSetup(params) {
    this._cameraRef = params.camera;
    if (this.options.stickToViewport && this._cameraRef) {
      this._cameraRef.camera.add(this.group);
      this.updateStickyTransform();
    }
  }
  textUpdate(params) {
    if (!this._sprite) return;
    if (this.options.stickToViewport && this._cameraRef) {
      this.updateStickyTransform();
    }
  }
  getResolution() {
    return {
      width: this._cameraRef?.screenResolution.x ?? 1,
      height: this._cameraRef?.screenResolution.y ?? 1
    };
  }
  getScreenPixels(sp, width, height) {
    const isPercentX = sp.x >= 0 && sp.x <= 1;
    const isPercentY = sp.y >= 0 && sp.y <= 1;
    return {
      px: isPercentX ? sp.x * width : sp.x,
      py: isPercentY ? sp.y * height : sp.y
    };
  }
  computeWorldExtents(camera, zDist) {
    let worldHalfW = 1;
    let worldHalfH = 1;
    if (camera.isPerspectiveCamera) {
      const pc = camera;
      const halfH = Math.tan(pc.fov * Math.PI / 180 / 2) * zDist;
      const halfW = halfH * pc.aspect;
      worldHalfW = halfW;
      worldHalfH = halfH;
    } else if (camera.isOrthographicCamera) {
      const oc = camera;
      worldHalfW = (oc.right - oc.left) / 2;
      worldHalfH = (oc.top - oc.bottom) / 2;
    }
    return { worldHalfW, worldHalfH };
  }
  updateSpriteScale(worldHalfH, viewportHeight) {
    if (!this._canvas || !this._sprite) return;
    const planeH = worldHalfH * 2;
    const unitsPerPixel = planeH / viewportHeight;
    const pixelH = this._canvas.height;
    const scaleY = Math.max(1e-4, pixelH * unitsPerPixel);
    const aspect = this._canvas.width / this._canvas.height;
    const scaleX = scaleY * aspect;
    this._sprite.scale.set(scaleX, scaleY, 1);
  }
  updateStickyTransform() {
    if (!this._sprite || !this._cameraRef) return;
    const camera = this._cameraRef.camera;
    const { width, height } = this.getResolution();
    const sp = this.options.screenPosition ?? new Vector28(24, 24);
    const { px, py } = this.getScreenPixels(sp, width, height);
    const zDist = Math.max(1e-3, this.options.zDistance ?? 1);
    const { worldHalfW, worldHalfH } = this.computeWorldExtents(camera, zDist);
    const ndcX = px / width * 2 - 1;
    const ndcY = 1 - py / height * 2;
    const localX = ndcX * worldHalfW;
    const localY = ndcY * worldHalfH;
    this.group?.position.set(localX, localY, -zDist);
    this.updateSpriteScale(worldHalfH, height);
  }
  updateText(_text) {
    this.options.text = _text;
    this.redrawText(_text);
    if (this.options.stickToViewport && this._cameraRef) {
      this.updateStickyTransform();
    }
  }
  buildInfo() {
    const delegate = new DebugDelegate(this);
    const baseInfo = delegate.buildDebugInfo();
    return {
      ...baseInfo,
      type: String(_ZylemText.type),
      text: this.options.text ?? "",
      sticky: this.options.stickToViewport
    };
  }
  /**
   * Dispose of Three.js resources when the entity is destroyed.
   */
  async textDestroy() {
    this._texture?.dispose();
    if (this._sprite?.material) {
      this._sprite.material.dispose();
    }
    if (this._sprite) {
      this._sprite.removeFromParent();
    }
    this.group?.removeFromParent();
    this._sprite = null;
    this._texture = null;
    this._canvas = null;
    this._ctx = null;
    this._cameraRef = null;
  }
};
async function text(...args) {
  return createEntity({
    args,
    defaultConfig: { ...textDefaults },
    EntityClass: ZylemText,
    BuilderClass: TextBuilder,
    entityType: ZylemText.type
  });
}

// src/lib/entities/sprite.ts
init_entity();
init_builder();
init_builder();
init_create();
import { ColliderDesc as ColliderDesc3 } from "@dimforge/rapier3d-compat";
import { Color as Color11, Euler, Group as Group6, Quaternion as Quaternion3, Vector3 as Vector316 } from "three";
import {
  TextureLoader as TextureLoader3,
  SpriteMaterial as SpriteMaterial2,
  Sprite as ThreeSprite2
} from "three";
var spriteDefaults = {
  size: new Vector316(1, 1, 1),
  position: new Vector316(0, 0, 0),
  collision: {
    static: false
  },
  material: {
    color: new Color11("#ffffff"),
    shader: "standard"
  },
  images: [],
  animations: []
};
var SpriteCollisionBuilder = class extends EntityCollisionBuilder {
  collider(options) {
    const size = options.collisionSize || options.size || new Vector316(1, 1, 1);
    const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
    let colliderDesc = ColliderDesc3.cuboid(half.x, half.y, half.z);
    return colliderDesc;
  }
};
var SpriteBuilder = class extends EntityBuilder {
  createEntity(options) {
    return new ZylemSprite(options);
  }
};
var SPRITE_TYPE = /* @__PURE__ */ Symbol("Sprite");
var ZylemSprite = class _ZylemSprite extends GameEntity {
  static type = SPRITE_TYPE;
  sprites = [];
  spriteMap = /* @__PURE__ */ new Map();
  currentSpriteIndex = 0;
  animations = /* @__PURE__ */ new Map();
  currentAnimation = null;
  currentAnimationFrame = "";
  currentAnimationIndex = 0;
  currentAnimationTime = 0;
  constructor(options) {
    super();
    this.options = { ...spriteDefaults, ...options };
    this.prependUpdate(this.spriteUpdate.bind(this));
    this.onDestroy(this.spriteDestroy.bind(this));
  }
  create() {
    this.sprites = [];
    this.spriteMap.clear();
    this.animations.clear();
    this.currentAnimation = null;
    this.currentAnimationFrame = "";
    this.currentAnimationIndex = 0;
    this.currentAnimationTime = 0;
    this.group = void 0;
    this.createSpritesFromImages(this.options?.images || []);
    this.createAnimations(this.options?.animations || []);
    return super.create();
  }
  createSpritesFromImages(images) {
    const textureLoader = new TextureLoader3();
    images.forEach((image, index) => {
      const spriteMap = textureLoader.load(image.file);
      const material = new SpriteMaterial2({
        map: spriteMap,
        transparent: true
      });
      const _sprite = new ThreeSprite2(material);
      _sprite.position.normalize();
      this.sprites.push(_sprite);
      this.spriteMap.set(image.name, index);
    });
    this.group = new Group6();
    this.group.add(...this.sprites);
  }
  createAnimations(animations) {
    animations.forEach((animation) => {
      const { name, frames, loop = false, speed = 1 } = animation;
      const internalAnimation = {
        frames: frames.map((frame, index) => ({
          key: frame,
          index,
          time: (typeof speed === "number" ? speed : speed[index]) * (index + 1),
          duration: typeof speed === "number" ? speed : speed[index]
        })),
        loop
      };
      this.animations.set(name, internalAnimation);
    });
  }
  setSprite(key) {
    const spriteIndex = this.spriteMap.get(key);
    const useIndex = spriteIndex ?? 0;
    this.currentSpriteIndex = useIndex;
    this.sprites.forEach((_sprite, i) => {
      _sprite.visible = this.currentSpriteIndex === i;
    });
  }
  setAnimation(name, delta) {
    const animation = this.animations.get(name);
    if (!animation) return;
    const { loop, frames } = animation;
    const frame = frames[this.currentAnimationIndex];
    if (name === this.currentAnimation) {
      this.currentAnimationFrame = frame.key;
      this.currentAnimationTime += delta;
      this.setSprite(this.currentAnimationFrame);
    } else {
      this.currentAnimation = name;
    }
    if (this.currentAnimationTime > frame.time) {
      this.currentAnimationIndex++;
    }
    if (this.currentAnimationIndex >= frames.length) {
      if (loop) {
        this.currentAnimationIndex = 0;
        this.currentAnimationTime = 0;
      } else {
        this.currentAnimationTime = frames[this.currentAnimationIndex].time;
      }
    }
  }
  async spriteUpdate(params) {
    this.sprites.forEach((_sprite) => {
      if (_sprite.material) {
        const q = this.body?.rotation();
        if (q) {
          const quat = new Quaternion3(q.x, q.y, q.z, q.w);
          const euler = new Euler().setFromQuaternion(quat, "XYZ");
          _sprite.material.rotation = euler.z;
        }
        _sprite.scale.set(this.options.size?.x ?? 1, this.options.size?.y ?? 1, this.options.size?.z ?? 1);
      }
    });
  }
  async spriteDestroy(params) {
    this.sprites.forEach((_sprite) => {
      _sprite.removeFromParent();
    });
    this.group?.remove(...this.sprites);
    this.group?.removeFromParent();
  }
  buildInfo() {
    const delegate = new DebugDelegate(this);
    const baseInfo = delegate.buildDebugInfo();
    return {
      ...baseInfo,
      type: String(_ZylemSprite.type)
    };
  }
};
async function sprite(...args) {
  return createEntity({
    args,
    defaultConfig: spriteDefaults,
    EntityClass: ZylemSprite,
    BuilderClass: SpriteBuilder,
    CollisionBuilderClass: SpriteCollisionBuilder,
    entityType: ZylemSprite.type
  });
}

// src/lib/entities/entity-factory.ts
var EntityFactory = {
  registry: /* @__PURE__ */ new Map(),
  register(type, creator) {
    this.registry.set(type, creator);
  },
  async createFromBlueprint(blueprint) {
    const creator = this.registry.get(blueprint.type);
    if (!creator) {
      throw new Error(`Unknown entity type: ${blueprint.type}`);
    }
    const options = {
      ...blueprint.data,
      position: blueprint.position ? { x: blueprint.position[0], y: blueprint.position[1], z: 0 } : void 0,
      name: blueprint.id
    };
    const entity = await creator(options);
    return entity;
  }
};
EntityFactory.register("text", async (opts) => await text(opts));
EntityFactory.register("sprite", async (opts) => await sprite(opts));

// src/lib/stage/stage-factory.ts
var StageFactory = {
  async createFromBlueprint(blueprint) {
    const stage = createStage({
      // Map blueprint properties to stage options if needed
      // e.g. name: blueprint.name
    });
    if (blueprint.entities) {
      for (const entityBlueprint of blueprint.entities) {
        try {
          const entity = await EntityFactory.createFromBlueprint(entityBlueprint);
          stage.add(entity);
        } catch (e) {
          console.error(`Failed to create entity ${entityBlueprint.id} for stage ${blueprint.id}`, e);
        }
      }
    }
    return stage;
  }
};

// src/lib/game/game.ts
init_game_state();
init_events();
var Game = class {
  wrappedGame = null;
  options;
  // Lifecycle callback arrays
  setupCallbacks = [];
  updateCallbacks = [];
  destroyCallbacks = [];
  pendingLoadingCallbacks = [];
  // Game-scoped global change subscriptions
  globalChangeCallbacks = [];
  globalChangesCallbacks = [];
  activeGlobalSubscriptions = [];
  // Event delegate for dispatch/listen API
  eventDelegate = new EventEmitterDelegate();
  refErrorMessage = "lost reference to game";
  constructor(options) {
    this.options = options;
    if (!hasStages(options)) {
      this.options.push(createStage());
    }
    const globals = extractGlobalsFromOptions(options);
    if (globals) {
      initGlobals(globals);
    }
  }
  // Fluent API for adding lifecycle callbacks
  onSetup(...callbacks) {
    this.setupCallbacks.push(...callbacks);
    return this;
  }
  onUpdate(...callbacks) {
    this.updateCallbacks.push(...callbacks);
    return this;
  }
  onDestroy(...callbacks) {
    this.destroyCallbacks.push(...callbacks);
    return this;
  }
  async start() {
    resetGlobals();
    const globals = extractGlobalsFromOptions(this.options);
    if (globals) {
      initGlobals(globals);
    }
    const game = await this.load();
    this.wrappedGame = game;
    this.setOverrides();
    this.registerGlobalSubscriptions();
    game.start();
    return this;
  }
  async load() {
    const options = await convertNodes(this.options);
    const resolved = resolveGameConfig(options);
    const game = new ZylemGame({
      ...options,
      ...resolved
    }, this);
    for (const callback of this.pendingLoadingCallbacks) {
      game.onLoading(callback);
    }
    await game.loadStage(options.stages[0]);
    return game;
  }
  setOverrides() {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    this.wrappedGame.customSetup = (params) => {
      this.setupCallbacks.forEach((cb) => cb(params));
    };
    this.wrappedGame.customUpdate = (params) => {
      this.updateCallbacks.forEach((cb) => cb(params));
    };
    this.wrappedGame.customDestroy = (params) => {
      this.destroyCallbacks.forEach((cb) => cb(params));
    };
  }
  /**
   * Subscribe to changes on a global value. Subscriptions are registered
   * when the game starts and cleaned up when disposed.
   * The callback receives the value and the current stage.
   * @example game.onGlobalChange('score', (val, stage) => console.log(val));
   */
  onGlobalChange(path, callback) {
    this.globalChangeCallbacks.push({ path, callback });
    return this;
  }
  /**
   * Subscribe to changes on multiple global paths. Subscriptions are registered
   * when the game starts and cleaned up when disposed.
   * The callback receives the values and the current stage.
   * @example game.onGlobalChanges(['score', 'lives'], ([score, lives], stage) => console.log(score, lives));
   */
  onGlobalChanges(paths, callback) {
    this.globalChangesCallbacks.push({ paths, callback });
    return this;
  }
  /**
   * Register all stored global change callbacks.
   * Called internally during start().
   */
  registerGlobalSubscriptions() {
    for (const { path, callback } of this.globalChangeCallbacks) {
      const unsub = onGlobalChange(path, (value) => {
        callback(value, this.getCurrentStage());
      });
      this.activeGlobalSubscriptions.push(unsub);
    }
    for (const { paths, callback } of this.globalChangesCallbacks) {
      const unsub = onGlobalChanges(paths, (values) => {
        callback(values, this.getCurrentStage());
      });
      this.activeGlobalSubscriptions.push(unsub);
    }
  }
  /**
   * Get the current stage wrapper.
   */
  getCurrentStage() {
    return this.wrappedGame?.currentStage() ?? null;
  }
  async pause() {
    setPaused(true);
  }
  async resume() {
    setPaused(false);
    if (this.wrappedGame) {
      this.wrappedGame.previousTimeStamp = 0;
      this.wrappedGame.timer.reset();
    }
  }
  async reset() {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    await this.wrappedGame.loadStage(this.wrappedGame.stages[0]);
  }
  previousStage() {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    const currentStageId = this.wrappedGame.currentStageId;
    const currentIndex = this.wrappedGame.stages.findIndex((s) => s.wrappedStage?.uuid === currentStageId);
    const previousStage = this.wrappedGame.stages[currentIndex - 1];
    if (!previousStage) {
      console.error("previous stage called on first stage");
      return;
    }
    this.wrappedGame.loadStage(previousStage);
  }
  async loadStageFromId(stageId) {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    try {
      const blueprint = await StageManager.loadStageData(stageId);
      const stage = await StageFactory.createFromBlueprint(blueprint);
      await this.wrappedGame.loadStage(stage);
      stageState2.current = blueprint;
    } catch (e) {
      console.error(`Failed to load stage ${stageId}`, e);
    }
  }
  nextStage() {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    if (stageState2.next) {
      const nextId = stageState2.next.id;
      StageManager.transitionForward(nextId);
      if (stageState2.current) {
        StageFactory.createFromBlueprint(stageState2.current).then((stage) => {
          this.wrappedGame?.loadStage(stage);
        });
        return;
      }
    }
    const currentStageId = this.wrappedGame.currentStageId;
    const currentIndex = this.wrappedGame.stages.findIndex((s) => s.wrappedStage?.uuid === currentStageId);
    const nextStage = this.wrappedGame.stages[currentIndex + 1];
    if (!nextStage) {
      console.error("next stage called on last stage");
      return;
    }
    this.wrappedGame.loadStage(nextStage);
  }
  async goToStage() {
  }
  async end() {
  }
  dispose() {
    this.eventDelegate.dispose();
    for (const unsub of this.activeGlobalSubscriptions) {
      unsub();
    }
    this.activeGlobalSubscriptions = [];
    if (this.wrappedGame) {
      this.wrappedGame.dispose();
    }
    clearGlobalSubscriptions();
    resetGlobals();
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Events API
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Dispatch an event from the game.
   * Events are emitted both locally and to the global event bus.
   */
  dispatch(event, payload) {
    this.eventDelegate.dispatch(event, payload);
    zylemEventBus.emit(event, payload);
  }
  /**
   * Listen for events on this game instance.
   * @returns Unsubscribe function
   */
  listen(event, handler) {
    return this.eventDelegate.listen(event, handler);
  }
  /**
   * Subscribe to loading events from the game.
   * Events include stage context (stageName, stageIndex).
   * @param callback Invoked for each loading event
   * @returns Unsubscribe function
   */
  onLoading(callback) {
    if (this.wrappedGame) {
      return this.wrappedGame.onLoading(callback);
    }
    this.pendingLoadingCallbacks.push(callback);
    return () => {
      this.pendingLoadingCallbacks = this.pendingLoadingCallbacks.filter((c) => c !== callback);
      if (this.wrappedGame) {
      }
    };
  }
};
function createGame(...options) {
  return new Game(options);
}

// src/lib/core/vessel.ts
init_base_node();
var VESSEL_TYPE = /* @__PURE__ */ Symbol("vessel");
var Vessel = class extends BaseNode {
  static type = VESSEL_TYPE;
  _setup(_params) {
  }
  async _loaded(_params) {
  }
  _update(_params) {
  }
  _destroy(_params) {
  }
  async _cleanup(_params) {
  }
  create() {
    return this;
  }
};
function vessel(...args) {
  const instance = new Vessel();
  args.forEach((arg) => instance.add(arg));
  return instance;
}

// src/lib/actions/global-change.ts
function globalChange(key, callback) {
  let previousValue = void 0;
  return (ctx) => {
    const currentValue = ctx.globals?.[key];
    if (previousValue !== currentValue) {
      if (!(previousValue === void 0 && currentValue === void 0)) {
        callback(currentValue, ctx);
      }
      previousValue = currentValue;
    }
  };
}
function globalChanges(keys, callback) {
  let previousValues = new Array(keys.length).fill(void 0);
  return (ctx) => {
    const currentValues = keys.map((k) => ctx.globals?.[k]);
    const hasAnyChange = currentValues.some((val, idx) => previousValues[idx] !== val);
    if (hasAnyChange) {
      const allPrevUndef = previousValues.every((v) => v === void 0);
      const allCurrUndef = currentValues.every((v) => v === void 0);
      if (!(allPrevUndef && allCurrUndef)) {
        callback(currentValues, ctx);
      }
      previousValues = currentValues;
    }
  };
}
function variableChange(key, callback) {
  let previousValue = void 0;
  return (ctx) => {
    const currentValue = ctx.stage?.getVariable?.(key) ?? void 0;
    if (previousValue !== currentValue) {
      if (!(previousValue === void 0 && currentValue === void 0)) {
        callback(currentValue, ctx);
      }
      previousValue = currentValue;
    }
  };
}
function variableChanges(keys, callback) {
  let previousValues = new Array(keys.length).fill(void 0);
  return (ctx) => {
    const reader = (k) => ctx.stage?.getVariable?.(k);
    const currentValues = keys.map(reader);
    const hasAnyChange = currentValues.some((val, idx) => previousValues[idx] !== val);
    if (hasAnyChange) {
      const allPrevUndef = previousValues.every((v) => v === void 0);
      const allCurrUndef = currentValues.every((v) => v === void 0);
      if (!(allPrevUndef && allCurrUndef)) {
        callback(currentValues, ctx);
      }
      previousValues = currentValues;
    }
  };
}
export {
  createGame,
  globalChange,
  globalChanges,
  variableChange,
  variableChanges,
  vessel
};
//# sourceMappingURL=core.js.map