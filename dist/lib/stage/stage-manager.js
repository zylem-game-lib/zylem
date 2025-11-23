import { proxy as i } from "valtio/vanilla";
import { set as n, get as o } from "../../node_modules/.pnpm/idb-keyval@6.2.2/node_modules/idb-keyval/dist/index.js";
import { pack as s } from "../../node_modules/.pnpm/msgpackr@1.11.5/node_modules/msgpackr/pack.js";
import { unpack as c } from "../../node_modules/.pnpm/msgpackr@1.11.5/node_modules/msgpackr/unpack.js";
const t = i({
  previous: null,
  current: null,
  next: null,
  isLoading: !1
}), p = {
  staticRegistry: /* @__PURE__ */ new Map(),
  registerStaticStage(r, a) {
    this.staticRegistry.set(r, a);
  },
  async loadStageData(r) {
    try {
      const a = await o(r);
      if (a)
        return c(a);
    } catch (a) {
      console.warn(`Failed to load stage ${r} from storage`, a);
    }
    if (this.staticRegistry.has(r))
      return this.staticRegistry.get(r);
    throw new Error(`Stage ${r} not found in storage and static loading not fully implemented.`);
  },
  async transitionForward(r, a) {
    if (!t.isLoading) {
      t.isLoading = !0;
      try {
        t.current && await n(t.current.id, s(t.current)), t.previous = t.current, t.current = t.next, t.current?.id !== r && (a ? t.current = await a(r) : t.current = await this.loadStageData(r)), t.next = null;
      } catch (e) {
        console.error("Failed to transition stage:", e);
      } finally {
        t.isLoading = !1;
      }
    }
  },
  /**
   * Manually set the next stage to pre-load it.
   */
  async preloadNext(r, a) {
    a ? t.next = await a(r) : t.next = await this.loadStageData(r);
  }
};
export {
  p as StageManager,
  t as stageState
};
