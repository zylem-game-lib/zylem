import { ZylemGame as n } from "./zylem-game.js";
import { setPaused as o } from "../debug/debug-state.js";
import { getGlobalState as i, setGlobalState as p } from "./game-state.js";
import { hasStages as d, convertNodes as l } from "../core/utility/nodes.js";
import { resolveGameConfig as h } from "./game-config.js";
import { stage as g } from "../stage/stage.js";
class m {
  wrappedGame = null;
  pendingGlobalChangeHandlers = [];
  options;
  update = () => {
  };
  setup = () => {
  };
  destroy = () => {
  };
  refErrorMessage = "lost reference to game";
  constructor(e) {
    this.options = e, d(e) || this.options.push(g());
  }
  async start() {
    const e = await this.load();
    return this.wrappedGame = e, this.setOverrides(), e.start(), this;
  }
  async load() {
    console.log("loading game", this.options);
    const e = await l(this.options), a = h(e), t = new n({
      ...e,
      ...a
    }, this);
    return await t.loadStage(e.stages[0]), t;
  }
  setOverrides() {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    if (this.wrappedGame.customSetup = this.setup, this.wrappedGame.customUpdate = this.update, this.wrappedGame.customDestroy = this.destroy, this.pendingGlobalChangeHandlers.length) {
      for (const { key: e, callback: a } of this.pendingGlobalChangeHandlers)
        this.wrappedGame.onGlobalChange(e, a);
      this.pendingGlobalChangeHandlers = [];
    }
  }
  async pause() {
    o(!0);
  }
  async resume() {
    o(!1), this.wrappedGame && (this.wrappedGame.previousTimeStamp = 0, this.wrappedGame.timer.reset());
  }
  async reset() {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    await this.wrappedGame.loadStage(this.wrappedGame.stages[0]);
  }
  async nextStage() {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    const e = this.wrappedGame.currentStageId, a = this.wrappedGame.stages.findIndex((r) => r.wrappedStage.uuid === e), t = this.wrappedGame.stages[a + 1];
    if (!t) {
      console.error("next stage called on last stage");
      return;
    }
    await this.wrappedGame.loadStage(t);
  }
  async previousStage() {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    const e = this.wrappedGame.currentStageId, a = this.wrappedGame.stages.findIndex((r) => r.wrappedStage.uuid === e), t = this.wrappedGame.stages[a - 1];
    if (!t) {
      console.error("previous stage called on first stage");
      return;
    }
    await this.wrappedGame.loadStage(t);
  }
  async goToStage() {
  }
  async end() {
  }
  getGlobal(e) {
    return this.wrappedGame ? this.wrappedGame.getGlobal(e) : i(e);
  }
  setGlobal(e, a) {
    if (this.wrappedGame) {
      this.wrappedGame.setGlobal(e, a);
      return;
    }
    p(e, a);
  }
  onGlobalChange(e, a) {
    if (this.wrappedGame) {
      this.wrappedGame.onGlobalChange(e, a);
      return;
    }
    this.pendingGlobalChangeHandlers.push({ key: e, callback: a });
  }
}
function b(...s) {
  return new m(s);
}
export {
  m as Game,
  b as createGame
};
