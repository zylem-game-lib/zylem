import { proxy as i } from "valtio/vanilla";
import { stage as e } from "../stage/stage.js";
const a = () => ({
  id: "zylem",
  globals: {},
  stages: [e()],
  debug: !1,
  time: 0,
  input: void 0
}), t = i({ ...a() });
function g() {
  return {
    id: t.id ?? "zylem",
    globals: t.globals ?? {},
    stages: t.stages ?? [e()],
    debug: t.debug,
    time: t.time,
    input: t.input
  };
}
export {
  t as gameDefaultsState,
  g as getGameDefaultConfig
};
