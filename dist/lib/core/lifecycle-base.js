class e {
  update = () => {
  };
  setup = () => {
  };
  destroy = () => {
  };
  nodeSetup(t) {
    typeof this._setup == "function" && this._setup(t), this.setup && this.setup(t);
  }
  nodeUpdate(t) {
    typeof this._update == "function" && this._update(t), this.update && this.update(t);
  }
  nodeDestroy(t) {
    this.destroy && this.destroy(t), typeof this._destroy == "function" && this._destroy(t);
  }
}
export {
  e as LifeCycleBase
};
