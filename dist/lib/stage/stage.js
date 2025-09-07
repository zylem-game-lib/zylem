import { ZylemStage as n } from "./zylem-stage.js";
import { CameraWrapper as r } from "../camera/camera.js";
import { stageState as i, setStageVariable as g, getStageVariable as p } from "./stage-state.js";
class f {
  stageRef;
  options = [];
  update = () => {
  };
  setup = () => {
  };
  destroy = () => {
  };
  constructor(t) {
    this.options = t, this.stageRef = new n(this.options);
  }
  async load(t, e) {
    this.stageRef.wrapperRef = this;
    const s = e instanceof r ? e.cameraRef : e;
    await this.stageRef.load(t, s);
  }
  async addEntities(t) {
    this.options.push(...t), this.stageRef.enqueue(...t);
  }
  add(...t) {
    this.stageRef.enqueue(...t);
  }
  start(t) {
    this.stageRef?.nodeSetup(t), this.stageRef.onEntityAdded((e) => {
      const s = this.stageRef.buildEntityState(e);
      i.entities = [...i.entities, s];
    }, { replayExisting: !0 });
  }
  onUpdate(...t) {
    this.stageRef.update = (e) => {
      const s = { ...e, stage: this };
      t.forEach((o) => o(s));
    };
  }
  onSetup(t) {
    this.stageRef.setup = t;
  }
  onDestroy(t) {
    this.stageRef.destroy = t;
  }
  setVariable(t, e) {
    g(t, e);
  }
  getVariable(t) {
    return p(t);
  }
}
function R(...a) {
  return new f(a);
}
export {
  f as Stage,
  R as stage
};
