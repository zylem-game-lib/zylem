class c {
  screenResolution = null;
  renderer = null;
  scene = null;
  cameraRef = null;
  constructor() {
  }
  /**
   * Setup the fixed 2D camera controller
   */
  setup(e) {
    const { screenResolution: s, renderer: r, scene: t, camera: n } = e;
    this.screenResolution = s, this.renderer = r, this.scene = t, this.cameraRef = n, this.cameraRef.camera.position.set(0, 0, 10), this.cameraRef.camera.lookAt(0, 0, 0);
  }
  /**
   * Update the fixed 2D camera
   * Fixed cameras don't need to update position/rotation automatically
   */
  update(e) {
  }
  /**
   * Handle resize events for 2D camera
   */
  resize(e, s) {
    this.screenResolution && this.screenResolution.set(e, s);
  }
}
export {
  c as Fixed2DCamera
};
