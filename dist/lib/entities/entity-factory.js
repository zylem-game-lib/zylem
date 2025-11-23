import { text as e } from "./text.js";
import { sprite as s } from "./sprite.js";
const o = {
  registry: /* @__PURE__ */ new Map(),
  register(t, i) {
    this.registry.set(t, i);
  },
  async createFromBlueprint(t) {
    const i = this.registry.get(t.type);
    if (!i)
      throw new Error(`Unknown entity type: ${t.type}`);
    const r = {
      ...t.data,
      position: t.position ? { x: t.position[0], y: t.position[1], z: 0 } : void 0,
      name: t.id
    };
    return await i(r);
  }
};
o.register("text", async (t) => await e(t));
o.register("sprite", async (t) => await s(t));
export {
  o as EntityFactory
};
