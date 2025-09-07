import { ColliderDesc as h } from "@dimforge/rapier3d-compat";
import { Color as d, Vector3 as c, TextureLoader as f, SpriteMaterial as y, Sprite as A, Group as x, Quaternion as S, Euler as I } from "three";
import { GameEntity as w } from "./entity.js";
import { EntityCollisionBuilder as z, EntityBuilder as E } from "./builder.js";
import { createEntity as g } from "./create.js";
const l = {
  size: new c(1, 1, 1),
  position: new c(0, 0, 0),
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
class C extends z {
  collider(t) {
    const i = t.collisionSize || t.size || new c(1, 1, 1), e = { x: i.x / 2, y: i.y / 2, z: i.z / 2 };
    return h.cuboid(e.x, e.y, e.z);
  }
}
class T extends E {
  createEntity(t) {
    return new p(t);
  }
}
const b = Symbol("Sprite");
class p extends w {
  static type = b;
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
    t.forEach((e, n) => {
      const r = i.load(e.file), s = new y({
        map: r,
        transparent: !0
      }), a = new A(s);
      a.position.normalize(), this.sprites.push(a), this.spriteMap.set(e.name, n);
    }), this.group = new x(), this.group.add(...this.sprites);
  }
  createAnimations(t) {
    t.forEach((i) => {
      const { name: e, frames: n, loop: r = !1, speed: s = 1 } = i, a = {
        frames: n.map((u, m) => ({
          key: u,
          index: m,
          time: (typeof s == "number" ? s : s[m]) * (m + 1),
          duration: typeof s == "number" ? s : s[m]
        })),
        loop: r
      };
      this.animations.set(e, a);
    });
  }
  setSprite(t) {
    const e = this.spriteMap.get(t) ?? 0;
    this.currentSpriteIndex = e, this.sprites.forEach((n, r) => {
      n.visible = this.currentSpriteIndex === r;
    });
  }
  setAnimation(t, i) {
    const e = this.animations.get(t);
    if (!e)
      return;
    const { loop: n, frames: r } = e, s = r[this.currentAnimationIndex];
    t === this.currentAnimation ? (this.currentAnimationFrame = s.key, this.currentAnimationTime += i, this.setSprite(this.currentAnimationFrame)) : this.currentAnimation = t, this.currentAnimationTime > s.time && this.currentAnimationIndex++, this.currentAnimationIndex >= r.length && (n ? (this.currentAnimationIndex = 0, this.currentAnimationTime = 0) : this.currentAnimationTime = r[this.currentAnimationIndex].time);
  }
  async spriteUpdate(t) {
    this.sprites.forEach((i) => {
      if (i.material) {
        const e = this.body?.rotation();
        if (e) {
          const n = new S(e.x, e.y, e.z, e.w), r = new I().setFromQuaternion(n, "XYZ");
          i.material.rotation = r.z;
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
}
async function P(...o) {
  return g({
    args: o,
    defaultConfig: l,
    EntityClass: p,
    BuilderClass: T,
    CollisionBuilderClass: C,
    entityType: p.type
  });
}
export {
  b as SPRITE_TYPE,
  T as SpriteBuilder,
  C as SpriteCollisionBuilder,
  p as ZylemSprite,
  P as sprite
};
