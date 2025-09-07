import { s as p, b as m, f as w, h as I, G as T, B as _ } from "./actor-CDwH9h9-.js";
import { a as A, i as L, b, S as f, s as M } from "./stage-B8WmdLRN.js";
import C from "stats.js";
class g {
  keyStates = /* @__PURE__ */ new Map();
  keyButtonStates = /* @__PURE__ */ new Map();
  mapping = null;
  includeDefaultBase = !0;
  constructor(e, t) {
    this.mapping = e ?? null, this.includeDefaultBase = t?.includeDefaultBase ?? !0, window.addEventListener("keydown", ({ key: s }) => this.keyStates.set(s, !0)), window.addEventListener("keyup", ({ key: s }) => this.keyStates.set(s, !1));
  }
  isKeyPressed(e) {
    return this.keyStates.get(e) || !1;
  }
  handleButtonState(e, t) {
    let s = this.keyButtonStates.get(e);
    const a = this.isKeyPressed(e);
    return s || (s = { pressed: !1, released: !1, held: 0 }, this.keyButtonStates.set(e, s)), a ? (s.held === 0 ? s.pressed = !0 : s.pressed = !1, s.held += t, s.released = !1) : (s.held > 0 ? (s.released = !0, s.held = 0) : s.released = !1, s.pressed = !1), s;
  }
  handleAnalogState(e, t, s) {
    return { value: this.getAxisValue(e, t), held: s };
  }
  mergeButtonState(e, t) {
    return {
      pressed: e?.pressed || t?.pressed || !1,
      released: e?.released || t?.released || !1,
      held: (e?.held || 0) + (t?.held || 0)
    };
  }
  applyCustomMapping(e, t) {
    if (!this.mapping)
      return e;
    for (const [s, a] of Object.entries(this.mapping)) {
      if (!a || a.length === 0)
        continue;
      const i = this.handleButtonState(s, t);
      for (const o of a) {
        const [r, l] = (o || "").split(".");
        if (!r || !l)
          continue;
        const d = r.toLowerCase(), R = l.toLowerCase();
        if (d === "buttons") {
          const u = {
            a: "A",
            b: "B",
            x: "X",
            y: "Y",
            start: "Start",
            select: "Select",
            l: "L",
            r: "R"
          }[R];
          if (!u)
            continue;
          const h = e.buttons || {};
          h[u] = this.mergeButtonState(h[u], i), e.buttons = h;
          continue;
        }
        if (d === "directions") {
          const u = {
            up: "Up",
            down: "Down",
            left: "Left",
            right: "Right"
          }[R];
          if (!u)
            continue;
          const h = e.directions || {};
          h[u] = this.mergeButtonState(h[u], i), e.directions = h;
          continue;
        }
        if (d === "shoulders") {
          const u = {
            ltrigger: "LTrigger",
            rtrigger: "RTrigger"
          }[R];
          if (!u)
            continue;
          const h = e.shoulders || {};
          h[u] = this.mergeButtonState(h[u], i), e.shoulders = h;
          continue;
        }
      }
    }
    return e;
  }
  getInput(e) {
    const t = {};
    return this.includeDefaultBase && (t.buttons = {
      A: this.handleButtonState("z", e),
      B: this.handleButtonState("x", e),
      X: this.handleButtonState("a", e),
      Y: this.handleButtonState("s", e),
      Start: this.handleButtonState(" ", e),
      Select: this.handleButtonState("Enter", e),
      L: this.handleButtonState("q", e),
      R: this.handleButtonState("e", e)
    }, t.directions = {
      Up: this.handleButtonState("ArrowUp", e),
      Down: this.handleButtonState("ArrowDown", e),
      Left: this.handleButtonState("ArrowLeft", e),
      Right: this.handleButtonState("ArrowRight", e)
    }, t.axes = {
      Horizontal: this.handleAnalogState("ArrowLeft", "ArrowRight", e),
      Vertical: this.handleAnalogState("ArrowUp", "ArrowDown", e)
    }, t.shoulders = {
      LTrigger: this.handleButtonState("Q", e),
      RTrigger: this.handleButtonState("E", e)
    }), this.applyCustomMapping(t, e);
  }
  getName() {
    return "keyboard";
  }
  getAxisValue(e, t) {
    return (this.isKeyPressed(t) ? 1 : 0) - (this.isKeyPressed(e) ? 1 : 0);
  }
  isConnected() {
    return !0;
  }
}
class c {
  gamepadIndex;
  connected = !1;
  buttonStates = {};
  constructor(e) {
    this.gamepadIndex = e, window.addEventListener("gamepadconnected", (t) => {
      t.gamepad.index === this.gamepadIndex && (this.connected = !0);
    }), window.addEventListener("gamepaddisconnected", (t) => {
      t.gamepad.index === this.gamepadIndex && (this.connected = !1);
    });
  }
  handleButtonState(e, t, s) {
    const a = t.buttons[e].pressed;
    let i = this.buttonStates[e];
    return i || (i = { pressed: !1, released: !1, held: 0 }, this.buttonStates[e] = i), a ? (i.held === 0 ? i.pressed = !0 : i.pressed = !1, i.held += s, i.released = !1) : (i.held > 0 ? (i.released = !0, i.held = 0) : i.released = !1, i.pressed = !1), i;
  }
  handleAnalogState(e, t, s) {
    return { value: t.axes[e], held: s };
  }
  getInput(e) {
    const t = navigator.getGamepads()[this.gamepadIndex];
    return t ? {
      buttons: {
        A: this.handleButtonState(0, t, e),
        B: this.handleButtonState(1, t, e),
        X: this.handleButtonState(2, t, e),
        Y: this.handleButtonState(3, t, e),
        Start: this.handleButtonState(9, t, e),
        Select: this.handleButtonState(8, t, e),
        L: this.handleButtonState(4, t, e),
        R: this.handleButtonState(5, t, e)
      },
      directions: {
        Up: this.handleButtonState(12, t, e),
        Down: this.handleButtonState(13, t, e),
        Left: this.handleButtonState(14, t, e),
        Right: this.handleButtonState(15, t, e)
      },
      axes: {
        Horizontal: this.handleAnalogState(0, t, e),
        Vertical: this.handleAnalogState(1, t, e)
      },
      shoulders: {
        LTrigger: this.handleButtonState(6, t, e),
        RTrigger: this.handleButtonState(7, t, e)
      }
    } : {};
  }
  getName() {
    return `gamepad-${this.gamepadIndex + 1}`;
  }
  isConnected() {
    return this.connected;
  }
}
class D {
  inputMap = /* @__PURE__ */ new Map();
  currentInputs = {};
  previousInputs = {};
  constructor(e) {
    e?.p1?.key ? this.addInputProvider(1, new g(e.p1.key, { includeDefaultBase: !1 })) : this.addInputProvider(1, new g()), this.addInputProvider(1, new c(0)), e?.p2?.key && this.addInputProvider(2, new g(e.p2.key, { includeDefaultBase: !1 })), this.addInputProvider(2, new c(1)), e?.p3?.key && this.addInputProvider(3, new g(e.p3.key, { includeDefaultBase: !1 })), this.addInputProvider(3, new c(2)), e?.p4?.key && this.addInputProvider(4, new g(e.p4.key, { includeDefaultBase: !1 })), this.addInputProvider(4, new c(3)), e?.p5?.key && this.addInputProvider(5, new g(e.p5.key, { includeDefaultBase: !1 })), this.addInputProvider(5, new c(4)), e?.p6?.key && this.addInputProvider(6, new g(e.p6.key, { includeDefaultBase: !1 })), this.addInputProvider(6, new c(5)), e?.p7?.key && this.addInputProvider(7, new g(e.p7.key, { includeDefaultBase: !1 })), this.addInputProvider(7, new c(6)), e?.p8?.key && this.addInputProvider(8, new g(e.p8.key, { includeDefaultBase: !1 })), this.addInputProvider(8, new c(7));
  }
  addInputProvider(e, t) {
    this.inputMap.has(e) || this.inputMap.set(e, []), this.inputMap.get(e)?.push(t);
  }
  getInputs(e) {
    const t = {};
    return this.inputMap.forEach((s, a) => {
      const i = `p${a}`, o = s.reduce((r, l) => {
        const d = l.getInput(e);
        return this.mergeInputs(r, d);
      }, {});
      t[i] = {
        playerNumber: a,
        ...o
      };
    }), t;
  }
  mergeButtonState(e, t) {
    return {
      pressed: e?.pressed || t?.pressed || !1,
      released: e?.released || t?.released || !1,
      held: (e?.held || 0) + (t?.held || 0)
    };
  }
  mergeAnalogState(e, t) {
    return {
      value: (e?.value || 0) + (t?.value || 0),
      held: (e?.held || 0) + (t?.held || 0)
    };
  }
  mergeInputs(e, t) {
    return {
      buttons: {
        A: this.mergeButtonState(e.buttons?.A, t.buttons?.A),
        B: this.mergeButtonState(e.buttons?.B, t.buttons?.B),
        X: this.mergeButtonState(e.buttons?.X, t.buttons?.X),
        Y: this.mergeButtonState(e.buttons?.Y, t.buttons?.Y),
        Start: this.mergeButtonState(e.buttons?.Start, t.buttons?.Start),
        Select: this.mergeButtonState(e.buttons?.Select, t.buttons?.Select),
        L: this.mergeButtonState(e.buttons?.L, t.buttons?.L),
        R: this.mergeButtonState(e.buttons?.R, t.buttons?.R)
      },
      directions: {
        Up: this.mergeButtonState(e.directions?.Up, t.directions?.Up),
        Down: this.mergeButtonState(e.directions?.Down, t.directions?.Down),
        Left: this.mergeButtonState(e.directions?.Left, t.directions?.Left),
        Right: this.mergeButtonState(e.directions?.Right, t.directions?.Right)
      },
      axes: {
        Horizontal: this.mergeAnalogState(e.axes?.Horizontal, t.axes?.Horizontal),
        Vertical: this.mergeAnalogState(e.axes?.Vertical, t.axes?.Vertical)
      },
      shoulders: {
        LTrigger: this.mergeButtonState(e.shoulders?.LTrigger, t.shoulders?.LTrigger),
        RTrigger: this.mergeButtonState(e.shoulders?.RTrigger, t.shoulders?.RTrigger)
      }
    };
  }
}
class E {
  _previousTime;
  _currentTime;
  _startTime;
  _delta;
  _elapsed;
  _timescale;
  _document;
  _pageVisibilityHandler;
  /**
   * Constructs a new timer.
   */
  constructor() {
    this._previousTime = 0, this._currentTime = 0, this._startTime = v(), this._delta = 0, this._elapsed = 0, this._timescale = 1, this._document = null, this._pageVisibilityHandler = null;
  }
  /**
   * Connect the timer to the given document.Calling this method is not mandatory to
   * use the timer but enables the usage of the Page Visibility API to avoid large time
   * delta values.
   *
   * @param {Document} document - The document.
   */
  connect(e) {
    this._document = e, e.hidden !== void 0 && (this._pageVisibilityHandler = P.bind(this), e.addEventListener("visibilitychange", this._pageVisibilityHandler, !1));
  }
  /**
   * Disconnects the timer from the DOM and also disables the usage of the Page Visibility API.
   */
  disconnect() {
    this._pageVisibilityHandler !== null && (this._document.removeEventListener("visibilitychange", this._pageVisibilityHandler), this._pageVisibilityHandler = null), this._document = null;
  }
  /**
   * Returns the time delta in seconds.
   *
   * @return {number} The time delta in second.
   */
  getDelta() {
    return this._delta / 1e3;
  }
  /**
   * Returns the elapsed time in seconds.
   *
   * @return {number} The elapsed time in second.
   */
  getElapsed() {
    return this._elapsed / 1e3;
  }
  /**
   * Returns the timescale.
   *
   * @return {number} The timescale.
   */
  getTimescale() {
    return this._timescale;
  }
  /**
   * Sets the given timescale which scale the time delta computation
   * in `update()`.
   *
   * @param {number} timescale - The timescale to set.
   * @return {Timer} A reference to this timer.
   */
  setTimescale(e) {
    return this._timescale = e, this;
  }
  /**
   * Resets the time computation for the current simulation step.
   *
   * @return {Timer} A reference to this timer.
   */
  reset() {
    return this._currentTime = v() - this._startTime, this;
  }
  /**
   * Can be used to free all internal resources. Usually called when
   * the timer instance isn't required anymore.
   */
  dispose() {
    this.disconnect();
  }
  /**
   * Updates the internal state of the timer. This method should be called
   * once per simulation step and before you perform queries against the timer
   * (e.g. via `getDelta()`).
   *
   * @param {number} timestamp - The current time in milliseconds. Can be obtained
   * from the `requestAnimationFrame` callback argument. If not provided, the current
   * time will be determined with `performance.now`.
   * @return {Timer} A reference to this timer.
   */
  update(e) {
    return this._pageVisibilityHandler !== null && this._document.hidden === !0 ? this._delta = 0 : (this._previousTime = this._currentTime, this._currentTime = (e !== void 0 ? e : v()) - this._startTime, this._delta = (this._currentTime - this._previousTime) * this._timescale, this._elapsed += this._delta), this;
  }
}
function v() {
  return performance.now();
}
function P() {
  this._document.hidden === !1 && this.reset();
}
class S {
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
  static FRAME_DURATION = 1e3 / S.FRAME_LIMIT;
  static MAX_DELTA_SECONDS = 1 / 30;
  constructor(e, t) {
    this.wrapperRef = t, this.inputManager = new D(e.input), this.timer = new E(), this.timer.connect(document), this.id = e.id, this.stages = e.stages || [], this.setGlobals(e), e.debug && (this.statsRef = new C(), this.statsRef.showPanel(0), this.statsRef.dom.style.position = "absolute", this.statsRef.dom.style.bottom = "0", this.statsRef.dom.style.right = "0", this.statsRef.dom.style.top = "auto", this.statsRef.dom.style.left = "auto", document.body.appendChild(this.statsRef.dom));
  }
  async loadStage(e) {
    this.unloadCurrentStage();
    const t = e.options[0];
    await e.load(this.id, t?.camera), this.stageMap.set(e.stageRef.uuid, e), this.currentStageId = e.stageRef.uuid, this.defaultCamera = e.stageRef.cameraRef;
  }
  unloadCurrentStage() {
    if (!this.currentStageId)
      return;
    const e = this.getStage(this.currentStageId);
    if (e) {
      if (e?.stageRef)
        try {
          e.stageRef.nodeDestroy({
            me: e.stageRef,
            globals: p.globals
          });
        } catch (t) {
          console.error("Failed to destroy previous stage", t);
        }
      this.stageMap.delete(this.currentStageId);
    }
  }
  setGlobals(e) {
    A(e.debug), this.initialGlobals = { ...e.globals };
    for (const t in this.initialGlobals) {
      const s = this.initialGlobals[t];
      s === void 0 && console.error(`global ${t} is undefined`), this.setGlobal(t, s);
    }
  }
  params() {
    const e = this.currentStage(), t = this.timer.getDelta(), s = this.inputManager.getInputs(t), a = e?.stageRef?.cameraRef || this.defaultCamera;
    return {
      delta: t,
      inputs: s,
      globals: p.globals,
      me: this,
      camera: a
    };
  }
  start() {
    const e = this.currentStage(), t = this.params();
    e.start({ ...t, me: e.stageRef }), this.customSetup && this.customSetup(t), this.loop(0);
  }
  loop(e) {
    if (this.statsRef && this.statsRef.begin(), !L()) {
      this.timer.update(e);
      const t = this.currentStage(), s = this.params(), a = Math.min(s.delta, S.MAX_DELTA_SECONDS), i = { ...s, delta: a };
      this.customUpdate && this.customUpdate(i), t && t.stageRef.nodeUpdate({ ...i, me: t.stageRef }), this.totalTime += i.delta, p.time = this.totalTime, this.previousTimeStamp = e;
    }
    this.statsRef && this.statsRef.end(), this.outOfLoop(), requestAnimationFrame(this.loop.bind(this));
  }
  outOfLoop() {
    const e = this.currentStage();
    e && e.stageRef.outOfLoop();
  }
  getStage(e) {
    return this.stageMap.get(e);
  }
  currentStage() {
    return this.getStage(this.currentStageId);
  }
  getGlobal(e) {
    return m(e);
  }
  setGlobal(e, t) {
    w(e, t);
  }
  onGlobalChange(e, t) {
    let s = m(e);
    I(p, () => {
      const a = m(e);
      a !== s && (s = a, t(a));
    });
  }
}
const B = {
  id: "zylem",
  globals: {},
  stages: [
    M()
  ]
};
function G(n) {
  let e = { ...B };
  const t = [], s = [], a = [];
  return Object.values(n).forEach((i) => {
    if (i instanceof f)
      s.push(i);
    else if (i instanceof T)
      a.push(i);
    else if (i instanceof _)
      a.push(i);
    else if (i.constructor.name === "Object" && typeof i == "object") {
      const o = Object.assign(B, { ...i });
      t.push(o);
    }
  }), t.forEach((i) => {
    e = Object.assign(e, { ...i });
  }), s.forEach((i) => {
    i.addEntities(a);
  }), s.length ? e.stages = s : e.stages[0].addEntities(a), e;
}
class V {
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
    const e = G(this.options), t = new S(e, this);
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
    b(!0);
  }
  async resume() {
    b(!1), this.gameRef && (this.gameRef.previousTimeStamp = 0, this.gameRef.timer.reset());
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
        if (t instanceof f) {
          this.gameRef ? (this.gameRef.stages.push(t), this.gameRef.stageMap.set(t.stageRef.uuid, t)) : this.options.push(t);
          continue;
        }
        if (typeof t == "function") {
          try {
            const s = t();
            s instanceof f ? this.gameRef ? (this.gameRef.stages.push(s), this.gameRef.stageMap.set(s.stageRef.uuid, s)) : this.options.push(s) : s && typeof s.then == "function" && s.then((a) => {
              a instanceof f && (this.gameRef ? (this.gameRef.stages.push(a), this.gameRef.stageMap.set(a.stageRef.uuid, a)) : this.options.push(a));
            }).catch((a) => console.error("Failed to add async stage", a));
          } catch (s) {
            console.error("Error executing stage factory", s);
          }
          continue;
        }
        t && typeof t.then == "function" && t.then((s) => {
          s instanceof f && (this.gameRef ? (this.gameRef.stages.push(s), this.gameRef.stageMap.set(s.stageRef.uuid, s)) : this.options.push(s));
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
    w(e, t);
  }
  onGlobalChange(e, t) {
    if (this.gameRef) {
      this.gameRef.onGlobalChange(e, t);
      return;
    }
    this.pendingGlobalChangeHandlers.push({ key: e, callback: t });
  }
}
function F(...n) {
  return new V(n);
}
const x = Symbol("vessel");
class k extends _ {
  static type = x;
  _setup(e) {
  }
  _update(e) {
  }
  _destroy(e) {
  }
  create() {
    return this;
  }
}
function X(...n) {
  const e = new k();
  return n.forEach((t) => e.add(t)), e;
}
function z(n, e) {
  let t;
  return (s) => {
    const a = s.globals?.[n];
    t !== a && (t === void 0 && a === void 0 || e(a, s), t = a);
  };
}
function K(n, e) {
  let t = new Array(n.length).fill(void 0);
  return (s) => {
    const a = n.map((o) => s.globals?.[o]);
    if (a.some((o, r) => t[r] !== o)) {
      const o = t.every((l) => l === void 0), r = a.every((l) => l === void 0);
      o && r || e(a, s), t = a;
    }
  };
}
function Y(n, e) {
  let t;
  return (s) => {
    const a = s.stage?.getVariable?.(n) ?? void 0;
    t !== a && (t === void 0 && a === void 0 || e(a, s), t = a);
  };
}
function j(n, e) {
  let t = new Array(n.length).fill(void 0);
  return (s) => {
    const a = (r) => s.stage?.getVariable?.(r), i = n.map(a);
    if (i.some((r, l) => t[l] !== r)) {
      const r = t.every((d) => d === void 0), l = i.every((d) => d === void 0);
      r && l || e(i, s), t = i;
    }
  };
}
export {
  z as a,
  K as b,
  Y as c,
  j as d,
  F as g,
  X as v
};
