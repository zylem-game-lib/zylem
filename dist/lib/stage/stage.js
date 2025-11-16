import { ZylemStage as i } from "./zylem-stage.js";
import { CameraWrapper as o } from "../camera/camera.js";
import { stageState as r, setStageVariable as n, getStageVariable as d } from "./stage-state.js";
import { getStageOptions as g } from "./stage-default.js";
class S {
  wrappedStage;
  options = [];
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
    this.wrappedStage = new i(this.options), this.wrappedStage.wrapperRef = this;
    const a = e instanceof o ? e.cameraRef : e;
    await this.wrappedStage.load(t, a);
  }
  async addEntities(t) {
    this.options.push(...t), this.wrappedStage && this.wrappedStage.enqueue(...t);
  }
  add(...t) {
    this.wrappedStage.enqueue(...t);
  }
  start(t) {
    this.wrappedStage?.nodeSetup(t), this.wrappedStage.onEntityAdded((e) => {
      const a = this.wrappedStage.buildEntityState(e);
      r.entities = [...r.entities, a];
    }, { replayExisting: !0 });
  }
  onUpdate(...t) {
    this.wrappedStage && (this.wrappedStage.update = (e) => {
      const a = { ...e, stage: this };
      t.forEach((s) => s(a));
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
    return d(t);
  }
}
function c(...p) {
  const t = g(p);
  return new S([...t]);
}
export {
  S as Stage,
  c as stage
};
