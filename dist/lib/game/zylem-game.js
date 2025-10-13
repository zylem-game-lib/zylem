import { state as o, getGlobalState as n, setGlobalState as l } from "./game-state.js";
import { setDebugFlag as u, isPaused as m } from "../debug/debug-state.js";
import { InputManager as c } from "../input/input-manager.js";
import { Timer as h } from "../core/three-addons/Timer.js";
import { resolveGameConfig as d } from "./game-config.js";
import { GameCanvas as g } from "./game-canvas.js";
import { subscribe as f } from "valtio/vanilla";
import p from "stats.js";
class r {
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
  container = null;
  canvas = null;
  aspectRatioDelegate = null;
  resolvedConfig = null;
  gameCanvas = null;
  static FRAME_LIMIT = 120;
  static FRAME_DURATION = 1e3 / r.FRAME_LIMIT;
  static MAX_DELTA_SECONDS = 1 / 30;
  constructor(t, e) {
    this.wrapperRef = e, this.inputManager = new c(t.input), this.timer = new h(), this.timer.connect(document);
    const a = d(t);
    this.id = a.id, this.stages = a.stages || [], this.container = a.container, this.canvas = a.canvas ?? null, this.resolvedConfig = a, this.loadGameCanvas(a), this.loadDebugOptions(t), this.setGlobals(t);
  }
  loadGameCanvas(t) {
    this.gameCanvas = new g({
      id: t.id,
      container: t.container,
      containerId: t.containerId,
      canvas: this.canvas ?? void 0,
      bodyBackground: t.bodyBackground,
      fullscreen: t.fullscreen,
      aspectRatio: t.aspectRatio
    }), this.gameCanvas.applyBodyBackground(), this.gameCanvas.mountCanvas(), this.gameCanvas.centerIfFullscreen();
  }
  loadDebugOptions(t) {
    u(!!t.debug), t.debug && (this.statsRef = new p(), this.statsRef.showPanel(0), this.statsRef.dom.style.position = "absolute", this.statsRef.dom.style.bottom = "0", this.statsRef.dom.style.right = "0", this.statsRef.dom.style.top = "auto", this.statsRef.dom.style.left = "auto", document.body.appendChild(this.statsRef.dom));
  }
  async loadStage(t) {
    this.unloadCurrentStage();
    const e = t.options[0];
    if (await t.load(this.id, e?.camera), this.stageMap.set(t.stageRef.uuid, t), this.currentStageId = t.stageRef.uuid, this.defaultCamera = t.stageRef.cameraRef, this.container && this.defaultCamera) {
      const a = this.defaultCamera.getDomElement();
      this.gameCanvas?.mountRenderer(a, (s, i) => this.defaultCamera?.resize(s, i));
    }
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
            globals: o.globals
          });
        } catch (e) {
          console.error("Failed to destroy previous stage", e);
        }
      this.stageMap.delete(this.currentStageId);
    }
  }
  setGlobals(t) {
    this.initialGlobals = { ...t.globals };
    for (const e in this.initialGlobals) {
      const a = this.initialGlobals[e];
      a === void 0 && console.error(`global ${e} is undefined`), this.setGlobal(e, a);
    }
  }
  params() {
    const t = this.currentStage(), e = this.timer.getDelta(), a = this.inputManager.getInputs(e), s = t?.stageRef?.cameraRef || this.defaultCamera;
    return {
      delta: e,
      inputs: a,
      globals: o.globals,
      me: this,
      camera: s
    };
  }
  start() {
    const t = this.currentStage(), e = this.params();
    t.start({ ...e, me: t.stageRef }), this.customSetup && this.customSetup(e), this.loop(0);
  }
  loop(t) {
    if (this.statsRef && this.statsRef.begin(), !m()) {
      this.timer.update(t);
      const e = this.currentStage(), a = this.params(), s = Math.min(a.delta, r.MAX_DELTA_SECONDS), i = { ...a, delta: s };
      this.customUpdate && this.customUpdate(i), e && e.stageRef.nodeUpdate({ ...i, me: e.stageRef }), this.totalTime += i.delta, o.time = this.totalTime, this.previousTimeStamp = t;
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
    return n(t);
  }
  setGlobal(t, e) {
    l(t, e);
  }
  onGlobalChange(t, e) {
    let a = n(t);
    f(o, () => {
      const s = n(t);
      s !== a && (a = s, e(s));
    });
  }
}
export {
  r as ZylemGame,
  r as default
};
