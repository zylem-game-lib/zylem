class h {
  gamepadIndex;
  connected = !1;
  buttonStates = {};
  constructor(t) {
    this.gamepadIndex = t, window.addEventListener("gamepadconnected", (e) => {
      e.gamepad.index === this.gamepadIndex && (this.connected = !0);
    }), window.addEventListener("gamepaddisconnected", (e) => {
      e.gamepad.index === this.gamepadIndex && (this.connected = !1);
    });
  }
  handleButtonState(t, e, a) {
    const s = e.buttons[t].pressed;
    let n = this.buttonStates[t];
    return n || (n = { pressed: !1, released: !1, held: 0 }, this.buttonStates[t] = n), s ? (n.held === 0 ? n.pressed = !0 : n.pressed = !1, n.held += a, n.released = !1) : (n.held > 0 ? (n.released = !0, n.held = 0) : n.released = !1, n.pressed = !1), n;
  }
  handleAnalogState(t, e, a) {
    return { value: e.axes[t], held: a };
  }
  getInput(t) {
    const e = navigator.getGamepads()[this.gamepadIndex];
    return e ? {
      buttons: {
        A: this.handleButtonState(0, e, t),
        B: this.handleButtonState(1, e, t),
        X: this.handleButtonState(2, e, t),
        Y: this.handleButtonState(3, e, t),
        Start: this.handleButtonState(9, e, t),
        Select: this.handleButtonState(8, e, t),
        L: this.handleButtonState(4, e, t),
        R: this.handleButtonState(5, e, t)
      },
      directions: {
        Up: this.handleButtonState(12, e, t),
        Down: this.handleButtonState(13, e, t),
        Left: this.handleButtonState(14, e, t),
        Right: this.handleButtonState(15, e, t)
      },
      axes: {
        Horizontal: this.handleAnalogState(0, e, t),
        Vertical: this.handleAnalogState(1, e, t)
      },
      shoulders: {
        LTrigger: this.handleButtonState(6, e, t),
        RTrigger: this.handleButtonState(7, e, t)
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
export {
  h as GamepadProvider
};
