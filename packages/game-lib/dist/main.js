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
function createGlobal(path, defaultValue) {
  const existing = getByPath(state.globals, path);
  if (existing === void 0) {
    setByPath(state.globals, path, defaultValue);
    return defaultValue;
  }
  return existing;
}
function getGlobal(path) {
  return getByPath(state.globals, path);
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
function setDebugTool(tool) {
  debugState.tool = tool;
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
  return { all: n = n || /* @__PURE__ */ new Map(), on: function(t6, e) {
    var i = n.get(t6);
    i ? i.push(e) : n.set(t6, [e]);
  }, off: function(t6, e) {
    var i = n.get(t6);
    i && (e ? i.splice(i.indexOf(e) >>> 0, 1) : n.set(t6, []));
  }, emit: function(t6, e) {
    var i = n.get(t6);
    i && i.slice().map(function(n2) {
      n2(e);
    }), (i = n.get("*")) && i.slice().map(function(n2) {
      n2(t6, e);
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
  const destroy2 = (world) => {
    removeQuery(world, transformQuery);
  };
  return { system, destroy: destroy2 };
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
      /**
       * @deprecated Use the new ECS-based behavior system instead.
       * Use 'any' for callback types to avoid contravariance issues
       * with function parameters. Type safety is enforced where callbacks are registered.
       */
      behaviorCallbackMap = {
        setup: [],
        update: [],
        destroy: [],
        collision: []
      };
      // Event delegate for dispatch/listen API
      eventDelegate = new EventEmitterDelegate();
      // Behavior references (new ECS pattern)
      behaviorRefs = [];
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
       * Use a behavior on this entity via typed descriptor.
       * Behaviors will be auto-registered as systems when the entity is spawned.
       * @param descriptor The behavior descriptor (import from behaviors module)
       * @param options Optional overrides for the behavior's default options
       * @returns BehaviorHandle with behavior-specific methods for lazy FSM access
       */
      use(descriptor, options) {
        const behaviorRef = {
          descriptor,
          options: { ...descriptor.defaultOptions, ...options }
        };
        this.behaviorRefs.push(behaviorRef);
        const baseHandle = {
          getFSM: () => behaviorRef.fsm ?? null,
          getOptions: () => behaviorRef.options,
          ref: behaviorRef
        };
        const customMethods = descriptor.createHandle?.(behaviorRef) ?? {};
        return {
          ...baseHandle,
          ...customMethods
        };
      }
      /**
       * Get all behavior references attached to this entity.
       * Used by the stage to auto-register required systems.
       */
      getBehaviorRefs() {
        return this.behaviorRefs;
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
      /**
       * @deprecated Use the new ECS-based behavior system instead.
       * See `lib/behaviors/thruster/thruster-movement.behavior.ts` for an example.
       */
      addBehavior(behaviorCallback) {
        const handler = behaviorCallback.handler;
        if (handler) {
          this.behaviorCallbackMap[behaviorCallback.type].push(handler);
        }
        return this;
      }
      /**
       * @deprecated Use the new ECS-based behavior system instead.
       * See `lib/behaviors/thruster/thruster-movement.behavior.ts` for an example.
       */
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
      load() {
        if (this.entityReference.load) {
          this.entityReference.load();
        }
      }
      data() {
        if (this.entityReference.data) {
          return this.entityReference.data();
        }
        return null;
      }
    };
  }
});

// src/lib/entities/create.ts
function createEntity(params) {
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
        loader.load();
        entityData = loader.data();
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
      builder.withMaterial(arg.material, entityType);
    }
  }
  if (!builder) {
    throw new Error(`missing options for ${String(entityType)}, builder is not initialized.`);
  }
  return builder.build();
}
var init_create = __esm({
  "src/lib/entities/create.ts"() {
    "use strict";
    init_base_node();
    init_loader();
  }
});

// src/lib/core/loaders/texture-loader.ts
import { TextureLoader, RepeatWrapping } from "three";
var TextureLoaderAdapter;
var init_texture_loader = __esm({
  "src/lib/core/loaders/texture-loader.ts"() {
    "use strict";
    TextureLoaderAdapter = class {
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
  }
});

// src/lib/core/loaders/gltf-loader.ts
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
var GLTFLoaderAdapter;
var init_gltf_loader = __esm({
  "src/lib/core/loaders/gltf-loader.ts"() {
    "use strict";
    GLTFLoaderAdapter = class {
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
  }
});

// src/lib/core/loaders/fbx-loader.ts
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
var FBXLoaderAdapter;
var init_fbx_loader = __esm({
  "src/lib/core/loaders/fbx-loader.ts"() {
    "use strict";
    FBXLoaderAdapter = class {
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
  }
});

// src/lib/core/loaders/obj-loader.ts
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
var OBJLoaderAdapter;
var init_obj_loader = __esm({
  "src/lib/core/loaders/obj-loader.ts"() {
    "use strict";
    OBJLoaderAdapter = class {
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
  }
});

// src/lib/core/loaders/audio-loader.ts
import { AudioLoader } from "three";
var AudioLoaderAdapter;
var init_audio_loader = __esm({
  "src/lib/core/loaders/audio-loader.ts"() {
    "use strict";
    AudioLoaderAdapter = class {
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
  }
});

// src/lib/core/loaders/file-loader.ts
import { FileLoader } from "three";
var FileLoaderAdapter, JsonLoaderAdapter;
var init_file_loader = __esm({
  "src/lib/core/loaders/file-loader.ts"() {
    "use strict";
    FileLoaderAdapter = class {
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
    JsonLoaderAdapter = class {
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
  }
});

// src/lib/core/loaders/index.ts
var init_loaders = __esm({
  "src/lib/core/loaders/index.ts"() {
    "use strict";
    init_texture_loader();
    init_gltf_loader();
    init_fbx_loader();
    init_obj_loader();
    init_audio_loader();
    init_file_loader();
  }
});

// src/lib/core/asset-manager.ts
import { LoadingManager, Cache } from "three";
var AssetManager, assetManager;
var init_asset_manager = __esm({
  "src/lib/core/asset-manager.ts"() {
    "use strict";
    init_mitt();
    init_loaders();
    AssetManager = class _AssetManager {
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
    assetManager = AssetManager.getInstance();
  }
});

// src/lib/core/entity-asset-loader.ts
var EntityAssetLoader;
var init_entity_asset_loader = __esm({
  "src/lib/core/entity-asset-loader.ts"() {
    "use strict";
    init_asset_manager();
    EntityAssetLoader = class {
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

// src/lib/graphics/mesh.ts
import { Mesh as Mesh2 } from "three";
var MeshBuilder;
var init_mesh = __esm({
  "src/lib/graphics/mesh.ts"() {
    "use strict";
    MeshBuilder = class {
      _build(meshOptions, geometry, materials) {
        const { batched, material } = meshOptions;
        if (batched) {
          console.warn("warning: mesh batching is not implemented");
        }
        const mesh = new Mesh2(geometry, materials.at(-1));
        mesh.position.set(0, 0, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
      }
      _postBuild() {
        return;
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

// src/lib/graphics/preset-shader.ts
var starShader, fireShader, standardShader, debugShader, shaderMap, preset_shader_default;
var init_preset_shader = __esm({
  "src/lib/graphics/preset-shader.ts"() {
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
  RepeatWrapping as RepeatWrapping2,
  ShaderMaterial as ShaderMaterial2,
  Vector2 as Vector22,
  Vector3 as Vector32
} from "three";
var MaterialBuilder;
var init_material = __esm({
  "src/lib/graphics/material.ts"() {
    "use strict";
    init_strings();
    init_preset_shader();
    init_asset_manager();
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
      build(options, entityType) {
        const { path, repeat, color, shader } = options;
        if (shader) this.withShader(shader);
        if (color) this.withColor(color);
        this.setTexture(path ?? null, repeat);
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
      /**
       * Set texture - loads in background (deferred).
       * Material is created immediately with null map, texture applies when loaded.
       */
      setTexture(texturePath = null, repeat = new Vector22(1, 1)) {
        if (!texturePath) {
          return;
        }
        const material = new MeshPhongMaterial({
          map: null
        });
        this.materials.push(material);
        assetManager.loadTexture(texturePath, {
          clone: true,
          repeat
        }).then((texture) => {
          texture.wrapS = RepeatWrapping2;
          texture.wrapT = RepeatWrapping2;
          material.map = texture;
          material.needsUpdate = true;
        });
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
import { BufferGeometry as BufferGeometry2, Mesh as Mesh3, Color as Color3 } from "three";
var EntityCollisionBuilder, EntityMeshBuilder, EntityBuilder;
var init_builder = __esm({
  "src/lib/entities/builder.ts"() {
    "use strict";
    init_collision_builder();
    init_mesh();
    init_material();
    EntityCollisionBuilder = class extends CollisionBuilder {
    };
    EntityMeshBuilder = class extends MeshBuilder {
      build(options) {
        return new BufferGeometry2();
      }
      postBuild() {
        return;
      }
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
      withMaterial(options, entityType) {
        if (this.materialBuilder) {
          this.materialBuilder.build(options, entityType);
        }
        return this;
      }
      applyMaterialToGroup(group, materials) {
        group.traverse((child) => {
          if (child instanceof Mesh3) {
            if (child.type === "SkinnedMesh" && materials[0] && !child.material.map) {
              child.material = materials[0];
            }
          }
          child.castShadow = true;
          child.receiveShadow = true;
        });
      }
      build() {
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
              if (child instanceof Mesh3 && child.material) {
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
import { MeshStandardMaterial as MeshStandardMaterial2, Group as Group3, Vector3 as Vector33 } from "three";
function createActor(...args) {
  return createEntity({
    args,
    defaultConfig: actorDefaults,
    EntityClass: ZylemActor,
    BuilderClass: ActorBuilder,
    CollisionBuilderClass: ActorCollisionBuilder,
    entityType: ZylemActor.type
  });
}
var actorDefaults, ActorCollisionBuilder, ActorBuilder, ACTOR_TYPE, ZylemActor;
var init_actor = __esm({
  "src/lib/entities/actor.ts"() {
    "use strict";
    init_entity();
    init_create();
    init_entity_asset_loader();
    init_animation();
    init_builder();
    init_builder();
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
      models: [],
      collisionShape: "capsule"
    };
    ActorCollisionBuilder = class extends EntityCollisionBuilder {
      objectModel = null;
      collisionShape = "capsule";
      constructor(data) {
        super();
        this.objectModel = data.objectModel;
        this.collisionShape = data.collisionShape ?? "capsule";
      }
      collider(options) {
        if (this.collisionShape === "model") {
          return this.createColliderFromModel(this.objectModel, options);
        }
        return this.createCapsuleCollider(options);
      }
      /**
       * Create a capsule collider based on size options (character controller style).
       */
      createCapsuleCollider(options) {
        const size = options.collision?.size ?? options.size ?? { x: 0.5, y: 1, z: 0.5 };
        const halfHeight = size.y || 1;
        const radius = Math.max(size.x || 0.5, size.z || 0.5);
        let colliderDesc = ColliderDesc2.capsule(halfHeight, radius);
        colliderDesc.setSensor(false);
        colliderDesc.setTranslation(0, halfHeight + radius, 0);
        colliderDesc.activeCollisionTypes = ActiveCollisionTypes2.DEFAULT;
        return colliderDesc;
      }
      /**
       * Create a collider based on model geometry (works with Mesh and SkinnedMesh).
       * If collision.size and collision.position are provided, use those instead of computing from geometry.
       */
      createColliderFromModel(objectModel, options) {
        const collisionSize = options.collision?.size;
        const collisionPosition = options.collision?.position;
        if (collisionSize) {
          const halfWidth = collisionSize.x / 2;
          const halfHeight = collisionSize.y / 2;
          const halfDepth = collisionSize.z / 2;
          let colliderDesc2 = ColliderDesc2.cuboid(halfWidth, halfHeight, halfDepth);
          colliderDesc2.setSensor(false);
          const posX = collisionPosition ? collisionPosition.x : 0;
          const posY = collisionPosition ? collisionPosition.y : halfHeight;
          const posZ = collisionPosition ? collisionPosition.z : 0;
          colliderDesc2.setTranslation(posX, posY, posZ);
          colliderDesc2.activeCollisionTypes = ActiveCollisionTypes2.DEFAULT;
          return colliderDesc2;
        }
        if (!objectModel) return this.createCapsuleCollider(options);
        let foundGeometry = null;
        objectModel.traverse((child) => {
          if (!foundGeometry && child.isMesh) {
            foundGeometry = child.geometry;
          }
        });
        if (!foundGeometry) return this.createCapsuleCollider(options);
        const geometry = foundGeometry;
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        if (!box) return this.createCapsuleCollider(options);
        const height = box.max.y - box.min.y;
        const width = box.max.x - box.min.x;
        const depth = box.max.z - box.min.z;
        let colliderDesc = ColliderDesc2.cuboid(width / 2, height / 2, depth / 2);
        colliderDesc.setSensor(false);
        const centerY = (box.max.y + box.min.y) / 2;
        colliderDesc.setTranslation(0, centerY, 0);
        colliderDesc.activeCollisionTypes = ActiveCollisionTypes2.DEFAULT;
        return colliderDesc;
      }
    };
    ActorBuilder = class extends EntityBuilder {
      createEntity(options) {
        return new ZylemActor(options);
      }
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
      /**
       * Initiates model and animation loading in background (deferred).
       * Call returns immediately; assets will be ready on subsequent updates.
       */
      load() {
        this._modelFileNames = this.options.models || [];
        this.loadModelsDeferred();
      }
      /**
       * Returns current data synchronously.
       * May return null values if loading is still in progress.
       */
      data() {
        return {
          animations: this._animationDelegate?.animations,
          objectModel: this._object,
          collisionShape: this.options.collisionShape
        };
      }
      actorUpdate(params) {
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
      /**
       * Deferred loading - starts async load and updates entity when complete.
       * Called by synchronous load() method.
       */
      loadModelsDeferred() {
        if (this._modelFileNames.length === 0) return;
        this.dispatch("entity:model:loading", {
          entityId: this.uuid,
          files: this._modelFileNames
        });
        const promises = this._modelFileNames.map((file) => this._assetLoader.loadFile(file));
        Promise.all(promises).then((results) => {
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
            this.applyMaterialOverrides();
            this._animationDelegate = new AnimationDelegate(this._object);
            this._animationDelegate.loadAnimations(this.options.animations || []).then(() => {
              this.dispatch("entity:animation:loaded", {
                entityId: this.uuid,
                animationCount: this.options.animations?.length || 0
              });
            });
          }
          this.dispatch("entity:model:loaded", {
            entityId: this.uuid,
            success: !!this._object,
            meshCount
          });
        });
      }
      playAnimation(animationOptions) {
        this._animationDelegate?.playAnimation(animationOptions);
      }
      /**
       * Apply material overrides from options to all meshes in the loaded model.
       * Only applies if material options are explicitly specified (not just defaults).
       */
      applyMaterialOverrides() {
        const materialOptions = this.options.material;
        if (!materialOptions || !materialOptions.color && !materialOptions.path) {
          return;
        }
        if (!this._object) return;
        this._object.traverse((child) => {
          if (child.isMesh) {
            const mesh = child;
            if (materialOptions.color) {
              const newMaterial = new MeshStandardMaterial2({
                color: materialOptions.color,
                emissiveIntensity: 0.5,
                lightMapIntensity: 0.5,
                fog: true
              });
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              mesh.material = newMaterial;
            }
          }
        });
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
            if (!otherCollider) {
              return;
            }
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
            if (!otherCollider) {
              return;
            }
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
  GridHelper
} from "three";
var ZylemScene;
var init_zylem_scene = __esm({
  "src/lib/graphics/zylem-scene.ts"() {
    "use strict";
    init_debug_state();
    init_game_state();
    init_asset_manager();
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
       * Add an entity's group or mesh to the scene (for late-loaded models).
       * Uses entity's current body position if physics is active.
       */
      addEntityGroup(entity) {
        const position2 = entity.body ? new Vector34(
          entity.body.translation().x,
          entity.body.translation().y,
          entity.body.translation().z
        ) : entity.options.position;
        if (entity.group) {
          this.add(entity.group, position2);
        } else if (entity.mesh) {
          this.add(entity.mesh, position2);
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

// src/lib/core/utility/vector.ts
import { Color as Color5 } from "three";
import { Vector3 as Vector35 } from "@dimforge/rapier3d-compat";
var ZylemBlueColor, Vec0, Vec1;
var init_vector = __esm({
  "src/lib/core/utility/vector.ts"() {
    "use strict";
    ZylemBlueColor = new Color5("#0333EC");
    Vec0 = new Vector35(0, 0, 0);
    Vec1 = new Vector35(1, 1, 1);
  }
});

// src/lib/stage/stage-state.ts
import { Color as Color6, Vector3 as Vector36 } from "three";
import { proxy as proxy3, subscribe as subscribe3 } from "valtio/vanilla";
function getOrCreateVariableProxy(target) {
  let store = variableProxyStore.get(target);
  if (!store) {
    store = proxy3({});
    variableProxyStore.set(target, store);
  }
  return store;
}
function setVariable(target, path, value) {
  const store = getOrCreateVariableProxy(target);
  setByPath(store, path, value);
}
function createVariable(target, path, defaultValue) {
  const store = getOrCreateVariableProxy(target);
  const existing = getByPath(store, path);
  if (existing === void 0) {
    setByPath(store, path, defaultValue);
    return defaultValue;
  }
  return existing;
}
function getVariable(target, path) {
  const store = variableProxyStore.get(target);
  if (!store) return void 0;
  return getByPath(store, path);
}
function onVariableChange(target, path, callback) {
  const store = getOrCreateVariableProxy(target);
  let previous = getByPath(store, path);
  return subscribe3(store, () => {
    const current = getByPath(store, path);
    if (current !== previous) {
      previous = current;
      callback(current);
    }
  });
}
function onVariableChanges(target, paths, callback) {
  const store = getOrCreateVariableProxy(target);
  let previousValues = paths.map((p) => getByPath(store, p));
  return subscribe3(store, () => {
    const currentValues = paths.map((p) => getByPath(store, p));
    const hasChange = currentValues.some((val, i) => val !== previousValues[i]);
    if (hasChange) {
      previousValues = currentValues;
      callback(currentValues);
    }
  });
}
function clearVariables(target) {
  variableProxyStore.delete(target);
}
var initialStageState, stageState, setStageBackgroundColor, setStageBackgroundImage, setStageVariables, resetStageVariables, variableProxyStore;
var init_stage_state = __esm({
  "src/lib/stage/stage-state.ts"() {
    "use strict";
    init_path_utils();
    init_vector();
    initialStageState = {
      backgroundColor: ZylemBlueColor,
      backgroundImage: null,
      inputs: {
        p1: ["gamepad-1", "keyboard"],
        p2: ["gamepad-2", "keyboard"]
      },
      gravity: new Vector36(0, 0, 0),
      variables: {},
      entities: []
    };
    stageState = proxy3({
      backgroundColor: new Color6(Color6.NAMES.cornflowerblue),
      backgroundImage: null,
      inputs: {
        p1: ["gamepad-1", "keyboard-1"],
        p2: ["gamepad-2", "keyboard-2"]
      },
      variables: {},
      gravity: new Vector36(0, 0, 0),
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
  Mesh as Mesh5,
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
        this.fillMesh = new Mesh5(
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
import { BufferAttribute, BufferGeometry as BufferGeometry4, LineBasicMaterial as LineBasicMaterial2, LineSegments as LineSegments2, Raycaster, Vector2 as Vector23 } from "three";
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
      mouseNdc = new Vector23(-2, -2);
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
        this.attachDomListeners();
      }
      initDebugVisuals() {
        if (this.debugLines || !this.stage.scene) return;
        this.debugLines = new LineSegments2(
          new BufferGeometry4(),
          new LineBasicMaterial2({ vertexColors: true })
        );
        this.stage.scene.scene.add(this.debugLines);
        this.debugLines.visible = true;
        this.debugCursor = new DebugEntityCursor(this.stage.scene.scene);
      }
      disposeDebugVisuals() {
        if (this.debugLines && this.stage.scene) {
          this.stage.scene.scene.remove(this.debugLines);
          this.debugLines.geometry.dispose();
          this.debugLines.material.dispose();
          this.debugLines = null;
        }
        this.debugCursor?.dispose();
        this.debugCursor = null;
      }
      update() {
        if (!debugState.enabled) {
          if (this.debugLines) {
            this.disposeDebugVisuals();
          }
          return;
        }
        if (!this.stage.scene || !this.stage.world || !this.stage.cameraRef) return;
        if (!this.debugLines) {
          this.initDebugVisuals();
        }
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
        this.disposeDebugVisuals();
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
      cameraRig = null;
      sceneRef = null;
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
      savedCameraLocalPosition = null;
      // Saved debug camera state for restoration when re-entering debug mode
      savedDebugCameraPosition = null;
      savedDebugCameraQuaternion = null;
      savedDebugCameraZoom = null;
      savedDebugOrbitTarget = null;
      constructor(camera, domElement, cameraRig) {
        this.camera = camera;
        this.domElement = domElement;
        this.cameraRig = cameraRig ?? null;
      }
      /**
       * Set the scene reference for adding/removing camera when detaching from rig.
       */
      setScene(scene) {
        this.sceneRef = scene;
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
          this.detachCameraFromRig();
          this.enableOrbitControls();
          this.restoreDebugCameraState();
          this.updateOrbitTargetFromSelection(state2.selected);
        } else if (!state2.enabled && wasEnabled) {
          this.saveDebugCameraState();
          this.orbitTarget = null;
          this.disableOrbitControls();
          this.reattachCameraToRig();
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
      /**
       * Detach camera from its rig to allow free orbit movement in debug mode.
       * Preserves the camera's world position.
       */
      detachCameraFromRig() {
        if (!this.cameraRig || this.camera.parent !== this.cameraRig) {
          return;
        }
        this.savedCameraLocalPosition = this.camera.position.clone();
        const worldPos = new Vector310();
        this.camera.getWorldPosition(worldPos);
        this.cameraRig.remove(this.camera);
        if (this.sceneRef) {
          this.sceneRef.add(this.camera);
        }
        this.camera.position.copy(worldPos);
      }
      /**
       * Reattach camera to its rig when exiting debug mode.
       * Restores the camera's local position relative to the rig.
       */
      reattachCameraToRig() {
        if (!this.cameraRig || this.camera.parent === this.cameraRig) {
          return;
        }
        if (this.sceneRef && this.camera.parent === this.sceneRef) {
          this.sceneRef.remove(this.camera);
        }
        this.cameraRig.add(this.camera);
        if (this.savedCameraLocalPosition) {
          this.camera.position.copy(this.savedCameraLocalPosition);
          this.savedCameraLocalPosition = null;
        }
      }
    };
  }
});

// src/lib/camera/zylem-camera.ts
import { PerspectiveCamera, Vector3 as Vector311, Object3D as Object3D7, OrthographicCamera, WebGLRenderer as WebGLRenderer3 } from "three";
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
          this.cameraRig = new Object3D7();
          this.cameraRig.position.set(0, 3, 10);
          this.cameraRig.add(this.camera);
          this.camera.lookAt(new Vector311(0, 2, 0));
        } else {
          this.camera.position.set(0, 0, 10);
          this.camera.lookAt(new Vector311(0, 0, 0));
        }
        this.initializePerspectiveController();
        this.orbitController = new CameraOrbitController(this.camera, this.renderer.domElement, this.cameraRig);
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
        this.orbitController?.setScene(scene);
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
import { Vector2 as Vector26 } from "three";
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
        const screenResolution = new Vector26(width, height);
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

// src/lib/stage/stage-entity-model-delegate.ts
var StageEntityModelDelegate;
var init_stage_entity_model_delegate = __esm({
  "src/lib/stage/stage-entity-model-delegate.ts"() {
    "use strict";
    init_events();
    StageEntityModelDelegate = class {
      scene = null;
      pendingEntities = /* @__PURE__ */ new Map();
      modelLoadedHandler = null;
      /**
       * Initialize the delegate with the scene reference and start listening.
       */
      attach(scene) {
        this.scene = scene;
        this.modelLoadedHandler = (payload) => {
          this.handleModelLoaded(payload.entityId, payload.success);
        };
        zylemEventBus.on("entity:model:loaded", this.modelLoadedHandler);
      }
      /**
       * Register an entity for observation.
       * When its model loads, the group will be added to the scene.
       */
      observe(entity) {
        this.pendingEntities.set(entity.uuid, entity);
      }
      /**
       * Unregister an entity (e.g., when removed before model loads).
       */
      unobserve(entityId) {
        this.pendingEntities.delete(entityId);
      }
      /**
       * Handle model loaded event - add group to scene if entity is pending.
       */
      handleModelLoaded(entityId, success) {
        const entity = this.pendingEntities.get(entityId);
        if (!entity || !success) {
          this.pendingEntities.delete(entityId);
          return;
        }
        this.scene?.addEntityGroup(entity);
        this.pendingEntities.delete(entityId);
      }
      /**
       * Cleanup all subscriptions and pending entities.
       */
      dispose() {
        if (this.modelLoadedHandler) {
          zylemEventBus.off("entity:model:loaded", this.modelLoadedHandler);
          this.modelLoadedHandler = null;
        }
        this.pendingEntities.clear();
        this.scene = null;
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
import { addEntity, createWorld as createECS, removeEntity } from "bitecs";
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
    init_debug_state();
    init_game_state();
    init_lifecycle_base();
    init_transformable_system();
    init_stage_debug_delegate();
    init_stage_camera_debug_delegate();
    init_stage_camera_delegate();
    init_stage_loading_delegate();
    init_stage_entity_model_delegate();
    init_entity();
    init_stage_config();
    init_options_parser();
    STAGE_TYPE = "Stage";
    ZylemStage = class extends LifeCycleBase {
      type = STAGE_TYPE;
      state = { ...initialStageState };
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
      behaviorSystems = [];
      registeredSystemKeys = /* @__PURE__ */ new Set();
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
      entityModelDelegate;
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
        this.entityModelDelegate = new StageEntityModelDelegate();
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
        this.entityModelDelegate.attach(this.scene);
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
        for (const system of this.behaviorSystems) {
          system.update(this.ecs, delta);
        }
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
        for (const system of this.behaviorSystems) {
          system.destroy?.(this.ecs);
        }
        this.behaviorSystems = [];
        this.registeredSystemKeys.clear();
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
        this.entityModelDelegate.dispose();
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
        if (typeof entity.getBehaviorRefs === "function") {
          for (const ref of entity.getBehaviorRefs()) {
            const key = ref.descriptor.key;
            if (!this.registeredSystemKeys.has(key)) {
              const system = ref.descriptor.systemFactory({ world: this.world, ecs: this.ecs });
              this.behaviorSystems.push(system);
              this.registeredSystemKeys.add(key);
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
        this.entityModelDelegate.observe(entity);
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
       * Register an ECS behavior system to run each frame.
       * @param systemOrFactory A BehaviorSystem instance or factory function
       * @returns this for chaining
       */
      registerSystem(systemOrFactory) {
        let system;
        if (typeof systemOrFactory === "function") {
          system = systemOrFactory({ world: this.world, ecs: this.ecs });
        } else {
          system = systemOrFactory;
        }
        this.behaviorSystems.push(system);
        return this;
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
        this.entityModelDelegate.unobserve(uuid);
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
import { Vector2 as Vector28, Vector3 as Vector314 } from "three";
function createCamera(options) {
  const screenResolution = options.screenResolution || new Vector28(window.innerWidth, window.innerHeight);
  let frustumSize = 10;
  if (options.perspective === "fixed-2d") {
    frustumSize = options.zoom || 10;
  }
  const zylemCamera = new ZylemCamera(options.perspective || "third-person", screenResolution, frustumSize);
  zylemCamera.move(options.position || new Vector314(0, 0, 0));
  zylemCamera.camera.lookAt(options.target || new Vector314(0, 0, 0));
  return new CameraWrapper(zylemCamera);
}
var CameraWrapper;
var init_camera = __esm({
  "src/lib/camera/camera.ts"() {
    "use strict";
    init_zylem_camera();
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

// src/lib/input/input-state.ts
function createButtonState() {
  return { pressed: false, released: false, held: 0 };
}
function createAnalogState() {
  return { value: 0, held: 0 };
}
function compileMapping(mapping) {
  const compiled = /* @__PURE__ */ new Map();
  if (!mapping) return compiled;
  for (const [key, targets] of Object.entries(mapping)) {
    if (!targets || targets.length === 0) continue;
    const paths = [];
    for (const target of targets) {
      const [rawCategory, rawName] = (target || "").split(".");
      if (!rawCategory || !rawName) continue;
      const category = rawCategory.toLowerCase();
      const nameKey = rawName.toLowerCase();
      if (category === "buttons") {
        const propertyMap = {
          "a": "A",
          "b": "B",
          "x": "X",
          "y": "Y",
          "start": "Start",
          "select": "Select",
          "l": "L",
          "r": "R"
        };
        const prop = propertyMap[nameKey];
        if (prop) {
          paths.push({ category: "buttons", property: prop });
        }
      } else if (category === "directions") {
        const propertyMap = {
          "up": "Up",
          "down": "Down",
          "left": "Left",
          "right": "Right"
        };
        const prop = propertyMap[nameKey];
        if (prop) {
          paths.push({ category: "directions", property: prop });
        }
      } else if (category === "shoulders") {
        const propertyMap = {
          "ltrigger": "LTrigger",
          "rtrigger": "RTrigger"
        };
        const prop = propertyMap[nameKey];
        if (prop) {
          paths.push({ category: "shoulders", property: prop });
        }
      }
    }
    if (paths.length > 0) {
      compiled.set(key, paths);
    }
  }
  return compiled;
}
function mergeButtonState(a, b) {
  if (!a && !b) return createButtonState();
  if (!a) return { ...b };
  if (!b) return { ...a };
  return {
    pressed: a.pressed || b.pressed,
    released: a.released || b.released,
    held: a.held + b.held
  };
}
function mergeAnalogState(a, b) {
  if (!a && !b) return createAnalogState();
  if (!a) return { ...b };
  if (!b) return { ...a };
  return {
    value: a.value + b.value,
    held: a.held + b.held
  };
}

// src/lib/input/keyboard-provider.ts
var KeyboardProvider = class {
  keyStates = /* @__PURE__ */ new Map();
  keyButtonStates = /* @__PURE__ */ new Map();
  mapping = null;
  compiledMapping;
  includeDefaultBase = true;
  constructor(mapping, options) {
    console.log("[KeyboardProvider] Constructor called with mapping:", mapping, "options:", options);
    this.mapping = mapping ?? null;
    this.includeDefaultBase = options?.includeDefaultBase ?? true;
    console.log("[KeyboardProvider] About to call compileMapping with:", this.mapping);
    this.compiledMapping = compileMapping(this.mapping);
    console.log("[KeyboardProvider] compileMapping returned, size:", this.compiledMapping.size);
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
  /**
   * Optimized custom mapping application using pre-computed paths.
   * No string parsing happens here - all lookups are O(1).
   */
  applyCustomMapping(input, delta) {
    if (this.compiledMapping.size === 0) return input;
    for (const [key, paths] of this.compiledMapping.entries()) {
      const state2 = this.handleButtonState(key, delta);
      for (const path of paths) {
        const { category, property } = path;
        if (category === "buttons") {
          if (!input.buttons) input.buttons = {};
          const nextButtons = input.buttons;
          nextButtons[property] = mergeButtonState(nextButtons[property], state2);
        } else if (category === "directions") {
          if (!input.directions) input.directions = {};
          const nextDirections = input.directions;
          nextDirections[property] = mergeButtonState(nextDirections[property], state2);
        } else if (category === "shoulders") {
          if (!input.shoulders) input.shoulders = {};
          const nextShoulders = input.shoulders;
          nextShoulders[property] = mergeButtonState(nextShoulders[property], state2);
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
    const result = this.applyCustomMapping(base, delta);
    if (this.isKeyPressed("w") || this.isKeyPressed("s") || this.isKeyPressed("ArrowUp") || this.isKeyPressed("ArrowDown")) {
      console.log("[KeyboardProvider] includeDefaultBase:", this.includeDefaultBase);
      console.log("[KeyboardProvider] compiledMapping size:", this.compiledMapping.size);
      console.log("[KeyboardProvider] result.directions:", result.directions);
    }
    return result;
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
    console.log("[InputManager] Constructor called with config:", config);
    console.log("[InputManager] config?.p1:", config?.p1);
    console.log("[InputManager] config?.p1?.key:", config?.p1?.key);
    if (config?.p1?.key) {
      console.log("[InputManager] Creating P1 KeyboardProvider with custom mapping:", config.p1.key);
      this.addInputProvider(1, new KeyboardProvider(config.p1.key, { includeDefaultBase: false }));
    } else {
      console.log("[InputManager] Creating P1 KeyboardProvider with default mapping");
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
  mergeInputs(a, b) {
    return {
      buttons: {
        A: mergeButtonState(a.buttons?.A, b.buttons?.A),
        B: mergeButtonState(a.buttons?.B, b.buttons?.B),
        X: mergeButtonState(a.buttons?.X, b.buttons?.X),
        Y: mergeButtonState(a.buttons?.Y, b.buttons?.Y),
        Start: mergeButtonState(a.buttons?.Start, b.buttons?.Start),
        Select: mergeButtonState(a.buttons?.Select, b.buttons?.Select),
        L: mergeButtonState(a.buttons?.L, b.buttons?.L),
        R: mergeButtonState(a.buttons?.R, b.buttons?.R)
      },
      directions: {
        Up: mergeButtonState(a.directions?.Up, b.directions?.Up),
        Down: mergeButtonState(a.directions?.Down, b.directions?.Down),
        Left: mergeButtonState(a.directions?.Left, b.directions?.Left),
        Right: mergeButtonState(a.directions?.Right, b.directions?.Right)
      },
      axes: {
        Horizontal: mergeAnalogState(a.axes?.Horizontal, b.axes?.Horizontal),
        Vertical: mergeAnalogState(a.axes?.Vertical, b.axes?.Vertical)
      },
      shoulders: {
        LTrigger: mergeButtonState(a.shoulders?.LTrigger, b.shoulders?.LTrigger),
        RTrigger: mergeButtonState(a.shoulders?.RTrigger, b.shoulders?.RTrigger)
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
function parseResolution(text) {
  if (!text) return null;
  const normalized = String(text).toLowerCase().trim().replace(/\s+/g, "").replace("\xD7", "x");
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
function gameConfig(config) {
  return { ...config };
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
init_events();

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
    this.timer = new Timer();
    this.timer.connect(document);
    console.log("[ZylemGame] options:", options);
    console.log("[ZylemGame] options.input:", options.input);
    const config = resolveGameConfig(options);
    console.log(config);
    console.log("[ZylemGame] config.input:", config.input);
    this.inputManager = new InputManager(config.input);
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
      this.emitStateDispatch("@stage:loaded");
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
  /**
   * Execute a single frame update.
   * This method can be called directly for testing or from the game loop.
   * @param deltaTime Optional delta time in seconds. If not provided, uses timer delta.
   */
  step(deltaTime) {
    const stage = this.currentStage();
    if (!stage || !stage.wrappedStage) return;
    const params = this.params();
    const delta = deltaTime !== void 0 ? deltaTime : params.delta;
    const clampedDelta = Math.min(Math.max(delta, 0), _ZylemGame.MAX_DELTA_SECONDS);
    const clampedParams = { ...params, delta: clampedDelta };
    if (this.customUpdate) {
      this.customUpdate(clampedParams);
    }
    stage.wrappedStage?.nodeUpdate({ ...clampedParams, me: stage.wrappedStage });
    this.totalTime += clampedDelta;
    state.time = this.totalTime;
  }
  loop(timestamp) {
    this.debugDelegate?.begin();
    if (!isPaused()) {
      this.timer.update(timestamp);
      this.step();
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
   * Build the stage config payload for the current stage.
   */
  buildStageConfigPayload() {
    const stage = this.currentStage();
    if (!stage?.wrappedStage) return null;
    const state2 = stage.wrappedStage.state;
    const bgColor = state2.backgroundColor;
    const colorStr = typeof bgColor === "string" ? bgColor : `#${bgColor.getHexString()}`;
    return {
      id: stage.wrappedStage.uuid,
      backgroundColor: colorStr,
      backgroundImage: state2.backgroundImage,
      gravity: {
        x: state2.gravity.x,
        y: state2.gravity.y,
        z: state2.gravity.z
      },
      inputs: state2.inputs,
      variables: state2.variables
    };
  }
  /**
   * Build the entities payload for the current stage.
   */
  buildEntitiesPayload() {
    const stage = this.currentStage();
    if (!stage?.wrappedStage) return null;
    const entities = [];
    stage.wrappedStage._childrenMap.forEach((child) => {
      const entityType = child.constructor.type;
      const typeStr = entityType ? String(entityType).replace("Symbol(", "").replace(")", "") : "Unknown";
      const position2 = child.position ?? { x: 0, y: 0, z: 0 };
      const rotation2 = child.rotation ?? { x: 0, y: 0, z: 0 };
      const scale2 = child.scale ?? { x: 1, y: 1, z: 1 };
      entities.push({
        uuid: child.uuid,
        name: child.name || "Unnamed",
        type: typeStr,
        position: { x: position2.x ?? 0, y: position2.y ?? 0, z: position2.z ?? 0 },
        rotation: { x: rotation2.x ?? 0, y: rotation2.y ?? 0, z: rotation2.z ?? 0 },
        scale: { x: scale2.x ?? 1, y: scale2.y ?? 1, z: scale2.z ?? 1 }
      });
    });
    return entities;
  }
  /**
   * Emit a state:dispatch event to the zylemEventBus.
   * Called after stage load and on global state changes.
   */
  emitStateDispatch(path, value, previousValue) {
    const statePayload = {
      scope: "game",
      path,
      value,
      previousValue,
      config: this.resolvedConfig ? {
        id: this.resolvedConfig.id,
        aspectRatio: this.resolvedConfig.aspectRatio,
        fullscreen: this.resolvedConfig.fullscreen,
        bodyBackground: this.resolvedConfig.bodyBackground,
        internalResolution: this.resolvedConfig.internalResolution,
        debug: this.resolvedConfig.debug
      } : null,
      stageConfig: this.buildStageConfigPayload(),
      entities: this.buildEntitiesPayload()
    };
    zylemEventBus.emit("state:dispatch", statePayload);
  }
  /**
   * Subscribe to the game event bus for stage loading and state events.
   * Emits events to zylemEventBus for cross-package communication.
   */
  subscribeToEventBus() {
    this.eventBusUnsubscribes.push(
      gameEventBus.on("game:state:updated", (payload) => {
        this.emitStateDispatch(payload.path, payload.value, payload.previousValue);
      })
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
  let convertedDefault = { ...getGameDefaultConfig2() };
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
    convertedDefault = Object.assign(convertedDefault, { ...configuration });
  });
  const converted = convertedDefault;
  converted.input = configurations[0].input;
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
import { Color as Color10, Group as Group5, Sprite as ThreeSprite, SpriteMaterial, CanvasTexture, LinearFilter, Vector2 as Vector29, ClampToEdgeWrapping } from "three";

// src/lib/entities/delegates/debug.ts
import { MeshStandardMaterial as MeshStandardMaterial3, MeshBasicMaterial as MeshBasicMaterial2, MeshPhongMaterial as MeshPhongMaterial2 } from "three";
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
    if (material instanceof MeshStandardMaterial3 || material instanceof MeshBasicMaterial2 || material instanceof MeshPhongMaterial2) {
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
  screenPosition: new Vector29(24, 24),
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
  measureAndResizeCanvas(text, fontSize, fontFamily, padding) {
    if (!this._canvas || !this._ctx) return { sizeChanged: false };
    this._ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = this._ctx.measureText(text);
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
  drawCenteredText(text, fontSize, fontFamily) {
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
    this._ctx.fillText(text, this._canvas.width / 2, this._canvas.height / 2);
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
    const sp = this.options.screenPosition ?? new Vector29(24, 24);
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
  textDestroy() {
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
function createText(...args) {
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
  TextureLoader as TextureLoader2,
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
    const textureLoader = new TextureLoader2();
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
  spriteUpdate(params) {
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
  spriteDestroy(params) {
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
function createSprite(...args) {
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
  createFromBlueprint(blueprint) {
    const creator = this.registry.get(blueprint.type);
    if (!creator) {
      throw new Error(`Unknown entity type: ${blueprint.type}`);
    }
    const options = {
      ...blueprint.data,
      position: blueprint.position ? { x: blueprint.position[0], y: blueprint.position[1], z: 0 } : void 0,
      name: blueprint.id
    };
    const entity = creator(options);
    return entity;
  }
};
EntityFactory.register("text", (opts) => createText(opts));
EntityFactory.register("sprite", (opts) => createSprite(opts));
function createEntityFactory(template) {
  return {
    template,
    generate(count) {
      const entities = [];
      for (let i = 0; i < count; i++) {
        const EntityClass = template.constructor;
        const options = { ...template.options };
        const clone = new EntityClass(options).create();
        const templateRefs = template.getBehaviorRefs();
        for (const ref of templateRefs) {
          clone.use(ref.descriptor, ref.options);
        }
        const templateCallbacks = template.lifecycleCallbacks;
        if (templateCallbacks) {
          const cloneCallbacks = clone.lifecycleCallbacks;
          if (cloneCallbacks) {
            cloneCallbacks.setup.push(...templateCallbacks.setup);
            cloneCallbacks.update.push(...templateCallbacks.update);
            cloneCallbacks.destroy.push(...templateCallbacks.destroy);
          }
        }
        entities.push(clone);
      }
      return entities;
    }
  };
}

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
  /**
   * Execute a single frame update.
   * Useful for testing or manual frame stepping.
   * @param deltaTime Optional delta time in seconds (defaults to 1/60)
   */
  step(deltaTime = 1 / 60) {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    this.wrappedGame.step(deltaTime);
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
      console.log("next stage called");
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

// src/api/main.ts
init_stage();

// src/lib/stage/entity-spawner.ts
import { Euler as Euler2, Quaternion as Quaternion4, Vector2 as Vector210 } from "three";
function entitySpawner(factory) {
  return {
    spawn: async (stage, x, y) => {
      const instance = await Promise.resolve(factory(x, y));
      stage.add(instance);
      return instance;
    },
    spawnRelative: async (source, stage, offset = new Vector210(0, 1)) => {
      if (!source.body) {
        console.warn("body missing for entity during spawnRelative");
        return void 0;
      }
      const { x, y, z } = source.body.translation();
      let rz = source._rotation2DAngle ?? 0;
      try {
        const r = source.body.rotation();
        const q = new Quaternion4(r.x, r.y, r.z, r.w);
        const e = new Euler2().setFromQuaternion(q, "XYZ");
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

// src/api/main.ts
init_camera();
init_perspective();

// src/lib/entities/box.ts
init_entity();
init_builder();
init_builder();
init_builder();
import { ColliderDesc as ColliderDesc4 } from "@dimforge/rapier3d-compat";
import { BoxGeometry as BoxGeometry2, Color as Color12 } from "three";
import { Vector3 as Vector317 } from "three";
init_create();
var boxDefaults = {
  size: new Vector317(1, 1, 1),
  position: new Vector317(0, 0, 0),
  collision: {
    static: false
  },
  material: {
    color: new Color12("#ffffff"),
    shader: "standard"
  }
};
var BoxCollisionBuilder = class extends EntityCollisionBuilder {
  collider(options) {
    const size = options.size || new Vector317(1, 1, 1);
    const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
    let colliderDesc = ColliderDesc4.cuboid(half.x, half.y, half.z);
    return colliderDesc;
  }
};
var BoxMeshBuilder = class extends EntityMeshBuilder {
  build(options) {
    const size = options.size ?? new Vector317(1, 1, 1);
    return new BoxGeometry2(size.x, size.y, size.z);
  }
};
var BoxBuilder = class extends EntityBuilder {
  createEntity(options) {
    return new ZylemBox(options);
  }
};
var BOX_TYPE = /* @__PURE__ */ Symbol("Box");
var ZylemBox = class _ZylemBox extends GameEntity {
  static type = BOX_TYPE;
  constructor(options) {
    super();
    this.options = { ...boxDefaults, ...options };
  }
  buildInfo() {
    const delegate = new DebugDelegate(this);
    const baseInfo = delegate.buildDebugInfo();
    const { x: sizeX, y: sizeY, z: sizeZ } = this.options.size ?? { x: 1, y: 1, z: 1 };
    return {
      ...baseInfo,
      type: String(_ZylemBox.type),
      size: `${sizeX}, ${sizeY}, ${sizeZ}`
    };
  }
};
function createBox(...args) {
  return createEntity({
    args,
    defaultConfig: boxDefaults,
    EntityClass: ZylemBox,
    BuilderClass: BoxBuilder,
    MeshBuilderClass: BoxMeshBuilder,
    CollisionBuilderClass: BoxCollisionBuilder,
    entityType: ZylemBox.type
  });
}

// src/lib/entities/sphere.ts
init_entity();
init_builder();
init_builder();
init_builder();
import { ColliderDesc as ColliderDesc5 } from "@dimforge/rapier3d-compat";
import { Color as Color13, SphereGeometry } from "three";
import { Vector3 as Vector318 } from "three";
init_create();
var sphereDefaults = {
  radius: 1,
  position: new Vector318(0, 0, 0),
  collision: {
    static: false
  },
  material: {
    color: new Color13("#ffffff"),
    shader: "standard"
  }
};
var SphereCollisionBuilder = class extends EntityCollisionBuilder {
  collider(options) {
    const radius = options.radius ?? 1;
    let colliderDesc = ColliderDesc5.ball(radius);
    return colliderDesc;
  }
};
var SphereMeshBuilder = class extends EntityMeshBuilder {
  build(options) {
    const radius = options.radius ?? 1;
    return new SphereGeometry(radius);
  }
};
var SphereBuilder = class extends EntityBuilder {
  createEntity(options) {
    return new ZylemSphere(options);
  }
};
var SPHERE_TYPE = /* @__PURE__ */ Symbol("Sphere");
var ZylemSphere = class _ZylemSphere extends GameEntity {
  static type = SPHERE_TYPE;
  constructor(options) {
    super();
    this.options = { ...sphereDefaults, ...options };
  }
  buildInfo() {
    const delegate = new DebugDelegate(this);
    const baseInfo = delegate.buildDebugInfo();
    const radius = this.options.radius ?? 1;
    return {
      ...baseInfo,
      type: String(_ZylemSphere.type),
      radius: radius.toFixed(2)
    };
  }
};
function createSphere(...args) {
  return createEntity({
    args,
    defaultConfig: sphereDefaults,
    EntityClass: ZylemSphere,
    BuilderClass: SphereBuilder,
    MeshBuilderClass: SphereMeshBuilder,
    CollisionBuilderClass: SphereCollisionBuilder,
    entityType: ZylemSphere.type
  });
}

// src/lib/entities/plane.ts
init_entity();
init_builder();
init_builder();
init_builder();
import { ColliderDesc as ColliderDesc6 } from "@dimforge/rapier3d-compat";
import { Color as Color14, PlaneGeometry, Vector2 as Vector211, Vector3 as Vector319 } from "three";

// src/lib/graphics/geometries/XZPlaneGeometry.ts
import { BufferGeometry as BufferGeometry5, Float32BufferAttribute } from "three";
var XZPlaneGeometry = class _XZPlaneGeometry extends BufferGeometry5 {
  constructor(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    super();
    this.type = "XZPlaneGeometry";
    this.parameters = {
      width,
      height,
      widthSegments,
      heightSegments
    };
    const width_half = width / 2;
    const height_half = height / 2;
    const gridX = Math.floor(widthSegments);
    const gridY = Math.floor(heightSegments);
    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;
    const segment_width = width / gridX;
    const segment_height = height / gridY;
    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];
    for (let iy = 0; iy < gridY1; iy++) {
      const z = iy * segment_height - height_half;
      for (let ix = 0; ix < gridX1; ix++) {
        const x = ix * segment_width - width_half;
        vertices.push(x, 0, z);
        normals.push(0, 1, 0);
        uvs.push(ix / gridX);
        uvs.push(1 - iy / gridY);
      }
    }
    for (let iy = 0; iy < gridY; iy++) {
      for (let ix = 0; ix < gridX; ix++) {
        const a = ix + gridX1 * iy;
        const b = ix + gridX1 * (iy + 1);
        const c = ix + 1 + gridX1 * (iy + 1);
        const d = ix + 1 + gridX1 * iy;
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
    this.setIndex(indices);
    this.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    this.setAttribute("normal", new Float32BufferAttribute(normals, 3));
    this.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  }
  copy(source) {
    super.copy(source);
    this.parameters = Object.assign({}, source.parameters);
    return this;
  }
  static fromJSON(data) {
    return new _XZPlaneGeometry(data.width, data.height, data.widthSegments, data.heightSegments);
  }
};

// src/lib/entities/plane.ts
init_create();
var DEFAULT_SUBDIVISIONS = 4;
var planeDefaults = {
  tile: new Vector211(10, 10),
  repeat: new Vector211(1, 1),
  position: new Vector319(0, 0, 0),
  collision: {
    static: true
  },
  material: {
    color: new Color14("#ffffff"),
    shader: "standard"
  },
  subdivisions: DEFAULT_SUBDIVISIONS,
  randomizeHeight: false,
  heightScale: 1
};
var PlaneCollisionBuilder = class extends EntityCollisionBuilder {
  collider(options) {
    const tile = options.tile ?? new Vector211(1, 1);
    const subdivisions = options.subdivisions ?? DEFAULT_SUBDIVISIONS;
    const size = new Vector319(tile.x, 1, tile.y);
    const heightData = options._builders?.meshBuilder?.heightData;
    const scale2 = new Vector319(size.x, 1, size.z);
    let colliderDesc = ColliderDesc6.heightfield(
      subdivisions,
      subdivisions,
      heightData,
      scale2
    );
    return colliderDesc;
  }
};
var PlaneMeshBuilder = class extends EntityMeshBuilder {
  heightData = new Float32Array();
  columnsRows = /* @__PURE__ */ new Map();
  subdivisions = DEFAULT_SUBDIVISIONS;
  build(options) {
    const tile = options.tile ?? new Vector211(1, 1);
    const subdivisions = options.subdivisions ?? DEFAULT_SUBDIVISIONS;
    this.subdivisions = subdivisions;
    const size = new Vector319(tile.x, 1, tile.y);
    const heightScale = options.heightScale ?? 1;
    const geometry = new XZPlaneGeometry(size.x, size.z, subdivisions, subdivisions);
    const vertexGeometry = new PlaneGeometry(size.x, size.z, subdivisions, subdivisions);
    const dx = size.x / subdivisions;
    const dy = size.z / subdivisions;
    const originalVertices = geometry.attributes.position.array;
    const vertices = vertexGeometry.attributes.position.array;
    const columsRows = /* @__PURE__ */ new Map();
    const heightMapData = options.heightMap;
    const useRandomHeight = options.randomizeHeight ?? false;
    for (let i = 0; i < vertices.length; i += 3) {
      const vertexIndex = i / 3;
      let row = Math.floor(Math.abs(vertices[i] + size.x / 2) / dx);
      let column = Math.floor(Math.abs(vertices[i + 1] - size.z / 2) / dy);
      let height = 0;
      if (heightMapData && heightMapData.length > 0) {
        const heightIndex = vertexIndex % heightMapData.length;
        height = heightMapData[heightIndex] * heightScale;
      } else if (useRandomHeight) {
        height = Math.random() * 4 * heightScale;
      }
      vertices[i + 2] = height;
      originalVertices[i + 1] = height;
      if (!columsRows.get(column)) {
        columsRows.set(column, /* @__PURE__ */ new Map());
      }
      columsRows.get(column).set(row, height);
    }
    this.columnsRows = columsRows;
    return geometry;
  }
  postBuild() {
    const heights = [];
    for (let i = 0; i <= this.subdivisions; ++i) {
      for (let j = 0; j <= this.subdivisions; ++j) {
        const row = this.columnsRows.get(j);
        if (!row) {
          heights.push(0);
          continue;
        }
        const data = row.get(i);
        heights.push(data ?? 0);
      }
    }
    this.heightData = new Float32Array(heights);
  }
};
var PlaneBuilder = class extends EntityBuilder {
  createEntity(options) {
    return new ZylemPlane(options);
  }
};
var PLANE_TYPE = /* @__PURE__ */ Symbol("Plane");
var ZylemPlane = class extends GameEntity {
  static type = PLANE_TYPE;
  constructor(options) {
    super();
    this.options = { ...planeDefaults, ...options };
  }
};
function createPlane(...args) {
  return createEntity({
    args,
    defaultConfig: planeDefaults,
    EntityClass: ZylemPlane,
    BuilderClass: PlaneBuilder,
    MeshBuilderClass: PlaneMeshBuilder,
    CollisionBuilderClass: PlaneCollisionBuilder,
    entityType: ZylemPlane.type
  });
}

// src/lib/entities/zone.ts
init_entity();
init_builder();
init_builder();
init_create();
init_game_state();
import { ActiveCollisionTypes as ActiveCollisionTypes3, ColliderDesc as ColliderDesc7 } from "@dimforge/rapier3d-compat";
import { Vector3 as Vector320 } from "three";
var zoneDefaults = {
  size: new Vector320(1, 1, 1),
  position: new Vector320(0, 0, 0),
  collision: {
    static: true
  },
  material: {
    shader: "standard"
  }
};
var ZoneCollisionBuilder = class extends EntityCollisionBuilder {
  collider(options) {
    const size = options.size || new Vector320(1, 1, 1);
    const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
    let colliderDesc = ColliderDesc7.cuboid(half.x, half.y, half.z);
    colliderDesc.setSensor(true);
    colliderDesc.activeCollisionTypes = ActiveCollisionTypes3.KINEMATIC_FIXED;
    return colliderDesc;
  }
};
var ZoneBuilder = class extends EntityBuilder {
  createEntity(options) {
    return new ZylemZone(options);
  }
};
var ZONE_TYPE = /* @__PURE__ */ Symbol("Zone");
var ZylemZone = class extends GameEntity {
  static type = ZONE_TYPE;
  _enteredZone = /* @__PURE__ */ new Map();
  _exitedZone = /* @__PURE__ */ new Map();
  _zoneEntities = /* @__PURE__ */ new Map();
  constructor(options) {
    super();
    this.options = { ...zoneDefaults, ...options };
  }
  handlePostCollision({ delta }) {
    this._enteredZone.forEach((val, key) => {
      this.exited(delta, key);
    });
    return this._enteredZone.size > 0;
  }
  handleIntersectionEvent({ other, delta }) {
    const hasEntered = this._enteredZone.get(other.uuid);
    if (!hasEntered) {
      this.entered(other);
      this._zoneEntities.set(other.uuid, other);
    } else {
      this.held(delta, other);
    }
  }
  onEnter(callback) {
    this.options.onEnter = callback;
    return this;
  }
  onHeld(callback) {
    this.options.onHeld = callback;
    return this;
  }
  onExit(callback) {
    this.options.onExit = callback;
    return this;
  }
  entered(other) {
    this._enteredZone.set(other.uuid, 1);
    if (this.options.onEnter) {
      this.options.onEnter({
        self: this,
        visitor: other,
        globals: state.globals
      });
    }
  }
  exited(delta, key) {
    const hasExited = this._exitedZone.get(key);
    if (hasExited && hasExited > 1 + delta) {
      this._exitedZone.delete(key);
      this._enteredZone.delete(key);
      const other = this._zoneEntities.get(key);
      if (this.options.onExit) {
        this.options.onExit({
          self: this,
          visitor: other,
          globals: state.globals
        });
      }
      return;
    }
    this._exitedZone.set(key, 1 + delta);
  }
  held(delta, other) {
    const heldTime = this._enteredZone.get(other.uuid) ?? 0;
    this._enteredZone.set(other.uuid, heldTime + delta);
    this._exitedZone.set(other.uuid, 1);
    if (this.options.onHeld) {
      this.options.onHeld({
        delta,
        self: this,
        visitor: other,
        globals: state.globals,
        heldTime
      });
    }
  }
};
function createZone(...args) {
  return createEntity({
    args,
    defaultConfig: zoneDefaults,
    EntityClass: ZylemZone,
    BuilderClass: ZoneBuilder,
    CollisionBuilderClass: ZoneCollisionBuilder,
    entityType: ZylemZone.type
  });
}

// src/api/main.ts
init_actor();

// src/lib/entities/rect.ts
init_entity();
init_builder();
init_create();
import { Color as Color15, Group as Group7, Sprite as ThreeSprite3, SpriteMaterial as SpriteMaterial3, CanvasTexture as CanvasTexture2, LinearFilter as LinearFilter2, Vector2 as Vector212, ClampToEdgeWrapping as ClampToEdgeWrapping2, ShaderMaterial as ShaderMaterial4, Mesh as Mesh6, PlaneGeometry as PlaneGeometry2, Vector3 as Vector321 } from "three";
var rectDefaults = {
  position: void 0,
  width: 120,
  height: 48,
  fillColor: "#FFFFFF",
  strokeColor: null,
  strokeWidth: 0,
  radius: 0,
  padding: 0,
  stickToViewport: true,
  screenPosition: new Vector212(24, 24),
  zDistance: 1,
  anchor: new Vector212(0, 0)
};
var RectBuilder = class extends EntityBuilder {
  createEntity(options) {
    return new ZylemRect(options);
  }
};
var RECT_TYPE = /* @__PURE__ */ Symbol("Rect");
var ZylemRect = class _ZylemRect extends GameEntity {
  static type = RECT_TYPE;
  _sprite = null;
  _mesh = null;
  _texture = null;
  _canvas = null;
  _ctx = null;
  _cameraRef = null;
  _lastCanvasW = 0;
  _lastCanvasH = 0;
  constructor(options) {
    super();
    this.options = { ...rectDefaults, ...options };
    this.group = new Group7();
    this.createSprite();
    this.prependSetup(this.rectSetup.bind(this));
    this.prependUpdate(this.rectUpdate.bind(this));
  }
  createSprite() {
    this._canvas = document.createElement("canvas");
    this._ctx = this._canvas.getContext("2d");
    this._texture = new CanvasTexture2(this._canvas);
    this._texture.minFilter = LinearFilter2;
    this._texture.magFilter = LinearFilter2;
    const material = new SpriteMaterial3({
      map: this._texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      alphaTest: 0.5
    });
    this._sprite = new ThreeSprite3(material);
    this.group?.add(this._sprite);
    this.redrawRect();
  }
  redrawRect() {
    if (!this._canvas || !this._ctx) return;
    const width = Math.max(2, Math.floor(this.options.width ?? 120));
    const height = Math.max(2, Math.floor(this.options.height ?? 48));
    const padding = this.options.padding ?? 0;
    const strokeWidth = this.options.strokeWidth ?? 0;
    const totalW = width + padding * 2 + strokeWidth;
    const totalH = height + padding * 2 + strokeWidth;
    const nextW = Math.max(2, totalW);
    const nextH = Math.max(2, totalH);
    const sizeChanged = nextW !== this._lastCanvasW || nextH !== this._lastCanvasH;
    this._canvas.width = nextW;
    this._canvas.height = nextH;
    this._lastCanvasW = nextW;
    this._lastCanvasH = nextH;
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    const radius = Math.max(0, this.options.radius ?? 0);
    const rectX = Math.floor(padding + strokeWidth / 2);
    const rectY = Math.floor(padding + strokeWidth / 2);
    const rectW = Math.floor(width);
    const rectH = Math.floor(height);
    this._ctx.beginPath();
    if (radius > 0) {
      this.roundedRectPath(this._ctx, rectX, rectY, rectW, rectH, radius);
    } else {
      this._ctx.rect(rectX, rectY, rectW, rectH);
    }
    if (this.options.fillColor) {
      this._ctx.fillStyle = this.toCssColor(this.options.fillColor);
      this._ctx.fill();
    }
    if (this.options.strokeColor && strokeWidth > 0) {
      this._ctx.lineWidth = strokeWidth;
      this._ctx.strokeStyle = this.toCssColor(this.options.strokeColor);
      this._ctx.stroke();
    }
    if (this._texture) {
      if (sizeChanged) {
        this._texture.dispose();
        this._texture = new CanvasTexture2(this._canvas);
        this._texture.minFilter = LinearFilter2;
        this._texture.magFilter = LinearFilter2;
        this._texture.wrapS = ClampToEdgeWrapping2;
        this._texture.wrapT = ClampToEdgeWrapping2;
        if (this._sprite && this._sprite.material instanceof ShaderMaterial4) {
          const shader = this._sprite.material;
          if (shader.uniforms?.tDiffuse) shader.uniforms.tDiffuse.value = this._texture;
          if (shader.uniforms?.iResolution) shader.uniforms.iResolution.value.set(this._canvas.width, this._canvas.height, 1);
        }
      }
      this._texture.image = this._canvas;
      this._texture.needsUpdate = true;
      if (this._sprite && this._sprite.material) {
        this._sprite.material.map = this._texture;
        this._sprite.material.needsUpdate = true;
      }
    }
  }
  getWidth() {
    return this.options.width ?? 0;
  }
  getHeight() {
    return this.options.height ?? 0;
  }
  roundedRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, Math.floor(Math.min(w, h) / 2));
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }
  toCssColor(color) {
    if (typeof color === "string") return color;
    const c = color instanceof Color15 ? color : new Color15(color);
    return `#${c.getHexString()}`;
  }
  rectSetup(params) {
    this._cameraRef = params.camera;
    if (this.options.stickToViewport && this._cameraRef) {
      this._cameraRef.camera.add(this.group);
    }
    if (this.materials?.length && this._sprite) {
      const mat = this.materials[0];
      if (mat instanceof ShaderMaterial4) {
        mat.transparent = true;
        mat.depthTest = false;
        mat.depthWrite = false;
        if (this._texture) {
          if (mat.uniforms?.tDiffuse) mat.uniforms.tDiffuse.value = this._texture;
          if (mat.uniforms?.iResolution && this._canvas) mat.uniforms.iResolution.value.set(this._canvas.width, this._canvas.height, 1);
        }
        this._mesh = new Mesh6(new PlaneGeometry2(1, 1), mat);
        this.group?.add(this._mesh);
        this._sprite.visible = false;
      }
    }
  }
  rectUpdate(params) {
    if (!this._sprite) return;
    if (this._cameraRef && this.options.bounds) {
      const dom = this._cameraRef.renderer.domElement;
      const screen = this.computeScreenBoundsFromOptions(this.options.bounds);
      if (screen) {
        const { x, y, width, height } = screen;
        const desiredW = Math.max(2, Math.floor(width));
        const desiredH = Math.max(2, Math.floor(height));
        const changed = desiredW !== (this.options.width ?? 0) || desiredH !== (this.options.height ?? 0);
        this.options.screenPosition = new Vector212(Math.floor(x), Math.floor(y));
        this.options.width = desiredW;
        this.options.height = desiredH;
        this.options.anchor = new Vector212(0, 0);
        if (changed) {
          this.redrawRect();
        }
      }
    }
    if (this.options.stickToViewport && this._cameraRef) {
      this.updateStickyTransform();
    }
  }
  updateStickyTransform() {
    if (!this._sprite || !this._cameraRef) return;
    const camera = this._cameraRef.camera;
    const dom = this._cameraRef.renderer.domElement;
    const width = dom.clientWidth;
    const height = dom.clientHeight;
    const px = (this.options.screenPosition ?? new Vector212(24, 24)).x;
    const py = (this.options.screenPosition ?? new Vector212(24, 24)).y;
    const zDist = Math.max(1e-3, this.options.zDistance ?? 1);
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
    const ndcX = px / width * 2 - 1;
    const ndcY = 1 - py / height * 2;
    const localX = ndcX * worldHalfW;
    const localY = ndcY * worldHalfH;
    let scaleX = 1;
    let scaleY = 1;
    if (this._canvas) {
      const planeH = worldHalfH * 2;
      const unitsPerPixel = planeH / height;
      const pixelH = this._canvas.height;
      scaleY = Math.max(1e-4, pixelH * unitsPerPixel);
      const aspect = this._canvas.width / this._canvas.height;
      scaleX = scaleY * aspect;
      this._sprite.scale.set(scaleX, scaleY, 1);
      if (this._mesh) this._mesh.scale.set(scaleX, scaleY, 1);
    }
    const anchor = this.options.anchor ?? new Vector212(0, 0);
    const ax = Math.min(100, Math.max(0, anchor.x)) / 100;
    const ay = Math.min(100, Math.max(0, anchor.y)) / 100;
    const offsetX = (0.5 - ax) * scaleX;
    const offsetY = (ay - 0.5) * scaleY;
    this.group?.position.set(localX + offsetX, localY + offsetY, -zDist);
  }
  worldToScreen(point) {
    if (!this._cameraRef) return { x: 0, y: 0 };
    const camera = this._cameraRef.camera;
    const dom = this._cameraRef.renderer.domElement;
    const v = point.clone().project(camera);
    const x = (v.x + 1) / 2 * dom.clientWidth;
    const y = (1 - v.y) / 2 * dom.clientHeight;
    return { x, y };
  }
  computeScreenBoundsFromOptions(bounds) {
    if (!this._cameraRef) return null;
    const dom = this._cameraRef.renderer.domElement;
    if (bounds.screen) {
      return { ...bounds.screen };
    }
    if (bounds.world) {
      const { left, right, top, bottom, z = 0 } = bounds.world;
      const tl = this.worldToScreen(new Vector321(left, top, z));
      const br = this.worldToScreen(new Vector321(right, bottom, z));
      const x = Math.min(tl.x, br.x);
      const y = Math.min(tl.y, br.y);
      const width = Math.abs(br.x - tl.x);
      const height = Math.abs(br.y - tl.y);
      return { x, y, width, height };
    }
    return null;
  }
  updateRect(options) {
    this.options = { ...this.options, ...options };
    this.redrawRect();
    if (this.options.stickToViewport && this._cameraRef) {
      this.updateStickyTransform();
    }
  }
  buildInfo() {
    const delegate = new DebugDelegate(this);
    const baseInfo = delegate.buildDebugInfo();
    return {
      ...baseInfo,
      type: String(_ZylemRect.type),
      width: this.options.width ?? 0,
      height: this.options.height ?? 0,
      sticky: this.options.stickToViewport
    };
  }
};
function createRect(...args) {
  return createEntity({
    args,
    defaultConfig: { ...rectDefaults },
    EntityClass: ZylemRect,
    BuilderClass: RectBuilder,
    entityType: ZylemRect.type
  });
}

// src/lib/behaviors/behavior-descriptor.ts
function defineBehavior(config) {
  return {
    key: /* @__PURE__ */ Symbol.for(`zylem:behavior:${config.name}`),
    defaultOptions: config.defaultOptions,
    systemFactory: config.systemFactory,
    createHandle: config.createHandle
  };
}

// src/lib/behaviors/use-behavior.ts
function useBehavior(entity, descriptor, options) {
  entity.use(descriptor, options);
  return entity;
}

// src/lib/behaviors/components.ts
import { Vector3 as Vector322, Quaternion as Quaternion5 } from "three";
function createTransformComponent() {
  return {
    position: new Vector322(),
    rotation: new Quaternion5()
  };
}
function createPhysicsBodyComponent(body) {
  return { body };
}

// src/lib/behaviors/physics-step.behavior.ts
var PhysicsStepBehavior = class {
  constructor(physicsWorld) {
    this.physicsWorld = physicsWorld;
  }
  update(dt) {
    this.physicsWorld.timestep = dt;
    this.physicsWorld.step();
  }
};

// src/lib/behaviors/physics-sync.behavior.ts
var PhysicsSyncBehavior = class {
  constructor(world) {
    this.world = world;
  }
  /**
   * Query entities that have both physics body and transform components
   */
  queryEntities() {
    const entities = [];
    for (const [, entity] of this.world.collisionMap) {
      const gameEntity = entity;
      if (gameEntity.physics?.body && gameEntity.transform) {
        entities.push({
          physics: gameEntity.physics,
          transform: gameEntity.transform
        });
      }
    }
    return entities;
  }
  update(_dt) {
    const entities = this.queryEntities();
    for (const e of entities) {
      const body = e.physics.body;
      const transform = e.transform;
      const p = body.translation();
      transform.position.set(p.x, p.y, p.z);
      const r = body.rotation();
      transform.rotation.set(r.x, r.y, r.z, r.w);
    }
  }
};

// src/lib/behaviors/thruster/components.ts
function createThrusterMovementComponent(linearThrust, angularThrust, options) {
  return {
    linearThrust,
    angularThrust,
    linearDamping: options?.linearDamping,
    angularDamping: options?.angularDamping
  };
}
function createThrusterInputComponent() {
  return {
    thrust: 0,
    rotate: 0
  };
}
function createThrusterStateComponent() {
  return {
    enabled: true,
    currentThrust: 0
  };
}

// src/lib/behaviors/thruster/thruster-fsm.ts
import { StateMachine, t } from "typescript-fsm";
var ThrusterState = /* @__PURE__ */ ((ThrusterState2) => {
  ThrusterState2["Idle"] = "idle";
  ThrusterState2["Active"] = "active";
  ThrusterState2["Boosting"] = "boosting";
  ThrusterState2["Disabled"] = "disabled";
  ThrusterState2["Docked"] = "docked";
  return ThrusterState2;
})(ThrusterState || {});
var ThrusterEvent = /* @__PURE__ */ ((ThrusterEvent2) => {
  ThrusterEvent2["Activate"] = "activate";
  ThrusterEvent2["Deactivate"] = "deactivate";
  ThrusterEvent2["Boost"] = "boost";
  ThrusterEvent2["EndBoost"] = "endBoost";
  ThrusterEvent2["Disable"] = "disable";
  ThrusterEvent2["Enable"] = "enable";
  ThrusterEvent2["Dock"] = "dock";
  ThrusterEvent2["Undock"] = "undock";
  return ThrusterEvent2;
})(ThrusterEvent || {});
var ThrusterFSM = class {
  constructor(ctx) {
    this.ctx = ctx;
    this.machine = new StateMachine(
      "idle" /* Idle */,
      [
        // Core transitions
        t("idle" /* Idle */, "activate" /* Activate */, "active" /* Active */),
        t("active" /* Active */, "deactivate" /* Deactivate */, "idle" /* Idle */),
        t("active" /* Active */, "boost" /* Boost */, "boosting" /* Boosting */),
        t("active" /* Active */, "disable" /* Disable */, "disabled" /* Disabled */),
        t("active" /* Active */, "dock" /* Dock */, "docked" /* Docked */),
        t("boosting" /* Boosting */, "endBoost" /* EndBoost */, "active" /* Active */),
        t("boosting" /* Boosting */, "disable" /* Disable */, "disabled" /* Disabled */),
        t("disabled" /* Disabled */, "enable" /* Enable */, "idle" /* Idle */),
        t("docked" /* Docked */, "undock" /* Undock */, "idle" /* Idle */),
        // Self-transitions (no-ops for redundant events)
        t("idle" /* Idle */, "deactivate" /* Deactivate */, "idle" /* Idle */),
        t("active" /* Active */, "activate" /* Activate */, "active" /* Active */)
      ]
    );
  }
  machine;
  /**
   * Get current state
   */
  getState() {
    return this.machine.getState();
  }
  /**
   * Dispatch an event to transition state
   */
  dispatch(event) {
    if (this.machine.can(event)) {
      this.machine.dispatch(event);
    }
  }
  /**
   * Update FSM state based on player input.
   * Auto-transitions between Idle/Active to report current state.
   * Does NOT modify input - just observes and reports.
   */
  update(playerInput) {
    const state2 = this.machine.getState();
    const hasInput = Math.abs(playerInput.thrust) > 0.01 || Math.abs(playerInput.rotate) > 0.01;
    if (hasInput && state2 === "idle" /* Idle */) {
      this.dispatch("activate" /* Activate */);
    } else if (!hasInput && state2 === "active" /* Active */) {
      this.dispatch("deactivate" /* Deactivate */);
    }
  }
};

// src/lib/behaviors/thruster/thruster-movement.behavior.ts
var ThrusterMovementBehavior = class {
  constructor(world) {
    this.world = world;
  }
  /**
   * Query function - returns entities with required thruster components
   */
  queryEntities() {
    const entities = [];
    for (const [, entity] of this.world.collisionMap) {
      const gameEntity = entity;
      if (gameEntity.physics?.body && gameEntity.thruster && gameEntity.$thruster) {
        entities.push({
          physics: gameEntity.physics,
          thruster: gameEntity.thruster,
          $thruster: gameEntity.$thruster
        });
      }
    }
    return entities;
  }
  update(_dt) {
    const entities = this.queryEntities();
    for (const e of entities) {
      const body = e.physics.body;
      const thruster = e.thruster;
      const input = e.$thruster;
      const q = body.rotation();
      const rotationZ = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
      if (input.thrust !== 0) {
        const currentVel = body.linvel();
        if (input.thrust > 0) {
          const forwardX = Math.sin(-rotationZ);
          const forwardY = Math.cos(-rotationZ);
          const thrustAmount = thruster.linearThrust * input.thrust * 0.1;
          body.setLinvel({
            x: currentVel.x + forwardX * thrustAmount,
            y: currentVel.y + forwardY * thrustAmount,
            z: currentVel.z
          }, true);
        } else {
          const brakeAmount = 0.9;
          body.setLinvel({
            x: currentVel.x * brakeAmount,
            y: currentVel.y * brakeAmount,
            z: currentVel.z
          }, true);
        }
      }
      if (input.rotate !== 0) {
        body.setAngvel({ x: 0, y: 0, z: -thruster.angularThrust * input.rotate }, true);
      } else {
        const angVel = body.angvel();
        body.setAngvel({ x: angVel.x, y: angVel.y, z: 0 }, true);
      }
    }
  }
};

// src/lib/behaviors/thruster/thruster.descriptor.ts
var defaultOptions = {
  linearThrust: 10,
  angularThrust: 5
};
var ThrusterBehaviorSystem = class {
  constructor(world) {
    this.world = world;
    this.movementBehavior = new ThrusterMovementBehavior(world);
  }
  movementBehavior;
  update(ecs, delta) {
    if (!this.world?.collisionMap) return;
    for (const [, entity] of this.world.collisionMap) {
      const gameEntity = entity;
      if (typeof gameEntity.getBehaviorRefs !== "function") continue;
      const refs = gameEntity.getBehaviorRefs();
      const thrusterRef = refs.find(
        (r) => r.descriptor.key === /* @__PURE__ */ Symbol.for("zylem:behavior:thruster")
      );
      if (!thrusterRef || !gameEntity.body) continue;
      const options = thrusterRef.options;
      if (!gameEntity.thruster) {
        gameEntity.thruster = {
          linearThrust: options.linearThrust,
          angularThrust: options.angularThrust
        };
      }
      if (!gameEntity.$thruster) {
        gameEntity.$thruster = {
          thrust: 0,
          rotate: 0
        };
      }
      if (!gameEntity.physics) {
        gameEntity.physics = { body: gameEntity.body };
      }
      if (!thrusterRef.fsm && gameEntity.$thruster) {
        thrusterRef.fsm = new ThrusterFSM({ input: gameEntity.$thruster });
      }
      if (thrusterRef.fsm && gameEntity.$thruster) {
        thrusterRef.fsm.update({
          thrust: gameEntity.$thruster.thrust,
          rotate: gameEntity.$thruster.rotate
        });
      }
    }
    this.movementBehavior.update(delta);
  }
  destroy(_ecs) {
  }
};
var ThrusterBehavior = defineBehavior({
  name: "thruster",
  defaultOptions,
  systemFactory: (ctx) => new ThrusterBehaviorSystem(ctx.world)
});

// src/lib/behaviors/screen-wrap/screen-wrap-fsm.ts
import { StateMachine as StateMachine2, t as t2 } from "typescript-fsm";
var ScreenWrapState = /* @__PURE__ */ ((ScreenWrapState2) => {
  ScreenWrapState2["Center"] = "center";
  ScreenWrapState2["NearEdgeLeft"] = "near-edge-left";
  ScreenWrapState2["NearEdgeRight"] = "near-edge-right";
  ScreenWrapState2["NearEdgeTop"] = "near-edge-top";
  ScreenWrapState2["NearEdgeBottom"] = "near-edge-bottom";
  ScreenWrapState2["Wrapped"] = "wrapped";
  return ScreenWrapState2;
})(ScreenWrapState || {});
var ScreenWrapEvent = /* @__PURE__ */ ((ScreenWrapEvent2) => {
  ScreenWrapEvent2["EnterCenter"] = "enter-center";
  ScreenWrapEvent2["ApproachLeft"] = "approach-left";
  ScreenWrapEvent2["ApproachRight"] = "approach-right";
  ScreenWrapEvent2["ApproachTop"] = "approach-top";
  ScreenWrapEvent2["ApproachBottom"] = "approach-bottom";
  ScreenWrapEvent2["Wrap"] = "wrap";
  return ScreenWrapEvent2;
})(ScreenWrapEvent || {});
var ScreenWrapFSM = class {
  machine;
  constructor() {
    this.machine = new StateMachine2(
      "center" /* Center */,
      [
        // From Center
        t2("center" /* Center */, "approach-left" /* ApproachLeft */, "near-edge-left" /* NearEdgeLeft */),
        t2("center" /* Center */, "approach-right" /* ApproachRight */, "near-edge-right" /* NearEdgeRight */),
        t2("center" /* Center */, "approach-top" /* ApproachTop */, "near-edge-top" /* NearEdgeTop */),
        t2("center" /* Center */, "approach-bottom" /* ApproachBottom */, "near-edge-bottom" /* NearEdgeBottom */),
        // From NearEdge to Wrapped
        t2("near-edge-left" /* NearEdgeLeft */, "wrap" /* Wrap */, "wrapped" /* Wrapped */),
        t2("near-edge-right" /* NearEdgeRight */, "wrap" /* Wrap */, "wrapped" /* Wrapped */),
        t2("near-edge-top" /* NearEdgeTop */, "wrap" /* Wrap */, "wrapped" /* Wrapped */),
        t2("near-edge-bottom" /* NearEdgeBottom */, "wrap" /* Wrap */, "wrapped" /* Wrapped */),
        // From NearEdge back to Center
        t2("near-edge-left" /* NearEdgeLeft */, "enter-center" /* EnterCenter */, "center" /* Center */),
        t2("near-edge-right" /* NearEdgeRight */, "enter-center" /* EnterCenter */, "center" /* Center */),
        t2("near-edge-top" /* NearEdgeTop */, "enter-center" /* EnterCenter */, "center" /* Center */),
        t2("near-edge-bottom" /* NearEdgeBottom */, "enter-center" /* EnterCenter */, "center" /* Center */),
        // From Wrapped back to Center
        t2("wrapped" /* Wrapped */, "enter-center" /* EnterCenter */, "center" /* Center */),
        // From Wrapped to NearEdge (landed near opposite edge)
        t2("wrapped" /* Wrapped */, "approach-left" /* ApproachLeft */, "near-edge-left" /* NearEdgeLeft */),
        t2("wrapped" /* Wrapped */, "approach-right" /* ApproachRight */, "near-edge-right" /* NearEdgeRight */),
        t2("wrapped" /* Wrapped */, "approach-top" /* ApproachTop */, "near-edge-top" /* NearEdgeTop */),
        t2("wrapped" /* Wrapped */, "approach-bottom" /* ApproachBottom */, "near-edge-bottom" /* NearEdgeBottom */),
        // Self-transitions (no-ops for redundant events)
        t2("center" /* Center */, "enter-center" /* EnterCenter */, "center" /* Center */),
        t2("near-edge-left" /* NearEdgeLeft */, "approach-left" /* ApproachLeft */, "near-edge-left" /* NearEdgeLeft */),
        t2("near-edge-right" /* NearEdgeRight */, "approach-right" /* ApproachRight */, "near-edge-right" /* NearEdgeRight */),
        t2("near-edge-top" /* NearEdgeTop */, "approach-top" /* ApproachTop */, "near-edge-top" /* NearEdgeTop */),
        t2("near-edge-bottom" /* NearEdgeBottom */, "approach-bottom" /* ApproachBottom */, "near-edge-bottom" /* NearEdgeBottom */)
      ]
    );
  }
  getState() {
    return this.machine.getState();
  }
  dispatch(event) {
    if (this.machine.can(event)) {
      this.machine.dispatch(event);
    }
  }
  /**
   * Update FSM based on entity position relative to bounds
   */
  update(position2, bounds, wrapped) {
    const { x, y } = position2;
    const { minX, maxX, minY, maxY, edgeThreshold } = bounds;
    if (wrapped) {
      this.dispatch("wrap" /* Wrap */);
      return;
    }
    const nearLeft = x < minX + edgeThreshold;
    const nearRight = x > maxX - edgeThreshold;
    const nearBottom = y < minY + edgeThreshold;
    const nearTop = y > maxY - edgeThreshold;
    if (nearLeft) {
      this.dispatch("approach-left" /* ApproachLeft */);
    } else if (nearRight) {
      this.dispatch("approach-right" /* ApproachRight */);
    } else if (nearTop) {
      this.dispatch("approach-top" /* ApproachTop */);
    } else if (nearBottom) {
      this.dispatch("approach-bottom" /* ApproachBottom */);
    } else {
      this.dispatch("enter-center" /* EnterCenter */);
    }
  }
};

// src/lib/behaviors/screen-wrap/screen-wrap.descriptor.ts
var defaultOptions2 = {
  width: 20,
  height: 15,
  centerX: 0,
  centerY: 0,
  edgeThreshold: 2
};
var ScreenWrapSystem = class {
  constructor(world) {
    this.world = world;
  }
  update(ecs, delta) {
    if (!this.world?.collisionMap) return;
    for (const [, entity] of this.world.collisionMap) {
      const gameEntity = entity;
      if (typeof gameEntity.getBehaviorRefs !== "function") continue;
      const refs = gameEntity.getBehaviorRefs();
      const wrapRef = refs.find(
        (r) => r.descriptor.key === /* @__PURE__ */ Symbol.for("zylem:behavior:screen-wrap")
      );
      if (!wrapRef || !gameEntity.body) continue;
      const options = wrapRef.options;
      if (!wrapRef.fsm) {
        wrapRef.fsm = new ScreenWrapFSM();
      }
      const wrapped = this.wrapEntity(gameEntity, options);
      const pos = gameEntity.body.translation();
      const { width, height, centerX, centerY, edgeThreshold } = options;
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      wrapRef.fsm.update(
        { x: pos.x, y: pos.y },
        {
          minX: centerX - halfWidth,
          maxX: centerX + halfWidth,
          minY: centerY - halfHeight,
          maxY: centerY + halfHeight,
          edgeThreshold
        },
        wrapped
      );
    }
  }
  wrapEntity(entity, options) {
    const body = entity.body;
    if (!body) return false;
    const { width, height, centerX, centerY } = options;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const minX = centerX - halfWidth;
    const maxX = centerX + halfWidth;
    const minY = centerY - halfHeight;
    const maxY = centerY + halfHeight;
    const pos = body.translation();
    let newX = pos.x;
    let newY = pos.y;
    let wrapped = false;
    if (pos.x < minX) {
      newX = maxX - (minX - pos.x);
      wrapped = true;
    } else if (pos.x > maxX) {
      newX = minX + (pos.x - maxX);
      wrapped = true;
    }
    if (pos.y < minY) {
      newY = maxY - (minY - pos.y);
      wrapped = true;
    } else if (pos.y > maxY) {
      newY = minY + (pos.y - maxY);
      wrapped = true;
    }
    if (wrapped) {
      body.setTranslation({ x: newX, y: newY, z: pos.z }, true);
    }
    return wrapped;
  }
  destroy(_ecs) {
  }
};
var ScreenWrapBehavior = defineBehavior({
  name: "screen-wrap",
  defaultOptions: defaultOptions2,
  systemFactory: (ctx) => new ScreenWrapSystem(ctx.world)
});

// src/lib/behaviors/world-boundary-2d/world-boundary-2d-fsm.ts
import { StateMachine as StateMachine3, t as t3 } from "typescript-fsm";
var WorldBoundary2DState = /* @__PURE__ */ ((WorldBoundary2DState2) => {
  WorldBoundary2DState2["Inside"] = "inside";
  WorldBoundary2DState2["Touching"] = "touching";
  return WorldBoundary2DState2;
})(WorldBoundary2DState || {});
var WorldBoundary2DEvent = /* @__PURE__ */ ((WorldBoundary2DEvent2) => {
  WorldBoundary2DEvent2["EnterInside"] = "enter-inside";
  WorldBoundary2DEvent2["TouchBoundary"] = "touch-boundary";
  return WorldBoundary2DEvent2;
})(WorldBoundary2DEvent || {});
function computeWorldBoundary2DHits(position2, bounds) {
  const hits = {
    top: false,
    bottom: false,
    left: false,
    right: false
  };
  if (position2.x <= bounds.left) hits.left = true;
  else if (position2.x >= bounds.right) hits.right = true;
  if (position2.y <= bounds.bottom) hits.bottom = true;
  else if (position2.y >= bounds.top) hits.top = true;
  return hits;
}
function hasAnyWorldBoundary2DHit(hits) {
  return !!(hits.left || hits.right || hits.top || hits.bottom);
}
var WorldBoundary2DFSM = class {
  machine;
  lastHits = { top: false, bottom: false, left: false, right: false };
  lastPosition = null;
  lastUpdatedAtMs = null;
  constructor() {
    this.machine = new StateMachine3(
      "inside" /* Inside */,
      [
        t3("inside" /* Inside */, "touch-boundary" /* TouchBoundary */, "touching" /* Touching */),
        t3("touching" /* Touching */, "enter-inside" /* EnterInside */, "inside" /* Inside */),
        // Self transitions (no-ops)
        t3("inside" /* Inside */, "enter-inside" /* EnterInside */, "inside" /* Inside */),
        t3("touching" /* Touching */, "touch-boundary" /* TouchBoundary */, "touching" /* Touching */)
      ]
    );
  }
  getState() {
    return this.machine.getState();
  }
  /**
   * Returns the last computed hits (always available after first update call).
   */
  getLastHits() {
    return this.lastHits;
  }
  /**
   * Returns adjusted movement values based on boundary hits.
   * If the entity is touching a boundary and trying to move further into it,
   * that axis component is zeroed out.
   *
   * @param moveX - The desired X movement
   * @param moveY - The desired Y movement
   * @returns Adjusted { moveX, moveY } with boundary-blocked axes zeroed
   */
  getMovement(moveX2, moveY2) {
    const hits = this.lastHits;
    let adjustedX = moveX2;
    let adjustedY = moveY2;
    if (hits.left && moveX2 < 0 || hits.right && moveX2 > 0) {
      adjustedX = 0;
    }
    if (hits.bottom && moveY2 < 0 || hits.top && moveY2 > 0) {
      adjustedY = 0;
    }
    return { moveX: adjustedX, moveY: adjustedY };
  }
  /**
   * Returns the last position passed to `update`, if any.
   */
  getLastPosition() {
    return this.lastPosition;
  }
  /**
   * Best-effort timestamp (ms) of the last `update(...)` call.
   * This is optional metadata; systems can ignore it.
   */
  getLastUpdatedAtMs() {
    return this.lastUpdatedAtMs;
  }
  /**
   * Update FSM + extended state based on current position and bounds.
   * Returns the computed hits for convenience.
   */
  update(position2, bounds) {
    const hits = computeWorldBoundary2DHits(position2, bounds);
    this.lastHits = hits;
    this.lastPosition = { x: position2.x, y: position2.y };
    this.lastUpdatedAtMs = Date.now();
    if (hasAnyWorldBoundary2DHit(hits)) {
      this.dispatch("touch-boundary" /* TouchBoundary */);
    } else {
      this.dispatch("enter-inside" /* EnterInside */);
    }
    return hits;
  }
  dispatch(event) {
    if (this.machine.can(event)) {
      this.machine.dispatch(event);
    }
  }
};

// src/lib/behaviors/world-boundary-2d/world-boundary-2d.descriptor.ts
var defaultOptions3 = {
  boundaries: { top: 0, bottom: 0, left: 0, right: 0 }
};
function createWorldBoundary2DHandle(ref) {
  return {
    getLastHits: () => {
      const fsm = ref.fsm;
      return fsm?.getLastHits() ?? null;
    },
    getMovement: (moveX2, moveY2) => {
      const fsm = ref.fsm;
      return fsm?.getMovement(moveX2, moveY2) ?? { moveX: moveX2, moveY: moveY2 };
    }
  };
}
var WorldBoundary2DSystem = class {
  constructor(world) {
    this.world = world;
  }
  update(_ecs, _delta) {
    if (!this.world?.collisionMap) return;
    for (const [, entity] of this.world.collisionMap) {
      const gameEntity = entity;
      if (typeof gameEntity.getBehaviorRefs !== "function") continue;
      const refs = gameEntity.getBehaviorRefs();
      const boundaryRef = refs.find(
        (r) => r.descriptor.key === /* @__PURE__ */ Symbol.for("zylem:behavior:world-boundary-2d")
      );
      if (!boundaryRef || !gameEntity.body) continue;
      const options = boundaryRef.options;
      if (!boundaryRef.fsm) {
        boundaryRef.fsm = new WorldBoundary2DFSM();
      }
      const body = gameEntity.body;
      const pos = body.translation();
      boundaryRef.fsm.update(
        { x: pos.x, y: pos.y },
        options.boundaries
      );
    }
  }
  destroy(_ecs) {
  }
};
var WorldBoundary2DBehavior = defineBehavior({
  name: "world-boundary-2d",
  defaultOptions: defaultOptions3,
  systemFactory: (ctx) => new WorldBoundary2DSystem(ctx.world),
  createHandle: createWorldBoundary2DHandle
});

// src/lib/behaviors/ricochet-2d/ricochet-2d-fsm.ts
import { StateMachine as StateMachine4, t as t4 } from "typescript-fsm";
var Ricochet2DState = /* @__PURE__ */ ((Ricochet2DState2) => {
  Ricochet2DState2["Idle"] = "idle";
  Ricochet2DState2["Ricocheting"] = "ricocheting";
  return Ricochet2DState2;
})(Ricochet2DState || {});
var Ricochet2DEvent = /* @__PURE__ */ ((Ricochet2DEvent2) => {
  Ricochet2DEvent2["StartRicochet"] = "start-ricochet";
  Ricochet2DEvent2["EndRicochet"] = "end-ricochet";
  return Ricochet2DEvent2;
})(Ricochet2DEvent || {});
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
var Ricochet2DFSM = class {
  machine;
  lastResult = null;
  lastUpdatedAtMs = null;
  constructor() {
    this.machine = new StateMachine4(
      "idle" /* Idle */,
      [
        t4("idle" /* Idle */, "start-ricochet" /* StartRicochet */, "ricocheting" /* Ricocheting */),
        t4("ricocheting" /* Ricocheting */, "end-ricochet" /* EndRicochet */, "idle" /* Idle */),
        // Self transitions (no-ops)
        t4("idle" /* Idle */, "end-ricochet" /* EndRicochet */, "idle" /* Idle */),
        t4("ricocheting" /* Ricocheting */, "start-ricochet" /* StartRicochet */, "ricocheting" /* Ricocheting */)
      ]
    );
  }
  getState() {
    return this.machine.getState();
  }
  /**
   * Returns the last computed ricochet result, or null if none.
   */
  getLastResult() {
    return this.lastResult;
  }
  /**
   * Best-effort timestamp (ms) of the last computation.
   */
  getLastUpdatedAtMs() {
    return this.lastUpdatedAtMs;
  }
  /**
   * Compute a ricochet result from collision context.
   * Returns the result for the consumer to apply, or null if invalid input.
   */
  computeRicochet(ctx, options = {}) {
    const {
      minSpeed = 2,
      maxSpeed = 20,
      speedMultiplier = 1.05,
      reflectionMode = "angled",
      maxAngleDeg = 60
    } = options;
    const { selfVelocity, selfPosition, otherPosition, otherSize } = this.extractDataFromEntities(ctx);
    if (!selfVelocity) {
      this.dispatch("end-ricochet" /* EndRicochet */);
      return null;
    }
    const speed = Math.hypot(selfVelocity.x, selfVelocity.y);
    if (speed === 0) {
      this.dispatch("end-ricochet" /* EndRicochet */);
      return null;
    }
    const normal = ctx.contact.normal ?? this.computeNormalFromPositions(selfPosition, otherPosition);
    if (!normal) {
      this.dispatch("end-ricochet" /* EndRicochet */);
      return null;
    }
    let reflected = this.computeBasicReflection(selfVelocity, normal);
    if (reflectionMode === "angled") {
      reflected = this.computeAngledDeflection(
        selfVelocity,
        normal,
        speed,
        maxAngleDeg,
        speedMultiplier,
        selfPosition,
        otherPosition,
        otherSize,
        ctx.contact.position
      );
    }
    reflected = this.applySpeedClamp(reflected, minSpeed, maxSpeed);
    const result = {
      velocity: { x: reflected.x, y: reflected.y, z: 0 },
      speed: Math.hypot(reflected.x, reflected.y),
      normal: { x: normal.x, y: normal.y, z: 0 }
    };
    this.lastResult = result;
    this.lastUpdatedAtMs = Date.now();
    this.dispatch("start-ricochet" /* StartRicochet */);
    return result;
  }
  /**
   * Extract velocity, position, and size data from entities or context.
   */
  extractDataFromEntities(ctx) {
    let selfVelocity = ctx.selfVelocity;
    let selfPosition = ctx.selfPosition;
    let otherPosition = ctx.otherPosition;
    let otherSize = ctx.otherSize;
    if (ctx.entity?.body) {
      const vel = ctx.entity.body.linvel();
      selfVelocity = selfVelocity ?? { x: vel.x, y: vel.y, z: vel.z };
      const pos = ctx.entity.body.translation();
      selfPosition = selfPosition ?? { x: pos.x, y: pos.y, z: pos.z };
    }
    if (ctx.otherEntity?.body) {
      const pos = ctx.otherEntity.body.translation();
      otherPosition = otherPosition ?? { x: pos.x, y: pos.y, z: pos.z };
    }
    if (ctx.otherEntity && "size" in ctx.otherEntity) {
      const size = ctx.otherEntity.size;
      if (size && typeof size.x === "number") {
        otherSize = otherSize ?? { x: size.x, y: size.y, z: size.z };
      }
    }
    return { selfVelocity, selfPosition, otherPosition, otherSize };
  }
  /**
   * Compute collision normal from entity positions using AABB heuristic.
   */
  computeNormalFromPositions(selfPosition, otherPosition) {
    if (!selfPosition || !otherPosition) return null;
    const dx = selfPosition.x - otherPosition.x;
    const dy = selfPosition.y - otherPosition.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      return { x: dx > 0 ? 1 : -1, y: 0, z: 0 };
    } else {
      return { x: 0, y: dy > 0 ? 1 : -1, z: 0 };
    }
  }
  /**
   * Compute basic reflection using the formula: v' = v - 2(v·n)n
   */
  computeBasicReflection(velocity, normal) {
    const vx = velocity.x;
    const vy = velocity.y;
    const dotProduct = vx * normal.x + vy * normal.y;
    return {
      x: vx - 2 * dotProduct * normal.x,
      y: vy - 2 * dotProduct * normal.y
    };
  }
  /**
   * Compute angled deflection for paddle-style reflections.
   */
  computeAngledDeflection(velocity, normal, speed, maxAngleDeg, speedMultiplier, selfPosition, otherPosition, otherSize, contactPosition) {
    const maxAngleRad = maxAngleDeg * Math.PI / 180;
    let tx = -normal.y;
    let ty = normal.x;
    if (Math.abs(normal.x) > Math.abs(normal.y)) {
      if (ty < 0) {
        tx = -tx;
        ty = -ty;
      }
    } else {
      if (tx < 0) {
        tx = -tx;
        ty = -ty;
      }
    }
    const offset = this.computeHitOffset(
      velocity,
      normal,
      speed,
      tx,
      ty,
      selfPosition,
      otherPosition,
      otherSize,
      contactPosition
    );
    const angle = clamp(offset, -1, 1) * maxAngleRad;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const newSpeed = speed * speedMultiplier;
    return {
      x: newSpeed * (normal.x * cosA + tx * sinA),
      y: newSpeed * (normal.y * cosA + ty * sinA)
    };
  }
  /**
   * Compute hit offset for angled deflection (-1 to 1).
   */
  computeHitOffset(velocity, normal, speed, tx, ty, selfPosition, otherPosition, otherSize, contactPosition) {
    if (otherPosition && otherSize) {
      const useY = Math.abs(normal.x) > Math.abs(normal.y);
      const halfExtent = useY ? otherSize.y / 2 : otherSize.x / 2;
      if (useY) {
        const selfY = selfPosition?.y ?? contactPosition?.y ?? 0;
        const paddleY = otherPosition.y;
        return (selfY - paddleY) / halfExtent;
      } else {
        const selfX = selfPosition?.x ?? contactPosition?.x ?? 0;
        const paddleX = otherPosition.x;
        return (selfX - paddleX) / halfExtent;
      }
    }
    return (velocity.x * tx + velocity.y * ty) / speed;
  }
  /**
   * Apply speed constraints to the reflected velocity.
   */
  applySpeedClamp(velocity, minSpeed, maxSpeed) {
    const currentSpeed = Math.hypot(velocity.x, velocity.y);
    if (currentSpeed === 0) return velocity;
    const targetSpeed = clamp(currentSpeed, minSpeed, maxSpeed);
    const scale2 = targetSpeed / currentSpeed;
    return {
      x: velocity.x * scale2,
      y: velocity.y * scale2
    };
  }
  /**
   * Clear the ricochet state (call after consumer has applied the result).
   */
  clearRicochet() {
    this.dispatch("end-ricochet" /* EndRicochet */);
  }
  dispatch(event) {
    if (this.machine.can(event)) {
      this.machine.dispatch(event);
    }
  }
};

// src/lib/behaviors/ricochet-2d/ricochet-2d.descriptor.ts
var defaultOptions4 = {
  minSpeed: 2,
  maxSpeed: 20,
  speedMultiplier: 1.05,
  reflectionMode: "angled",
  maxAngleDeg: 60
};
function createRicochet2DHandle(ref) {
  return {
    getRicochet: (ctx) => {
      const fsm = ref.fsm;
      if (!fsm) return null;
      return fsm.computeRicochet(ctx, ref.options);
    },
    getLastResult: () => {
      const fsm = ref.fsm;
      return fsm?.getLastResult() ?? null;
    }
  };
}
var Ricochet2DSystem = class {
  constructor(world) {
    this.world = world;
  }
  update(_ecs, _delta) {
    if (!this.world?.collisionMap) return;
    for (const [, entity] of this.world.collisionMap) {
      const gameEntity = entity;
      if (typeof gameEntity.getBehaviorRefs !== "function") continue;
      const refs = gameEntity.getBehaviorRefs();
      const ricochetRef = refs.find(
        (r) => r.descriptor.key === /* @__PURE__ */ Symbol.for("zylem:behavior:ricochet-2d")
      );
      if (!ricochetRef) continue;
      if (!ricochetRef.fsm) {
        ricochetRef.fsm = new Ricochet2DFSM();
      }
    }
  }
  destroy(_ecs) {
  }
};
var Ricochet2DBehavior = defineBehavior({
  name: "ricochet-2d",
  defaultOptions: defaultOptions4,
  systemFactory: (ctx) => new Ricochet2DSystem(ctx.world),
  createHandle: createRicochet2DHandle
});

// src/lib/behaviors/movement-sequence-2d/movement-sequence-2d-fsm.ts
import { StateMachine as StateMachine5, t as t5 } from "typescript-fsm";
var MovementSequence2DState = /* @__PURE__ */ ((MovementSequence2DState2) => {
  MovementSequence2DState2["Idle"] = "idle";
  MovementSequence2DState2["Running"] = "running";
  MovementSequence2DState2["Paused"] = "paused";
  MovementSequence2DState2["Completed"] = "completed";
  return MovementSequence2DState2;
})(MovementSequence2DState || {});
var MovementSequence2DEvent = /* @__PURE__ */ ((MovementSequence2DEvent2) => {
  MovementSequence2DEvent2["Start"] = "start";
  MovementSequence2DEvent2["Pause"] = "pause";
  MovementSequence2DEvent2["Resume"] = "resume";
  MovementSequence2DEvent2["Complete"] = "complete";
  MovementSequence2DEvent2["Reset"] = "reset";
  return MovementSequence2DEvent2;
})(MovementSequence2DEvent || {});
var MovementSequence2DFSM = class {
  machine;
  sequence = [];
  loop = true;
  currentIndex = 0;
  timeRemaining = 0;
  constructor() {
    this.machine = new StateMachine5(
      "idle" /* Idle */,
      [
        // From Idle
        t5("idle" /* Idle */, "start" /* Start */, "running" /* Running */),
        // From Running
        t5("running" /* Running */, "pause" /* Pause */, "paused" /* Paused */),
        t5("running" /* Running */, "complete" /* Complete */, "completed" /* Completed */),
        t5("running" /* Running */, "reset" /* Reset */, "idle" /* Idle */),
        // From Paused
        t5("paused" /* Paused */, "resume" /* Resume */, "running" /* Running */),
        t5("paused" /* Paused */, "reset" /* Reset */, "idle" /* Idle */),
        // From Completed
        t5("completed" /* Completed */, "reset" /* Reset */, "idle" /* Idle */),
        t5("completed" /* Completed */, "start" /* Start */, "running" /* Running */),
        // Self-transitions (no-ops)
        t5("idle" /* Idle */, "pause" /* Pause */, "idle" /* Idle */),
        t5("idle" /* Idle */, "resume" /* Resume */, "idle" /* Idle */),
        t5("running" /* Running */, "start" /* Start */, "running" /* Running */),
        t5("running" /* Running */, "resume" /* Resume */, "running" /* Running */),
        t5("paused" /* Paused */, "pause" /* Pause */, "paused" /* Paused */),
        t5("completed" /* Completed */, "complete" /* Complete */, "completed" /* Completed */)
      ]
    );
  }
  /**
   * Initialize the sequence. Call this once with options.
   */
  init(sequence, loop) {
    this.sequence = sequence;
    this.loop = loop;
    this.currentIndex = 0;
    this.timeRemaining = sequence.length > 0 ? sequence[0].timeInSeconds : 0;
  }
  getState() {
    return this.machine.getState();
  }
  /**
   * Start the sequence (from Idle or Completed).
   */
  start() {
    if (this.machine.getState() === "idle" /* Idle */ || this.machine.getState() === "completed" /* Completed */) {
      this.currentIndex = 0;
      this.timeRemaining = this.sequence.length > 0 ? this.sequence[0].timeInSeconds : 0;
    }
    this.dispatch("start" /* Start */);
  }
  /**
   * Pause the sequence.
   */
  pause() {
    this.dispatch("pause" /* Pause */);
  }
  /**
   * Resume a paused sequence.
   */
  resume() {
    this.dispatch("resume" /* Resume */);
  }
  /**
   * Reset to Idle state.
   */
  reset() {
    this.dispatch("reset" /* Reset */);
    this.currentIndex = 0;
    this.timeRemaining = this.sequence.length > 0 ? this.sequence[0].timeInSeconds : 0;
  }
  /**
   * Update the sequence with delta time.
   * Returns the current movement to apply.
   * Automatically starts if in Idle state.
   */
  update(delta) {
    if (this.sequence.length === 0) {
      return { moveX: 0, moveY: 0 };
    }
    if (this.machine.getState() === "idle" /* Idle */) {
      this.start();
    }
    if (this.machine.getState() !== "running" /* Running */) {
      if (this.machine.getState() === "completed" /* Completed */) {
        return { moveX: 0, moveY: 0 };
      }
      const step2 = this.sequence[this.currentIndex];
      return { moveX: step2?.moveX ?? 0, moveY: step2?.moveY ?? 0 };
    }
    let timeLeft = this.timeRemaining - delta;
    while (timeLeft <= 0) {
      const overflow = -timeLeft;
      this.currentIndex += 1;
      if (this.currentIndex >= this.sequence.length) {
        if (!this.loop) {
          this.dispatch("complete" /* Complete */);
          return { moveX: 0, moveY: 0 };
        }
        this.currentIndex = 0;
      }
      timeLeft = this.sequence[this.currentIndex].timeInSeconds - overflow;
    }
    this.timeRemaining = timeLeft;
    const step = this.sequence[this.currentIndex];
    return { moveX: step?.moveX ?? 0, moveY: step?.moveY ?? 0 };
  }
  /**
   * Get the current movement without advancing time.
   */
  getMovement() {
    if (this.sequence.length === 0 || this.machine.getState() === "completed" /* Completed */) {
      return { moveX: 0, moveY: 0 };
    }
    const step = this.sequence[this.currentIndex];
    return { moveX: step?.moveX ?? 0, moveY: step?.moveY ?? 0 };
  }
  /**
   * Get current step info.
   */
  getCurrentStep() {
    if (this.sequence.length === 0) return null;
    const step = this.sequence[this.currentIndex];
    if (!step) return null;
    return {
      name: step.name,
      index: this.currentIndex,
      moveX: step.moveX ?? 0,
      moveY: step.moveY ?? 0,
      timeRemaining: this.timeRemaining
    };
  }
  /**
   * Get sequence progress.
   */
  getProgress() {
    return {
      stepIndex: this.currentIndex,
      totalSteps: this.sequence.length,
      stepTimeRemaining: this.timeRemaining,
      done: this.machine.getState() === "completed" /* Completed */
    };
  }
  dispatch(event) {
    if (this.machine.can(event)) {
      this.machine.dispatch(event);
    }
  }
};

// src/lib/behaviors/movement-sequence-2d/movement-sequence-2d.descriptor.ts
var defaultOptions5 = {
  sequence: [],
  loop: true
};
function createMovementSequence2DHandle(ref) {
  return {
    getMovement: () => {
      const fsm = ref.fsm;
      return fsm?.getMovement() ?? { moveX: 0, moveY: 0 };
    },
    getCurrentStep: () => {
      const fsm = ref.fsm;
      return fsm?.getCurrentStep() ?? null;
    },
    getProgress: () => {
      const fsm = ref.fsm;
      return fsm?.getProgress() ?? { stepIndex: 0, totalSteps: 0, stepTimeRemaining: 0, done: true };
    },
    pause: () => {
      const fsm = ref.fsm;
      fsm?.pause();
    },
    resume: () => {
      const fsm = ref.fsm;
      fsm?.resume();
    },
    reset: () => {
      const fsm = ref.fsm;
      fsm?.reset();
    }
  };
}
var MovementSequence2DSystem = class {
  constructor(world) {
    this.world = world;
  }
  update(_ecs, delta) {
    if (!this.world?.collisionMap) return;
    for (const [, entity] of this.world.collisionMap) {
      const gameEntity = entity;
      if (typeof gameEntity.getBehaviorRefs !== "function") continue;
      const refs = gameEntity.getBehaviorRefs();
      const sequenceRef = refs.find(
        (r) => r.descriptor.key === /* @__PURE__ */ Symbol.for("zylem:behavior:movement-sequence-2d")
      );
      if (!sequenceRef) continue;
      const options = sequenceRef.options;
      if (!sequenceRef.fsm) {
        sequenceRef.fsm = new MovementSequence2DFSM();
        sequenceRef.fsm.init(options.sequence, options.loop);
      }
      sequenceRef.fsm.update(delta);
    }
  }
  destroy(_ecs) {
  }
};
var MovementSequence2DBehavior = defineBehavior({
  name: "movement-sequence-2d",
  defaultOptions: defaultOptions5,
  systemFactory: (ctx) => new MovementSequence2DSystem(ctx.world),
  createHandle: createMovementSequence2DHandle
});

// src/lib/coordinators/boundary-ricochet.coordinator.ts
var BoundaryRicochetCoordinator = class {
  constructor(entity, boundary, ricochet) {
    this.entity = entity;
    this.boundary = boundary;
    this.ricochet = ricochet;
  }
  /**
   * Update loop - call this every frame
   */
  update() {
    const hits = this.boundary.getLastHits();
    if (!hits) return null;
    const anyHit = hits.left || hits.right || hits.top || hits.bottom;
    if (!anyHit) return null;
    let normalX = 0;
    let normalY = 0;
    if (hits.left) normalX = 1;
    if (hits.right) normalX = -1;
    if (hits.bottom) normalY = 1;
    if (hits.top) normalY = -1;
    return this.ricochet.getRicochet({
      entity: this.entity,
      contact: { normal: { x: normalX, y: normalY } }
    });
  }
};

// src/lib/actions/capabilities/moveable.ts
import { Vector3 as Vector323 } from "three";
function moveX(entity, delta) {
  if (!entity.body) return;
  const currentVelocity = entity.body.linvel();
  const newVelocity = new Vector323(delta, currentVelocity.y, currentVelocity.z);
  entity.body.setLinvel(newVelocity, true);
}
function moveY(entity, delta) {
  if (!entity.body) return;
  const currentVelocity = entity.body.linvel();
  const newVelocity = new Vector323(currentVelocity.x, delta, currentVelocity.z);
  entity.body.setLinvel(newVelocity, true);
}
function moveZ(entity, delta) {
  if (!entity.body) return;
  const currentVelocity = entity.body.linvel();
  const newVelocity = new Vector323(currentVelocity.x, currentVelocity.y, delta);
  entity.body.setLinvel(newVelocity, true);
}
function moveXY(entity, deltaX, deltaY) {
  if (!entity.body) return;
  const currentVelocity = entity.body.linvel();
  const newVelocity = new Vector323(deltaX, deltaY, currentVelocity.z);
  entity.body.setLinvel(newVelocity, true);
}
function moveXZ(entity, deltaX, deltaZ) {
  if (!entity.body) return;
  const currentVelocity = entity.body.linvel();
  const newVelocity = new Vector323(deltaX, currentVelocity.y, deltaZ);
  entity.body.setLinvel(newVelocity, true);
}
function move(entity, vector) {
  if (!entity.body) return;
  const currentVelocity = entity.body.linvel();
  const newVelocity = new Vector323(
    currentVelocity.x + vector.x,
    currentVelocity.y + vector.y,
    currentVelocity.z + vector.z
  );
  entity.body.setLinvel(newVelocity, true);
}
function resetVelocity(entity) {
  if (!entity.body) return;
  entity.body.setLinvel(new Vector323(0, 0, 0), true);
  entity.body.setLinearDamping(5);
}
function moveForwardXY(entity, delta, rotation2DAngle) {
  const deltaX = Math.sin(-rotation2DAngle) * delta;
  const deltaY = Math.cos(-rotation2DAngle) * delta;
  moveXY(entity, deltaX, deltaY);
}
function getPosition(entity) {
  if (!entity.body) return null;
  return entity.body.translation();
}
function getVelocity(entity) {
  if (!entity.body) return null;
  return entity.body.linvel();
}
function setPosition(entity, x, y, z) {
  if (!entity.body) return;
  entity.body.setTranslation({ x, y, z }, true);
}
function setPositionX(entity, x) {
  if (!entity.body) return;
  const { y, z } = entity.body.translation();
  entity.body.setTranslation({ x, y, z }, true);
}
function setPositionY(entity, y) {
  if (!entity.body) return;
  const { x, z } = entity.body.translation();
  entity.body.setTranslation({ x, y, z }, true);
}
function setPositionZ(entity, z) {
  if (!entity.body) return;
  const { x, y } = entity.body.translation();
  entity.body.setTranslation({ x, y, z }, true);
}
function wrapAroundXY(entity, boundsX, boundsY) {
  const position2 = getPosition(entity);
  if (!position2) return;
  const { x, y } = position2;
  const newX = x > boundsX ? -boundsX : x < -boundsX ? boundsX : x;
  const newY = y > boundsY ? -boundsY : y < -boundsY ? boundsY : y;
  if (newX !== x || newY !== y) {
    setPosition(entity, newX, newY, 0);
  }
}
function wrapAround3D(entity, boundsX, boundsY, boundsZ) {
  const position2 = getPosition(entity);
  if (!position2) return;
  const { x, y, z } = position2;
  const newX = x > boundsX ? -boundsX : x < -boundsX ? boundsX : x;
  const newY = y > boundsY ? -boundsY : y < -boundsY ? boundsY : y;
  const newZ = z > boundsZ ? -boundsZ : z < -boundsZ ? boundsZ : z;
  if (newX !== x || newY !== y || newZ !== z) {
    setPosition(entity, newX, newY, newZ);
  }
}
function moveable(constructor) {
  return class extends constructor {
    moveX(delta) {
      moveX(this, delta);
    }
    moveY(delta) {
      moveY(this, delta);
    }
    moveZ(delta) {
      moveZ(this, delta);
    }
    moveXY(deltaX, deltaY) {
      moveXY(this, deltaX, deltaY);
    }
    moveXZ(deltaX, deltaZ) {
      moveXZ(this, deltaX, deltaZ);
    }
    move(vector) {
      move(this, vector);
    }
    resetVelocity() {
      resetVelocity(this);
    }
    moveForwardXY(delta, rotation2DAngle) {
      moveForwardXY(this, delta, rotation2DAngle);
    }
    getPosition() {
      return getPosition(this);
    }
    getVelocity() {
      return getVelocity(this);
    }
    setPosition(x, y, z) {
      setPosition(this, x, y, z);
    }
    setPositionX(x) {
      setPositionX(this, x);
    }
    setPositionY(y) {
      setPositionY(this, y);
    }
    setPositionZ(z) {
      setPositionZ(this, z);
    }
    wrapAroundXY(boundsX, boundsY) {
      wrapAroundXY(this, boundsX, boundsY);
    }
    wrapAround3D(boundsX, boundsY, boundsZ) {
      wrapAround3D(this, boundsX, boundsY, boundsZ);
    }
  };
}
function makeMoveable(entity) {
  const moveable2 = entity;
  moveable2.moveX = (delta) => moveX(entity, delta);
  moveable2.moveY = (delta) => moveY(entity, delta);
  moveable2.moveZ = (delta) => moveZ(entity, delta);
  moveable2.moveXY = (deltaX, deltaY) => moveXY(entity, deltaX, deltaY);
  moveable2.moveXZ = (deltaX, deltaZ) => moveXZ(entity, deltaX, deltaZ);
  moveable2.move = (vector) => move(entity, vector);
  moveable2.resetVelocity = () => resetVelocity(entity);
  moveable2.moveForwardXY = (delta, rotation2DAngle) => moveForwardXY(entity, delta, rotation2DAngle);
  moveable2.getPosition = () => getPosition(entity);
  moveable2.getVelocity = () => getVelocity(entity);
  moveable2.setPosition = (x, y, z) => setPosition(entity, x, y, z);
  moveable2.setPositionX = (x) => setPositionX(entity, x);
  moveable2.setPositionY = (y) => setPositionY(entity, y);
  moveable2.setPositionZ = (z) => setPositionZ(entity, z);
  moveable2.wrapAroundXY = (boundsX, boundsY) => wrapAroundXY(entity, boundsX, boundsY);
  moveable2.wrapAround3D = (boundsX, boundsY, boundsZ) => wrapAround3D(entity, boundsX, boundsY, boundsZ);
  return moveable2;
}

// src/lib/actions/capabilities/rotatable.ts
import { Euler as Euler3, Vector3 as Vector324, MathUtils, Quaternion as Quaternion6 } from "three";
function rotateInDirection(entity, moveVector) {
  if (!entity.body) return;
  const rotate = Math.atan2(-moveVector.x, moveVector.z);
  rotateYEuler(entity, rotate);
}
function rotateYEuler(entity, amount) {
  rotateEuler(entity, new Vector324(0, -amount, 0));
}
function rotateEuler(entity, rotation2) {
  if (!entity.group) return;
  const euler = new Euler3(rotation2.x, rotation2.y, rotation2.z);
  entity.group.setRotationFromEuler(euler);
}
function rotateY(entity, delta) {
  setRotationY(entity, delta);
}
function rotateZ(entity, delta) {
  setRotationZ(entity, delta);
}
function setRotationY(entity, y) {
  if (!entity.body) return;
  const halfAngle = y / 2;
  const w = Math.cos(halfAngle);
  const yComponent = Math.sin(halfAngle);
  entity.body.setRotation({ w, x: 0, y: yComponent, z: 0 }, true);
}
function setRotationDegreesY(entity, y) {
  if (!entity.body) return;
  setRotationY(entity, MathUtils.degToRad(y));
}
function setRotationX(entity, x) {
  if (!entity.body) return;
  const halfAngle = x / 2;
  const w = Math.cos(halfAngle);
  const xComponent = Math.sin(halfAngle);
  entity.body.setRotation({ w, x: xComponent, y: 0, z: 0 }, true);
}
function setRotationDegreesX(entity, x) {
  if (!entity.body) return;
  setRotationX(entity, MathUtils.degToRad(x));
}
function setRotationZ(entity, z) {
  if (!entity.body) return;
  const halfAngle = z / 2;
  const w = Math.cos(halfAngle);
  const zComponent = Math.sin(halfAngle);
  entity.body.setRotation({ w, x: 0, y: 0, z: zComponent }, true);
}
function setRotationDegreesZ(entity, z) {
  if (!entity.body) return;
  setRotationZ(entity, MathUtils.degToRad(z));
}
function setRotation(entity, x, y, z) {
  if (!entity.body) return;
  const quat = new Quaternion6().setFromEuler(new Euler3(x, y, z));
  entity.body.setRotation({ w: quat.w, x: quat.x, y: quat.y, z: quat.z }, true);
}
function setRotationDegrees(entity, x, y, z) {
  if (!entity.body) return;
  setRotation(entity, MathUtils.degToRad(x), MathUtils.degToRad(y), MathUtils.degToRad(z));
}
function getRotation(entity) {
  if (!entity.body) return null;
  return entity.body.rotation();
}
function rotatable(constructor) {
  return class extends constructor {
    rotateInDirection(moveVector) {
      rotateInDirection(this, moveVector);
    }
    rotateYEuler(amount) {
      rotateYEuler(this, amount);
    }
    rotateEuler(rotation2) {
      rotateEuler(this, rotation2);
    }
    rotateY(delta) {
      rotateY(this, delta);
    }
    rotateZ(delta) {
      rotateZ(this, delta);
    }
    setRotationY(y) {
      setRotationY(this, y);
    }
    setRotationX(x) {
      setRotationX(this, x);
    }
    setRotationZ(z) {
      setRotationZ(this, z);
    }
    setRotationDegrees(x, y, z) {
      setRotationDegrees(this, x, y, z);
    }
    setRotationDegreesY(y) {
      setRotationDegreesY(this, y);
    }
    setRotationDegreesX(x) {
      setRotationDegreesX(this, x);
    }
    setRotationDegreesZ(z) {
      setRotationDegreesZ(this, z);
    }
    setRotation(x, y, z) {
      setRotation(this, x, y, z);
    }
    getRotation() {
      return getRotation(this);
    }
  };
}
function makeRotatable(entity) {
  const rotatableEntity = entity;
  rotatableEntity.rotateInDirection = (moveVector) => rotateInDirection(entity, moveVector);
  rotatableEntity.rotateYEuler = (amount) => rotateYEuler(entity, amount);
  rotatableEntity.rotateEuler = (rotation2) => rotateEuler(entity, rotation2);
  rotatableEntity.rotateY = (delta) => rotateY(entity, delta);
  rotatableEntity.rotateZ = (delta) => rotateZ(entity, delta);
  rotatableEntity.setRotationY = (y) => setRotationY(entity, y);
  rotatableEntity.setRotationX = (x) => setRotationX(entity, x);
  rotatableEntity.setRotationZ = (z) => setRotationZ(entity, z);
  rotatableEntity.setRotationDegreesY = (y) => setRotationDegreesY(entity, y);
  rotatableEntity.setRotationDegreesX = (x) => setRotationDegreesX(entity, x);
  rotatableEntity.setRotationDegreesZ = (z) => setRotationDegreesZ(entity, z);
  rotatableEntity.setRotationDegrees = (x, y, z) => setRotationDegrees(entity, x, y, z);
  rotatableEntity.setRotation = (x, y, z) => setRotation(entity, x, y, z);
  rotatableEntity.getRotation = () => getRotation(entity);
  return rotatableEntity;
}

// src/lib/actions/capabilities/transformable.ts
function makeTransformable(entity) {
  const withMovement = makeMoveable(entity);
  const withRotation = makeRotatable(withMovement);
  return withRotation;
}

// src/lib/entities/destroy.ts
init_game_state();
function destroyEntity(entity, globals, destroyFunction) {
  const context = {
    me: entity,
    globals
  };
  destroyFunction(context);
}
function destroy(entity, globals) {
  const resolvedGlobals = globals ?? getGlobals();
  destroyEntity(entity, resolvedGlobals, entity.nodeDestroy.bind(entity));
}

// src/lib/sounds/ricochet-sound.ts
function ricochetSound(frequency = 800, duration = 0.05) {
  _ricochetSound(frequency, duration);
}
function _ricochetSound(frequency, duration) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = "sawtooth";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(1e-3, audioCtx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

// src/lib/sounds/ping-pong-sound.ts
function pingPongBeep(frequency = 440, duration = 0.1) {
  _pingPongBeep(frequency, duration);
}
function _pingPongBeep(frequency, duration) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(1e-3, audioCtx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

// src/api/main.ts
import { Howl } from "howler";
import * as THREE2 from "three";
import * as RAPIER2 from "@dimforge/rapier3d-compat";

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

// src/api/main.ts
init_game_state();
init_stage_state();
init_debug_state();

// src/web-components/zylem-game.ts
init_debug_state();
var ZylemGameElement = class extends HTMLElement {
  _game = null;
  _state = {};
  container;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.container = document.createElement("div");
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.position = "relative";
    this.container.style.outline = "none";
    this.container.tabIndex = 0;
    this.shadowRoot.appendChild(this.container);
  }
  /**
   * Focus the game container for keyboard input
   */
  focus() {
    this.container.focus();
  }
  set game(game) {
    if (this._game) {
      this._game.dispose();
    }
    this._game = game;
    game.options.push({ container: this.container });
    game.start();
  }
  get game() {
    return this._game;
  }
  set state(value) {
    this._state = value;
    this.syncDebugState();
    this.syncToolbarState();
  }
  get state() {
    return this._state;
  }
  /**
   * Sync the web component's state with the game-lib's internal debug state
   */
  syncDebugState() {
    const debugFlag = this._state.gameState?.debugFlag;
    if (debugFlag !== void 0) {
      debugState.enabled = debugFlag;
    }
  }
  /**
   * Sync toolbar state with game-lib's debug state
   */
  syncToolbarState() {
    const { tool, paused } = this._state.toolbarState ?? {};
    if (tool !== void 0) {
      setDebugTool(tool);
    }
    if (paused !== void 0) {
      setPaused(paused);
    }
  }
  disconnectedCallback() {
    if (this._game) {
      this._game.dispose();
      this._game = null;
    }
  }
};
customElements.define("zylem-game", ZylemGameElement);

// src/lib/types/entity-type-map.ts
init_actor();

// src/api/main.ts
init_events();
export {
  ACTOR_TYPE,
  BOX_TYPE,
  BoundaryRicochetCoordinator,
  EventEmitterDelegate,
  Game,
  Howl,
  MovementSequence2DBehavior,
  MovementSequence2DEvent,
  MovementSequence2DFSM,
  MovementSequence2DState,
  PLANE_TYPE,
  Perspectives,
  PhysicsStepBehavior,
  PhysicsSyncBehavior,
  RAPIER2 as RAPIER,
  RECT_TYPE,
  Ricochet2DBehavior,
  Ricochet2DEvent,
  Ricochet2DFSM,
  Ricochet2DState,
  SPHERE_TYPE,
  SPRITE_TYPE,
  ScreenWrapBehavior,
  ScreenWrapEvent,
  ScreenWrapFSM,
  ScreenWrapState,
  StageManager,
  TEXT_TYPE,
  THREE2 as THREE,
  ThrusterBehavior,
  ThrusterEvent,
  ThrusterFSM,
  ThrusterMovementBehavior,
  ThrusterState,
  WorldBoundary2DBehavior,
  WorldBoundary2DEvent,
  WorldBoundary2DFSM,
  WorldBoundary2DState,
  ZONE_TYPE,
  ZylemBox,
  ZylemGameElement,
  clearGlobalSubscriptions,
  computeWorldBoundary2DHits,
  createActor,
  createBox,
  createCamera,
  createEntityFactory,
  createGame,
  createGlobal,
  createPhysicsBodyComponent,
  createPlane,
  createRect,
  createSphere,
  createSprite,
  createStage,
  createText,
  createThrusterInputComponent,
  createThrusterMovementComponent,
  createThrusterStateComponent,
  createTransformComponent,
  createVariable,
  createZone,
  debugState,
  defineBehavior,
  destroy,
  entitySpawner,
  gameConfig,
  getGlobal,
  getGlobals,
  getVariable,
  globalChange,
  globalChanges,
  hasAnyWorldBoundary2DHit,
  makeMoveable,
  makeRotatable,
  makeTransformable,
  move,
  moveable,
  onGlobalChange,
  onGlobalChanges,
  onVariableChange,
  onVariableChanges,
  pingPongBeep,
  resetVelocity,
  ricochetSound,
  rotatable,
  rotateInDirection,
  setDebugTool,
  setGlobal,
  setPaused,
  setVariable,
  stageState2 as stageState,
  useBehavior,
  variableChange,
  variableChanges,
  vessel,
  zylemEventBus
};
//# sourceMappingURL=main.js.map