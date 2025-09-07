import d from "@dimforge/rapier3d-compat";
import { state as c } from "../game/game-state.js";
import { ZylemActor as h } from "../entities/actor.js";
import { isCollisionHandlerDelegate as n } from "./collision-delegate.js";
class v {
  type = "World";
  world;
  collisionMap = /* @__PURE__ */ new Map();
  collisionBehaviorMap = /* @__PURE__ */ new Map();
  _removalMap = /* @__PURE__ */ new Map();
  static async loadPhysics(o) {
    return await d.init(), new d.World(o);
  }
  constructor(o) {
    this.world = o;
  }
  addEntity(o) {
    const i = this.world.createRigidBody(o.bodyDesc);
    o.body = i, o.body.userData = { uuid: o.uuid, ref: o }, this.world.gravity.x === 0 && this.world.gravity.y === 0 && this.world.gravity.z === 0 && (o.body.lockTranslations(!0, !0), o.body.lockRotations(!0, !0));
    const e = this.world.createCollider(o.colliderDesc, o.body);
    o.collider = e, (o.controlledRotation || o instanceof h) && (o.body.lockRotations(!0, !0), o.characterController = this.world.createCharacterController(0.01), o.characterController.setMaxSlopeClimbAngle(45 * Math.PI / 180), o.characterController.setMinSlopeSlideAngle(30 * Math.PI / 180), o.characterController.enableSnapToGround(0.01), o.characterController.setSlideEnabled(!0), o.characterController.setApplyImpulsesToDynamicBodies(!0), o.characterController.setCharacterMass(1)), this.collisionMap.set(o.uuid, o);
  }
  setForRemoval(o) {
    o.body && this._removalMap.set(o.uuid, o);
  }
  destroyEntity(o) {
    o.collider && this.world.removeCollider(o.collider, !0), o.body && (this.world.removeRigidBody(o.body), this.collisionMap.delete(o.uuid), this._removalMap.delete(o.uuid));
  }
  setup() {
  }
  update(o) {
    const { delta: i } = o;
    this.world && (this.updateColliders(i), this.updatePostCollisionBehaviors(i), this.world.step());
  }
  updatePostCollisionBehaviors(o) {
    const i = this.collisionBehaviorMap;
    for (let [e, a] of i) {
      const r = a;
      if (!n(r))
        return;
      r.handlePostCollision({ entity: r, delta: o }) || this.collisionBehaviorMap.delete(e);
    }
  }
  updateColliders(o) {
    const i = this.collisionMap;
    for (let [e, a] of i) {
      const r = a;
      if (r.body) {
        if (this._removalMap.get(r.uuid)) {
          this.destroyEntity(r);
          continue;
        }
        this.world.contactsWith(r.body.collider(0), (t) => {
          const s = t._parent.userData.uuid, l = i.get(s);
          l && r._collision && r._collision(l, c.globals);
        }), this.world.intersectionsWith(r.body.collider(0), (t) => {
          const s = t._parent.userData.uuid, l = i.get(s);
          l && (r._collision && r._collision(l, c.globals), n(l) && (l.handleIntersectionEvent({ entity: l, other: r, delta: o }), this.collisionBehaviorMap.set(s, l)));
        });
      }
    }
  }
  destroy() {
    try {
      for (const [, o] of this.collisionMap)
        try {
          this.destroyEntity(o);
        } catch {
        }
      this.collisionMap.clear(), this.collisionBehaviorMap.clear(), this._removalMap.clear(), this.world = void 0;
    } catch {
    }
  }
}
export {
  v as ZylemWorld
};
