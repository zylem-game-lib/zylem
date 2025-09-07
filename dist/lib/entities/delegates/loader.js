function n(e) {
  return typeof e?.load == "function" && typeof e?.data == "function";
}
class a {
  entityReference;
  constructor(t) {
    this.entityReference = t;
  }
  async load() {
    this.entityReference.load && await this.entityReference.load();
  }
  async data() {
    return this.entityReference.data ? this.entityReference.data() : null;
  }
}
export {
  a as EntityLoader,
  n as isLoadable
};
