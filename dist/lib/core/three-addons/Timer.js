class n {
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
    this._previousTime = 0, this._currentTime = 0, this._startTime = e(), this._delta = 0, this._elapsed = 0, this._timescale = 1, this._document = null, this._pageVisibilityHandler = null;
  }
  /**
   * Connect the timer to the given document.Calling this method is not mandatory to
   * use the timer but enables the usage of the Page Visibility API to avoid large time
   * delta values.
   *
   * @param {Document} document - The document.
   */
  connect(i) {
    this._document = i, i.hidden !== void 0 && (this._pageVisibilityHandler = t.bind(this), i.addEventListener("visibilitychange", this._pageVisibilityHandler, !1));
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
  setTimescale(i) {
    return this._timescale = i, this;
  }
  /**
   * Resets the time computation for the current simulation step.
   *
   * @return {Timer} A reference to this timer.
   */
  reset() {
    return this._currentTime = e() - this._startTime, this;
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
  update(i) {
    return this._pageVisibilityHandler !== null && this._document.hidden === !0 ? this._delta = 0 : (this._previousTime = this._currentTime, this._currentTime = (i !== void 0 ? i : e()) - this._startTime, this._delta = (this._currentTime - this._previousTime) * this._timescale, this._elapsed += this._delta), this;
  }
}
function e() {
  return performance.now();
}
function t() {
  this._document.hidden === !1 && this.reset();
}
export {
  n as Timer
};
