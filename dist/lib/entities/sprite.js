import { ColliderDesc as h } from "@dimforge/rapier3d-compat";
import { Color as d, Vector3 as p, TextureLoader as f, SpriteMaterial as y, Sprite as A, Group as x, Quaternion as I, Euler as g } from "three";
import { GameEntity as S } from "./entity.js";
import { EntityCollisionBuilder as w, EntityBuilder as b } from "./builder.js";
import { createEntity as z } from "./create.js";
import { DebugDelegate as E } from "./delegates/debug.js";
const l = {
  size: new p(1, 1, 1),
  position: new p(0, 0, 0),
  collision: {
    static: !1
  },
  material: {
    color: new d("#ffffff"),
    shader: "standard"
  },
  images: [],
  animations: []
};
class C extends w {
  collider(t) {
    const i = t.collisionSize || t.size || new p(1, 1, 1), e = { x: i.x / 2, y: i.y / 2, z: i.z / 2 };
    return h.cuboid(e.x, e.y, e.z);
  }
}
class D extends b {
  createEntity(t) {
    return new o(t);
  }
}
const T = Symbol("Sprite");
class o extends S {
  static type = T;
  sprites = [];
  spriteMap = /* @__PURE__ */ new Map();
  currentSpriteIndex = 0;
  animations = /* @__PURE__ */ new Map();
  currentAnimation = null;
  currentAnimationFrame = "";
  currentAnimationIndex = 0;
  currentAnimationTime = 0;
  constructor(t) {
    super(), this.options = { ...l, ...t }, this.createSpritesFromImages(t?.images || []), this.createAnimations(t?.animations || []), this.lifeCycleDelegate = {
      update: [this.spriteUpdate.bind(this)],
      destroy: [this.spriteDestroy.bind(this)]
    };
  }
  createSpritesFromImages(t) {
    const i = new f();
    t.forEach((e, s) => {
      const n = i.load(e.file), r = new y({
        map: n,
        transparent: !0
      }), a = new A(r);
      a.position.normalize(), this.sprites.push(a), this.spriteMap.set(e.name, s);
    }), this.group = new x(), this.group.add(...this.sprites);
  }
  createAnimations(t) {
    t.forEach((i) => {
      const { name: e, frames: s, loop: n = !1, speed: r = 1 } = i, a = {
        frames: s.map((u, m) => ({
          key: u,
          index: m,
          time: (typeof r == "number" ? r : r[m]) * (m + 1),
          duration: typeof r == "number" ? r : r[m]
        })),
        loop: n
      };
      this.animations.set(e, a);
    });
  }
  setSprite(t) {
    const e = this.spriteMap.get(t) ?? 0;
    this.currentSpriteIndex = e, this.sprites.forEach((s, n) => {
      s.visible = this.currentSpriteIndex === n;
    });
  }
  setAnimation(t, i) {
    const e = this.animations.get(t);
    if (!e)
      return;
    const { loop: s, frames: n } = e, r = n[this.currentAnimationIndex];
    t === this.currentAnimation ? (this.currentAnimationFrame = r.key, this.currentAnimationTime += i, this.setSprite(this.currentAnimationFrame)) : this.currentAnimation = t, this.currentAnimationTime > r.time && this.currentAnimationIndex++, this.currentAnimationIndex >= n.length && (s ? (this.currentAnimationIndex = 0, this.currentAnimationTime = 0) : this.currentAnimationTime = n[this.currentAnimationIndex].time);
  }
  async spriteUpdate(t) {
    this.sprites.forEach((i) => {
      if (i.material) {
        const e = this.body?.rotation();
        if (e) {
          const s = new I(e.x, e.y, e.z, e.w), n = new g().setFromQuaternion(s, "XYZ");
          i.material.rotation = n.z;
        }
        i.scale.set(this.options.size?.x ?? 1, this.options.size?.y ?? 1, this.options.size?.z ?? 1);
      }
    });
  }
  async spriteDestroy(t) {
    this.sprites.forEach((i) => {
      i.removeFromParent();
    }), this.group?.remove(...this.sprites), this.group?.removeFromParent();
  }
  buildInfo() {
    return {
      ...new E(this).buildDebugInfo(),
      type: String(o.type)
    };
  }
}
async function q(...c) {
  return z({
    args: c,
    defaultConfig: l,
    EntityClass: o,
    BuilderClass: D,
    CollisionBuilderClass: C,
    entityType: o.type
  });
}
export {
  T as SPRITE_TYPE,
  D as SpriteBuilder,
  C as SpriteCollisionBuilder,
  o as ZylemSprite,
  q as sprite
};
