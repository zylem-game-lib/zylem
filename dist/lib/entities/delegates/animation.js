import { AnimationMixer as u, LoopOnce as c, LoopRepeat as h } from "three";
import { EntityAssetLoader as _ } from "../../core/entity-asset-loader.js";
class d {
  target;
  _mixer = null;
  _actions = {};
  _animations = [];
  _currentAction = null;
  _pauseAtPercentage = 0;
  _isPaused = !1;
  _queuedKey = null;
  _fadeDuration = 0.5;
  _currentKey = "";
  _assetLoader = new _();
  constructor(e) {
    this.target = e;
  }
  async loadAnimations(e) {
    if (!e.length)
      return;
    const i = await Promise.all(e.map((t) => this._assetLoader.loadFile(t.path)));
    this._animations = i.filter((t) => !!t.animation).map((t) => t.animation), this._animations.length && (this._mixer = new u(this.target), this._animations.forEach((t, n) => {
      const a = e[n].key || n.toString();
      this._actions[a] = this._mixer.clipAction(t);
    }), this.playAnimation({ key: Object.keys(this._actions)[0] }));
  }
  update(e) {
    if (!this._mixer || !this._currentAction)
      return;
    this._mixer.update(e);
    const i = this._currentAction.getClip().duration * (this._pauseAtPercentage / 100);
    if (!this._isPaused && this._pauseAtPercentage > 0 && this._currentAction.time >= i && (this._currentAction.time = i, this._currentAction.paused = !0, this._isPaused = !0, this._queuedKey !== null)) {
      const t = this._actions[this._queuedKey];
      t.reset().play(), this._currentAction.crossFadeTo(t, this._fadeDuration, !1), this._currentAction = t, this._currentKey = this._queuedKey, this._queuedKey = null;
    }
  }
  playAnimation(e) {
    if (!this._mixer)
      return;
    const { key: i, pauseAtPercentage: t = 0, pauseAtEnd: n = !1, fadeToKey: a, fadeDuration: o = 0.5 } = e;
    if (i === this._currentKey)
      return;
    this._queuedKey = a || null, this._fadeDuration = o, this._pauseAtPercentage = n ? 100 : t, this._isPaused = !1;
    const r = this._currentAction;
    r && r.stop();
    const s = this._actions[i];
    s && (this._pauseAtPercentage > 0 ? (s.setLoop(c, 1 / 0), s.clampWhenFinished = !0) : (s.setLoop(h, 1 / 0), s.clampWhenFinished = !1), r && r.crossFadeTo(s, o, !1), s.reset().play(), this._currentAction = s, this._currentKey = i);
  }
  get currentAnimationKey() {
    return this._currentKey;
  }
  get animations() {
    return this._animations;
  }
}
export {
  d as AnimationDelegate
};
