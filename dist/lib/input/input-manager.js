import { KeyboardProvider as s } from "./keyboard-provider.js";
import { GamepadProvider as r } from "./gamepad-provider.js";
class B {
  inputMap = /* @__PURE__ */ new Map();
  currentInputs = {};
  previousInputs = {};
  constructor(t) {
    t?.p1?.key ? this.addInputProvider(1, new s(t.p1.key, { includeDefaultBase: !1 })) : this.addInputProvider(1, new s()), this.addInputProvider(1, new r(0)), t?.p2?.key && this.addInputProvider(2, new s(t.p2.key, { includeDefaultBase: !1 })), this.addInputProvider(2, new r(1)), t?.p3?.key && this.addInputProvider(3, new s(t.p3.key, { includeDefaultBase: !1 })), this.addInputProvider(3, new r(2)), t?.p4?.key && this.addInputProvider(4, new s(t.p4.key, { includeDefaultBase: !1 })), this.addInputProvider(4, new r(3)), t?.p5?.key && this.addInputProvider(5, new s(t.p5.key, { includeDefaultBase: !1 })), this.addInputProvider(5, new r(4)), t?.p6?.key && this.addInputProvider(6, new s(t.p6.key, { includeDefaultBase: !1 })), this.addInputProvider(6, new r(5)), t?.p7?.key && this.addInputProvider(7, new s(t.p7.key, { includeDefaultBase: !1 })), this.addInputProvider(7, new r(6)), t?.p8?.key && this.addInputProvider(8, new s(t.p8.key, { includeDefaultBase: !1 })), this.addInputProvider(8, new r(7));
  }
  addInputProvider(t, e) {
    this.inputMap.has(t) || this.inputMap.set(t, []), this.inputMap.get(t)?.push(e);
  }
  getInputs(t) {
    const e = {};
    return this.inputMap.forEach((i, n) => {
      const u = `p${n}`, d = i.reduce((a, o) => {
        const p = o.getInput(t);
        return this.mergeInputs(a, p);
      }, {});
      e[u] = {
        playerNumber: n,
        ...d
      };
    }), e;
  }
  mergeButtonState(t, e) {
    return {
      pressed: t?.pressed || e?.pressed || !1,
      released: t?.released || e?.released || !1,
      held: (t?.held || 0) + (e?.held || 0)
    };
  }
  mergeAnalogState(t, e) {
    return {
      value: (t?.value || 0) + (e?.value || 0),
      held: (t?.held || 0) + (e?.held || 0)
    };
  }
  mergeInputs(t, e) {
    return {
      buttons: {
        A: this.mergeButtonState(t.buttons?.A, e.buttons?.A),
        B: this.mergeButtonState(t.buttons?.B, e.buttons?.B),
        X: this.mergeButtonState(t.buttons?.X, e.buttons?.X),
        Y: this.mergeButtonState(t.buttons?.Y, e.buttons?.Y),
        Start: this.mergeButtonState(t.buttons?.Start, e.buttons?.Start),
        Select: this.mergeButtonState(t.buttons?.Select, e.buttons?.Select),
        L: this.mergeButtonState(t.buttons?.L, e.buttons?.L),
        R: this.mergeButtonState(t.buttons?.R, e.buttons?.R)
      },
      directions: {
        Up: this.mergeButtonState(t.directions?.Up, e.directions?.Up),
        Down: this.mergeButtonState(t.directions?.Down, e.directions?.Down),
        Left: this.mergeButtonState(t.directions?.Left, e.directions?.Left),
        Right: this.mergeButtonState(t.directions?.Right, e.directions?.Right)
      },
      axes: {
        Horizontal: this.mergeAnalogState(t.axes?.Horizontal, e.axes?.Horizontal),
        Vertical: this.mergeAnalogState(t.axes?.Vertical, e.axes?.Vertical)
      },
      shoulders: {
        LTrigger: this.mergeButtonState(t.shoulders?.LTrigger, e.shoulders?.LTrigger),
        RTrigger: this.mergeButtonState(t.shoulders?.RTrigger, e.shoulders?.RTrigger)
      }
    };
  }
}
export {
  B as InputManager
};
