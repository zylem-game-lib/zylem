import { state as i, getGlobalState as r, setGlobalState as n } from "./game-state.js";
import { setDebugFlag as u, isPaused as h } from "../debug/debug-state.js";
import { InputManager as g } from "../input/input-manager.js";
import { Timer as c } from "../core/three-addons/Timer.js";
import { subscribe as m } from "valtio/vanilla";
import f from "stats.js";
class l {
  id;
  initialGlobals = {};
  customSetup = null;
  customUpdate = null;
  customDestroy = null;
  stages = [];
  stageMap = /* @__PURE__ */ new Map();
  currentStageId = "";
  previousTimeStamp = 0;
  totalTime = 0;
  timer;
  inputManager;
  wrapperRef;
  statsRef = null;
  defaultCamera = null;
  static FRAME_LIMIT = 120;
  static FRAME_DURATION = 1e3 / l.FRAME_LIMIT;
  static MAX_DELTA_SECONDS = 1 / 30;
  constructor(t, e) {
    this.wrapperRef = e, this.inputManager = new g(t.input), this.timer = new c(), this.timer.connect(document), this.id = t.id, this.stages = t.stages || [], this.setGlobals(t), t.debug && (this.statsRef = new f(), this.statsRef.showPanel(0), this.statsRef.dom.style.position = "absolute", this.statsRef.dom.style.bottom = "0", this.statsRef.dom.style.right = "0", this.statsRef.dom.style.top = "auto", this.statsRef.dom.style.left = "auto", document.body.appendChild(this.statsRef.dom));
  }
  async loadStage(t) {
    this.unloadCurrentStage();
    const e = t.options[0];
    await t.load(this.id, e?.camera), this.stageMap.set(t.stageRef.uuid, t), this.currentStageId = t.stageRef.uuid, this.defaultCamera = t.stageRef.cameraRef;
  }
  unloadCurrentStage() {
    if (!this.currentStageId)
      return;
    const t = this.getStage(this.currentStageId);
    if (t) {
      if (t?.stageRef)
        try {
          t.stageRef.nodeDestroy({
            me: t.stageRef,
            globals: i.globals
          });
        } catch (e) {
          console.error("Failed to destroy previous stage", e);
        }
      this.stageMap.delete(this.currentStageId);
    }
  }
  setGlobals(t) {
    u(t.debug), this.initialGlobals = { ...t.globals };
    for (const e in this.initialGlobals) {
      const s = this.initialGlobals[e];
      s === void 0 && console.error(`global ${e} is undefined`), this.setGlobal(e, s);
    }
  }
  params() {
    const t = this.currentStage(), e = this.timer.getDelta(), s = this.inputManager.getInputs(e), a = t?.stageRef?.cameraRef || this.defaultCamera;
    return {
      delta: e,
      inputs: s,
      globals: i.globals,
      me: this,
      camera: a
    };
  }
  start() {
    const t = this.currentStage(), e = this.params();
    t.start({ ...e, me: t.stageRef }), this.customSetup && this.customSetup(e), this.loop(0);
  }
  loop(t) {
    if (this.statsRef && this.statsRef.begin(), !h()) {
      this.timer.update(t);
      const e = this.currentStage(), s = this.params(), a = Math.min(s.delta, l.MAX_DELTA_SECONDS), o = { ...s, delta: a };
      this.customUpdate && this.customUpdate(o), e && e.stageRef.nodeUpdate({ ...o, me: e.stageRef }), this.totalTime += o.delta, i.time = this.totalTime, this.previousTimeStamp = t;
    }
    this.statsRef && this.statsRef.end(), this.outOfLoop(), requestAnimationFrame(this.loop.bind(this));
  }
  outOfLoop() {
    const t = this.currentStage();
    t && t.stageRef.outOfLoop();
  }
  getStage(t) {
    return this.stageMap.get(t);
  }
  currentStage() {
    return this.getStage(this.currentStageId);
  }
  getGlobal(t) {
    return r(t);
  }
  setGlobal(t, e) {
    n(t, e);
  }
  onGlobalChange(t, e) {
    let s = r(t);
    m(i, () => {
      const a = r(t);
      a !== s && (s = a, e(a));
    });
  }
}
export {
  l as ZylemGame,
  l as default
};
