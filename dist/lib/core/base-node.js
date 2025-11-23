import { nanoid as o } from "nanoid";
class s {
  parent = null;
  children = [];
  options;
  eid = 0;
  uuid = "";
  name = "";
  markedForRemoval = !1;
  setup = () => {
  };
  loaded = () => {
  };
  update = () => {
  };
  destroy = () => {
  };
  cleanup = () => {
  };
  constructor(t = []) {
    const e = t.filter((i) => !(i instanceof s)).reduce((i, n) => ({ ...i, ...n }), {});
    this.options = e, this.uuid = o();
  }
  setParent(t) {
    this.parent = t;
  }
  getParent() {
    return this.parent;
  }
  add(t) {
    this.children.push(t), t.setParent(this);
  }
  remove(t) {
    const e = this.children.indexOf(t);
    e !== -1 && (this.children.splice(e, 1), t.setParent(null));
  }
  getChildren() {
    return this.children;
  }
  isComposite() {
    return this.children.length > 0;
  }
  nodeSetup(t) {
    this.markedForRemoval = !1, typeof this._setup == "function" && this._setup(t), this.setup && this.setup(t), this.children.forEach((e) => e.nodeSetup(t));
  }
  nodeUpdate(t) {
    this.markedForRemoval || (typeof this._update == "function" && this._update(t), this.update && this.update(t), this.children.forEach((e) => e.nodeUpdate(t)));
  }
  nodeDestroy(t) {
    this.children.forEach((e) => e.nodeDestroy(t)), this.destroy && this.destroy(t), typeof this._destroy == "function" && this._destroy(t), this.markedForRemoval = !0;
  }
  getOptions() {
    return this.options;
  }
  setOptions(t) {
    this.options = { ...this.options, ...t };
  }
}
export {
  s as BaseNode
};
