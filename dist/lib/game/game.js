import { ZylemGame as l } from "./zylem-game.js";
import { setPaused as n } from "../debug/debug-state.js";
import { getGlobalState as g, setGlobalState as m } from "./game-state.js";
import { hasStages as h, convertNodes as c } from "../core/utility/nodes.js";
import { resolveGameConfig as u } from "./game-config.js";
import { createStage as G } from "../stage/stage.js";
import { StageManager as i, stageState as s } from "../stage/stage-manager.js";
import { StageFactory as p } from "../stage/stage-factory.js";
class w {
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
    this.options = e, h(e) || this.options.push(G());
  }
  async start() {
    const e = await this.load();
    return this.wrappedGame = e, this.setOverrides(), e.start(), this;
  }
  async load() {
    console.log("loading game", this.options);
    const e = await c(this.options), a = u(e), t = new l({
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
    n(!0);
  }
  async resume() {
    n(!1), this.wrappedGame && (this.wrappedGame.previousTimeStamp = 0, this.wrappedGame.timer.reset());
  }
  async reset() {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    await this.wrappedGame.loadStage(this.wrappedGame.stages[0]);
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
  async loadStageFromId(e) {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    try {
      const a = await i.loadStageData(e), t = await p.createFromBlueprint(a);
      await this.wrappedGame.loadStage(t), s.current = a;
    } catch (a) {
      console.error(`Failed to load stage ${e}`, a);
    }
  }
  async nextStage() {
    if (!this.wrappedGame) {
      console.error(this.refErrorMessage);
      return;
    }
    if (s.next) {
      const r = s.next.id;
      if (await i.transitionForward(r), s.current) {
        const d = await p.createFromBlueprint(s.current);
        await this.wrappedGame.loadStage(d);
        return;
      }
    }
    const e = this.wrappedGame.currentStageId, a = this.wrappedGame.stages.findIndex((r) => r.wrappedStage.uuid === e), t = this.wrappedGame.stages[a + 1];
    if (!t) {
      console.error("next stage called on last stage");
      return;
    }
    await this.wrappedGame.loadStage(t);
  }
  async goToStage() {
  }
  async end() {
  }
  getGlobal(e) {
    return this.wrappedGame ? this.wrappedGame.getGlobal(e) : g(e);
  }
  setGlobal(e, a) {
    if (this.wrappedGame) {
      this.wrappedGame.setGlobal(e, a);
      return;
    }
    m(e, a);
  }
  onGlobalChange(e, a) {
    if (this.wrappedGame) {
      this.wrappedGame.onGlobalChange(e, a);
      return;
    }
    this.pendingGlobalChangeHandlers.push({ key: e, callback: a });
  }
}
function M(...o) {
  return new w(o);
}
export {
  w as Game,
  M as createGame
};
