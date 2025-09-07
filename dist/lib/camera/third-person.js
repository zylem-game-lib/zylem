import { Vector3 as a } from "three";
class c {
  distance;
  screenResolution = null;
  renderer = null;
  scene = null;
  cameraRef = null;
  constructor() {
    this.distance = new a(0, 5, 8);
  }
  /**
   * Setup the third person camera controller
   */
  setup(e) {
    const { screenResolution: t, renderer: s, scene: r, camera: i } = e;
    this.screenResolution = t, this.renderer = s, this.scene = r, this.cameraRef = i;
  }
  /**
   * Update the third person camera
   */
  update(e) {
    if (!this.cameraRef.target)
      return;
    const t = this.cameraRef.target.group.position.clone().add(this.distance);
    this.cameraRef.camera.position.lerp(t, 0.1), this.cameraRef.camera.lookAt(this.cameraRef.target.group.position);
  }
  /**
   * Handle resize events
   */
  resize(e, t) {
    this.screenResolution && this.screenResolution.set(e, t);
  }
  /**
   * Set the distance from the target
   */
  setDistance(e) {
    this.distance = e;
  }
}
export {
  c as ThirdPersonCamera
};
