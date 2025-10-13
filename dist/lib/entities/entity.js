import { ShaderMaterial as s } from "three";
import { position as a, scale as o, rotation as n } from "../systems/transformable.system.js";
import { BaseNode as c } from "../core/base-node.js";
class f extends c {
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
    const { position: e } = this.options, { x: t, y: i, z: l } = e || { x: 0, y: 0, z: 0 };
    return this.behaviors = [
      { component: a, values: { x: t, y: i, z: l } },
      { component: o, values: { x: 0, y: 0, z: 0 } },
      { component: n, values: { x: 0, y: 0, z: 0, w: 0 } }
    ], this.name = this.options.name || "", this;
  }
  onSetup(...e) {
    const t = [...this.lifeCycleDelegate.setup ?? [], ...e];
    return this.lifeCycleDelegate = {
      ...this.lifeCycleDelegate,
      setup: t
    }, this;
  }
  onUpdate(...e) {
    const t = [...this.lifeCycleDelegate.update ?? [], ...e];
    return this.lifeCycleDelegate = {
      ...this.lifeCycleDelegate,
      update: t
    }, this;
  }
  onDestroy(...e) {
    return this.lifeCycleDelegate = {
      ...this.lifeCycleDelegate,
      destroy: e.length > 0 ? e : void 0
    }, this;
  }
  onCollision(...e) {
    return this.collisionDelegate = {
      collision: e.length > 0 ? e : void 0
    }, this;
  }
  _setup(e) {
    this.behaviorCallbackMap.setup.forEach((t) => {
      t({ ...e, me: this });
    }), this.lifeCycleDelegate.setup?.length && this.lifeCycleDelegate.setup.forEach((i) => {
      i({ ...e, me: this });
    });
  }
  async _loaded(e) {
  }
  _update(e) {
    this.updateMaterials(e), this.lifeCycleDelegate.update?.length && this.lifeCycleDelegate.update.forEach((i) => {
      i({ ...e, me: this });
    }), this.behaviorCallbackMap.update.forEach((t) => {
      t({ ...e, me: this });
    });
  }
  _destroy(e) {
    this.lifeCycleDelegate.destroy?.length && this.lifeCycleDelegate.destroy.forEach((i) => {
      i({ ...e, me: this });
    }), this.behaviorCallbackMap.destroy.forEach((t) => {
      t({ ...e, me: this });
    });
  }
  async _cleanup(e) {
  }
  _collision(e, t) {
    this.collisionDelegate.collision?.length && this.collisionDelegate.collision.forEach((l) => {
      l({ entity: this, other: e, globals: t });
    }), this.behaviorCallbackMap.collision.forEach((i) => {
      i({ entity: this, other: e, globals: t });
    });
  }
  addBehavior(e) {
    const t = e.handler;
    return t && this.behaviorCallbackMap[e.type].push(t), this;
  }
  addBehaviors(e) {
    return e.forEach((t) => {
      const i = t.handler;
      i && this.behaviorCallbackMap[t.type].push(i);
    }), this;
  }
  updateMaterials(e) {
    if (this.materials?.length)
      for (const t of this.materials)
        t instanceof s && t.uniforms && t.uniforms.iTime && (t.uniforms.iTime.value += e.delta);
  }
  buildInfo() {
    const e = {};
    return e.name = this.name, e.uuid = this.uuid, e.eid = this.eid.toString(), e;
  }
}
export {
  f as GameEntity
};
