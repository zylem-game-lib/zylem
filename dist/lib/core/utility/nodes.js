import { BaseNode as r } from "../base-node.js";
import { Stage as c } from "../../stage/stage.js";
import { GameEntity as g } from "../../entities/entity.js";
async function h(i) {
  const { getGameDefaultConfig: n } = await import("../../game/game-default.js");
  let s = { ...n() };
  const o = [], e = [], a = [];
  return Object.values(i).forEach((t) => {
    if (t instanceof c)
      e.push(t);
    else if (t instanceof g)
      a.push(t);
    else if (t instanceof r)
      a.push(t);
    else if (t?.constructor?.name === "Object" && typeof t == "object") {
      const f = Object.assign({ ...n() }, { ...t });
      o.push(f);
    }
  }), o.forEach((t) => {
    s = Object.assign(s, { ...t });
  }), e.forEach((t) => {
    t.addEntities(a);
  }), e.length ? s.stages = e : s.stages[0].addEntities(a), s;
}
function l(i) {
  return !!i.find((s) => s instanceof c);
}
export {
  h as convertNodes,
  l as hasStages
};
