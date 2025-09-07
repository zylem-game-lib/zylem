import { BaseNode as h } from "../core/base-node.js";
import { ZylemGame as c } from "./zylem-game.js";
import { Stage as o, stage as l } from "../stage/stage.js";
import { setPaused as r } from "../debug/debug-state.js";
import { GameEntity as u } from "../entities/entity.js";
import { getGlobalState as m, setGlobalState as p } from "./game-state.js";
const f = {
  id: "zylem",
  globals: {},
  stages: [
    l()
  ]
};
function d(n) {
  let e = { ...f };
  const t = [], s = [], a = [];
  return Object.values(n).forEach((i) => {
    if (i instanceof o)
      s.push(i);
    else if (i instanceof u)
      a.push(i);
    else if (i instanceof h)
      a.push(i);
    else if (i.constructor.name === "Object" && typeof i == "object") {
      const g = Object.assign(f, { ...i });
      t.push(g);
    }
  }), t.forEach((i) => {
    e = Object.assign(e, { ...i });
  }), s.forEach((i) => {
    i.addEntities(a);
  }), s.length ? e.stages = s : e.stages[0].addEntities(a), e;
}
class R {
  gameRef = null;
  options;
  pendingGlobalChangeHandlers = [];
  update = () => {
  };
  setup = () => {
  };
  destroy = () => {
  };
  refErrorMessage = "lost reference to game";
  constructor(e) {
    this.options = e;
  }
  async start() {
    const e = await this.load();
    return this.gameRef = e, this.setOverrides(), e.start(), this;
  }
  async load() {
    console.log("loading game", this.options);
    const e = d(this.options), t = new c(e, this);
    return await t.loadStage(e.stages[0]), t;
  }
  setOverrides() {
    if (!this.gameRef) {
      console.error(this.refErrorMessage);
      return;
    }
    if (this.gameRef.customSetup = this.setup, this.gameRef.customUpdate = this.update, this.gameRef.customDestroy = this.destroy, this.pendingGlobalChangeHandlers.length) {
      for (const { key: e, callback: t } of this.pendingGlobalChangeHandlers)
        this.gameRef.onGlobalChange(e, t);
      this.pendingGlobalChangeHandlers = [];
    }
  }
  async pause() {
    r(!0);
  }
  async resume() {
    r(!1), this.gameRef && (this.gameRef.previousTimeStamp = 0, this.gameRef.timer.reset());
  }
  async reset() {
    if (!this.gameRef) {
      console.error(this.refErrorMessage);
      return;
    }
    await this.gameRef.loadStage(this.gameRef.stages[0]);
  }
  async nextStage() {
    if (!this.gameRef) {
      console.error(this.refErrorMessage);
      return;
    }
    const e = this.gameRef.currentStageId, t = this.gameRef.stages.findIndex((a) => a.stageRef.uuid === e), s = this.gameRef.stages[t + 1];
    if (!s) {
      console.error("next stage called on last stage");
      return;
    }
    await this.gameRef.loadStage(s);
  }
  async previousStage() {
    if (!this.gameRef) {
      console.error(this.refErrorMessage);
      return;
    }
    const e = this.gameRef.currentStageId, t = this.gameRef.stages.findIndex((a) => a.stageRef.uuid === e), s = this.gameRef.stages[t - 1];
    if (!s) {
      console.error("previous stage called on first stage");
      return;
    }
    await this.gameRef.loadStage(s);
  }
  async goToStage() {
  }
  async end() {
  }
  add(...e) {
    for (const t of e)
      if (t) {
        if (t instanceof o) {
          this.gameRef ? (this.gameRef.stages.push(t), this.gameRef.stageMap.set(t.stageRef.uuid, t)) : this.options.push(t);
          continue;
        }
        if (typeof t == "function") {
          try {
            const s = t();
            s instanceof o ? this.gameRef ? (this.gameRef.stages.push(s), this.gameRef.stageMap.set(s.stageRef.uuid, s)) : this.options.push(s) : s && typeof s.then == "function" && s.then((a) => {
              a instanceof o && (this.gameRef ? (this.gameRef.stages.push(a), this.gameRef.stageMap.set(a.stageRef.uuid, a)) : this.options.push(a));
            }).catch((a) => console.error("Failed to add async stage", a));
          } catch (s) {
            console.error("Error executing stage factory", s);
          }
          continue;
        }
        t && typeof t.then == "function" && t.then((s) => {
          s instanceof o && (this.gameRef ? (this.gameRef.stages.push(s), this.gameRef.stageMap.set(s.stageRef.uuid, s)) : this.options.push(s));
        }).catch((s) => console.error("Failed to add async stage", s));
      }
    return this;
  }
  getGlobal(e) {
    return this.gameRef ? this.gameRef.getGlobal(e) : m(e);
  }
  setGlobal(e, t) {
    if (this.gameRef) {
      this.gameRef.setGlobal(e, t);
      return;
    }
    p(e, t);
  }
  onGlobalChange(e, t) {
    if (this.gameRef) {
      this.gameRef.onGlobalChange(e, t);
      return;
    }
    this.pendingGlobalChangeHandlers.push({ key: e, callback: t });
  }
}
function M(...n) {
  return new R(n);
}
export {
  R as Game,
  M as game
};
