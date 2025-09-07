class p {
  keyStates = /* @__PURE__ */ new Map();
  keyButtonStates = /* @__PURE__ */ new Map();
  mapping = null;
  includeDefaultBase = !0;
  constructor(t, s) {
    this.mapping = t ?? null, this.includeDefaultBase = s?.includeDefaultBase ?? !0, window.addEventListener("keydown", ({ key: e }) => this.keyStates.set(e, !0)), window.addEventListener("keyup", ({ key: e }) => this.keyStates.set(e, !1));
  }
  isKeyPressed(t) {
    return this.keyStates.get(t) || !1;
  }
  handleButtonState(t, s) {
    let e = this.keyButtonStates.get(t);
    const o = this.isKeyPressed(t);
    return e || (e = { pressed: !1, released: !1, held: 0 }, this.keyButtonStates.set(t, e)), o ? (e.held === 0 ? e.pressed = !0 : e.pressed = !1, e.held += s, e.released = !1) : (e.held > 0 ? (e.released = !0, e.held = 0) : e.released = !1, e.pressed = !1), e;
  }
  handleAnalogState(t, s, e) {
    return { value: this.getAxisValue(t, s), held: e };
  }
  mergeButtonState(t, s) {
    return {
      pressed: t?.pressed || s?.pressed || !1,
      released: t?.released || s?.released || !1,
      held: (t?.held || 0) + (s?.held || 0)
    };
  }
  applyCustomMapping(t, s) {
    if (!this.mapping)
      return t;
    for (const [e, o] of Object.entries(this.mapping)) {
      if (!o || o.length === 0)
        continue;
      const a = this.handleButtonState(e, s);
      for (const c of o) {
        const [u, l] = (c || "").split(".");
        if (!u || !l)
          continue;
        const i = u.toLowerCase(), h = l.toLowerCase();
        if (i === "buttons") {
          const n = {
            a: "A",
            b: "B",
            x: "X",
            y: "Y",
            start: "Start",
            select: "Select",
            l: "L",
            r: "R"
          }[h];
          if (!n)
            continue;
          const r = t.buttons || {};
          r[n] = this.mergeButtonState(r[n], a), t.buttons = r;
          continue;
        }
        if (i === "directions") {
          const n = {
            up: "Up",
            down: "Down",
            left: "Left",
            right: "Right"
          }[h];
          if (!n)
            continue;
          const r = t.directions || {};
          r[n] = this.mergeButtonState(r[n], a), t.directions = r;
          continue;
        }
        if (i === "shoulders") {
          const n = {
            ltrigger: "LTrigger",
            rtrigger: "RTrigger"
          }[h];
          if (!n)
            continue;
          const r = t.shoulders || {};
          r[n] = this.mergeButtonState(r[n], a), t.shoulders = r;
          continue;
        }
      }
    }
    return t;
  }
  getInput(t) {
    const s = {};
    return this.includeDefaultBase && (s.buttons = {
      A: this.handleButtonState("z", t),
      B: this.handleButtonState("x", t),
      X: this.handleButtonState("a", t),
      Y: this.handleButtonState("s", t),
      Start: this.handleButtonState(" ", t),
      Select: this.handleButtonState("Enter", t),
      L: this.handleButtonState("q", t),
      R: this.handleButtonState("e", t)
    }, s.directions = {
      Up: this.handleButtonState("ArrowUp", t),
      Down: this.handleButtonState("ArrowDown", t),
      Left: this.handleButtonState("ArrowLeft", t),
      Right: this.handleButtonState("ArrowRight", t)
    }, s.axes = {
      Horizontal: this.handleAnalogState("ArrowLeft", "ArrowRight", t),
      Vertical: this.handleAnalogState("ArrowUp", "ArrowDown", t)
    }, s.shoulders = {
      LTrigger: this.handleButtonState("Q", t),
      RTrigger: this.handleButtonState("E", t)
    }), this.applyCustomMapping(s, t);
  }
  getName() {
    return "keyboard";
  }
  getAxisValue(t, s) {
    return (this.isKeyPressed(s) ? 1 : 0) - (this.isKeyPressed(t) ? 1 : 0);
  }
  isConnected() {
    return !0;
  }
}
export {
  p as KeyboardProvider
};
