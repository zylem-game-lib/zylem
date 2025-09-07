import * as y from "three";
import { Controls as z, Vector3 as u, MOUSE as _, TOUCH as f, Quaternion as S, Spherical as x, Vector2 as d, Ray as N, Plane as I, MathUtils as U, Mesh as F, OrthographicCamera as T, BufferGeometry as Y, Float32BufferAttribute as C, ShaderMaterial as M, UniformsUtils as Z, WebGLRenderTarget as w, HalfFloatType as K, NoBlending as H, Clock as B, WebGLRenderer as X, Object3D as W, PerspectiveCamera as P } from "three";
import { s as Q } from "./standard-DsmgGGer.js";
const v = { type: "change" }, R = { type: "start" }, k = { type: "end" }, g = new N(), O = new I(), V = Math.cos(70 * U.DEG2RAD), h = new u(), c = 2 * Math.PI, r = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6
}, E = 1e-6;
class G extends z {
  /**
   * Constructs a new controls instance.
   *
   * @param {Object3D} object - The object that is managed by the controls.
   * @param {?HTMLDOMElement} domElement - The HTML element used for event listeners.
   */
  constructor(t, e = null) {
    super(t, e), this.state = r.NONE, this.target = new u(), this.cursor = new u(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.keyRotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: _.ROTATE, MIDDLE: _.DOLLY, RIGHT: _.PAN }, this.touches = { ONE: f.ROTATE, TWO: f.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._domElementKeyEvents = null, this._lastPosition = new u(), this._lastQuaternion = new S(), this._lastTargetPosition = new u(), this._quat = new S().setFromUnitVectors(t.up, new u(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new x(), this._sphericalDelta = new x(), this._scale = 1, this._panOffset = new u(), this._rotateStart = new d(), this._rotateEnd = new d(), this._rotateDelta = new d(), this._panStart = new d(), this._panEnd = new d(), this._panDelta = new d(), this._dollyStart = new d(), this._dollyEnd = new d(), this._dollyDelta = new d(), this._dollyDirection = new u(), this._mouse = new d(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = $.bind(this), this._onPointerDown = q.bind(this), this._onPointerUp = J.bind(this), this._onContextMenu = rt.bind(this), this._onMouseWheel = st.bind(this), this._onKeyDown = it.bind(this), this._onTouchStart = ot.bind(this), this._onTouchMove = at.bind(this), this._onMouseDown = tt.bind(this), this._onMouseMove = et.bind(this), this._interceptControlDown = nt.bind(this), this._interceptControlUp = ht.bind(this), this.domElement !== null && this.connect(this.domElement), this.update();
  }
  connect(t) {
    super.connect(t), this.domElement.addEventListener("pointerdown", this._onPointerDown), this.domElement.addEventListener("pointercancel", this._onPointerUp), this.domElement.addEventListener("contextmenu", this._onContextMenu), this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: !1 }), this.domElement.getRootNode().addEventListener("keydown", this._interceptControlDown, { passive: !0, capture: !0 }), this.domElement.style.touchAction = "none";
  }
  disconnect() {
    this.domElement.removeEventListener("pointerdown", this._onPointerDown), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.domElement.removeEventListener("pointercancel", this._onPointerUp), this.domElement.removeEventListener("wheel", this._onMouseWheel), this.domElement.removeEventListener("contextmenu", this._onContextMenu), this.stopListenToKeyEvents(), this.domElement.getRootNode().removeEventListener("keydown", this._interceptControlDown, { capture: !0 }), this.domElement.style.touchAction = "auto";
  }
  dispose() {
    this.disconnect();
  }
  /**
   * Get the current vertical rotation, in radians.
   *
   * @return {number} The current vertical rotation, in radians.
   */
  getPolarAngle() {
    return this._spherical.phi;
  }
  /**
   * Get the current horizontal rotation, in radians.
   *
   * @return {number} The current horizontal rotation, in radians.
   */
  getAzimuthalAngle() {
    return this._spherical.theta;
  }
  /**
   * Returns the distance from the camera to the target.
   *
   * @return {number} The distance from the camera to the target.
   */
  getDistance() {
    return this.object.position.distanceTo(this.target);
  }
  /**
   * Adds key event listeners to the given DOM element.
   * `window` is a recommended argument for using this method.
   *
   * @param {HTMLDOMElement} domElement - The DOM element
   */
  listenToKeyEvents(t) {
    t.addEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = t;
  }
  /**
   * Removes the key event listener previously defined with `listenToKeyEvents()`.
   */
  stopListenToKeyEvents() {
    this._domElementKeyEvents !== null && (this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = null);
  }
  /**
   * Save the current state of the controls. This can later be recovered with `reset()`.
   */
  saveState() {
    this.target0.copy(this.target), this.position0.copy(this.object.position), this.zoom0 = this.object.zoom;
  }
  /**
   * Reset the controls to their state from either the last time the `saveState()`
   * was called, or the initial state.
   */
  reset() {
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(v), this.update(), this.state = r.NONE;
  }
  update(t = null) {
    const e = this.object.position;
    h.copy(e).sub(this.target), h.applyQuaternion(this._quat), this._spherical.setFromVector3(h), this.autoRotate && this.state === r.NONE && this._rotateLeft(this._getAutoRotationAngle(t)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let i = this.minAzimuthAngle, o = this.maxAzimuthAngle;
    isFinite(i) && isFinite(o) && (i < -Math.PI ? i += c : i > Math.PI && (i -= c), o < -Math.PI ? o += c : o > Math.PI && (o -= c), i <= o ? this._spherical.theta = Math.max(i, Math.min(o, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (i + o) / 2 ? Math.max(i, this._spherical.theta) : Math.min(o, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
    let a = !1;
    if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera)
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    else {
      const n = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), a = n != this._spherical.radius;
    }
    if (h.setFromSpherical(this._spherical), h.applyQuaternion(this._quatInverse), e.copy(this.target).add(h), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
      let n = null;
      if (this.object.isPerspectiveCamera) {
        const l = h.length();
        n = this._clampDistance(l * this._scale);
        const m = l - n;
        this.object.position.addScaledVector(this._dollyDirection, m), this.object.updateMatrixWorld(), a = !!m;
      } else if (this.object.isOrthographicCamera) {
        const l = new u(this._mouse.x, this._mouse.y, 0);
        l.unproject(this.object);
        const m = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), a = m !== this.object.zoom;
        const D = new u(this._mouse.x, this._mouse.y, 0);
        D.unproject(this.object), this.object.position.sub(D).add(l), this.object.updateMatrixWorld(), n = h.length();
      } else
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      n !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(n).add(this.object.position) : (g.origin.copy(this.object.position), g.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(g.direction)) < V ? this.object.lookAt(this.target) : (O.setFromNormalAndCoplanarPoint(this.object.up, this.target), g.intersectPlane(O, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const n = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), n !== this.object.zoom && (this.object.updateProjectionMatrix(), a = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, a || this._lastPosition.distanceToSquared(this.object.position) > E || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > E || this._lastTargetPosition.distanceToSquared(this.target) > E ? (this.dispatchEvent(v), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
  }
  _getAutoRotationAngle(t) {
    return t !== null ? c / 60 * this.autoRotateSpeed * t : c / 60 / 60 * this.autoRotateSpeed;
  }
  _getZoomScale(t) {
    const e = Math.abs(t * 0.01);
    return Math.pow(0.95, this.zoomSpeed * e);
  }
  _rotateLeft(t) {
    this._sphericalDelta.theta -= t;
  }
  _rotateUp(t) {
    this._sphericalDelta.phi -= t;
  }
  _panLeft(t, e) {
    h.setFromMatrixColumn(e, 0), h.multiplyScalar(-t), this._panOffset.add(h);
  }
  _panUp(t, e) {
    this.screenSpacePanning === !0 ? h.setFromMatrixColumn(e, 1) : (h.setFromMatrixColumn(e, 0), h.crossVectors(this.object.up, h)), h.multiplyScalar(t), this._panOffset.add(h);
  }
  // deltaX and deltaY are in pixels; right and down are positive
  _pan(t, e) {
    const i = this.domElement;
    if (this.object.isPerspectiveCamera) {
      const o = this.object.position;
      h.copy(o).sub(this.target);
      let a = h.length();
      a *= Math.tan(this.object.fov / 2 * Math.PI / 180), this._panLeft(2 * t * a / i.clientHeight, this.object.matrix), this._panUp(2 * e * a / i.clientHeight, this.object.matrix);
    } else this.object.isOrthographicCamera ? (this._panLeft(t * (this.object.right - this.object.left) / this.object.zoom / i.clientWidth, this.object.matrix), this._panUp(e * (this.object.top - this.object.bottom) / this.object.zoom / i.clientHeight, this.object.matrix)) : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."), this.enablePan = !1);
  }
  _dollyOut(t) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale /= t : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  _dollyIn(t) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale *= t : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  _updateZoomParameters(t, e) {
    if (!this.zoomToCursor)
      return;
    this._performCursorZoom = !0;
    const i = this.domElement.getBoundingClientRect(), o = t - i.left, a = e - i.top, n = i.width, l = i.height;
    this._mouse.x = o / n * 2 - 1, this._mouse.y = -(a / l) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
  }
  _clampDistance(t) {
    return Math.max(this.minDistance, Math.min(this.maxDistance, t));
  }
  //
  // event callbacks - update the object state
  //
  _handleMouseDownRotate(t) {
    this._rotateStart.set(t.clientX, t.clientY);
  }
  _handleMouseDownDolly(t) {
    this._updateZoomParameters(t.clientX, t.clientX), this._dollyStart.set(t.clientX, t.clientY);
  }
  _handleMouseDownPan(t) {
    this._panStart.set(t.clientX, t.clientY);
  }
  _handleMouseMoveRotate(t) {
    this._rotateEnd.set(t.clientX, t.clientY), this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const e = this.domElement;
    this._rotateLeft(c * this._rotateDelta.x / e.clientHeight), this._rotateUp(c * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
  }
  _handleMouseMoveDolly(t) {
    this._dollyEnd.set(t.clientX, t.clientY), this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart), this._dollyDelta.y > 0 ? this._dollyOut(this._getZoomScale(this._dollyDelta.y)) : this._dollyDelta.y < 0 && this._dollyIn(this._getZoomScale(this._dollyDelta.y)), this._dollyStart.copy(this._dollyEnd), this.update();
  }
  _handleMouseMovePan(t) {
    this._panEnd.set(t.clientX, t.clientY), this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd), this.update();
  }
  _handleMouseWheel(t) {
    this._updateZoomParameters(t.clientX, t.clientY), t.deltaY < 0 ? this._dollyIn(this._getZoomScale(t.deltaY)) : t.deltaY > 0 && this._dollyOut(this._getZoomScale(t.deltaY)), this.update();
  }
  _handleKeyDown(t) {
    let e = !1;
    switch (t.code) {
      case this.keys.UP:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(c * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, this.keyPanSpeed), e = !0;
        break;
      case this.keys.BOTTOM:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateUp(-c * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(0, -this.keyPanSpeed), e = !0;
        break;
      case this.keys.LEFT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(c * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(this.keyPanSpeed, 0), e = !0;
        break;
      case this.keys.RIGHT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this.enableRotate && this._rotateLeft(-c * this.keyRotateSpeed / this.domElement.clientHeight) : this.enablePan && this._pan(-this.keyPanSpeed, 0), e = !0;
        break;
    }
    e && (t.preventDefault(), this.update());
  }
  _handleTouchStartRotate(t) {
    if (this._pointers.length === 1)
      this._rotateStart.set(t.pageX, t.pageY);
    else {
      const e = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + e.x), o = 0.5 * (t.pageY + e.y);
      this._rotateStart.set(i, o);
    }
  }
  _handleTouchStartPan(t) {
    if (this._pointers.length === 1)
      this._panStart.set(t.pageX, t.pageY);
    else {
      const e = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + e.x), o = 0.5 * (t.pageY + e.y);
      this._panStart.set(i, o);
    }
  }
  _handleTouchStartDolly(t) {
    const e = this._getSecondPointerPosition(t), i = t.pageX - e.x, o = t.pageY - e.y, a = Math.sqrt(i * i + o * o);
    this._dollyStart.set(0, a);
  }
  _handleTouchStartDollyPan(t) {
    this.enableZoom && this._handleTouchStartDolly(t), this.enablePan && this._handleTouchStartPan(t);
  }
  _handleTouchStartDollyRotate(t) {
    this.enableZoom && this._handleTouchStartDolly(t), this.enableRotate && this._handleTouchStartRotate(t);
  }
  _handleTouchMoveRotate(t) {
    if (this._pointers.length == 1)
      this._rotateEnd.set(t.pageX, t.pageY);
    else {
      const i = this._getSecondPointerPosition(t), o = 0.5 * (t.pageX + i.x), a = 0.5 * (t.pageY + i.y);
      this._rotateEnd.set(o, a);
    }
    this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const e = this.domElement;
    this._rotateLeft(c * this._rotateDelta.x / e.clientHeight), this._rotateUp(c * this._rotateDelta.y / e.clientHeight), this._rotateStart.copy(this._rotateEnd);
  }
  _handleTouchMovePan(t) {
    if (this._pointers.length === 1)
      this._panEnd.set(t.pageX, t.pageY);
    else {
      const e = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + e.x), o = 0.5 * (t.pageY + e.y);
      this._panEnd.set(i, o);
    }
    this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd);
  }
  _handleTouchMoveDolly(t) {
    const e = this._getSecondPointerPosition(t), i = t.pageX - e.x, o = t.pageY - e.y, a = Math.sqrt(i * i + o * o);
    this._dollyEnd.set(0, a), this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed)), this._dollyOut(this._dollyDelta.y), this._dollyStart.copy(this._dollyEnd);
    const n = (t.pageX + e.x) * 0.5, l = (t.pageY + e.y) * 0.5;
    this._updateZoomParameters(n, l);
  }
  _handleTouchMoveDollyPan(t) {
    this.enableZoom && this._handleTouchMoveDolly(t), this.enablePan && this._handleTouchMovePan(t);
  }
  _handleTouchMoveDollyRotate(t) {
    this.enableZoom && this._handleTouchMoveDolly(t), this.enableRotate && this._handleTouchMoveRotate(t);
  }
  // pointers
  _addPointer(t) {
    this._pointers.push(t.pointerId);
  }
  _removePointer(t) {
    delete this._pointerPositions[t.pointerId];
    for (let e = 0; e < this._pointers.length; e++)
      if (this._pointers[e] == t.pointerId) {
        this._pointers.splice(e, 1);
        return;
      }
  }
  _isTrackingPointer(t) {
    for (let e = 0; e < this._pointers.length; e++)
      if (this._pointers[e] == t.pointerId) return !0;
    return !1;
  }
  _trackPointer(t) {
    let e = this._pointerPositions[t.pointerId];
    e === void 0 && (e = new d(), this._pointerPositions[t.pointerId] = e), e.set(t.pageX, t.pageY);
  }
  _getSecondPointerPosition(t) {
    const e = t.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];
    return this._pointerPositions[e];
  }
  //
  _customWheelEvent(t) {
    const e = t.deltaMode, i = {
      clientX: t.clientX,
      clientY: t.clientY,
      deltaY: t.deltaY
    };
    switch (e) {
      case 1:
        i.deltaY *= 16;
        break;
      case 2:
        i.deltaY *= 100;
        break;
    }
    return t.ctrlKey && !this._controlActive && (i.deltaY *= 10), i;
  }
}
function q(s) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(s.pointerId), this.domElement.addEventListener("pointermove", this._onPointerMove), this.domElement.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(s) && (this._addPointer(s), s.pointerType === "touch" ? this._onTouchStart(s) : this._onMouseDown(s)));
}
function $(s) {
  this.enabled !== !1 && (s.pointerType === "touch" ? this._onTouchMove(s) : this._onMouseMove(s));
}
function J(s) {
  switch (this._removePointer(s), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(s.pointerId), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(k), this.state = r.NONE;
      break;
    case 1:
      const t = this._pointers[0], e = this._pointerPositions[t];
      this._onTouchStart({ pointerId: t, pageX: e.x, pageY: e.y });
      break;
  }
}
function tt(s) {
  let t;
  switch (s.button) {
    case 0:
      t = this.mouseButtons.LEFT;
      break;
    case 1:
      t = this.mouseButtons.MIDDLE;
      break;
    case 2:
      t = this.mouseButtons.RIGHT;
      break;
    default:
      t = -1;
  }
  switch (t) {
    case _.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseDownDolly(s), this.state = r.DOLLY;
      break;
    case _.ROTATE:
      if (s.ctrlKey || s.metaKey || s.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(s), this.state = r.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(s), this.state = r.ROTATE;
      }
      break;
    case _.PAN:
      if (s.ctrlKey || s.metaKey || s.shiftKey) {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(s), this.state = r.ROTATE;
      } else {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(s), this.state = r.PAN;
      }
      break;
    default:
      this.state = r.NONE;
  }
  this.state !== r.NONE && this.dispatchEvent(R);
}
function et(s) {
  switch (this.state) {
    case r.ROTATE:
      if (this.enableRotate === !1) return;
      this._handleMouseMoveRotate(s);
      break;
    case r.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseMoveDolly(s);
      break;
    case r.PAN:
      if (this.enablePan === !1) return;
      this._handleMouseMovePan(s);
      break;
  }
}
function st(s) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== r.NONE || (s.preventDefault(), this.dispatchEvent(R), this._handleMouseWheel(this._customWheelEvent(s)), this.dispatchEvent(k));
}
function it(s) {
  this.enabled !== !1 && this._handleKeyDown(s);
}
function ot(s) {
  switch (this._trackPointer(s), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case f.ROTATE:
          if (this.enableRotate === !1) return;
          this._handleTouchStartRotate(s), this.state = r.TOUCH_ROTATE;
          break;
        case f.PAN:
          if (this.enablePan === !1) return;
          this._handleTouchStartPan(s), this.state = r.TOUCH_PAN;
          break;
        default:
          this.state = r.NONE;
      }
      break;
    case 2:
      switch (this.touches.TWO) {
        case f.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(s), this.state = r.TOUCH_DOLLY_PAN;
          break;
        case f.DOLLY_ROTATE:
          if (this.enableZoom === !1 && this.enableRotate === !1) return;
          this._handleTouchStartDollyRotate(s), this.state = r.TOUCH_DOLLY_ROTATE;
          break;
        default:
          this.state = r.NONE;
      }
      break;
    default:
      this.state = r.NONE;
  }
  this.state !== r.NONE && this.dispatchEvent(R);
}
function at(s) {
  switch (this._trackPointer(s), this.state) {
    case r.TOUCH_ROTATE:
      if (this.enableRotate === !1) return;
      this._handleTouchMoveRotate(s), this.update();
      break;
    case r.TOUCH_PAN:
      if (this.enablePan === !1) return;
      this._handleTouchMovePan(s), this.update();
      break;
    case r.TOUCH_DOLLY_PAN:
      if (this.enableZoom === !1 && this.enablePan === !1) return;
      this._handleTouchMoveDollyPan(s), this.update();
      break;
    case r.TOUCH_DOLLY_ROTATE:
      if (this.enableZoom === !1 && this.enableRotate === !1) return;
      this._handleTouchMoveDollyRotate(s), this.update();
      break;
    default:
      this.state = r.NONE;
  }
}
function rt(s) {
  this.enabled !== !1 && s.preventDefault();
}
function nt(s) {
  s.key === "Control" && (this._controlActive = !0, this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function ht(s) {
  s.key === "Control" && (this._controlActive = !1, this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
const p = {
  FirstPerson: "first-person",
  ThirdPerson: "third-person",
  Isometric: "isometric",
  Flat2D: "flat-2d",
  Fixed2D: "fixed-2d"
};
class L {
  distance;
  screenResolution = null;
  renderer = null;
  scene = null;
  cameraRef = null;
  constructor() {
    this.distance = new u(0, 5, 8);
  }
  /**
   * Setup the third person camera controller
   */
  setup(t) {
    const { screenResolution: e, renderer: i, scene: o, camera: a } = t;
    this.screenResolution = e, this.renderer = i, this.scene = o, this.cameraRef = a;
  }
  /**
   * Update the third person camera
   */
  update(t) {
    if (!this.cameraRef.target)
      return;
    const e = this.cameraRef.target.group.position.clone().add(this.distance);
    this.cameraRef.camera.position.lerp(e, 0.1), this.cameraRef.camera.lookAt(this.cameraRef.target.group.position);
  }
  /**
   * Handle resize events
   */
  resize(t, e) {
    this.screenResolution && this.screenResolution.set(t, e);
  }
  /**
   * Set the distance from the target
   */
  setDistance(t) {
    this.distance = t;
  }
}
class lt {
  screenResolution = null;
  renderer = null;
  scene = null;
  cameraRef = null;
  constructor() {
  }
  /**
   * Setup the fixed 2D camera controller
   */
  setup(t) {
    const { screenResolution: e, renderer: i, scene: o, camera: a } = t;
    this.screenResolution = e, this.renderer = i, this.scene = o, this.cameraRef = a, this.cameraRef.camera.position.set(0, 0, 10), this.cameraRef.camera.lookAt(0, 0, 0);
  }
  /**
   * Update the fixed 2D camera
   * Fixed cameras don't need to update position/rotation automatically
   */
  update(t) {
  }
  /**
   * Handle resize events for 2D camera
   */
  resize(t, e) {
    this.screenResolution && this.screenResolution.set(t, e);
  }
}
const ct = {
  name: "CopyShader",
  uniforms: {
    tDiffuse: { value: null },
    opacity: { value: 1 }
  },
  vertexShader: (
    /* glsl */
    `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`
  ),
  fragmentShader: (
    /* glsl */
    `

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`
  )
};
class b {
  /**
   * Constructs a new pass.
   */
  constructor() {
    this.isPass = !0, this.enabled = !0, this.needsSwap = !0, this.clear = !1, this.renderToScreen = !1;
  }
  /**
   * Sets the size of the pass.
   *
   * @abstract
   * @param {number} width - The width to set.
   * @param {number} height - The height to set.
   */
  setSize() {
  }
  /**
   * This method holds the render logic of a pass. It must be implemented in all derived classes.
   *
   * @abstract
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} writeBuffer - The write buffer. This buffer is intended as the rendering
   * destination for the pass.
   * @param {WebGLRenderTarget} readBuffer - The read buffer. The pass can access the result from the
   * previous pass from this buffer.
   * @param {number} deltaTime - The delta time in seconds.
   * @param {boolean} maskActive - Whether masking is active or not.
   */
  render() {
    console.error("THREE.Pass: .render() must be implemented in derived pass.");
  }
  /**
   * Frees the GPU-related resources allocated by this instance. Call this
   * method whenever the pass is no longer used in your app.
   *
   * @abstract
   */
  dispose() {
  }
}
const dt = new T(-1, 1, 1, -1, 0, 1);
class ut extends Y {
  constructor() {
    super(), this.setAttribute("position", new C([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3)), this.setAttribute("uv", new C([0, 2, 0, 0, 2, 0], 2));
  }
}
const pt = new ut();
class j {
  /**
   * Constructs a new full screen quad.
   *
   * @param {?Material} material - The material to render te full screen quad with.
   */
  constructor(t) {
    this._mesh = new F(pt, t);
  }
  /**
   * Frees the GPU-related resources allocated by this instance. Call this
   * method whenever the instance is no longer used in your app.
   */
  dispose() {
    this._mesh.geometry.dispose();
  }
  /**
   * Renders the full screen quad.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   */
  render(t) {
    t.render(this._mesh, dt);
  }
  /**
   * The quad's material.
   *
   * @type {?Material}
   */
  get material() {
    return this._mesh.material;
  }
  set material(t) {
    this._mesh.material = t;
  }
}
class mt extends b {
  /**
   * Constructs a new shader pass.
   *
   * @param {Object|ShaderMaterial} [shader] - A shader object holding vertex and fragment shader as well as
   * defines and uniforms. It's also valid to pass a custom shader material.
   * @param {string} [textureID='tDiffuse'] - The name of the texture uniform that should sample
   * the read buffer.
   */
  constructor(t, e = "tDiffuse") {
    super(), this.textureID = e, this.uniforms = null, this.material = null, t instanceof M ? (this.uniforms = t.uniforms, this.material = t) : t && (this.uniforms = Z.clone(t.uniforms), this.material = new M({
      name: t.name !== void 0 ? t.name : "unspecified",
      defines: Object.assign({}, t.defines),
      uniforms: this.uniforms,
      vertexShader: t.vertexShader,
      fragmentShader: t.fragmentShader
    })), this._fsQuad = new j(this.material);
  }
  /**
   * Performs the shader pass.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} writeBuffer - The write buffer. This buffer is intended as the rendering
   * destination for the pass.
   * @param {WebGLRenderTarget} readBuffer - The read buffer. The pass can access the result from the
   * previous pass from this buffer.
   * @param {number} deltaTime - The delta time in seconds.
   * @param {boolean} maskActive - Whether masking is active or not.
   */
  render(t, e, i) {
    this.uniforms[this.textureID] && (this.uniforms[this.textureID].value = i.texture), this._fsQuad.material = this.material, this.renderToScreen ? (t.setRenderTarget(null), this._fsQuad.render(t)) : (t.setRenderTarget(e), this.clear && t.clear(t.autoClearColor, t.autoClearDepth, t.autoClearStencil), this._fsQuad.render(t));
  }
  /**
   * Frees the GPU-related resources allocated by this instance. Call this
   * method whenever the pass is no longer used in your app.
   */
  dispose() {
    this.material.dispose(), this._fsQuad.dispose();
  }
}
class A extends b {
  /**
   * Constructs a new mask pass.
   *
   * @param {Scene} scene - The 3D objects in this scene will define the mask.
   * @param {Camera} camera - The camera.
   */
  constructor(t, e) {
    super(), this.scene = t, this.camera = e, this.clear = !0, this.needsSwap = !1, this.inverse = !1;
  }
  /**
   * Performs a mask pass with the configured scene and camera.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} writeBuffer - The write buffer. This buffer is intended as the rendering
   * destination for the pass.
   * @param {WebGLRenderTarget} readBuffer - The read buffer. The pass can access the result from the
   * previous pass from this buffer.
   * @param {number} deltaTime - The delta time in seconds.
   * @param {boolean} maskActive - Whether masking is active or not.
   */
  render(t, e, i) {
    const o = t.getContext(), a = t.state;
    a.buffers.color.setMask(!1), a.buffers.depth.setMask(!1), a.buffers.color.setLocked(!0), a.buffers.depth.setLocked(!0);
    let n, l;
    this.inverse ? (n = 0, l = 1) : (n = 1, l = 0), a.buffers.stencil.setTest(!0), a.buffers.stencil.setOp(o.REPLACE, o.REPLACE, o.REPLACE), a.buffers.stencil.setFunc(o.ALWAYS, n, 4294967295), a.buffers.stencil.setClear(l), a.buffers.stencil.setLocked(!0), t.setRenderTarget(i), this.clear && t.clear(), t.render(this.scene, this.camera), t.setRenderTarget(e), this.clear && t.clear(), t.render(this.scene, this.camera), a.buffers.color.setLocked(!1), a.buffers.depth.setLocked(!1), a.buffers.color.setMask(!0), a.buffers.depth.setMask(!0), a.buffers.stencil.setLocked(!1), a.buffers.stencil.setFunc(o.EQUAL, 1, 4294967295), a.buffers.stencil.setOp(o.KEEP, o.KEEP, o.KEEP), a.buffers.stencil.setLocked(!0);
  }
}
class ft extends b {
  /**
   * Constructs a new clear mask pass.
   */
  constructor() {
    super(), this.needsSwap = !1;
  }
  /**
   * Performs the clear of the currently defined mask.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} writeBuffer - The write buffer. This buffer is intended as the rendering
   * destination for the pass.
   * @param {WebGLRenderTarget} readBuffer - The read buffer. The pass can access the result from the
   * previous pass from this buffer.
   * @param {number} deltaTime - The delta time in seconds.
   * @param {boolean} maskActive - Whether masking is active or not.
   */
  render(t) {
    t.state.buffers.stencil.setLocked(!1), t.state.buffers.stencil.setTest(!1);
  }
}
class _t {
  /**
   * Constructs a new effect composer.
   *
   * @param {WebGLRenderer} renderer - The renderer.
   * @param {WebGLRenderTarget} [renderTarget] - This render target and a clone will
   * be used as the internal read and write buffers. If not given, the composer creates
   * the buffers automatically.
   */
  constructor(t, e) {
    if (this.renderer = t, this._pixelRatio = t.getPixelRatio(), e === void 0) {
      const i = t.getSize(new d());
      this._width = i.width, this._height = i.height, e = new w(this._width * this._pixelRatio, this._height * this._pixelRatio, { type: K }), e.texture.name = "EffectComposer.rt1";
    } else
      this._width = e.width, this._height = e.height;
    this.renderTarget1 = e, this.renderTarget2 = e.clone(), this.renderTarget2.texture.name = "EffectComposer.rt2", this.writeBuffer = this.renderTarget1, this.readBuffer = this.renderTarget2, this.renderToScreen = !0, this.passes = [], this.copyPass = new mt(ct), this.copyPass.material.blending = H, this.clock = new B();
  }
  /**
   * Swaps the internal read/write buffers.
   */
  swapBuffers() {
    const t = this.readBuffer;
    this.readBuffer = this.writeBuffer, this.writeBuffer = t;
  }
  /**
   * Adds the given pass to the pass chain.
   *
   * @param {Pass} pass - The pass to add.
   */
  addPass(t) {
    this.passes.push(t), t.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  }
  /**
   * Inserts the given pass at a given index.
   *
   * @param {Pass} pass - The pass to insert.
   * @param {number} index - The index into the pass chain.
   */
  insertPass(t, e) {
    this.passes.splice(e, 0, t), t.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  }
  /**
   * Removes the given pass from the pass chain.
   *
   * @param {Pass} pass - The pass to remove.
   */
  removePass(t) {
    const e = this.passes.indexOf(t);
    e !== -1 && this.passes.splice(e, 1);
  }
  /**
   * Returns `true` if the pass for the given index is the last enabled pass in the pass chain.
   *
   * @param {number} passIndex - The pass index.
   * @return {boolean} Whether the pass for the given index is the last pass in the pass chain.
   */
  isLastEnabledPass(t) {
    for (let e = t + 1; e < this.passes.length; e++)
      if (this.passes[e].enabled)
        return !1;
    return !0;
  }
  /**
   * Executes all enabled post-processing passes in order to produce the final frame.
   *
   * @param {number} deltaTime - The delta time in seconds. If not given, the composer computes
   * its own time delta value.
   */
  render(t) {
    t === void 0 && (t = this.clock.getDelta());
    const e = this.renderer.getRenderTarget();
    let i = !1;
    for (let o = 0, a = this.passes.length; o < a; o++) {
      const n = this.passes[o];
      if (n.enabled !== !1) {
        if (n.renderToScreen = this.renderToScreen && this.isLastEnabledPass(o), n.render(this.renderer, this.writeBuffer, this.readBuffer, t, i), n.needsSwap) {
          if (i) {
            const l = this.renderer.getContext(), m = this.renderer.state.buffers.stencil;
            m.setFunc(l.NOTEQUAL, 1, 4294967295), this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, t), m.setFunc(l.EQUAL, 1, 4294967295);
          }
          this.swapBuffers();
        }
        A !== void 0 && (n instanceof A ? i = !0 : n instanceof ft && (i = !1));
      }
    }
    this.renderer.setRenderTarget(e);
  }
  /**
   * Resets the internal state of the EffectComposer.
   *
   * @param {WebGLRenderTarget} [renderTarget] - This render target has the same purpose like
   * the one from the constructor. If set, it is used to setup the read and write buffers.
   */
  reset(t) {
    if (t === void 0) {
      const e = this.renderer.getSize(new d());
      this._pixelRatio = this.renderer.getPixelRatio(), this._width = e.width, this._height = e.height, t = this.renderTarget1.clone(), t.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
    }
    this.renderTarget1.dispose(), this.renderTarget2.dispose(), this.renderTarget1 = t, this.renderTarget2 = t.clone(), this.writeBuffer = this.renderTarget1, this.readBuffer = this.renderTarget2;
  }
  /**
   * Resizes the internal read and write buffers as well as all passes. Similar to {@link WebGLRenderer#setSize},
   * this method honors the current pixel ration.
   *
   * @param {number} width - The width in logical pixels.
   * @param {number} height - The height in logical pixels.
   */
  setSize(t, e) {
    this._width = t, this._height = e;
    const i = this._width * this._pixelRatio, o = this._height * this._pixelRatio;
    this.renderTarget1.setSize(i, o), this.renderTarget2.setSize(i, o);
    for (let a = 0; a < this.passes.length; a++)
      this.passes[a].setSize(i, o);
  }
  /**
   * Sets device pixel ratio. This is usually used for HiDPI device to prevent blurring output.
   * Setting the pixel ratio will automatically resize the composer.
   *
   * @param {number} pixelRatio - The pixel ratio to set.
   */
  setPixelRatio(t) {
    this._pixelRatio = t, this.setSize(this._width, this._height);
  }
  /**
   * Frees the GPU-related resources allocated by this instance. Call this
   * method whenever the composer is no longer used in your app.
   */
  dispose() {
    this.renderTarget1.dispose(), this.renderTarget2.dispose(), this.copyPass.dispose();
  }
}
var gt = `varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;
class bt extends b {
  fsQuad;
  resolution;
  scene;
  camera;
  rgbRenderTarget;
  normalRenderTarget;
  normalMaterial;
  constructor(t, e, i) {
    super(), this.resolution = t, this.fsQuad = new j(this.material()), this.scene = e, this.camera = i, this.rgbRenderTarget = new w(t.x * 4, t.y * 4), this.normalRenderTarget = new w(t.x * 4, t.y * 4), this.normalMaterial = new y.MeshNormalMaterial();
  }
  render(t, e) {
    t.setRenderTarget(this.rgbRenderTarget), t.render(this.scene, this.camera);
    const i = this.scene.overrideMaterial;
    t.setRenderTarget(this.normalRenderTarget), this.scene.overrideMaterial = this.normalMaterial, t.render(this.scene, this.camera), this.scene.overrideMaterial = i;
    const o = this.fsQuad.material.uniforms;
    o.tDiffuse.value = this.rgbRenderTarget.texture, o.tDepth.value = this.rgbRenderTarget.depthTexture, o.tNormal.value = this.normalRenderTarget.texture, o.iTime.value += 0.01, this.renderToScreen ? t.setRenderTarget(null) : t.setRenderTarget(e), this.fsQuad.render(t);
  }
  material() {
    return new y.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        tDiffuse: { value: null },
        tDepth: { value: null },
        tNormal: { value: null },
        resolution: {
          value: new y.Vector4(this.resolution.x, this.resolution.y, 1 / this.resolution.x, 1 / this.resolution.y)
        }
      },
      vertexShader: gt,
      fragmentShader: Q
    });
  }
  dispose() {
    try {
      this.fsQuad?.dispose?.();
    } catch {
    }
    try {
      this.rgbRenderTarget?.dispose?.(), this.normalRenderTarget?.dispose?.();
    } catch {
    }
    try {
      this.normalMaterial?.dispose?.();
    } catch {
    }
  }
}
class yt {
  cameraRig;
  camera;
  screenResolution;
  renderer;
  composer;
  _perspective;
  orbitControls = null;
  target = null;
  sceneRef = null;
  frustumSize = 10;
  // Perspective controller delegation
  perspectiveController = null;
  constructor(t, e, i = 10) {
    this._perspective = t, this.screenResolution = e, this.frustumSize = i, this.renderer = new X({ antialias: !1, alpha: !0 }), this.renderer.setSize(e.x, e.y), this.renderer.shadowMap.enabled = !0, this.composer = new _t(this.renderer);
    const o = e.x / e.y;
    this.camera = this.createCameraForPerspective(o), this.cameraRig = new W(), this.cameraRig.position.set(0, 3, 10), this.cameraRig.add(this.camera), this.camera.lookAt(new u(0, 2, 0)), this.initializePerspectiveController();
  }
  /**
   * Setup the camera with a scene
   */
  async setup(t) {
    this.sceneRef = t, this.orbitControls === null && (this.orbitControls = new G(this.camera, this.renderer.domElement), this.orbitControls.enableDamping = !0, this.orbitControls.dampingFactor = 0.05, this.orbitControls.screenSpacePanning = !1, this.orbitControls.minDistance = 1, this.orbitControls.maxDistance = 500, this.orbitControls.maxPolarAngle = Math.PI / 2);
    let e = this.screenResolution.clone().divideScalar(2);
    e.x |= 0, e.y |= 0;
    const i = new bt(e, t, this.camera);
    this.composer.addPass(i), this.perspectiveController && this.perspectiveController.setup({
      screenResolution: this.screenResolution,
      renderer: this.renderer,
      scene: t,
      camera: this
    }), this.renderer.setAnimationLoop((o) => {
      this.update(o || 0);
    });
  }
  /**
   * Update camera and render
   */
  update(t) {
    this.orbitControls?.update(), this.perspectiveController && this.perspectiveController.update(t), this.composer.render(t);
  }
  /**
   * Dispose renderer, composer, controls, and detach from scene
   */
  destroy() {
    try {
      this.renderer.setAnimationLoop(null);
    } catch {
    }
    try {
      this.orbitControls?.dispose(), this.orbitControls = null;
    } catch {
    }
    try {
      this.composer?.passes?.forEach((t) => t.dispose?.()), this.composer?.dispose?.();
    } catch {
    }
    try {
      this.renderer.dispose();
    } catch {
    }
    this.sceneRef = null;
  }
  /**
   * Resize camera and renderer
   */
  resize(t, e) {
    this.screenResolution.set(t, e), this.renderer.setSize(t, e, !0), this.composer.setSize(t, e), this.camera instanceof P && (this.camera.aspect = t / e, this.camera.updateProjectionMatrix()), this.perspectiveController && this.perspectiveController.resize(t, e);
  }
  /**
   * Create camera based on perspective type
   */
  createCameraForPerspective(t) {
    switch (this._perspective) {
      case p.ThirdPerson:
        return this.createThirdPersonCamera(t);
      case p.FirstPerson:
        return this.createFirstPersonCamera(t);
      case p.Isometric:
        return this.createIsometricCamera(t);
      case p.Flat2D:
        return this.createFlat2DCamera(t);
      case p.Fixed2D:
        return this.createFixed2DCamera(t);
      default:
        return this.createThirdPersonCamera(t);
    }
  }
  /**
   * Initialize perspective-specific controller
   */
  initializePerspectiveController() {
    switch (this._perspective) {
      case p.ThirdPerson:
        this.perspectiveController = new L();
        break;
      case p.Fixed2D:
        this.perspectiveController = new lt();
        break;
      default:
        this.perspectiveController = new L();
    }
  }
  createThirdPersonCamera(t) {
    return new P(75, t, 0.1, 1e3);
  }
  createFirstPersonCamera(t) {
    return new P(75, t, 0.1, 1e3);
  }
  createIsometricCamera(t) {
    return new T(this.frustumSize * t / -2, this.frustumSize * t / 2, this.frustumSize / 2, this.frustumSize / -2, 1, 1e3);
  }
  createFlat2DCamera(t) {
    return new T(this.frustumSize * t / -2, this.frustumSize * t / 2, this.frustumSize / 2, this.frustumSize / -2, 1, 1e3);
  }
  createFixed2DCamera(t) {
    return this.createFlat2DCamera(t);
  }
  // Movement methods
  moveCamera(t) {
    (this._perspective === p.Flat2D || this._perspective === p.Fixed2D) && (this.frustumSize = t.z), this.cameraRig.position.set(t.x, t.y, t.z);
  }
  move(t) {
    this.moveCamera(t);
  }
  rotate(t, e, i) {
    this.cameraRig.rotateX(t), this.cameraRig.rotateY(e), this.cameraRig.rotateZ(i);
  }
  /**
   * Get the DOM element for the renderer
   */
  getDomElement() {
    return this.renderer.domElement;
  }
}
class Pt {
  cameraRef;
  constructor(t) {
    this.cameraRef = t;
  }
}
function wt(s) {
  const t = s.screenResolution || new d(window.innerWidth, window.innerHeight);
  let e = 10;
  s.perspective === "fixed-2d" && (e = s.zoom || 10);
  const i = new yt(s.perspective || "third-person", t, e);
  return i.move(s.position || new u(0, 0, 0)), i.camera.lookAt(s.target || new u(0, 0, 0)), new Pt(i);
}
export {
  Pt as C,
  p as P,
  yt as Z,
  wt as c
};
