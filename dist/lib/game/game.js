import { ZylemGame as n } from "./zylem-game.js";
import { Stage as o } from "../stage/stage.js";
import { setPaused as r } from "../debug/debug-state.js";
import { getGlobalState as g, setGlobalState as f } from "./game-state.js";
import { convertNodes as h } from "../core/utility/nodes.js";
import { resolveGameConfig as l } from "./game-config.js";
class u {
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
  constructor(t) {
    this.options = t;
  }
  async start() {
    const t = await this.load();
    return this.gameRef = t, this.setOverrides(), t.start(), this;
  }
  async load() {
    console.log("loading game", this.options);
    const t = await h(this.options), s = l(t), e = new n({
      ...t,
      ...s
    }, this);
    return await e.loadStage(t.stages[0]), e;
  }
  setOverrides() {
    if (!this.gameRef) {
      console.error(this.refErrorMessage);
      return;
    }
    if (this.gameRef.customSetup = this.setup, this.gameRef.customUpdate = this.update, this.gameRef.customDestroy = this.destroy, this.pendingGlobalChangeHandlers.length) {
      for (const { key: t, callback: s } of this.pendingGlobalChangeHandlers)
        this.gameRef.onGlobalChange(t, s);
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
    const t = this.gameRef.currentStageId, s = this.gameRef.stages.findIndex((a) => a.stageRef.uuid === t), e = this.gameRef.stages[s + 1];
    if (!e) {
      console.error("next stage called on last stage");
      return;
    }
    await this.gameRef.loadStage(e);
  }
  async previousStage() {
    if (!this.gameRef) {
      console.error(this.refErrorMessage);
      return;
    }
    const t = this.gameRef.currentStageId, s = this.gameRef.stages.findIndex((a) => a.stageRef.uuid === t), e = this.gameRef.stages[s - 1];
    if (!e) {
      console.error("previous stage called on first stage");
      return;
    }
    await this.gameRef.loadStage(e);
  }
  async goToStage() {
  }
  async end() {
  }
  add(...t) {
    for (const s of t)
      if (s) {
        if (s instanceof o) {
          this.gameRef ? (this.gameRef.stages.push(s), this.gameRef.stageMap.set(s.stageRef.uuid, s)) : this.options.push(s);
          continue;
        }
        if (typeof s == "function") {
          try {
            const e = s();
            e instanceof o ? this.gameRef ? (this.gameRef.stages.push(e), this.gameRef.stageMap.set(e.stageRef.uuid, e)) : this.options.push(e) : e && typeof e.then == "function" && e.then((a) => {
              a instanceof o && (this.gameRef ? (this.gameRef.stages.push(a), this.gameRef.stageMap.set(a.stageRef.uuid, a)) : this.options.push(a));
            }).catch((a) => console.error("Failed to add async stage", a));
          } catch (e) {
            console.error("Error executing stage factory", e);
          }
          continue;
        }
        s && typeof s.then == "function" && s.then((e) => {
          e instanceof o && (this.gameRef ? (this.gameRef.stages.push(e), this.gameRef.stageMap.set(e.stageRef.uuid, e)) : this.options.push(e));
        }).catch((e) => console.error("Failed to add async stage", e));
      }
    return this;
  }
  getGlobal(t) {
    return this.gameRef ? this.gameRef.getGlobal(t) : g(t);
  }
  setGlobal(t, s) {
    if (this.gameRef) {
      this.gameRef.setGlobal(t, s);
      return;
    }
    f(t, s);
  }
  onGlobalChange(t, s) {
    if (this.gameRef) {
      this.gameRef.onGlobalChange(t, s);
      return;
    }
    this.pendingGlobalChangeHandlers.push({ key: t, callback: s });
  }
}
function S(...i) {
  return new u(i);
}
export {
  u as Game,
  S as game
};
