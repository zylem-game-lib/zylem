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

// src/lib/game/game-state.ts
import { proxy, subscribe } from "valtio/vanilla";
function setGlobal(path, value) {
  setByPath(state.globals, path, value);
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
var state;
var init_game_state = __esm({
  "src/lib/game/game-state.ts"() {
    "use strict";
    init_path_utils();
    state = proxy({
      id: "",
      globals: {},
      time: 0
    });
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
  }
});

// src/lib/systems/transformable.system.ts
import {
  defineSystem,
  defineQuery,
  defineComponent,
  Types
} from "bitecs";
import { Quaternion } from "three";
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
var position, rotation, scale;
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
    ACTOR_TYPE = Symbol("Actor");
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
          this.group = new Group3();
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
  }
});

// src/lib/collision/collision-delegate.ts
function isCollisionHandlerDelegate(obj) {
  return typeof obj?.handlePostCollision === "function" && typeof obj?.handleIntersectionEvent === "function";
}
var init_collision_delegate = __esm({
  "src/lib/collision/collision-delegate.ts"() {
    "use strict";
  }
});

// src/lib/collision/world.ts
import RAPIER from "@dimforge/rapier3d-compat";
var ZylemWorld;
var init_world = __esm({
  "src/lib/collision/world.ts"() {
    "use strict";
    init_game_state();
    init_actor();
    init_collision_delegate();
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
import { proxy as proxy3, subscribe as subscribe2 } from "valtio/vanilla";
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
import { Vector3 as Vector37 } from "three";
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

// src/lib/camera/zylem-camera.ts
import { PerspectiveCamera, Vector3 as Vector38, Object3D as Object3D4, OrthographicCamera, WebGLRenderer as WebGLRenderer3 } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
var ZylemCamera;
var init_zylem_camera = __esm({
  "src/lib/camera/zylem-camera.ts"() {
    "use strict";
    init_perspective();
    init_third_person();
    init_fixed_2d();
    init_render_pass();
    ZylemCamera = class {
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
      orbitTargetWorldPos = new Vector38();
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
        this.camera.lookAt(new Vector38(0, 2, 0));
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
  }
});

// src/lib/camera/camera.ts
import { Vector2 as Vector24, Vector3 as Vector39 } from "three";
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
  Vector3 as Vector310
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
      size = new Vector310();
      center = new Vector310();
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
import { BufferAttribute, BufferGeometry as BufferGeometry3, LineBasicMaterial as LineBasicMaterial2, LineSegments as LineSegments2, Raycaster, Vector2 as Vector25 } from "three";
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
      mouseNdc = new Vector25(-2, -2);
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

// src/lib/stage/zylem-stage.ts
import { addComponent, addEntity, createWorld as createECS, removeEntity } from "bitecs";
import { Color as Color8, Vector3 as Vector312, Vector2 as Vector26 } from "three";
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
    init_base_node();
    init_perspective();
    init_camera();
    init_stage_debug_delegate();
    init_entity();
    init_zylem_camera();
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
        gravity: new Vector312(0, 0, 0),
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
        this.gravity = config.gravity ?? new Vector312(0, 0, 0);
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
        const color = backgroundColor instanceof Color8 ? backgroundColor : new Color8(backgroundColor);
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
        const physicsWorld = await ZylemWorld.loadPhysics(this.gravity ?? new Vector312(0, 0, 0));
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
        const screenResolution = new Vector26(width, height);
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
  }
});

// src/lib/stage/stage-default.ts
import { proxy as proxy4 } from "valtio/vanilla";
import { Vector3 as Vector313 } from "three";
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
      gravity: new Vector313(0, 0, 0),
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
    Stage = class {
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

// src/lib/game/zylem-game.ts
import Stats from "stats.js";
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
  statsRef = null;
  defaultCamera = null;
  container = null;
  canvas = null;
  aspectRatioDelegate = null;
  resolvedConfig = null;
  gameCanvas = null;
  animationFrameId = null;
  isDisposed = false;
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
  }
  loadDebugOptions(options) {
    debugState.enabled = Boolean(options.debug);
    if (options.debug) {
      this.statsRef = new Stats();
      this.statsRef.showPanel(0);
      this.statsRef.dom.style.position = "absolute";
      this.statsRef.dom.style.bottom = "0";
      this.statsRef.dom.style.right = "0";
      this.statsRef.dom.style.top = "auto";
      this.statsRef.dom.style.left = "auto";
      document.body.appendChild(this.statsRef.dom);
    }
  }
  async loadStage(stage) {
    this.unloadCurrentStage();
    const config = stage.options[0];
    await stage.load(this.id, config?.camera);
    this.stageMap.set(stage.wrappedStage.uuid, stage);
    this.currentStageId = stage.wrappedStage.uuid;
    this.defaultCamera = stage.wrappedStage.cameraRef;
    if (this.container && this.defaultCamera) {
      const dom = this.defaultCamera.getDomElement();
      const internal = this.resolvedConfig?.internalResolution;
      this.gameCanvas?.mountRenderer(dom, (cssW, cssH) => {
        if (!this.defaultCamera) return;
        if (internal) {
          this.defaultCamera.setPixelRatio(1);
          this.defaultCamera.resize(internal.width, internal.height);
        } else {
          const dpr = window.devicePixelRatio || 1;
          this.defaultCamera.setPixelRatio(dpr);
          this.defaultCamera.resize(cssW, cssH);
        }
      });
    }
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
    }
    this.stageMap.delete(this.currentStageId);
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
    this.statsRef && this.statsRef.begin();
    if (!isPaused()) {
      this.timer.update(timestamp);
      const stage = this.currentStage();
      const params = this.params();
      const clampedDelta = Math.min(Math.max(params.delta, 0), _ZylemGame.MAX_DELTA_SECONDS);
      const clampedParams = { ...params, delta: clampedDelta };
      if (this.customUpdate) {
        this.customUpdate(clampedParams);
      }
      if (stage) {
        stage.wrappedStage.nodeUpdate({ ...clampedParams, me: stage.wrappedStage });
      }
      this.totalTime += clampedParams.delta;
      state.time = this.totalTime;
      this.previousTimeStamp = timestamp;
    }
    this.statsRef && this.statsRef.end();
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
    if (this.statsRef && this.statsRef.dom && this.statsRef.dom.parentNode) {
      this.statsRef.dom.parentNode.removeChild(this.statsRef.dom);
    }
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
import { Color as Color9, Group as Group5, Sprite as ThreeSprite, SpriteMaterial, CanvasTexture, LinearFilter, Vector2 as Vector27, ClampToEdgeWrapping } from "three";

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
  screenPosition: new Vector27(24, 24),
  zDistance: 1
};
var TextBuilder = class extends EntityBuilder {
  createEntity(options) {
    return new ZylemText(options);
  }
};
var TEXT_TYPE = Symbol("Text");
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
    this.group = new Group5();
    this.createSprite();
    this.lifeCycleDelegate = {
      setup: [this.textSetup.bind(this)],
      update: [this.textUpdate.bind(this)]
    };
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
    const c = color instanceof Color9 ? color : new Color9(color);
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
    const sp = this.options.screenPosition ?? new Vector27(24, 24);
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
import { Color as Color10, Euler, Group as Group6, Quaternion as Quaternion2, Vector3 as Vector314 } from "three";
import {
  TextureLoader as TextureLoader3,
  SpriteMaterial as SpriteMaterial2,
  Sprite as ThreeSprite2
} from "three";
var spriteDefaults = {
  size: new Vector314(1, 1, 1),
  position: new Vector314(0, 0, 0),
  collision: {
    static: false
  },
  material: {
    color: new Color10("#ffffff"),
    shader: "standard"
  },
  images: [],
  animations: []
};
var SpriteCollisionBuilder = class extends EntityCollisionBuilder {
  collider(options) {
    const size = options.collisionSize || options.size || new Vector314(1, 1, 1);
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
var SPRITE_TYPE = Symbol("Sprite");
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
    this.createSpritesFromImages(options?.images || []);
    this.createAnimations(options?.animations || []);
    this.lifeCycleDelegate = {
      update: [this.spriteUpdate.bind(this)],
      destroy: [this.spriteDestroy.bind(this)]
    };
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
          const quat = new Quaternion2(q.x, q.y, q.z, q.w);
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
var Game = class {
  wrappedGame = null;
  options;
  update = () => {
  };
  setup = () => {
  };
  destroy = () => {
  };
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
  async start() {
    const game = await this.load();
    this.wrappedGame = game;
    this.setOverrides();
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
    await game.loadStage(options.stages[0]);
    return game;
  }
  setOverrides() {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    this.wrappedGame.customSetup = this.setup;
    this.wrappedGame.customUpdate = this.update;
    this.wrappedGame.customDestroy = this.destroy;
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
  async previousStage() {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    const currentStageId = this.wrappedGame.currentStageId;
    const currentIndex = this.wrappedGame.stages.findIndex((s) => s.wrappedStage.uuid === currentStageId);
    const previousStage = this.wrappedGame.stages[currentIndex - 1];
    if (!previousStage) {
      console.error("previous stage called on first stage");
      return;
    }
    await this.wrappedGame.loadStage(previousStage);
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
  async nextStage() {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    if (stageState2.next) {
      const nextId = stageState2.next.id;
      await StageManager.transitionForward(nextId);
      if (stageState2.current) {
        const stage = await StageFactory.createFromBlueprint(stageState2.current);
        await this.wrappedGame.loadStage(stage);
        return;
      }
    }
    const currentStageId = this.wrappedGame.currentStageId;
    const currentIndex = this.wrappedGame.stages.findIndex((s) => s.wrappedStage.uuid === currentStageId);
    const nextStage = this.wrappedGame.stages[currentIndex + 1];
    if (!nextStage) {
      console.error("next stage called on last stage");
      return;
    }
    await this.wrappedGame.loadStage(nextStage);
  }
  async goToStage() {
  }
  async end() {
  }
  dispose() {
    if (this.wrappedGame) {
      this.wrappedGame.dispose();
    }
  }
  onLoading(callback) {
  }
};
function createGame(...options) {
  return new Game(options);
}

// src/lib/core/vessel.ts
init_base_node();
var VESSEL_TYPE = Symbol("vessel");
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