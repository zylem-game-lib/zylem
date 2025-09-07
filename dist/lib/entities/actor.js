import { ColliderDesc as l, ActiveCollisionTypes as m } from "@dimforge/rapier3d-compat";
import { Vector3 as r, Group as d, SkinnedMesh as u } from "three";
import { GameEntity as p } from "./entity.js";
import { createEntity as g } from "./create.js";
import { EntityAssetLoader as y } from "../core/entity-asset-loader.js";
import { AnimationDelegate as f } from "./delegates/animation.js";
import { EntityCollisionBuilder as b, EntityBuilder as _ } from "./builder.js";
const c = {
  position: { x: 0, y: 0, z: 0 },
  collision: {
    static: !1,
    size: new r(0.5, 0.5, 0.5),
    position: new r(0, 0, 0)
  },
  material: {
    shader: "standard"
  },
  animations: [],
  models: []
};
class j extends b {
  height = 1;
  objectModel = null;
  constructor(t) {
    super(), this.objectModel = t.objectModel;
  }
  createColliderFromObjectModel(t) {
    if (!t)
      return l.capsule(1, 1);
    const e = t.children.find((s) => s instanceof u).geometry;
    if (e && (e.computeBoundingBox(), e.boundingBox)) {
      const s = e.boundingBox.max.y, h = e.boundingBox.min.y;
      this.height = s - h;
    }
    this.height = 1;
    let o = l.capsule(this.height / 2, 1);
    return o.setSensor(!1), o.setTranslation(0, this.height + 0.5, 0), o.activeCollisionTypes = m.DEFAULT, o;
  }
  collider(t) {
    return this.createColliderFromObjectModel(this.objectModel);
  }
}
class C extends _ {
  createEntity(t) {
    return new a(t);
  }
}
const D = Symbol("Actor");
class a extends p {
  static type = D;
  _object = null;
  _animationDelegate = null;
  _modelFileNames = [];
  _assetLoader = new y();
  controlledRotation = !1;
  constructor(t) {
    super(), this.options = { ...c, ...t }, this.lifeCycleDelegate = {
      update: [this.actorUpdate.bind(this)]
    }, this.controlledRotation = !0;
  }
  async load() {
    this._modelFileNames = this.options.models || [], await this.loadModels(), this._object && (this._animationDelegate = new f(this._object), await this._animationDelegate.loadAnimations(this.options.animations || []));
  }
  async data() {
    return {
      animations: this._animationDelegate?.animations,
      objectModel: this._object
    };
  }
  async actorUpdate(t) {
    this._animationDelegate?.update(t.delta);
  }
  async loadModels() {
    if (this._modelFileNames.length === 0)
      return;
    const t = this._modelFileNames.map((e) => this._assetLoader.loadFile(e)), i = await Promise.all(t);
    i[0]?.object && (this._object = i[0].object), this._object && (this.group = new d(), this.group.attach(this._object), this.group.scale.set(this.options.scale?.x || 1, this.options.scale?.y || 1, this.options.scale?.z || 1));
  }
  playAnimation(t) {
    this._animationDelegate?.playAnimation(t);
  }
  get object() {
    return this._object;
  }
  /**
   * Provide custom debug information for the actor
   * This will be merged with the default debug information
   */
  getDebugInfo() {
    const t = {
      type: "Actor",
      models: this._modelFileNames.length > 0 ? this._modelFileNames : "none",
      modelLoaded: !!this._object,
      scale: this.options.scale ? `${this.options.scale.x}, ${this.options.scale.y}, ${this.options.scale.z}` : "1, 1, 1"
    };
    if (this._animationDelegate && (t.currentAnimation = this._animationDelegate.currentAnimationKey || "none", t.animationsCount = this.options.animations?.length || 0), this._object) {
      let i = 0, e = 0;
      this._object.traverse((o) => {
        if (o.isMesh) {
          i++;
          const s = o.geometry;
          s && s.attributes.position && (e += s.attributes.position.count);
        }
      }), t.meshCount = i, t.vertexCount = e;
    }
    return t;
  }
}
async function T(...n) {
  return await g({
    args: n,
    defaultConfig: c,
    EntityClass: a,
    BuilderClass: C,
    CollisionBuilderClass: j,
    entityType: a.type
  });
}
export {
  D as ACTOR_TYPE,
  C as ActorBuilder,
  j as ActorCollisionBuilder,
  a as ZylemActor,
  T as actor
};
