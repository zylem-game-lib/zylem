import { ZylemStage as o } from "./zylem-stage.js";
import { CameraWrapper as d } from "../camera/camera.js";
import { stageState as r, setStageVariable as n, getStageVariable as g } from "./stage-state.js";
import { getStageOptions as S } from "./stage-default.js";
class h {
  wrappedStage;
  options = [];
  // TODO: these shouldn't be here maybe more like nextFrame(stageInstance, () => {})
  update = () => {
  };
  setup = () => {
  };
  destroy = () => {
  };
  constructor(t) {
    this.options = t, this.wrappedStage = null;
  }
  async load(t, e) {
    r.entities = [], this.wrappedStage = new o(this.options), this.wrappedStage.wrapperRef = this;
    const a = e instanceof d ? e.cameraRef : e;
    await this.wrappedStage.load(t, a), this.wrappedStage.onEntityAdded((p) => {
      const s = this.wrappedStage.buildEntityState(p);
      r.entities = [...r.entities, s];
    }, { replayExisting: !0 });
  }
  async addEntities(t) {
    this.options.push(...t), this.wrappedStage && this.wrappedStage.enqueue(...t);
  }
  add(...t) {
    this.addToBlueprints(...t), this.addToStage(...t);
  }
  addToBlueprints(...t) {
    this.wrappedStage || this.options.push(...t);
  }
  addToStage(...t) {
    this.wrappedStage && this.wrappedStage.enqueue(...t);
  }
  start(t) {
    this.wrappedStage?.nodeSetup(t);
  }
  onUpdate(...t) {
    this.wrappedStage && (this.wrappedStage.update = (e) => {
      const a = { ...e, stage: this };
      t.forEach((p) => p(a));
    });
  }
  onSetup(t) {
    this.wrappedStage.setup = t;
  }
  onDestroy(t) {
    this.wrappedStage.destroy = t;
  }
  setVariable(t, e) {
    n(t, e);
  }
  getVariable(t) {
    return g(t);
  }
}
function c(...i) {
  const t = S(i);
  return new h([...t]);
}
export {
  h as Stage,
  c as createStage
};
