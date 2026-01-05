// src/lib/entities/box.ts
import { ColliderDesc as ColliderDesc2 } from "@dimforge/rapier3d-compat";
import { BoxGeometry, Color as Color4 } from "three";
import { Vector3 as Vector33 } from "three";

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

// src/lib/entities/builder.ts
import { BufferGeometry as BufferGeometry2, Mesh as Mesh3, Color as Color3 } from "three";

// src/lib/collision/collision-builder.ts
import { ActiveCollisionTypes, ColliderDesc, RigidBodyDesc, RigidBodyType, Vector3 } from "@dimforge/rapier3d-compat";
var typeToGroup = /* @__PURE__ */ new Map();
var nextGroupId = 0;
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
var CollisionBuilder = class {
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

// src/lib/graphics/mesh.ts
import { Mesh as Mesh2 } from "three";
var MeshBuilder = class {
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

// src/lib/graphics/shaders/fragment/stars.glsl
var stars_default = "#include <common>\n\nuniform vec3 iResolution;\nuniform float iTime;\nvarying vec2 vUv;\n\n// Credit goes to:\n// https://www.shadertoy.com/view/mtyGWy\n\nvec3 palette( float t ) {\n    vec3 a = vec3(0.5, 0.5, 0.5);\n    vec3 b = vec3(0.5, 0.5, 0.5);\n    vec3 c = vec3(1.0, 1.0, 1.0);\n    vec3 d = vec3(0.263,0.416,0.557);\n\n    return a + b*cos( 6.28318*(c*t+d) );\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;\n    vec2 uv0 = uv;\n    vec3 finalColor = vec3(0.0);\n    \n    for (float i = 0.0; i < 4.0; i++) {\n        uv = fract(uv * 1.5) - 0.5;\n\n        float d = length(uv) * exp(-length(uv0));\n\n        vec3 col = palette(length(uv0) + i*.4 + iTime*.4);\n\n        d = sin(d*5. + iTime)/5.;\n        d = abs(d);\n\n        d = pow(0.01 / d, 1.2);\n\n        finalColor += col * d;\n    }\n        \n    fragColor = vec4(finalColor, 1.0);\n}\n \nvoid main() {\n  mainImage(gl_FragColor, vUv);\n}";

// src/lib/graphics/shaders/fragment/fire.glsl
var fire_default = "#include <common>\n \nuniform vec3 iResolution;\nuniform float iTime;\nuniform vec2 iOffset;\nvarying vec2 vUv;\n\nfloat snoise(vec3 uv, float res)\n{\n	const vec3 s = vec3(1e0, 1e2, 1e3);\n	\n	uv *= res;\n	\n	vec3 uv0 = floor(mod(uv, res))*s;\n	vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;\n	\n	vec3 f = fract(uv); f = f*f*(3.0-2.0*f);\n\n	vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,\n		      	  uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);\n\n	vec4 r = fract(sin(v*1e-1)*1e3);\n	float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);\n	\n	r = fract(sin((v + uv1.z - uv0.z)*1e-1)*1e3);\n	float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);\n	\n	return mix(r0, r1, f.z)*2.-1.;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n	vec2 p = -.5 + fragCoord.xy / iResolution.xy;\n	p.x *= iResolution.x/iResolution.y;\n	\n	float color = 3.0 - (3.*length(2.*p));\n	\n	vec3 coord = vec3(atan(p.x,p.y)/6.2832+.5, length(p)*.4, .5);\n	\n	for(int i = 1; i <= 7; i++)\n	{\n		float power = pow(2.0, float(i));\n		color += (1.5 / power) * snoise(coord + vec3(0.,-iTime*.05, iTime*.01), power*16.);\n	}\n	fragColor = vec4( color, pow(max(color,0.),2.)*0.4, pow(max(color,0.),3.)*0.15 , 1.0);\n}\n\nvoid main() {\n  mainImage(gl_FragColor, vUv);\n}";

// src/lib/graphics/shaders/fragment/standard.glsl
var standard_default = "uniform sampler2D tDiffuse;\nvarying vec2 vUv;\n\nvoid main() {\n	vec4 texel = texture2D( tDiffuse, vUv );\n\n	gl_FragColor = texel;\n}";

// src/lib/graphics/shaders/fragment/debug.glsl
var debug_default = "varying vec3 vBarycentric;\nuniform vec3 baseColor;\nuniform vec3 wireframeColor;\nuniform float wireframeThickness;\n\nfloat edgeFactor() {\n    vec3 d = fwidth(vBarycentric);\n    vec3 a3 = smoothstep(vec3(0.0), d * wireframeThickness, vBarycentric);\n    return min(min(a3.x, a3.y), a3.z);\n}\n\nvoid main() {\n    float edge = edgeFactor();\n\n    vec3 wireColor = wireframeColor;\n\n    vec3 finalColor = mix(wireColor, baseColor, edge);\n    \n    gl_FragColor = vec4(finalColor, 1.0);\n}\n";

// src/lib/graphics/shaders/vertex/object-shader.glsl
var object_shader_default = "uniform vec2 uvScale;\nvarying vec2 vUv;\n\nvoid main() {\n	vUv = uv;\n	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n	gl_Position = projectionMatrix * mvPosition;\n}";

// src/lib/graphics/shaders/vertex/debug.glsl
var debug_default2 = "varying vec3 vBarycentric;\n\nvoid main() {\n    vec3 barycentric = vec3(0.0);\n    int index = gl_VertexID % 3;\n    if (index == 0) barycentric = vec3(1.0, 0.0, 0.0);\n    else if (index == 1) barycentric = vec3(0.0, 1.0, 0.0);\n    else barycentric = vec3(0.0, 0.0, 1.0);\n    vBarycentric = barycentric;\n    \n    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}\n";

// src/lib/core/preset-shader.ts
var starShader = {
  fragment: stars_default,
  vertex: object_shader_default
};
var fireShader = {
  fragment: fire_default,
  vertex: object_shader_default
};
var standardShader = {
  fragment: standard_default,
  vertex: object_shader_default
};
var debugShader = {
  fragment: debug_default,
  vertex: debug_default2
};
var shaderMap = /* @__PURE__ */ new Map();
shaderMap.set("standard", standardShader);
shaderMap.set("fire", fireShader);
shaderMap.set("star", starShader);
shaderMap.set("debug", debugShader);
var preset_shader_default = shaderMap;

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

// src/lib/graphics/material.ts
var MaterialBuilder = class _MaterialBuilder {
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
  async setTexture(texturePath = null, repeat = new Vector22(1, 1)) {
    if (!texturePath) {
      return;
    }
    const texture = await assetManager.loadTexture(texturePath, {
      clone: true,
      repeat
    });
    texture.wrapS = RepeatWrapping2;
    texture.wrapT = RepeatWrapping2;
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

// src/lib/entities/builder.ts
var EntityCollisionBuilder = class extends CollisionBuilder {
};
var EntityMeshBuilder = class extends MeshBuilder {
  build(options) {
    return new BufferGeometry2();
  }
  postBuild() {
    return;
  }
};
var EntityBuilder = class {
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
      if (child instanceof Mesh3) {
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

// src/lib/entities/delegates/debug.ts
import { MeshStandardMaterial as MeshStandardMaterial2, MeshBasicMaterial, MeshPhongMaterial as MeshPhongMaterial2 } from "three";
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
    if (material instanceof MeshStandardMaterial2 || material instanceof MeshBasicMaterial || material instanceof MeshPhongMaterial2) {
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

// src/lib/entities/delegates/loader.ts
function isLoadable(obj) {
  return typeof obj?.load === "function" && typeof obj?.data === "function";
}
var EntityLoader = class {
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

// src/lib/entities/box.ts
var boxDefaults = {
  size: new Vector33(1, 1, 1),
  position: new Vector33(0, 0, 0),
  collision: {
    static: false
  },
  material: {
    color: new Color4("#ffffff"),
    shader: "standard"
  }
};
var BoxCollisionBuilder = class extends EntityCollisionBuilder {
  collider(options) {
    const size = options.size || new Vector33(1, 1, 1);
    const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
    let colliderDesc = ColliderDesc2.cuboid(half.x, half.y, half.z);
    return colliderDesc;
  }
};
var BoxMeshBuilder = class extends EntityMeshBuilder {
  build(options) {
    const size = options.size ?? new Vector33(1, 1, 1);
    return new BoxGeometry(size.x, size.y, size.z);
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
async function box(...args) {
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
import { ColliderDesc as ColliderDesc3 } from "@dimforge/rapier3d-compat";
import { Color as Color5, SphereGeometry } from "three";
import { Vector3 as Vector34 } from "three";
var sphereDefaults = {
  radius: 1,
  position: new Vector34(0, 0, 0),
  collision: {
    static: false
  },
  material: {
    color: new Color5("#ffffff"),
    shader: "standard"
  }
};
var SphereCollisionBuilder = class extends EntityCollisionBuilder {
  collider(options) {
    const radius = options.radius ?? 1;
    let colliderDesc = ColliderDesc3.ball(radius);
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
async function sphere(...args) {
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

// src/lib/entities/sprite.ts
import { ColliderDesc as ColliderDesc4 } from "@dimforge/rapier3d-compat";
import { Color as Color6, Euler, Group as Group3, Quaternion as Quaternion2, Vector3 as Vector35 } from "three";
import {
  TextureLoader as TextureLoader2,
  SpriteMaterial,
  Sprite as ThreeSprite
} from "three";
var spriteDefaults = {
  size: new Vector35(1, 1, 1),
  position: new Vector35(0, 0, 0),
  collision: {
    static: false
  },
  material: {
    color: new Color6("#ffffff"),
    shader: "standard"
  },
  images: [],
  animations: []
};
var SpriteCollisionBuilder = class extends EntityCollisionBuilder {
  collider(options) {
    const size = options.collisionSize || options.size || new Vector35(1, 1, 1);
    const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
    let colliderDesc = ColliderDesc4.cuboid(half.x, half.y, half.z);
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
      const material = new SpriteMaterial({
        map: spriteMap,
        transparent: true
      });
      const _sprite = new ThreeSprite(material);
      _sprite.position.normalize();
      this.sprites.push(_sprite);
      this.spriteMap.set(image.name, index);
    });
    this.group = new Group3();
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

// src/lib/entities/plane.ts
import { ColliderDesc as ColliderDesc5 } from "@dimforge/rapier3d-compat";
import { Color as Color7, PlaneGeometry, Vector2 as Vector23, Vector3 as Vector36 } from "three";

// src/lib/graphics/geometries/XZPlaneGeometry.ts
import { BufferGeometry as BufferGeometry3, Float32BufferAttribute } from "three";
var XZPlaneGeometry = class _XZPlaneGeometry extends BufferGeometry3 {
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
var DEFAULT_SUBDIVISIONS = 4;
var planeDefaults = {
  tile: new Vector23(10, 10),
  repeat: new Vector23(1, 1),
  position: new Vector36(0, 0, 0),
  collision: {
    static: true
  },
  material: {
    color: new Color7("#ffffff"),
    shader: "standard"
  },
  subdivisions: DEFAULT_SUBDIVISIONS
};
var PlaneCollisionBuilder = class extends EntityCollisionBuilder {
  collider(options) {
    const tile = options.tile ?? new Vector23(1, 1);
    const subdivisions = options.subdivisions ?? DEFAULT_SUBDIVISIONS;
    const size = new Vector36(tile.x, 1, tile.y);
    const heightData = options._builders?.meshBuilder?.heightData;
    const scale2 = new Vector36(size.x, 1, size.z);
    let colliderDesc = ColliderDesc5.heightfield(
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
  build(options) {
    const tile = options.tile ?? new Vector23(1, 1);
    const subdivisions = options.subdivisions ?? DEFAULT_SUBDIVISIONS;
    const size = new Vector36(tile.x, 1, tile.y);
    const geometry = new XZPlaneGeometry(size.x, size.z, subdivisions, subdivisions);
    const vertexGeometry = new PlaneGeometry(size.x, size.z, subdivisions, subdivisions);
    const dx = size.x / subdivisions;
    const dy = size.z / subdivisions;
    const originalVertices = geometry.attributes.position.array;
    const vertices = vertexGeometry.attributes.position.array;
    const columsRows = /* @__PURE__ */ new Map();
    for (let i = 0; i < vertices.length; i += 3) {
      let row = Math.floor(Math.abs(vertices[i] + size.x / 2) / dx);
      let column = Math.floor(Math.abs(vertices[i + 1] - size.z / 2) / dy);
      const randomHeight = Math.random() * 4;
      vertices[i + 2] = randomHeight;
      originalVertices[i + 1] = randomHeight;
      if (!columsRows.get(column)) {
        columsRows.set(column, /* @__PURE__ */ new Map());
      }
      columsRows.get(column).set(row, randomHeight);
    }
    this.columnsRows = columsRows;
    return geometry;
  }
  postBuild() {
    const heights = [];
    for (let i = 0; i <= DEFAULT_SUBDIVISIONS; ++i) {
      for (let j = 0; j <= DEFAULT_SUBDIVISIONS; ++j) {
        const row = this.columnsRows.get(j);
        if (!row) {
          continue;
        }
        const data = row.get(i);
        heights.push(data);
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
async function plane(...args) {
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
import { ActiveCollisionTypes as ActiveCollisionTypes2, ColliderDesc as ColliderDesc6 } from "@dimforge/rapier3d-compat";
import { Vector3 as Vector37 } from "three";

// src/lib/game/game-state.ts
import { proxy, subscribe } from "valtio/vanilla";
var state = proxy({
  id: "",
  globals: {},
  time: 0
});

// src/lib/entities/zone.ts
var zoneDefaults = {
  size: new Vector37(1, 1, 1),
  position: new Vector37(0, 0, 0),
  collision: {
    static: true
  },
  material: {
    shader: "standard"
  }
};
var ZoneCollisionBuilder = class extends EntityCollisionBuilder {
  collider(options) {
    const size = options.size || new Vector37(1, 1, 1);
    const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
    let colliderDesc = ColliderDesc6.cuboid(half.x, half.y, half.z);
    colliderDesc.setSensor(true);
    colliderDesc.activeCollisionTypes = ActiveCollisionTypes2.KINEMATIC_FIXED;
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
async function zone(...args) {
  return createEntity({
    args,
    defaultConfig: zoneDefaults,
    EntityClass: ZylemZone,
    BuilderClass: ZoneBuilder,
    CollisionBuilderClass: ZoneCollisionBuilder,
    entityType: ZylemZone.type
  });
}

// src/lib/entities/actor.ts
import { ActiveCollisionTypes as ActiveCollisionTypes3, ColliderDesc as ColliderDesc7 } from "@dimforge/rapier3d-compat";
import { SkinnedMesh, Group as Group4, Vector3 as Vector38 } from "three";

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

// src/lib/entities/actor.ts
var actorDefaults = {
  position: { x: 0, y: 0, z: 0 },
  collision: {
    static: false,
    size: new Vector38(0.5, 0.5, 0.5),
    position: new Vector38(0, 0, 0)
  },
  material: {
    shader: "standard"
  },
  animations: [],
  models: []
};
var ActorCollisionBuilder = class extends EntityCollisionBuilder {
  height = 1;
  objectModel = null;
  constructor(data) {
    super();
    this.objectModel = data.objectModel;
  }
  createColliderFromObjectModel(objectModel) {
    if (!objectModel) return ColliderDesc7.capsule(1, 1);
    const skinnedMesh = objectModel.children.find((child) => child instanceof SkinnedMesh);
    const geometry = skinnedMesh.geometry;
    if (geometry) {
      geometry.computeBoundingBox();
      if (geometry.boundingBox) {
        const maxY = geometry.boundingBox.max.y;
        const minY = geometry.boundingBox.min.y;
        this.height = maxY - minY;
      }
    }
    this.height = 1;
    let colliderDesc = ColliderDesc7.capsule(this.height / 2, 1);
    colliderDesc.setSensor(false);
    colliderDesc.setTranslation(0, this.height + 0.5, 0);
    colliderDesc.activeCollisionTypes = ActiveCollisionTypes3.DEFAULT;
    return colliderDesc;
  }
  collider(options) {
    let colliderDesc = this.createColliderFromObjectModel(this.objectModel);
    return colliderDesc;
  }
};
var ActorBuilder = class extends EntityBuilder {
  createEntity(options) {
    return new ZylemActor(options);
  }
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
      this.group = new Group4();
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
async function actor(...args) {
  return await createEntity({
    args,
    defaultConfig: actorDefaults,
    EntityClass: ZylemActor,
    BuilderClass: ActorBuilder,
    CollisionBuilderClass: ActorCollisionBuilder,
    entityType: ZylemActor.type
  });
}

// src/lib/entities/text.ts
import { Color as Color8, Group as Group5, Sprite as ThreeSprite2, SpriteMaterial as SpriteMaterial2, CanvasTexture, LinearFilter, Vector2 as Vector24, ClampToEdgeWrapping } from "three";
var textDefaults = {
  position: void 0,
  text: "",
  fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: 18,
  fontColor: "#FFFFFF",
  backgroundColor: null,
  padding: 4,
  stickToViewport: true,
  screenPosition: new Vector24(24, 24),
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
    const material = new SpriteMaterial2({
      map: this._texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      alphaTest: 0.5
    });
    this._sprite = new ThreeSprite2(material);
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
    const c = color instanceof Color8 ? color : new Color8(color);
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
    const sp = this.options.screenPosition ?? new Vector24(24, 24);
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

// src/lib/entities/rect.ts
import { Color as Color9, Group as Group6, Sprite as ThreeSprite3, SpriteMaterial as SpriteMaterial3, CanvasTexture as CanvasTexture2, LinearFilter as LinearFilter2, Vector2 as Vector25, ClampToEdgeWrapping as ClampToEdgeWrapping2, ShaderMaterial as ShaderMaterial3, Mesh as Mesh4, PlaneGeometry as PlaneGeometry2, Vector3 as Vector39 } from "three";
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
  screenPosition: new Vector25(24, 24),
  zDistance: 1,
  anchor: new Vector25(0, 0)
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
    this.group = new Group6();
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
        if (this._sprite && this._sprite.material instanceof ShaderMaterial3) {
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
    const c = color instanceof Color9 ? color : new Color9(color);
    return `#${c.getHexString()}`;
  }
  rectSetup(params) {
    this._cameraRef = params.camera;
    if (this.options.stickToViewport && this._cameraRef) {
      this._cameraRef.camera.add(this.group);
    }
    if (this.materials?.length && this._sprite) {
      const mat = this.materials[0];
      if (mat instanceof ShaderMaterial3) {
        mat.transparent = true;
        mat.depthTest = false;
        mat.depthWrite = false;
        if (this._texture) {
          if (mat.uniforms?.tDiffuse) mat.uniforms.tDiffuse.value = this._texture;
          if (mat.uniforms?.iResolution && this._canvas) mat.uniforms.iResolution.value.set(this._canvas.width, this._canvas.height, 1);
        }
        this._mesh = new Mesh4(new PlaneGeometry2(1, 1), mat);
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
        this.options.screenPosition = new Vector25(Math.floor(x), Math.floor(y));
        this.options.width = desiredW;
        this.options.height = desiredH;
        this.options.anchor = new Vector25(0, 0);
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
    const px = (this.options.screenPosition ?? new Vector25(24, 24)).x;
    const py = (this.options.screenPosition ?? new Vector25(24, 24)).y;
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
    const anchor = this.options.anchor ?? new Vector25(0, 0);
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
      const tl = this.worldToScreen(new Vector39(left, top, z));
      const br = this.worldToScreen(new Vector39(right, bottom, z));
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
async function rect(...args) {
  return createEntity({
    args,
    defaultConfig: { ...rectDefaults },
    EntityClass: ZylemRect,
    BuilderClass: RectBuilder,
    entityType: ZylemRect.type
  });
}
export {
  ZylemBox,
  actor,
  box,
  plane,
  rect,
  sphere,
  sprite,
  text,
  zone
};
//# sourceMappingURL=entities.js.map