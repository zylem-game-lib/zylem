import { Vector2 as c, Vector3 as a } from "three";
import { ZylemCamera as m } from "./zylem-camera.js";
class o {
  cameraRef;
  constructor(r) {
    this.cameraRef = r;
  }
}
function w(e) {
  const r = e.screenResolution || new c(window.innerWidth, window.innerHeight);
  let n = 10;
  e.perspective === "fixed-2d" && (n = e.zoom || 10);
  const t = new m(e.perspective || "third-person", r, n);
  return t.move(e.position || new a(0, 0, 0)), t.camera.lookAt(e.target || new a(0, 0, 0)), new o(t);
}
export {
  o as CameraWrapper,
  w as camera
};
