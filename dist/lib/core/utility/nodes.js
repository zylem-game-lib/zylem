import { BaseNode as f } from "../base-node.js";
import { Stage as r } from "../../stage/stage.js";
import { GameEntity as g } from "../../entities/entity.js";
async function h(c) {
  const { getGameDefaultConfig: a } = await import("../../game/game-default.js");
  let s = { ...a() };
  const o = [], e = [], i = [];
  return Object.values(c).forEach((t) => {
    if (t instanceof r)
      e.push(t);
    else if (t instanceof g)
      i.push(t);
    else if (t instanceof f)
      i.push(t);
    else if (t?.constructor?.name === "Object" && typeof t == "object") {
      const n = Object.assign({ ...a() }, { ...t });
      o.push(n);
    }
  }), o.forEach((t) => {
    s = Object.assign(s, { ...t });
  }), e.forEach((t) => {
    t.addEntities(i);
  }), e.length ? s.stages = e : s.stages[0].addEntities(i), s;
}
export {
  h as convertNodes
};
