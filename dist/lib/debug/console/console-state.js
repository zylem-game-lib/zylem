import { proxy as s } from "valtio/vanilla";
const o = s({
  messages: []
}), n = (t) => {
  const e = `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] ${t}`;
  o.messages.push(e);
};
export {
  o as consoleState,
  n as printToConsole
};
