var ol = Object.defineProperty;
var al = (a, e, t) => e in a ? ol(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var ze = (a, e, t) => (al(a, typeof e != "symbol" ? e + "" : e, t), t);
class kt {
  /**
   * A vector of length 9, containing all matrix elements.
   */
  /**
   * @param elements A vector of length 9, containing all matrix elements.
   */
  constructor(e) {
    e === void 0 && (e = [0, 0, 0, 0, 0, 0, 0, 0, 0]), this.elements = e;
  }
  /**
   * Sets the matrix to identity
   * @todo Should perhaps be renamed to `setIdentity()` to be more clear.
   * @todo Create another function that immediately creates an identity matrix eg. `eye()`
   */
  identity() {
    const e = this.elements;
    e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 1, e[5] = 0, e[6] = 0, e[7] = 0, e[8] = 1;
  }
  /**
   * Set all elements to zero
   */
  setZero() {
    const e = this.elements;
    e[0] = 0, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = 0, e[6] = 0, e[7] = 0, e[8] = 0;
  }
  /**
   * Sets the matrix diagonal elements from a Vec3
   */
  setTrace(e) {
    const t = this.elements;
    t[0] = e.x, t[4] = e.y, t[8] = e.z;
  }
  /**
   * Gets the matrix diagonal elements
   */
  getTrace(e) {
    e === void 0 && (e = new x());
    const t = this.elements;
    return e.x = t[0], e.y = t[4], e.z = t[8], e;
  }
  /**
   * Matrix-Vector multiplication
   * @param v The vector to multiply with
   * @param target Optional, target to save the result in.
   */
  vmult(e, t) {
    t === void 0 && (t = new x());
    const n = this.elements, i = e.x, s = e.y, r = e.z;
    return t.x = n[0] * i + n[1] * s + n[2] * r, t.y = n[3] * i + n[4] * s + n[5] * r, t.z = n[6] * i + n[7] * s + n[8] * r, t;
  }
  /**
   * Matrix-scalar multiplication
   */
  smult(e) {
    for (let t = 0; t < this.elements.length; t++)
      this.elements[t] *= e;
  }
  /**
   * Matrix multiplication
   * @param matrix Matrix to multiply with from left side.
   */
  mmult(e, t) {
    t === void 0 && (t = new kt());
    const n = this.elements, i = e.elements, s = t.elements, r = n[0], o = n[1], c = n[2], l = n[3], h = n[4], d = n[5], u = n[6], p = n[7], g = n[8], _ = i[0], m = i[1], f = i[2], v = i[3], M = i[4], y = i[5], w = i[6], C = i[7], P = i[8];
    return s[0] = r * _ + o * v + c * w, s[1] = r * m + o * M + c * C, s[2] = r * f + o * y + c * P, s[3] = l * _ + h * v + d * w, s[4] = l * m + h * M + d * C, s[5] = l * f + h * y + d * P, s[6] = u * _ + p * v + g * w, s[7] = u * m + p * M + g * C, s[8] = u * f + p * y + g * P, t;
  }
  /**
   * Scale each column of the matrix
   */
  scale(e, t) {
    t === void 0 && (t = new kt());
    const n = this.elements, i = t.elements;
    for (let s = 0; s !== 3; s++)
      i[3 * s + 0] = e.x * n[3 * s + 0], i[3 * s + 1] = e.y * n[3 * s + 1], i[3 * s + 2] = e.z * n[3 * s + 2];
    return t;
  }
  /**
   * Solve Ax=b
   * @param b The right hand side
   * @param target Optional. Target vector to save in.
   * @return The solution x
   * @todo should reuse arrays
   */
  solve(e, t) {
    t === void 0 && (t = new x());
    const n = 3, i = 4, s = [];
    let r, o;
    for (r = 0; r < n * i; r++)
      s.push(0);
    for (r = 0; r < 3; r++)
      for (o = 0; o < 3; o++)
        s[r + i * o] = this.elements[r + 3 * o];
    s[3 + 4 * 0] = e.x, s[3 + 4 * 1] = e.y, s[3 + 4 * 2] = e.z;
    let c = 3;
    const l = c;
    let h;
    const d = 4;
    let u;
    do {
      if (r = l - c, s[r + i * r] === 0) {
        for (o = r + 1; o < l; o++)
          if (s[r + i * o] !== 0) {
            h = d;
            do
              u = d - h, s[u + i * r] += s[u + i * o];
            while (--h);
            break;
          }
      }
      if (s[r + i * r] !== 0)
        for (o = r + 1; o < l; o++) {
          const p = s[r + i * o] / s[r + i * r];
          h = d;
          do
            u = d - h, s[u + i * o] = u <= r ? 0 : s[u + i * o] - s[u + i * r] * p;
          while (--h);
        }
    } while (--c);
    if (t.z = s[2 * i + 3] / s[2 * i + 2], t.y = (s[1 * i + 3] - s[1 * i + 2] * t.z) / s[1 * i + 1], t.x = (s[0 * i + 3] - s[0 * i + 2] * t.z - s[0 * i + 1] * t.y) / s[0 * i + 0], isNaN(t.x) || isNaN(t.y) || isNaN(t.z) || t.x === 1 / 0 || t.y === 1 / 0 || t.z === 1 / 0)
      throw `Could not solve equation! Got x=[${t.toString()}], b=[${e.toString()}], A=[${this.toString()}]`;
    return t;
  }
  /**
   * Get an element in the matrix by index. Index starts at 0, not 1!!!
   * @param value If provided, the matrix element will be set to this value.
   */
  e(e, t, n) {
    if (n === void 0)
      return this.elements[t + 3 * e];
    this.elements[t + 3 * e] = n;
  }
  /**
   * Copy another matrix into this matrix object.
   */
  copy(e) {
    for (let t = 0; t < e.elements.length; t++)
      this.elements[t] = e.elements[t];
    return this;
  }
  /**
   * Returns a string representation of the matrix.
   */
  toString() {
    let e = "";
    const t = ",";
    for (let n = 0; n < 9; n++)
      e += this.elements[n] + t;
    return e;
  }
  /**
   * reverse the matrix
   * @param target Target matrix to save in.
   * @return The solution x
   */
  reverse(e) {
    e === void 0 && (e = new kt());
    const t = 3, n = 6, i = ll;
    let s, r;
    for (s = 0; s < 3; s++)
      for (r = 0; r < 3; r++)
        i[s + n * r] = this.elements[s + 3 * r];
    i[3 + 6 * 0] = 1, i[3 + 6 * 1] = 0, i[3 + 6 * 2] = 0, i[4 + 6 * 0] = 0, i[4 + 6 * 1] = 1, i[4 + 6 * 2] = 0, i[5 + 6 * 0] = 0, i[5 + 6 * 1] = 0, i[5 + 6 * 2] = 1;
    let o = 3;
    const c = o;
    let l;
    const h = n;
    let d;
    do {
      if (s = c - o, i[s + n * s] === 0) {
        for (r = s + 1; r < c; r++)
          if (i[s + n * r] !== 0) {
            l = h;
            do
              d = h - l, i[d + n * s] += i[d + n * r];
            while (--l);
            break;
          }
      }
      if (i[s + n * s] !== 0)
        for (r = s + 1; r < c; r++) {
          const u = i[s + n * r] / i[s + n * s];
          l = h;
          do
            d = h - l, i[d + n * r] = d <= s ? 0 : i[d + n * r] - i[d + n * s] * u;
          while (--l);
        }
    } while (--o);
    s = 2;
    do {
      r = s - 1;
      do {
        const u = i[s + n * r] / i[s + n * s];
        l = n;
        do
          d = n - l, i[d + n * r] = i[d + n * r] - i[d + n * s] * u;
        while (--l);
      } while (r--);
    } while (--s);
    s = 2;
    do {
      const u = 1 / i[s + n * s];
      l = n;
      do
        d = n - l, i[d + n * s] = i[d + n * s] * u;
      while (--l);
    } while (s--);
    s = 2;
    do {
      r = 2;
      do {
        if (d = i[t + r + n * s], isNaN(d) || d === 1 / 0)
          throw `Could not reverse! A=[${this.toString()}]`;
        e.e(s, r, d);
      } while (r--);
    } while (s--);
    return e;
  }
  /**
   * Set the matrix from a quaterion
   */
  setRotationFromQuaternion(e) {
    const t = e.x, n = e.y, i = e.z, s = e.w, r = t + t, o = n + n, c = i + i, l = t * r, h = t * o, d = t * c, u = n * o, p = n * c, g = i * c, _ = s * r, m = s * o, f = s * c, v = this.elements;
    return v[3 * 0 + 0] = 1 - (u + g), v[3 * 0 + 1] = h - f, v[3 * 0 + 2] = d + m, v[3 * 1 + 0] = h + f, v[3 * 1 + 1] = 1 - (l + g), v[3 * 1 + 2] = p - _, v[3 * 2 + 0] = d - m, v[3 * 2 + 1] = p + _, v[3 * 2 + 2] = 1 - (l + u), this;
  }
  /**
   * Transpose the matrix
   * @param target Optional. Where to store the result.
   * @return The target Mat3, or a new Mat3 if target was omitted.
   */
  transpose(e) {
    e === void 0 && (e = new kt());
    const t = this.elements, n = e.elements;
    let i;
    return n[0] = t[0], n[4] = t[4], n[8] = t[8], i = t[1], n[1] = t[3], n[3] = i, i = t[2], n[2] = t[6], n[6] = i, i = t[5], n[5] = t[7], n[7] = i, e;
  }
}
const ll = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
class x {
  constructor(e, t, n) {
    e === void 0 && (e = 0), t === void 0 && (t = 0), n === void 0 && (n = 0), this.x = e, this.y = t, this.z = n;
  }
  /**
   * Vector cross product
   * @param target Optional target to save in.
   */
  cross(e, t) {
    t === void 0 && (t = new x());
    const n = e.x, i = e.y, s = e.z, r = this.x, o = this.y, c = this.z;
    return t.x = o * s - c * i, t.y = c * n - r * s, t.z = r * i - o * n, t;
  }
  /**
   * Set the vectors' 3 elements
   */
  set(e, t, n) {
    return this.x = e, this.y = t, this.z = n, this;
  }
  /**
   * Set all components of the vector to zero.
   */
  setZero() {
    this.x = this.y = this.z = 0;
  }
  /**
   * Vector addition
   */
  vadd(e, t) {
    if (t)
      t.x = e.x + this.x, t.y = e.y + this.y, t.z = e.z + this.z;
    else
      return new x(this.x + e.x, this.y + e.y, this.z + e.z);
  }
  /**
   * Vector subtraction
   * @param target Optional target to save in.
   */
  vsub(e, t) {
    if (t)
      t.x = this.x - e.x, t.y = this.y - e.y, t.z = this.z - e.z;
    else
      return new x(this.x - e.x, this.y - e.y, this.z - e.z);
  }
  /**
   * Get the cross product matrix a_cross from a vector, such that a x b = a_cross * b = c
   *
   * See {@link https://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf Umeå University Lecture}
   */
  crossmat() {
    return new kt([0, -this.z, this.y, this.z, 0, -this.x, -this.y, this.x, 0]);
  }
  /**
   * Normalize the vector. Note that this changes the values in the vector.
    * @return Returns the norm of the vector
   */
  normalize() {
    const e = this.x, t = this.y, n = this.z, i = Math.sqrt(e * e + t * t + n * n);
    if (i > 0) {
      const s = 1 / i;
      this.x *= s, this.y *= s, this.z *= s;
    } else
      this.x = 0, this.y = 0, this.z = 0;
    return i;
  }
  /**
   * Get the version of this vector that is of length 1.
   * @param target Optional target to save in
   * @return Returns the unit vector
   */
  unit(e) {
    e === void 0 && (e = new x());
    const t = this.x, n = this.y, i = this.z;
    let s = Math.sqrt(t * t + n * n + i * i);
    return s > 0 ? (s = 1 / s, e.x = t * s, e.y = n * s, e.z = i * s) : (e.x = 1, e.y = 0, e.z = 0), e;
  }
  /**
   * Get the length of the vector
   */
  length() {
    const e = this.x, t = this.y, n = this.z;
    return Math.sqrt(e * e + t * t + n * n);
  }
  /**
   * Get the squared length of the vector.
   */
  lengthSquared() {
    return this.dot(this);
  }
  /**
   * Get distance from this point to another point
   */
  distanceTo(e) {
    const t = this.x, n = this.y, i = this.z, s = e.x, r = e.y, o = e.z;
    return Math.sqrt((s - t) * (s - t) + (r - n) * (r - n) + (o - i) * (o - i));
  }
  /**
   * Get squared distance from this point to another point
   */
  distanceSquared(e) {
    const t = this.x, n = this.y, i = this.z, s = e.x, r = e.y, o = e.z;
    return (s - t) * (s - t) + (r - n) * (r - n) + (o - i) * (o - i);
  }
  /**
   * Multiply all the components of the vector with a scalar.
   * @param target The vector to save the result in.
   */
  scale(e, t) {
    t === void 0 && (t = new x());
    const n = this.x, i = this.y, s = this.z;
    return t.x = e * n, t.y = e * i, t.z = e * s, t;
  }
  /**
   * Multiply the vector with an other vector, component-wise.
   * @param target The vector to save the result in.
   */
  vmul(e, t) {
    return t === void 0 && (t = new x()), t.x = e.x * this.x, t.y = e.y * this.y, t.z = e.z * this.z, t;
  }
  /**
   * Scale a vector and add it to this vector. Save the result in "target". (target = this + vector * scalar)
   * @param target The vector to save the result in.
   */
  addScaledVector(e, t, n) {
    return n === void 0 && (n = new x()), n.x = this.x + e * t.x, n.y = this.y + e * t.y, n.z = this.z + e * t.z, n;
  }
  /**
   * Calculate dot product
   * @param vector
   */
  dot(e) {
    return this.x * e.x + this.y * e.y + this.z * e.z;
  }
  isZero() {
    return this.x === 0 && this.y === 0 && this.z === 0;
  }
  /**
   * Make the vector point in the opposite direction.
   * @param target Optional target to save in
   */
  negate(e) {
    return e === void 0 && (e = new x()), e.x = -this.x, e.y = -this.y, e.z = -this.z, e;
  }
  /**
   * Compute two artificial tangents to the vector
   * @param t1 Vector object to save the first tangent in
   * @param t2 Vector object to save the second tangent in
   */
  tangents(e, t) {
    const n = this.length();
    if (n > 0) {
      const i = cl, s = 1 / n;
      i.set(this.x * s, this.y * s, this.z * s);
      const r = hl;
      Math.abs(i.x) < 0.9 ? (r.set(1, 0, 0), i.cross(r, e)) : (r.set(0, 1, 0), i.cross(r, e)), i.cross(e, t);
    } else
      e.set(1, 0, 0), t.set(0, 1, 0);
  }
  /**
   * Converts to a more readable format
   */
  toString() {
    return `${this.x},${this.y},${this.z}`;
  }
  /**
   * Converts to an array
   */
  toArray() {
    return [this.x, this.y, this.z];
  }
  /**
   * Copies value of source to this vector.
   */
  copy(e) {
    return this.x = e.x, this.y = e.y, this.z = e.z, this;
  }
  /**
   * Do a linear interpolation between two vectors
   * @param t A number between 0 and 1. 0 will make this function return u, and 1 will make it return v. Numbers in between will generate a vector in between them.
   */
  lerp(e, t, n) {
    const i = this.x, s = this.y, r = this.z;
    n.x = i + (e.x - i) * t, n.y = s + (e.y - s) * t, n.z = r + (e.z - r) * t;
  }
  /**
   * Check if a vector equals is almost equal to another one.
   */
  almostEquals(e, t) {
    return t === void 0 && (t = 1e-6), !(Math.abs(this.x - e.x) > t || Math.abs(this.y - e.y) > t || Math.abs(this.z - e.z) > t);
  }
  /**
   * Check if a vector is almost zero
   */
  almostZero(e) {
    return e === void 0 && (e = 1e-6), !(Math.abs(this.x) > e || Math.abs(this.y) > e || Math.abs(this.z) > e);
  }
  /**
   * Check if the vector is anti-parallel to another vector.
   * @param precision Set to zero for exact comparisons
   */
  isAntiparallelTo(e, t) {
    return this.negate(Pr), Pr.almostEquals(e, t);
  }
  /**
   * Clone the vector
   */
  clone() {
    return new x(this.x, this.y, this.z);
  }
}
x.ZERO = new x(0, 0, 0);
x.UNIT_X = new x(1, 0, 0);
x.UNIT_Y = new x(0, 1, 0);
x.UNIT_Z = new x(0, 0, 1);
const cl = new x(), hl = new x(), Pr = new x();
class Lt {
  /**
   * The lower bound of the bounding box
   */
  /**
   * The upper bound of the bounding box
   */
  constructor(e) {
    e === void 0 && (e = {}), this.lowerBound = new x(), this.upperBound = new x(), e.lowerBound && this.lowerBound.copy(e.lowerBound), e.upperBound && this.upperBound.copy(e.upperBound);
  }
  /**
   * Set the AABB bounds from a set of points.
   * @param points An array of Vec3's.
   * @return The self object
   */
  setFromPoints(e, t, n, i) {
    const s = this.lowerBound, r = this.upperBound, o = n;
    s.copy(e[0]), o && o.vmult(s, s), r.copy(s);
    for (let c = 1; c < e.length; c++) {
      let l = e[c];
      o && (o.vmult(l, Rr), l = Rr), l.x > r.x && (r.x = l.x), l.x < s.x && (s.x = l.x), l.y > r.y && (r.y = l.y), l.y < s.y && (s.y = l.y), l.z > r.z && (r.z = l.z), l.z < s.z && (s.z = l.z);
    }
    return t && (t.vadd(s, s), t.vadd(r, r)), i && (s.x -= i, s.y -= i, s.z -= i, r.x += i, r.y += i, r.z += i), this;
  }
  /**
   * Copy bounds from an AABB to this AABB
   * @param aabb Source to copy from
   * @return The this object, for chainability
   */
  copy(e) {
    return this.lowerBound.copy(e.lowerBound), this.upperBound.copy(e.upperBound), this;
  }
  /**
   * Clone an AABB
   */
  clone() {
    return new Lt().copy(this);
  }
  /**
   * Extend this AABB so that it covers the given AABB too.
   */
  extend(e) {
    this.lowerBound.x = Math.min(this.lowerBound.x, e.lowerBound.x), this.upperBound.x = Math.max(this.upperBound.x, e.upperBound.x), this.lowerBound.y = Math.min(this.lowerBound.y, e.lowerBound.y), this.upperBound.y = Math.max(this.upperBound.y, e.upperBound.y), this.lowerBound.z = Math.min(this.lowerBound.z, e.lowerBound.z), this.upperBound.z = Math.max(this.upperBound.z, e.upperBound.z);
  }
  /**
   * Returns true if the given AABB overlaps this AABB.
   */
  overlaps(e) {
    const t = this.lowerBound, n = this.upperBound, i = e.lowerBound, s = e.upperBound, r = i.x <= n.x && n.x <= s.x || t.x <= s.x && s.x <= n.x, o = i.y <= n.y && n.y <= s.y || t.y <= s.y && s.y <= n.y, c = i.z <= n.z && n.z <= s.z || t.z <= s.z && s.z <= n.z;
    return r && o && c;
  }
  // Mostly for debugging
  volume() {
    const e = this.lowerBound, t = this.upperBound;
    return (t.x - e.x) * (t.y - e.y) * (t.z - e.z);
  }
  /**
   * Returns true if the given AABB is fully contained in this AABB.
   */
  contains(e) {
    const t = this.lowerBound, n = this.upperBound, i = e.lowerBound, s = e.upperBound;
    return t.x <= i.x && n.x >= s.x && t.y <= i.y && n.y >= s.y && t.z <= i.z && n.z >= s.z;
  }
  getCorners(e, t, n, i, s, r, o, c) {
    const l = this.lowerBound, h = this.upperBound;
    e.copy(l), t.set(h.x, l.y, l.z), n.set(h.x, h.y, l.z), i.set(l.x, h.y, h.z), s.set(h.x, l.y, h.z), r.set(l.x, h.y, l.z), o.set(l.x, l.y, h.z), c.copy(h);
  }
  /**
   * Get the representation of an AABB in another frame.
   * @return The "target" AABB object.
   */
  toLocalFrame(e, t) {
    const n = Dr, i = n[0], s = n[1], r = n[2], o = n[3], c = n[4], l = n[5], h = n[6], d = n[7];
    this.getCorners(i, s, r, o, c, l, h, d);
    for (let u = 0; u !== 8; u++) {
      const p = n[u];
      e.pointToLocal(p, p);
    }
    return t.setFromPoints(n);
  }
  /**
   * Get the representation of an AABB in the global frame.
   * @return The "target" AABB object.
   */
  toWorldFrame(e, t) {
    const n = Dr, i = n[0], s = n[1], r = n[2], o = n[3], c = n[4], l = n[5], h = n[6], d = n[7];
    this.getCorners(i, s, r, o, c, l, h, d);
    for (let u = 0; u !== 8; u++) {
      const p = n[u];
      e.pointToWorld(p, p);
    }
    return t.setFromPoints(n);
  }
  /**
   * Check if the AABB is hit by a ray.
   */
  overlapsRay(e) {
    const {
      direction: t,
      from: n
    } = e, i = 1 / t.x, s = 1 / t.y, r = 1 / t.z, o = (this.lowerBound.x - n.x) * i, c = (this.upperBound.x - n.x) * i, l = (this.lowerBound.y - n.y) * s, h = (this.upperBound.y - n.y) * s, d = (this.lowerBound.z - n.z) * r, u = (this.upperBound.z - n.z) * r, p = Math.max(Math.max(Math.min(o, c), Math.min(l, h)), Math.min(d, u)), g = Math.min(Math.min(Math.max(o, c), Math.max(l, h)), Math.max(d, u));
    return !(g < 0 || p > g);
  }
}
const Rr = new x(), Dr = [new x(), new x(), new x(), new x(), new x(), new x(), new x(), new x()];
class Ir {
  /**
   * The matrix storage.
   */
  constructor() {
    this.matrix = [];
  }
  /**
   * Get an element
   */
  get(e, t) {
    let {
      index: n
    } = e, {
      index: i
    } = t;
    if (i > n) {
      const s = i;
      i = n, n = s;
    }
    return this.matrix[(n * (n + 1) >> 1) + i - 1];
  }
  /**
   * Set an element
   */
  set(e, t, n) {
    let {
      index: i
    } = e, {
      index: s
    } = t;
    if (s > i) {
      const r = s;
      s = i, i = r;
    }
    this.matrix[(i * (i + 1) >> 1) + s - 1] = n ? 1 : 0;
  }
  /**
   * Sets all elements to zero
   */
  reset() {
    for (let e = 0, t = this.matrix.length; e !== t; e++)
      this.matrix[e] = 0;
  }
  /**
   * Sets the max number of objects
   */
  setNumObjects(e) {
    this.matrix.length = e * (e - 1) >> 1;
  }
}
class ma {
  /**
   * Add an event listener
   * @return The self object, for chainability.
   */
  addEventListener(e, t) {
    this._listeners === void 0 && (this._listeners = {});
    const n = this._listeners;
    return n[e] === void 0 && (n[e] = []), n[e].includes(t) || n[e].push(t), this;
  }
  /**
   * Check if an event listener is added
   */
  hasEventListener(e, t) {
    if (this._listeners === void 0)
      return !1;
    const n = this._listeners;
    return !!(n[e] !== void 0 && n[e].includes(t));
  }
  /**
   * Check if any event listener of the given type is added
   */
  hasAnyEventListener(e) {
    return this._listeners === void 0 ? !1 : this._listeners[e] !== void 0;
  }
  /**
   * Remove an event listener
   * @return The self object, for chainability.
   */
  removeEventListener(e, t) {
    if (this._listeners === void 0)
      return this;
    const n = this._listeners;
    if (n[e] === void 0)
      return this;
    const i = n[e].indexOf(t);
    return i !== -1 && n[e].splice(i, 1), this;
  }
  /**
   * Emit an event.
   * @return The self object, for chainability.
   */
  dispatchEvent(e) {
    if (this._listeners === void 0)
      return this;
    const n = this._listeners[e.type];
    if (n !== void 0) {
      e.target = this;
      for (let i = 0, s = n.length; i < s; i++)
        n[i].call(this, e);
    }
    return this;
  }
}
let At = class Dn {
  constructor(e, t, n, i) {
    e === void 0 && (e = 0), t === void 0 && (t = 0), n === void 0 && (n = 0), i === void 0 && (i = 1), this.x = e, this.y = t, this.z = n, this.w = i;
  }
  /**
   * Set the value of the quaternion.
   */
  set(e, t, n, i) {
    return this.x = e, this.y = t, this.z = n, this.w = i, this;
  }
  /**
   * Convert to a readable format
   * @return "x,y,z,w"
   */
  toString() {
    return `${this.x},${this.y},${this.z},${this.w}`;
  }
  /**
   * Convert to an Array
   * @return [x, y, z, w]
   */
  toArray() {
    return [this.x, this.y, this.z, this.w];
  }
  /**
   * Set the quaternion components given an axis and an angle in radians.
   */
  setFromAxisAngle(e, t) {
    const n = Math.sin(t * 0.5);
    return this.x = e.x * n, this.y = e.y * n, this.z = e.z * n, this.w = Math.cos(t * 0.5), this;
  }
  /**
   * Converts the quaternion to [ axis, angle ] representation.
   * @param targetAxis A vector object to reuse for storing the axis.
   * @return An array, first element is the axis and the second is the angle in radians.
   */
  toAxisAngle(e) {
    e === void 0 && (e = new x()), this.normalize();
    const t = 2 * Math.acos(this.w), n = Math.sqrt(1 - this.w * this.w);
    return n < 1e-3 ? (e.x = this.x, e.y = this.y, e.z = this.z) : (e.x = this.x / n, e.y = this.y / n, e.z = this.z / n), [e, t];
  }
  /**
   * Set the quaternion value given two vectors. The resulting rotation will be the needed rotation to rotate u to v.
   */
  setFromVectors(e, t) {
    if (e.isAntiparallelTo(t)) {
      const n = ul, i = dl;
      e.tangents(n, i), this.setFromAxisAngle(n, Math.PI);
    } else {
      const n = e.cross(t);
      this.x = n.x, this.y = n.y, this.z = n.z, this.w = Math.sqrt(e.length() ** 2 * t.length() ** 2) + e.dot(t), this.normalize();
    }
    return this;
  }
  /**
   * Multiply the quaternion with an other quaternion.
   */
  mult(e, t) {
    t === void 0 && (t = new Dn());
    const n = this.x, i = this.y, s = this.z, r = this.w, o = e.x, c = e.y, l = e.z, h = e.w;
    return t.x = n * h + r * o + i * l - s * c, t.y = i * h + r * c + s * o - n * l, t.z = s * h + r * l + n * c - i * o, t.w = r * h - n * o - i * c - s * l, t;
  }
  /**
   * Get the inverse quaternion rotation.
   */
  inverse(e) {
    e === void 0 && (e = new Dn());
    const t = this.x, n = this.y, i = this.z, s = this.w;
    this.conjugate(e);
    const r = 1 / (t * t + n * n + i * i + s * s);
    return e.x *= r, e.y *= r, e.z *= r, e.w *= r, e;
  }
  /**
   * Get the quaternion conjugate
   */
  conjugate(e) {
    return e === void 0 && (e = new Dn()), e.x = -this.x, e.y = -this.y, e.z = -this.z, e.w = this.w, e;
  }
  /**
   * Normalize the quaternion. Note that this changes the values of the quaternion.
   */
  normalize() {
    let e = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    return e === 0 ? (this.x = 0, this.y = 0, this.z = 0, this.w = 0) : (e = 1 / e, this.x *= e, this.y *= e, this.z *= e, this.w *= e), this;
  }
  /**
   * Approximation of quaternion normalization. Works best when quat is already almost-normalized.
   * @author unphased, https://github.com/unphased
   */
  normalizeFast() {
    const e = (3 - (this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w)) / 2;
    return e === 0 ? (this.x = 0, this.y = 0, this.z = 0, this.w = 0) : (this.x *= e, this.y *= e, this.z *= e, this.w *= e), this;
  }
  /**
   * Multiply the quaternion by a vector
   */
  vmult(e, t) {
    t === void 0 && (t = new x());
    const n = e.x, i = e.y, s = e.z, r = this.x, o = this.y, c = this.z, l = this.w, h = l * n + o * s - c * i, d = l * i + c * n - r * s, u = l * s + r * i - o * n, p = -r * n - o * i - c * s;
    return t.x = h * l + p * -r + d * -c - u * -o, t.y = d * l + p * -o + u * -r - h * -c, t.z = u * l + p * -c + h * -o - d * -r, t;
  }
  /**
   * Copies value of source to this quaternion.
   * @return this
   */
  copy(e) {
    return this.x = e.x, this.y = e.y, this.z = e.z, this.w = e.w, this;
  }
  /**
   * Convert the quaternion to euler angle representation. Order: YZX, as this page describes: https://www.euclideanspace.com/maths/standards/index.htm
   * @param order Three-character string, defaults to "YZX"
   */
  toEuler(e, t) {
    t === void 0 && (t = "YZX");
    let n, i, s;
    const r = this.x, o = this.y, c = this.z, l = this.w;
    switch (t) {
      case "YZX":
        const h = r * o + c * l;
        if (h > 0.499 && (n = 2 * Math.atan2(r, l), i = Math.PI / 2, s = 0), h < -0.499 && (n = -2 * Math.atan2(r, l), i = -Math.PI / 2, s = 0), n === void 0) {
          const d = r * r, u = o * o, p = c * c;
          n = Math.atan2(2 * o * l - 2 * r * c, 1 - 2 * u - 2 * p), i = Math.asin(2 * h), s = Math.atan2(2 * r * l - 2 * o * c, 1 - 2 * d - 2 * p);
        }
        break;
      default:
        throw new Error(`Euler order ${t} not supported yet.`);
    }
    e.y = n, e.z = i, e.x = s;
  }
  /**
   * Set the quaternion components given Euler angle representation.
   *
   * @param order The order to apply angles: 'XYZ' or 'YXZ' or any other combination.
   *
   * See {@link https://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors MathWorks} reference
   */
  setFromEuler(e, t, n, i) {
    i === void 0 && (i = "XYZ");
    const s = Math.cos(e / 2), r = Math.cos(t / 2), o = Math.cos(n / 2), c = Math.sin(e / 2), l = Math.sin(t / 2), h = Math.sin(n / 2);
    return i === "XYZ" ? (this.x = c * r * o + s * l * h, this.y = s * l * o - c * r * h, this.z = s * r * h + c * l * o, this.w = s * r * o - c * l * h) : i === "YXZ" ? (this.x = c * r * o + s * l * h, this.y = s * l * o - c * r * h, this.z = s * r * h - c * l * o, this.w = s * r * o + c * l * h) : i === "ZXY" ? (this.x = c * r * o - s * l * h, this.y = s * l * o + c * r * h, this.z = s * r * h + c * l * o, this.w = s * r * o - c * l * h) : i === "ZYX" ? (this.x = c * r * o - s * l * h, this.y = s * l * o + c * r * h, this.z = s * r * h - c * l * o, this.w = s * r * o + c * l * h) : i === "YZX" ? (this.x = c * r * o + s * l * h, this.y = s * l * o + c * r * h, this.z = s * r * h - c * l * o, this.w = s * r * o - c * l * h) : i === "XZY" && (this.x = c * r * o - s * l * h, this.y = s * l * o - c * r * h, this.z = s * r * h + c * l * o, this.w = s * r * o + c * l * h), this;
  }
  clone() {
    return new Dn(this.x, this.y, this.z, this.w);
  }
  /**
   * Performs a spherical linear interpolation between two quat
   *
   * @param toQuat second operand
   * @param t interpolation amount between the self quaternion and toQuat
   * @param target A quaternion to store the result in. If not provided, a new one will be created.
   * @returns {Quaternion} The "target" object
   */
  slerp(e, t, n) {
    n === void 0 && (n = new Dn());
    const i = this.x, s = this.y, r = this.z, o = this.w;
    let c = e.x, l = e.y, h = e.z, d = e.w, u, p, g, _, m;
    return p = i * c + s * l + r * h + o * d, p < 0 && (p = -p, c = -c, l = -l, h = -h, d = -d), 1 - p > 1e-6 ? (u = Math.acos(p), g = Math.sin(u), _ = Math.sin((1 - t) * u) / g, m = Math.sin(t * u) / g) : (_ = 1 - t, m = t), n.x = _ * i + m * c, n.y = _ * s + m * l, n.z = _ * r + m * h, n.w = _ * o + m * d, n;
  }
  /**
   * Rotate an absolute orientation quaternion given an angular velocity and a time step.
   */
  integrate(e, t, n, i) {
    i === void 0 && (i = new Dn());
    const s = e.x * n.x, r = e.y * n.y, o = e.z * n.z, c = this.x, l = this.y, h = this.z, d = this.w, u = t * 0.5;
    return i.x += u * (s * d + r * h - o * l), i.y += u * (r * d + o * c - s * h), i.z += u * (o * d + s * l - r * c), i.w += u * (-s * c - r * l - o * h), i;
  }
};
const ul = new x(), dl = new x(), fl = {
  /** SPHERE */
  SPHERE: 1,
  /** PLANE */
  PLANE: 2,
  /** BOX */
  BOX: 4,
  /** COMPOUND */
  COMPOUND: 8,
  /** CONVEXPOLYHEDRON */
  CONVEXPOLYHEDRON: 16,
  /** HEIGHTFIELD */
  HEIGHTFIELD: 32,
  /** PARTICLE */
  PARTICLE: 64,
  /** CYLINDER */
  CYLINDER: 128,
  /** TRIMESH */
  TRIMESH: 256
};
class fe {
  /**
   * Identifier of the Shape.
   */
  /**
   * The type of this shape. Must be set to an int > 0 by subclasses.
   */
  /**
   * The local bounding sphere radius of this shape.
   */
  /**
   * Whether to produce contact forces when in contact with other bodies. Note that contacts will be generated, but they will be disabled.
   * @default true
   */
  /**
   * @default 1
   */
  /**
   * @default -1
   */
  /**
   * Optional material of the shape that regulates contact properties.
   */
  /**
   * The body to which the shape is added to.
   */
  /**
   * All the Shape types.
   */
  constructor(e) {
    e === void 0 && (e = {}), this.id = fe.idCounter++, this.type = e.type || 0, this.boundingSphereRadius = 0, this.collisionResponse = e.collisionResponse ? e.collisionResponse : !0, this.collisionFilterGroup = e.collisionFilterGroup !== void 0 ? e.collisionFilterGroup : 1, this.collisionFilterMask = e.collisionFilterMask !== void 0 ? e.collisionFilterMask : -1, this.material = e.material ? e.material : null, this.body = null;
  }
  /**
   * Computes the bounding sphere radius.
   * The result is stored in the property `.boundingSphereRadius`
   */
  updateBoundingSphereRadius() {
    throw `computeBoundingSphereRadius() not implemented for shape type ${this.type}`;
  }
  /**
   * Get the volume of this shape
   */
  volume() {
    throw `volume() not implemented for shape type ${this.type}`;
  }
  /**
   * Calculates the inertia in the local frame for this shape.
   * @see http://en.wikipedia.org/wiki/List_of_moments_of_inertia
   */
  calculateLocalInertia(e, t) {
    throw `calculateLocalInertia() not implemented for shape type ${this.type}`;
  }
  /**
   * @todo use abstract for these kind of methods
   */
  calculateWorldAABB(e, t, n, i) {
    throw `calculateWorldAABB() not implemented for shape type ${this.type}`;
  }
}
fe.idCounter = 0;
fe.types = fl;
class Oe {
  /**
   * position
   */
  /**
   * quaternion
   */
  constructor(e) {
    e === void 0 && (e = {}), this.position = new x(), this.quaternion = new At(), e.position && this.position.copy(e.position), e.quaternion && this.quaternion.copy(e.quaternion);
  }
  /**
   * Get a global point in local transform coordinates.
   */
  pointToLocal(e, t) {
    return Oe.pointToLocalFrame(this.position, this.quaternion, e, t);
  }
  /**
   * Get a local point in global transform coordinates.
   */
  pointToWorld(e, t) {
    return Oe.pointToWorldFrame(this.position, this.quaternion, e, t);
  }
  /**
   * vectorToWorldFrame
   */
  vectorToWorldFrame(e, t) {
    return t === void 0 && (t = new x()), this.quaternion.vmult(e, t), t;
  }
  /**
   * pointToLocalFrame
   */
  static pointToLocalFrame(e, t, n, i) {
    return i === void 0 && (i = new x()), n.vsub(e, i), t.conjugate(Ur), Ur.vmult(i, i), i;
  }
  /**
   * pointToWorldFrame
   */
  static pointToWorldFrame(e, t, n, i) {
    return i === void 0 && (i = new x()), t.vmult(n, i), i.vadd(e, i), i;
  }
  /**
   * vectorToWorldFrame
   */
  static vectorToWorldFrame(e, t, n) {
    return n === void 0 && (n = new x()), e.vmult(t, n), n;
  }
  /**
   * vectorToLocalFrame
   */
  static vectorToLocalFrame(e, t, n, i) {
    return i === void 0 && (i = new x()), t.w *= -1, t.vmult(n, i), t.w *= -1, i;
  }
}
const Ur = new At();
class Pi extends fe {
  /** vertices */
  /**
   * Array of integer arrays, indicating which vertices each face consists of
   */
  /** faceNormals */
  /** worldVertices */
  /** worldVerticesNeedsUpdate */
  /** worldFaceNormals */
  /** worldFaceNormalsNeedsUpdate */
  /**
   * If given, these locally defined, normalized axes are the only ones being checked when doing separating axis check.
   */
  /** uniqueEdges */
  /**
   * @param vertices An array of Vec3's
   * @param faces Array of integer arrays, describing which vertices that is included in each face.
   */
  constructor(e) {
    e === void 0 && (e = {});
    const {
      vertices: t = [],
      faces: n = [],
      normals: i = [],
      axes: s,
      boundingSphereRadius: r
    } = e;
    super({
      type: fe.types.CONVEXPOLYHEDRON
    }), this.vertices = t, this.faces = n, this.faceNormals = i, this.faceNormals.length === 0 && this.computeNormals(), r ? this.boundingSphereRadius = r : this.updateBoundingSphereRadius(), this.worldVertices = [], this.worldVerticesNeedsUpdate = !0, this.worldFaceNormals = [], this.worldFaceNormalsNeedsUpdate = !0, this.uniqueAxes = s ? s.slice() : null, this.uniqueEdges = [], this.computeEdges();
  }
  /**
   * Computes uniqueEdges
   */
  computeEdges() {
    const e = this.faces, t = this.vertices, n = this.uniqueEdges;
    n.length = 0;
    const i = new x();
    for (let s = 0; s !== e.length; s++) {
      const r = e[s], o = r.length;
      for (let c = 0; c !== o; c++) {
        const l = (c + 1) % o;
        t[r[c]].vsub(t[r[l]], i), i.normalize();
        let h = !1;
        for (let d = 0; d !== n.length; d++)
          if (n[d].almostEquals(i) || n[d].almostEquals(i)) {
            h = !0;
            break;
          }
        h || n.push(i.clone());
      }
    }
  }
  /**
   * Compute the normals of the faces.
   * Will reuse existing Vec3 objects in the `faceNormals` array if they exist.
   */
  computeNormals() {
    this.faceNormals.length = this.faces.length;
    for (let e = 0; e < this.faces.length; e++) {
      for (let i = 0; i < this.faces[e].length; i++)
        if (!this.vertices[this.faces[e][i]])
          throw new Error(`Vertex ${this.faces[e][i]} not found!`);
      const t = this.faceNormals[e] || new x();
      this.getFaceNormal(e, t), t.negate(t), this.faceNormals[e] = t;
      const n = this.vertices[this.faces[e][0]];
      if (t.dot(n) < 0) {
        console.error(`.faceNormals[${e}] = Vec3(${t.toString()}) looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule.`);
        for (let i = 0; i < this.faces[e].length; i++)
          console.warn(`.vertices[${this.faces[e][i]}] = Vec3(${this.vertices[this.faces[e][i]].toString()})`);
      }
    }
  }
  /**
   * Compute the normal of a face from its vertices
   */
  getFaceNormal(e, t) {
    const n = this.faces[e], i = this.vertices[n[0]], s = this.vertices[n[1]], r = this.vertices[n[2]];
    Pi.computeNormal(i, s, r, t);
  }
  /**
   * Get face normal given 3 vertices
   */
  static computeNormal(e, t, n, i) {
    const s = new x(), r = new x();
    t.vsub(e, r), n.vsub(t, s), s.cross(r, i), i.isZero() || i.normalize();
  }
  /**
   * @param minDist Clamp distance
   * @param result The an array of contact point objects, see clipFaceAgainstHull
   */
  clipAgainstHull(e, t, n, i, s, r, o, c, l) {
    const h = new x();
    let d = -1, u = -Number.MAX_VALUE;
    for (let g = 0; g < n.faces.length; g++) {
      h.copy(n.faceNormals[g]), s.vmult(h, h);
      const _ = h.dot(r);
      _ > u && (u = _, d = g);
    }
    const p = [];
    for (let g = 0; g < n.faces[d].length; g++) {
      const _ = n.vertices[n.faces[d][g]], m = new x();
      m.copy(_), s.vmult(m, m), i.vadd(m, m), p.push(m);
    }
    d >= 0 && this.clipFaceAgainstHull(r, e, t, p, o, c, l);
  }
  /**
   * Find the separating axis between this hull and another
   * @param target The target vector to save the axis in
   * @return Returns false if a separation is found, else true
   */
  findSeparatingAxis(e, t, n, i, s, r, o, c) {
    const l = new x(), h = new x(), d = new x(), u = new x(), p = new x(), g = new x();
    let _ = Number.MAX_VALUE;
    const m = this;
    if (m.uniqueAxes)
      for (let f = 0; f !== m.uniqueAxes.length; f++) {
        n.vmult(m.uniqueAxes[f], l);
        const v = m.testSepAxis(l, e, t, n, i, s);
        if (v === !1)
          return !1;
        v < _ && (_ = v, r.copy(l));
      }
    else {
      const f = o ? o.length : m.faces.length;
      for (let v = 0; v < f; v++) {
        const M = o ? o[v] : v;
        l.copy(m.faceNormals[M]), n.vmult(l, l);
        const y = m.testSepAxis(l, e, t, n, i, s);
        if (y === !1)
          return !1;
        y < _ && (_ = y, r.copy(l));
      }
    }
    if (e.uniqueAxes)
      for (let f = 0; f !== e.uniqueAxes.length; f++) {
        s.vmult(e.uniqueAxes[f], h);
        const v = m.testSepAxis(h, e, t, n, i, s);
        if (v === !1)
          return !1;
        v < _ && (_ = v, r.copy(h));
      }
    else {
      const f = c ? c.length : e.faces.length;
      for (let v = 0; v < f; v++) {
        const M = c ? c[v] : v;
        h.copy(e.faceNormals[M]), s.vmult(h, h);
        const y = m.testSepAxis(h, e, t, n, i, s);
        if (y === !1)
          return !1;
        y < _ && (_ = y, r.copy(h));
      }
    }
    for (let f = 0; f !== m.uniqueEdges.length; f++) {
      n.vmult(m.uniqueEdges[f], u);
      for (let v = 0; v !== e.uniqueEdges.length; v++)
        if (s.vmult(e.uniqueEdges[v], p), u.cross(p, g), !g.almostZero()) {
          g.normalize();
          const M = m.testSepAxis(g, e, t, n, i, s);
          if (M === !1)
            return !1;
          M < _ && (_ = M, r.copy(g));
        }
    }
    return i.vsub(t, d), d.dot(r) > 0 && r.negate(r), !0;
  }
  /**
   * Test separating axis against two hulls. Both hulls are projected onto the axis and the overlap size is returned if there is one.
   * @return The overlap depth, or FALSE if no penetration.
   */
  testSepAxis(e, t, n, i, s, r) {
    const o = this;
    Pi.project(o, e, n, i, Es), Pi.project(t, e, s, r, Ts);
    const c = Es[0], l = Es[1], h = Ts[0], d = Ts[1];
    if (c < d || h < l)
      return !1;
    const u = c - d, p = h - l;
    return u < p ? u : p;
  }
  /**
   * calculateLocalInertia
   */
  calculateLocalInertia(e, t) {
    const n = new x(), i = new x();
    this.computeLocalAABB(i, n);
    const s = n.x - i.x, r = n.y - i.y, o = n.z - i.z;
    t.x = 1 / 12 * e * (2 * r * 2 * r + 2 * o * 2 * o), t.y = 1 / 12 * e * (2 * s * 2 * s + 2 * o * 2 * o), t.z = 1 / 12 * e * (2 * r * 2 * r + 2 * s * 2 * s);
  }
  /**
   * @param face_i Index of the face
   */
  getPlaneConstantOfFace(e) {
    const t = this.faces[e], n = this.faceNormals[e], i = this.vertices[t[0]];
    return -n.dot(i);
  }
  /**
   * Clip a face against a hull.
   * @param worldVertsB1 An array of Vec3 with vertices in the world frame.
   * @param minDist Distance clamping
   * @param Array result Array to store resulting contact points in. Will be objects with properties: point, depth, normal. These are represented in world coordinates.
   */
  clipFaceAgainstHull(e, t, n, i, s, r, o) {
    const c = new x(), l = new x(), h = new x(), d = new x(), u = new x(), p = new x(), g = new x(), _ = new x(), m = this, f = [], v = i, M = f;
    let y = -1, w = Number.MAX_VALUE;
    for (let T = 0; T < m.faces.length; T++) {
      c.copy(m.faceNormals[T]), n.vmult(c, c);
      const O = c.dot(e);
      O < w && (w = O, y = T);
    }
    if (y < 0)
      return;
    const C = m.faces[y];
    C.connectedFaces = [];
    for (let T = 0; T < m.faces.length; T++)
      for (let O = 0; O < m.faces[T].length; O++)
        /* Sharing a vertex*/
        C.indexOf(m.faces[T][O]) !== -1 && /* Not the one we are looking for connections from */
        T !== y && /* Not already added */
        C.connectedFaces.indexOf(T) === -1 && C.connectedFaces.push(T);
    const P = C.length;
    for (let T = 0; T < P; T++) {
      const O = m.vertices[C[T]], k = m.vertices[C[(T + 1) % P]];
      O.vsub(k, l), h.copy(l), n.vmult(h, h), t.vadd(h, h), d.copy(this.faceNormals[y]), n.vmult(d, d), t.vadd(d, d), h.cross(d, u), u.negate(u), p.copy(O), n.vmult(p, p), t.vadd(p, p);
      const L = C.connectedFaces[T];
      g.copy(this.faceNormals[L]);
      const R = this.getPlaneConstantOfFace(L);
      _.copy(g), n.vmult(_, _);
      const D = R - _.dot(t);
      for (this.clipFaceAgainstPlane(v, M, _, D); v.length; )
        v.shift();
      for (; M.length; )
        v.push(M.shift());
    }
    g.copy(this.faceNormals[y]);
    const I = this.getPlaneConstantOfFace(y);
    _.copy(g), n.vmult(_, _);
    const S = I - _.dot(t);
    for (let T = 0; T < v.length; T++) {
      let O = _.dot(v[T]) + S;
      if (O <= s && (console.log(`clamped: depth=${O} to minDist=${s}`), O = s), O <= r) {
        const k = v[T];
        if (O <= 1e-6) {
          const L = {
            point: k,
            normal: _,
            depth: O
          };
          o.push(L);
        }
      }
    }
  }
  /**
   * Clip a face in a hull against the back of a plane.
   * @param planeConstant The constant in the mathematical plane equation
   */
  clipFaceAgainstPlane(e, t, n, i) {
    let s, r;
    const o = e.length;
    if (o < 2)
      return t;
    let c = e[e.length - 1], l = e[0];
    s = n.dot(c) + i;
    for (let h = 0; h < o; h++) {
      if (l = e[h], r = n.dot(l) + i, s < 0)
        if (r < 0) {
          const d = new x();
          d.copy(l), t.push(d);
        } else {
          const d = new x();
          c.lerp(l, s / (s - r), d), t.push(d);
        }
      else if (r < 0) {
        const d = new x();
        c.lerp(l, s / (s - r), d), t.push(d), t.push(l);
      }
      c = l, s = r;
    }
    return t;
  }
  /**
   * Updates `.worldVertices` and sets `.worldVerticesNeedsUpdate` to false.
   */
  computeWorldVertices(e, t) {
    for (; this.worldVertices.length < this.vertices.length; )
      this.worldVertices.push(new x());
    const n = this.vertices, i = this.worldVertices;
    for (let s = 0; s !== this.vertices.length; s++)
      t.vmult(n[s], i[s]), e.vadd(i[s], i[s]);
    this.worldVerticesNeedsUpdate = !1;
  }
  computeLocalAABB(e, t) {
    const n = this.vertices;
    e.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE), t.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    for (let i = 0; i < this.vertices.length; i++) {
      const s = n[i];
      s.x < e.x ? e.x = s.x : s.x > t.x && (t.x = s.x), s.y < e.y ? e.y = s.y : s.y > t.y && (t.y = s.y), s.z < e.z ? e.z = s.z : s.z > t.z && (t.z = s.z);
    }
  }
  /**
   * Updates `worldVertices` and sets `worldVerticesNeedsUpdate` to false.
   */
  computeWorldFaceNormals(e) {
    const t = this.faceNormals.length;
    for (; this.worldFaceNormals.length < t; )
      this.worldFaceNormals.push(new x());
    const n = this.faceNormals, i = this.worldFaceNormals;
    for (let s = 0; s !== t; s++)
      e.vmult(n[s], i[s]);
    this.worldFaceNormalsNeedsUpdate = !1;
  }
  /**
   * updateBoundingSphereRadius
   */
  updateBoundingSphereRadius() {
    let e = 0;
    const t = this.vertices;
    for (let n = 0; n !== t.length; n++) {
      const i = t[n].lengthSquared();
      i > e && (e = i);
    }
    this.boundingSphereRadius = Math.sqrt(e);
  }
  /**
   * calculateWorldAABB
   */
  calculateWorldAABB(e, t, n, i) {
    const s = this.vertices;
    let r, o, c, l, h, d, u = new x();
    for (let p = 0; p < s.length; p++) {
      u.copy(s[p]), t.vmult(u, u), e.vadd(u, u);
      const g = u;
      (r === void 0 || g.x < r) && (r = g.x), (l === void 0 || g.x > l) && (l = g.x), (o === void 0 || g.y < o) && (o = g.y), (h === void 0 || g.y > h) && (h = g.y), (c === void 0 || g.z < c) && (c = g.z), (d === void 0 || g.z > d) && (d = g.z);
    }
    n.set(r, o, c), i.set(l, h, d);
  }
  /**
   * Get approximate convex volume
   */
  volume() {
    return 4 * Math.PI * this.boundingSphereRadius / 3;
  }
  /**
   * Get an average of all the vertices positions
   */
  getAveragePointLocal(e) {
    e === void 0 && (e = new x());
    const t = this.vertices;
    for (let n = 0; n < t.length; n++)
      e.vadd(t[n], e);
    return e.scale(1 / t.length, e), e;
  }
  /**
   * Transform all local points. Will change the .vertices
   */
  transformAllPoints(e, t) {
    const n = this.vertices.length, i = this.vertices;
    if (t) {
      for (let s = 0; s < n; s++) {
        const r = i[s];
        t.vmult(r, r);
      }
      for (let s = 0; s < this.faceNormals.length; s++) {
        const r = this.faceNormals[s];
        t.vmult(r, r);
      }
    }
    if (e)
      for (let s = 0; s < n; s++) {
        const r = i[s];
        r.vadd(e, r);
      }
  }
  /**
   * Checks whether p is inside the polyhedra. Must be in local coords.
   * The point lies outside of the convex hull of the other points if and only if the direction
   * of all the vectors from it to those other points are on less than one half of a sphere around it.
   * @param p A point given in local coordinates
   */
  pointIsInside(e) {
    const t = this.vertices, n = this.faces, i = this.faceNormals, s = null, r = new x();
    this.getAveragePointLocal(r);
    for (let o = 0; o < this.faces.length; o++) {
      let c = i[o];
      const l = t[n[o][0]], h = new x();
      e.vsub(l, h);
      const d = c.dot(h), u = new x();
      r.vsub(l, u);
      const p = c.dot(u);
      if (d < 0 && p > 0 || d > 0 && p < 0)
        return !1;
    }
    return s ? 1 : -1;
  }
  /**
   * Get max and min dot product of a convex hull at position (pos,quat) projected onto an axis.
   * Results are saved in the array maxmin.
   * @param result result[0] and result[1] will be set to maximum and minimum, respectively.
   */
  static project(e, t, n, i, s) {
    const r = e.vertices.length, o = pl;
    let c = 0, l = 0;
    const h = ml, d = e.vertices;
    h.setZero(), Oe.vectorToLocalFrame(n, i, t, o), Oe.pointToLocalFrame(n, i, h, h);
    const u = h.dot(o);
    l = c = d[0].dot(o);
    for (let p = 1; p < r; p++) {
      const g = d[p].dot(o);
      g > c && (c = g), g < l && (l = g);
    }
    if (l -= u, c -= u, l > c) {
      const p = l;
      l = c, c = p;
    }
    s[0] = c, s[1] = l;
  }
}
const Es = [], Ts = [];
new x();
const pl = new x(), ml = new x();
class ms extends fe {
  /**
   * The half extents of the box.
   */
  /**
   * Used by the contact generator to make contacts with other convex polyhedra for example.
   */
  constructor(e) {
    super({
      type: fe.types.BOX
    }), this.halfExtents = e, this.convexPolyhedronRepresentation = null, this.updateConvexPolyhedronRepresentation(), this.updateBoundingSphereRadius();
  }
  /**
   * Updates the local convex polyhedron representation used for some collisions.
   */
  updateConvexPolyhedronRepresentation() {
    const e = this.halfExtents.x, t = this.halfExtents.y, n = this.halfExtents.z, i = x, s = [new i(-e, -t, -n), new i(e, -t, -n), new i(e, t, -n), new i(-e, t, -n), new i(-e, -t, n), new i(e, -t, n), new i(e, t, n), new i(-e, t, n)], r = [
      [3, 2, 1, 0],
      // -z
      [4, 5, 6, 7],
      // +z
      [5, 4, 0, 1],
      // -y
      [2, 3, 7, 6],
      // +y
      [0, 4, 7, 3],
      // -x
      [1, 2, 6, 5]
      // +x
    ], o = [new i(0, 0, 1), new i(0, 1, 0), new i(1, 0, 0)], c = new Pi({
      vertices: s,
      faces: r,
      axes: o
    });
    this.convexPolyhedronRepresentation = c, c.material = this.material;
  }
  /**
   * Calculate the inertia of the box.
   */
  calculateLocalInertia(e, t) {
    return t === void 0 && (t = new x()), ms.calculateInertia(this.halfExtents, e, t), t;
  }
  static calculateInertia(e, t, n) {
    const i = e;
    n.x = 1 / 12 * t * (2 * i.y * 2 * i.y + 2 * i.z * 2 * i.z), n.y = 1 / 12 * t * (2 * i.x * 2 * i.x + 2 * i.z * 2 * i.z), n.z = 1 / 12 * t * (2 * i.y * 2 * i.y + 2 * i.x * 2 * i.x);
  }
  /**
   * Get the box 6 side normals
   * @param sixTargetVectors An array of 6 vectors, to store the resulting side normals in.
   * @param quat Orientation to apply to the normal vectors. If not provided, the vectors will be in respect to the local frame.
   */
  getSideNormals(e, t) {
    const n = e, i = this.halfExtents;
    if (n[0].set(i.x, 0, 0), n[1].set(0, i.y, 0), n[2].set(0, 0, i.z), n[3].set(-i.x, 0, 0), n[4].set(0, -i.y, 0), n[5].set(0, 0, -i.z), t !== void 0)
      for (let s = 0; s !== n.length; s++)
        t.vmult(n[s], n[s]);
    return n;
  }
  /**
   * Returns the volume of the box.
   */
  volume() {
    return 8 * this.halfExtents.x * this.halfExtents.y * this.halfExtents.z;
  }
  /**
   * updateBoundingSphereRadius
   */
  updateBoundingSphereRadius() {
    this.boundingSphereRadius = this.halfExtents.length();
  }
  /**
   * forEachWorldCorner
   */
  forEachWorldCorner(e, t, n) {
    const i = this.halfExtents, s = [[i.x, i.y, i.z], [-i.x, i.y, i.z], [-i.x, -i.y, i.z], [-i.x, -i.y, -i.z], [i.x, -i.y, -i.z], [i.x, i.y, -i.z], [-i.x, i.y, -i.z], [i.x, -i.y, i.z]];
    for (let r = 0; r < s.length; r++)
      _n.set(s[r][0], s[r][1], s[r][2]), t.vmult(_n, _n), e.vadd(_n, _n), n(_n.x, _n.y, _n.z);
  }
  /**
   * calculateWorldAABB
   */
  calculateWorldAABB(e, t, n, i) {
    const s = this.halfExtents;
    Wt[0].set(s.x, s.y, s.z), Wt[1].set(-s.x, s.y, s.z), Wt[2].set(-s.x, -s.y, s.z), Wt[3].set(-s.x, -s.y, -s.z), Wt[4].set(s.x, -s.y, -s.z), Wt[5].set(s.x, s.y, -s.z), Wt[6].set(-s.x, s.y, -s.z), Wt[7].set(s.x, -s.y, s.z);
    const r = Wt[0];
    t.vmult(r, r), e.vadd(r, r), i.copy(r), n.copy(r);
    for (let o = 1; o < 8; o++) {
      const c = Wt[o];
      t.vmult(c, c), e.vadd(c, c);
      const l = c.x, h = c.y, d = c.z;
      l > i.x && (i.x = l), h > i.y && (i.y = h), d > i.z && (i.z = d), l < n.x && (n.x = l), h < n.y && (n.y = h), d < n.z && (n.z = d);
    }
  }
}
const _n = new x(), Wt = [new x(), new x(), new x(), new x(), new x(), new x(), new x(), new x()], gr = {
  /** DYNAMIC */
  DYNAMIC: 1,
  /** STATIC */
  STATIC: 2,
  /** KINEMATIC */
  KINEMATIC: 4
}, _r = {
  /** AWAKE */
  AWAKE: 0,
  /** SLEEPY */
  SLEEPY: 1,
  /** SLEEPING */
  SLEEPING: 2
};
class he extends ma {
  /**
   * Dispatched after two bodies collide. This event is dispatched on each
   * of the two bodies involved in the collision.
   * @event collide
   * @param body The body that was involved in the collision.
   * @param contact The details of the collision.
   */
  /**
   * A dynamic body is fully simulated. Can be moved manually by the user, but normally they move according to forces. A dynamic body can collide with all body types. A dynamic body always has finite, non-zero mass.
   */
  /**
   * A static body does not move during simulation and behaves as if it has infinite mass. Static bodies can be moved manually by setting the position of the body. The velocity of a static body is always zero. Static bodies do not collide with other static or kinematic bodies.
   */
  /**
   * A kinematic body moves under simulation according to its velocity. They do not respond to forces. They can be moved manually, but normally a kinematic body is moved by setting its velocity. A kinematic body behaves as if it has infinite mass. Kinematic bodies do not collide with other static or kinematic bodies.
   */
  /**
   * AWAKE
   */
  /**
   * SLEEPY
   */
  /**
   * SLEEPING
   */
  /**
   * Dispatched after a sleeping body has woken up.
   * @event wakeup
   */
  /**
   * Dispatched after a body has gone in to the sleepy state.
   * @event sleepy
   */
  /**
   * Dispatched after a body has fallen asleep.
   * @event sleep
   */
  constructor(e) {
    e === void 0 && (e = {}), super(), this.id = he.idCounter++, this.index = -1, this.world = null, this.vlambda = new x(), this.collisionFilterGroup = typeof e.collisionFilterGroup == "number" ? e.collisionFilterGroup : 1, this.collisionFilterMask = typeof e.collisionFilterMask == "number" ? e.collisionFilterMask : -1, this.collisionResponse = typeof e.collisionResponse == "boolean" ? e.collisionResponse : !0, this.position = new x(), this.previousPosition = new x(), this.interpolatedPosition = new x(), this.initPosition = new x(), e.position && (this.position.copy(e.position), this.previousPosition.copy(e.position), this.interpolatedPosition.copy(e.position), this.initPosition.copy(e.position)), this.velocity = new x(), e.velocity && this.velocity.copy(e.velocity), this.initVelocity = new x(), this.force = new x();
    const t = typeof e.mass == "number" ? e.mass : 0;
    this.mass = t, this.invMass = t > 0 ? 1 / t : 0, this.material = e.material || null, this.linearDamping = typeof e.linearDamping == "number" ? e.linearDamping : 0.01, this.type = t <= 0 ? he.STATIC : he.DYNAMIC, typeof e.type == typeof he.STATIC && (this.type = e.type), this.allowSleep = typeof e.allowSleep < "u" ? e.allowSleep : !0, this.sleepState = he.AWAKE, this.sleepSpeedLimit = typeof e.sleepSpeedLimit < "u" ? e.sleepSpeedLimit : 0.1, this.sleepTimeLimit = typeof e.sleepTimeLimit < "u" ? e.sleepTimeLimit : 1, this.timeLastSleepy = 0, this.wakeUpAfterNarrowphase = !1, this.torque = new x(), this.quaternion = new At(), this.initQuaternion = new At(), this.previousQuaternion = new At(), this.interpolatedQuaternion = new At(), e.quaternion && (this.quaternion.copy(e.quaternion), this.initQuaternion.copy(e.quaternion), this.previousQuaternion.copy(e.quaternion), this.interpolatedQuaternion.copy(e.quaternion)), this.angularVelocity = new x(), e.angularVelocity && this.angularVelocity.copy(e.angularVelocity), this.initAngularVelocity = new x(), this.shapes = [], this.shapeOffsets = [], this.shapeOrientations = [], this.inertia = new x(), this.invInertia = new x(), this.invInertiaWorld = new kt(), this.invMassSolve = 0, this.invInertiaSolve = new x(), this.invInertiaWorldSolve = new kt(), this.fixedRotation = typeof e.fixedRotation < "u" ? e.fixedRotation : !1, this.angularDamping = typeof e.angularDamping < "u" ? e.angularDamping : 0.01, this.linearFactor = new x(1, 1, 1), e.linearFactor && this.linearFactor.copy(e.linearFactor), this.angularFactor = new x(1, 1, 1), e.angularFactor && this.angularFactor.copy(e.angularFactor), this.aabb = new Lt(), this.aabbNeedsUpdate = !0, this.boundingRadius = 0, this.wlambda = new x(), this.isTrigger = !!e.isTrigger, e.shape && this.addShape(e.shape), this.updateMassProperties();
  }
  /**
   * Wake the body up.
   */
  wakeUp() {
    const e = this.sleepState;
    this.sleepState = he.AWAKE, this.wakeUpAfterNarrowphase = !1, e === he.SLEEPING && this.dispatchEvent(he.wakeupEvent);
  }
  /**
   * Force body sleep
   */
  sleep() {
    this.sleepState = he.SLEEPING, this.velocity.set(0, 0, 0), this.angularVelocity.set(0, 0, 0), this.wakeUpAfterNarrowphase = !1;
  }
  /**
   * Called every timestep to update internal sleep timer and change sleep state if needed.
   * @param time The world time in seconds
   */
  sleepTick(e) {
    if (this.allowSleep) {
      const t = this.sleepState, n = this.velocity.lengthSquared() + this.angularVelocity.lengthSquared(), i = this.sleepSpeedLimit ** 2;
      t === he.AWAKE && n < i ? (this.sleepState = he.SLEEPY, this.timeLastSleepy = e, this.dispatchEvent(he.sleepyEvent)) : t === he.SLEEPY && n > i ? this.wakeUp() : t === he.SLEEPY && e - this.timeLastSleepy > this.sleepTimeLimit && (this.sleep(), this.dispatchEvent(he.sleepEvent));
    }
  }
  /**
   * If the body is sleeping, it should be immovable / have infinite mass during solve. We solve it by having a separate "solve mass".
   */
  updateSolveMassProperties() {
    this.sleepState === he.SLEEPING || this.type === he.KINEMATIC ? (this.invMassSolve = 0, this.invInertiaSolve.setZero(), this.invInertiaWorldSolve.setZero()) : (this.invMassSolve = this.invMass, this.invInertiaSolve.copy(this.invInertia), this.invInertiaWorldSolve.copy(this.invInertiaWorld));
  }
  /**
   * Convert a world point to local body frame.
   */
  pointToLocalFrame(e, t) {
    return t === void 0 && (t = new x()), e.vsub(this.position, t), this.quaternion.conjugate().vmult(t, t), t;
  }
  /**
   * Convert a world vector to local body frame.
   */
  vectorToLocalFrame(e, t) {
    return t === void 0 && (t = new x()), this.quaternion.conjugate().vmult(e, t), t;
  }
  /**
   * Convert a local body point to world frame.
   */
  pointToWorldFrame(e, t) {
    return t === void 0 && (t = new x()), this.quaternion.vmult(e, t), t.vadd(this.position, t), t;
  }
  /**
   * Convert a local body point to world frame.
   */
  vectorToWorldFrame(e, t) {
    return t === void 0 && (t = new x()), this.quaternion.vmult(e, t), t;
  }
  /**
   * Add a shape to the body with a local offset and orientation.
   * @return The body object, for chainability.
   */
  addShape(e, t, n) {
    const i = new x(), s = new At();
    return t && i.copy(t), n && s.copy(n), this.shapes.push(e), this.shapeOffsets.push(i), this.shapeOrientations.push(s), this.updateMassProperties(), this.updateBoundingRadius(), this.aabbNeedsUpdate = !0, e.body = this, this;
  }
  /**
   * Remove a shape from the body.
   * @return The body object, for chainability.
   */
  removeShape(e) {
    const t = this.shapes.indexOf(e);
    return t === -1 ? (console.warn("Shape does not belong to the body"), this) : (this.shapes.splice(t, 1), this.shapeOffsets.splice(t, 1), this.shapeOrientations.splice(t, 1), this.updateMassProperties(), this.updateBoundingRadius(), this.aabbNeedsUpdate = !0, e.body = null, this);
  }
  /**
   * Update the bounding radius of the body. Should be done if any of the shapes are changed.
   */
  updateBoundingRadius() {
    const e = this.shapes, t = this.shapeOffsets, n = e.length;
    let i = 0;
    for (let s = 0; s !== n; s++) {
      const r = e[s];
      r.updateBoundingSphereRadius();
      const o = t[s].length(), c = r.boundingSphereRadius;
      o + c > i && (i = o + c);
    }
    this.boundingRadius = i;
  }
  /**
   * Updates the .aabb
   */
  updateAABB() {
    const e = this.shapes, t = this.shapeOffsets, n = this.shapeOrientations, i = e.length, s = gl, r = _l, o = this.quaternion, c = this.aabb, l = vl;
    for (let h = 0; h !== i; h++) {
      const d = e[h];
      o.vmult(t[h], s), s.vadd(this.position, s), o.mult(n[h], r), d.calculateWorldAABB(s, r, l.lowerBound, l.upperBound), h === 0 ? c.copy(l) : c.extend(l);
    }
    this.aabbNeedsUpdate = !1;
  }
  /**
   * Update `.inertiaWorld` and `.invInertiaWorld`
   */
  updateInertiaWorld(e) {
    const t = this.invInertia;
    if (!(t.x === t.y && t.y === t.z && !e)) {
      const n = xl, i = Ml;
      n.setRotationFromQuaternion(this.quaternion), n.transpose(i), n.scale(t, n), n.mmult(i, this.invInertiaWorld);
    }
  }
  /**
   * Apply force to a point of the body. This could for example be a point on the Body surface.
   * Applying force this way will add to Body.force and Body.torque.
   * @param force The amount of force to add.
   * @param relativePoint A point relative to the center of mass to apply the force on.
   */
  applyForce(e, t) {
    if (t === void 0 && (t = new x()), this.type !== he.DYNAMIC)
      return;
    this.sleepState === he.SLEEPING && this.wakeUp();
    const n = Sl;
    t.cross(e, n), this.force.vadd(e, this.force), this.torque.vadd(n, this.torque);
  }
  /**
   * Apply force to a local point in the body.
   * @param force The force vector to apply, defined locally in the body frame.
   * @param localPoint A local point in the body to apply the force on.
   */
  applyLocalForce(e, t) {
    if (t === void 0 && (t = new x()), this.type !== he.DYNAMIC)
      return;
    const n = wl, i = bl;
    this.vectorToWorldFrame(e, n), this.vectorToWorldFrame(t, i), this.applyForce(n, i);
  }
  /**
   * Apply torque to the body.
   * @param torque The amount of torque to add.
   */
  applyTorque(e) {
    this.type === he.DYNAMIC && (this.sleepState === he.SLEEPING && this.wakeUp(), this.torque.vadd(e, this.torque));
  }
  /**
   * Apply impulse to a point of the body. This could for example be a point on the Body surface.
   * An impulse is a force added to a body during a short period of time (impulse = force * time).
   * Impulses will be added to Body.velocity and Body.angularVelocity.
   * @param impulse The amount of impulse to add.
   * @param relativePoint A point relative to the center of mass to apply the force on.
   */
  applyImpulse(e, t) {
    if (t === void 0 && (t = new x()), this.type !== he.DYNAMIC)
      return;
    this.sleepState === he.SLEEPING && this.wakeUp();
    const n = t, i = El;
    i.copy(e), i.scale(this.invMass, i), this.velocity.vadd(i, this.velocity);
    const s = Tl;
    n.cross(e, s), this.invInertiaWorld.vmult(s, s), this.angularVelocity.vadd(s, this.angularVelocity);
  }
  /**
   * Apply locally-defined impulse to a local point in the body.
   * @param force The force vector to apply, defined locally in the body frame.
   * @param localPoint A local point in the body to apply the force on.
   */
  applyLocalImpulse(e, t) {
    if (t === void 0 && (t = new x()), this.type !== he.DYNAMIC)
      return;
    const n = Al, i = Cl;
    this.vectorToWorldFrame(e, n), this.vectorToWorldFrame(t, i), this.applyImpulse(n, i);
  }
  /**
   * Should be called whenever you change the body shape or mass.
   */
  updateMassProperties() {
    const e = Ll;
    this.invMass = this.mass > 0 ? 1 / this.mass : 0;
    const t = this.inertia, n = this.fixedRotation;
    this.updateAABB(), e.set((this.aabb.upperBound.x - this.aabb.lowerBound.x) / 2, (this.aabb.upperBound.y - this.aabb.lowerBound.y) / 2, (this.aabb.upperBound.z - this.aabb.lowerBound.z) / 2), ms.calculateInertia(e, this.mass, t), this.invInertia.set(t.x > 0 && !n ? 1 / t.x : 0, t.y > 0 && !n ? 1 / t.y : 0, t.z > 0 && !n ? 1 / t.z : 0), this.updateInertiaWorld(!0);
  }
  /**
   * Get world velocity of a point in the body.
   * @param worldPoint
   * @param result
   * @return The result vector.
   */
  getVelocityAtWorldPoint(e, t) {
    const n = new x();
    return e.vsub(this.position, n), this.angularVelocity.cross(n, t), this.velocity.vadd(t, t), t;
  }
  /**
   * Move the body forward in time.
   * @param dt Time step
   * @param quatNormalize Set to true to normalize the body quaternion
   * @param quatNormalizeFast If the quaternion should be normalized using "fast" quaternion normalization
   */
  integrate(e, t, n) {
    if (this.previousPosition.copy(this.position), this.previousQuaternion.copy(this.quaternion), !(this.type === he.DYNAMIC || this.type === he.KINEMATIC) || this.sleepState === he.SLEEPING)
      return;
    const i = this.velocity, s = this.angularVelocity, r = this.position, o = this.force, c = this.torque, l = this.quaternion, h = this.invMass, d = this.invInertiaWorld, u = this.linearFactor, p = h * e;
    i.x += o.x * p * u.x, i.y += o.y * p * u.y, i.z += o.z * p * u.z;
    const g = d.elements, _ = this.angularFactor, m = c.x * _.x, f = c.y * _.y, v = c.z * _.z;
    s.x += e * (g[0] * m + g[1] * f + g[2] * v), s.y += e * (g[3] * m + g[4] * f + g[5] * v), s.z += e * (g[6] * m + g[7] * f + g[8] * v), r.x += i.x * e, r.y += i.y * e, r.z += i.z * e, l.integrate(this.angularVelocity, e, this.angularFactor, l), t && (n ? l.normalizeFast() : l.normalize()), this.aabbNeedsUpdate = !0, this.updateInertiaWorld();
  }
}
he.idCounter = 0;
he.COLLIDE_EVENT_NAME = "collide";
he.DYNAMIC = gr.DYNAMIC;
he.STATIC = gr.STATIC;
he.KINEMATIC = gr.KINEMATIC;
he.AWAKE = _r.AWAKE;
he.SLEEPY = _r.SLEEPY;
he.SLEEPING = _r.SLEEPING;
he.wakeupEvent = {
  type: "wakeup"
};
he.sleepyEvent = {
  type: "sleepy"
};
he.sleepEvent = {
  type: "sleep"
};
const gl = new x(), _l = new At(), vl = new Lt(), xl = new kt(), Ml = new kt(), yl = new kt(), Sl = new x(), wl = new x(), bl = new x(), El = new x(), Tl = new x(), Al = new x(), Cl = new x(), Ll = new x();
class Pl {
  /**
   * The world to search for collisions in.
   */
  /**
   * If set to true, the broadphase uses bounding boxes for intersection tests, else it uses bounding spheres.
   */
  /**
   * Set to true if the objects in the world moved.
   */
  constructor() {
    this.world = null, this.useBoundingBoxes = !1, this.dirty = !0;
  }
  /**
   * Get the collision pairs from the world
   * @param world The world to search in
   * @param p1 Empty array to be filled with body objects
   * @param p2 Empty array to be filled with body objects
   */
  collisionPairs(e, t, n) {
    throw new Error("collisionPairs not implemented for this BroadPhase class!");
  }
  /**
   * Check if a body pair needs to be intersection tested at all.
   */
  needBroadphaseCollision(e, t) {
    return !(!(e.collisionFilterGroup & t.collisionFilterMask) || !(t.collisionFilterGroup & e.collisionFilterMask) || (e.type & he.STATIC || e.sleepState === he.SLEEPING) && (t.type & he.STATIC || t.sleepState === he.SLEEPING));
  }
  /**
   * Check if the bounding volumes of two bodies intersect.
   */
  intersectionTest(e, t, n, i) {
    this.useBoundingBoxes ? this.doBoundingBoxBroadphase(e, t, n, i) : this.doBoundingSphereBroadphase(e, t, n, i);
  }
  /**
   * Check if the bounding spheres of two bodies are intersecting.
   * @param pairs1 bodyA is appended to this array if intersection
   * @param pairs2 bodyB is appended to this array if intersection
   */
  doBoundingSphereBroadphase(e, t, n, i) {
    const s = Rl;
    t.position.vsub(e.position, s);
    const r = (e.boundingRadius + t.boundingRadius) ** 2;
    s.lengthSquared() < r && (n.push(e), i.push(t));
  }
  /**
   * Check if the bounding boxes of two bodies are intersecting.
   */
  doBoundingBoxBroadphase(e, t, n, i) {
    e.aabbNeedsUpdate && e.updateAABB(), t.aabbNeedsUpdate && t.updateAABB(), e.aabb.overlaps(t.aabb) && (n.push(e), i.push(t));
  }
  /**
   * Removes duplicate pairs from the pair arrays.
   */
  makePairsUnique(e, t) {
    const n = Dl, i = Il, s = Ul, r = e.length;
    for (let o = 0; o !== r; o++)
      i[o] = e[o], s[o] = t[o];
    e.length = 0, t.length = 0;
    for (let o = 0; o !== r; o++) {
      const c = i[o].id, l = s[o].id, h = c < l ? `${c},${l}` : `${l},${c}`;
      n[h] = o, n.keys.push(h);
    }
    for (let o = 0; o !== n.keys.length; o++) {
      const c = n.keys.pop(), l = n[c];
      e.push(i[l]), t.push(s[l]), delete n[c];
    }
  }
  /**
   * To be implemented by subcasses
   */
  setWorld(e) {
  }
  /**
   * Check if the bounding spheres of two bodies overlap.
   */
  static boundingSphereCheck(e, t) {
    const n = new x();
    e.position.vsub(t.position, n);
    const i = e.shapes[0], s = t.shapes[0];
    return Math.pow(i.boundingSphereRadius + s.boundingSphereRadius, 2) > n.lengthSquared();
  }
  /**
   * Returns all the bodies within the AABB.
   */
  aabbQuery(e, t, n) {
    return console.warn(".aabbQuery is not implemented in this Broadphase subclass."), [];
  }
}
const Rl = new x();
new x();
new At();
new x();
const Dl = {
  keys: []
}, Il = [], Ul = [];
new x();
new x();
new x();
class Nl extends Pl {
  /**
   * @todo Remove useless constructor
   */
  constructor() {
    super();
  }
  /**
   * Get all the collision pairs in the physics world
   */
  collisionPairs(e, t, n) {
    const i = e.bodies, s = i.length;
    let r, o;
    for (let c = 0; c !== s; c++)
      for (let l = 0; l !== c; l++)
        r = i[c], o = i[l], this.needBroadphaseCollision(r, o) && this.intersectionTest(r, o, t, n);
  }
  /**
   * Returns all the bodies within an AABB.
   * @param result An array to store resulting bodies in.
   */
  aabbQuery(e, t, n) {
    n === void 0 && (n = []);
    for (let i = 0; i < e.bodies.length; i++) {
      const s = e.bodies[i];
      s.aabbNeedsUpdate && s.updateAABB(), s.aabb.overlaps(t) && n.push(s);
    }
    return n;
  }
}
class fs {
  /**
   * rayFromWorld
   */
  /**
   * rayToWorld
   */
  /**
   * hitNormalWorld
   */
  /**
   * hitPointWorld
   */
  /**
   * hasHit
   */
  /**
   * shape
   */
  /**
   * body
   */
  /**
   * The index of the hit triangle, if the hit shape was a trimesh
   */
  /**
   * Distance to the hit. Will be set to -1 if there was no hit
   */
  /**
   * If the ray should stop traversing the bodies
   */
  constructor() {
    this.rayFromWorld = new x(), this.rayToWorld = new x(), this.hitNormalWorld = new x(), this.hitPointWorld = new x(), this.hasHit = !1, this.shape = null, this.body = null, this.hitFaceIndex = -1, this.distance = -1, this.shouldStop = !1;
  }
  /**
   * Reset all result data.
   */
  reset() {
    this.rayFromWorld.setZero(), this.rayToWorld.setZero(), this.hitNormalWorld.setZero(), this.hitPointWorld.setZero(), this.hasHit = !1, this.shape = null, this.body = null, this.hitFaceIndex = -1, this.distance = -1, this.shouldStop = !1;
  }
  /**
   * abort
   */
  abort() {
    this.shouldStop = !0;
  }
  /**
   * Set result data.
   */
  set(e, t, n, i, s, r, o) {
    this.rayFromWorld.copy(e), this.rayToWorld.copy(t), this.hitNormalWorld.copy(n), this.hitPointWorld.copy(i), this.shape = s, this.body = r, this.distance = o;
  }
}
let ga, _a, va, xa, Ma, ya, Sa;
const vr = {
  /** CLOSEST */
  CLOSEST: 1,
  /** ANY */
  ANY: 2,
  /** ALL */
  ALL: 4
};
ga = fe.types.SPHERE;
_a = fe.types.PLANE;
va = fe.types.BOX;
xa = fe.types.CYLINDER;
Ma = fe.types.CONVEXPOLYHEDRON;
ya = fe.types.HEIGHTFIELD;
Sa = fe.types.TRIMESH;
let Jt = class Yt {
  /**
   * from
   */
  /**
   * to
   */
  /**
   * direction
   */
  /**
   * The precision of the ray. Used when checking parallelity etc.
   * @default 0.0001
   */
  /**
   * Set to `false` if you don't want the Ray to take `collisionResponse` flags into account on bodies and shapes.
   * @default true
   */
  /**
   * If set to `true`, the ray skips any hits with normal.dot(rayDirection) < 0.
   * @default false
   */
  /**
   * collisionFilterMask
   * @default -1
   */
  /**
   * collisionFilterGroup
   * @default -1
   */
  /**
   * The intersection mode. Should be Ray.ANY, Ray.ALL or Ray.CLOSEST.
   * @default RAY.ANY
   */
  /**
   * Current result object.
   */
  /**
   * Will be set to `true` during intersectWorld() if the ray hit anything.
   */
  /**
   * User-provided result callback. Will be used if mode is Ray.ALL.
   */
  /**
   * CLOSEST
   */
  /**
   * ANY
   */
  /**
   * ALL
   */
  get [ga]() {
    return this._intersectSphere;
  }
  get [_a]() {
    return this._intersectPlane;
  }
  get [va]() {
    return this._intersectBox;
  }
  get [xa]() {
    return this._intersectConvex;
  }
  get [Ma]() {
    return this._intersectConvex;
  }
  get [ya]() {
    return this._intersectHeightfield;
  }
  get [Sa]() {
    return this._intersectTrimesh;
  }
  constructor(e, t) {
    e === void 0 && (e = new x()), t === void 0 && (t = new x()), this.from = e.clone(), this.to = t.clone(), this.direction = new x(), this.precision = 1e-4, this.checkCollisionResponse = !0, this.skipBackfaces = !1, this.collisionFilterMask = -1, this.collisionFilterGroup = -1, this.mode = Yt.ANY, this.result = new fs(), this.hasHit = !1, this.callback = (n) => {
    };
  }
  /**
   * Do itersection against all bodies in the given World.
   * @return True if the ray hit anything, otherwise false.
   */
  intersectWorld(e, t) {
    return this.mode = t.mode || Yt.ANY, this.result = t.result || new fs(), this.skipBackfaces = !!t.skipBackfaces, this.collisionFilterMask = typeof t.collisionFilterMask < "u" ? t.collisionFilterMask : -1, this.collisionFilterGroup = typeof t.collisionFilterGroup < "u" ? t.collisionFilterGroup : -1, this.checkCollisionResponse = typeof t.checkCollisionResponse < "u" ? t.checkCollisionResponse : !0, t.from && this.from.copy(t.from), t.to && this.to.copy(t.to), this.callback = t.callback || (() => {
    }), this.hasHit = !1, this.result.reset(), this.updateDirection(), this.getAABB(Nr), As.length = 0, e.broadphase.aabbQuery(e, Nr, As), this.intersectBodies(As), this.hasHit;
  }
  /**
   * Shoot a ray at a body, get back information about the hit.
   * @deprecated @param result set the result property of the Ray instead.
   */
  intersectBody(e, t) {
    t && (this.result = t, this.updateDirection());
    const n = this.checkCollisionResponse;
    if (n && !e.collisionResponse || !(this.collisionFilterGroup & e.collisionFilterMask) || !(e.collisionFilterGroup & this.collisionFilterMask))
      return;
    const i = zl, s = Fl;
    for (let r = 0, o = e.shapes.length; r < o; r++) {
      const c = e.shapes[r];
      if (!(n && !c.collisionResponse) && (e.quaternion.mult(e.shapeOrientations[r], s), e.quaternion.vmult(e.shapeOffsets[r], i), i.vadd(e.position, i), this.intersectShape(c, s, i, e), this.result.shouldStop))
        break;
    }
  }
  /**
   * Shoot a ray at an array bodies, get back information about the hit.
   * @param bodies An array of Body objects.
   * @deprecated @param result set the result property of the Ray instead.
   *
   */
  intersectBodies(e, t) {
    t && (this.result = t, this.updateDirection());
    for (let n = 0, i = e.length; !this.result.shouldStop && n < i; n++)
      this.intersectBody(e[n]);
  }
  /**
   * Updates the direction vector.
   */
  updateDirection() {
    this.to.vsub(this.from, this.direction), this.direction.normalize();
  }
  intersectShape(e, t, n, i) {
    const s = this.from;
    if (Kl(s, this.direction, n) > e.boundingSphereRadius)
      return;
    const o = this[e.type];
    o && o.call(this, e, t, n, i, e);
  }
  _intersectBox(e, t, n, i, s) {
    return this._intersectConvex(e.convexPolyhedronRepresentation, t, n, i, s);
  }
  _intersectPlane(e, t, n, i, s) {
    const r = this.from, o = this.to, c = this.direction, l = new x(0, 0, 1);
    t.vmult(l, l);
    const h = new x();
    r.vsub(n, h);
    const d = h.dot(l);
    o.vsub(n, h);
    const u = h.dot(l);
    if (d * u > 0 || r.distanceTo(o) < d)
      return;
    const p = l.dot(c);
    if (Math.abs(p) < this.precision)
      return;
    const g = new x(), _ = new x(), m = new x();
    r.vsub(n, g);
    const f = -l.dot(g) / p;
    c.scale(f, _), r.vadd(_, m), this.reportIntersection(l, m, s, i, -1);
  }
  /**
   * Get the world AABB of the ray.
   */
  getAABB(e) {
    const {
      lowerBound: t,
      upperBound: n
    } = e, i = this.to, s = this.from;
    t.x = Math.min(i.x, s.x), t.y = Math.min(i.y, s.y), t.z = Math.min(i.z, s.z), n.x = Math.max(i.x, s.x), n.y = Math.max(i.y, s.y), n.z = Math.max(i.z, s.z);
  }
  _intersectHeightfield(e, t, n, i, s) {
    e.data, e.elementSize;
    const r = Ol;
    r.from.copy(this.from), r.to.copy(this.to), Oe.pointToLocalFrame(n, t, r.from, r.from), Oe.pointToLocalFrame(n, t, r.to, r.to), r.updateDirection();
    const o = Bl;
    let c, l, h, d;
    c = l = 0, h = d = e.data.length - 1;
    const u = new Lt();
    r.getAABB(u), e.getIndexOfPosition(u.lowerBound.x, u.lowerBound.y, o, !0), c = Math.max(c, o[0]), l = Math.max(l, o[1]), e.getIndexOfPosition(u.upperBound.x, u.upperBound.y, o, !0), h = Math.min(h, o[0] + 1), d = Math.min(d, o[1] + 1);
    for (let p = c; p < h; p++)
      for (let g = l; g < d; g++) {
        if (this.result.shouldStop)
          return;
        if (e.getAabbAtIndex(p, g, u), !!u.overlapsRay(r)) {
          if (e.getConvexTrianglePillar(p, g, !1), Oe.pointToWorldFrame(n, t, e.pillarOffset, Bi), this._intersectConvex(e.pillarConvex, t, Bi, i, s, zr), this.result.shouldStop)
            return;
          e.getConvexTrianglePillar(p, g, !0), Oe.pointToWorldFrame(n, t, e.pillarOffset, Bi), this._intersectConvex(e.pillarConvex, t, Bi, i, s, zr);
        }
      }
  }
  _intersectSphere(e, t, n, i, s) {
    const r = this.from, o = this.to, c = e.radius, l = (o.x - r.x) ** 2 + (o.y - r.y) ** 2 + (o.z - r.z) ** 2, h = 2 * ((o.x - r.x) * (r.x - n.x) + (o.y - r.y) * (r.y - n.y) + (o.z - r.z) * (r.z - n.z)), d = (r.x - n.x) ** 2 + (r.y - n.y) ** 2 + (r.z - n.z) ** 2 - c ** 2, u = h ** 2 - 4 * l * d, p = Gl, g = Vl;
    if (!(u < 0))
      if (u === 0)
        r.lerp(o, u, p), p.vsub(n, g), g.normalize(), this.reportIntersection(g, p, s, i, -1);
      else {
        const _ = (-h - Math.sqrt(u)) / (2 * l), m = (-h + Math.sqrt(u)) / (2 * l);
        if (_ >= 0 && _ <= 1 && (r.lerp(o, _, p), p.vsub(n, g), g.normalize(), this.reportIntersection(g, p, s, i, -1)), this.result.shouldStop)
          return;
        m >= 0 && m <= 1 && (r.lerp(o, m, p), p.vsub(n, g), g.normalize(), this.reportIntersection(g, p, s, i, -1));
      }
  }
  _intersectConvex(e, t, n, i, s, r) {
    const o = kl, c = Fr, l = r && r.faceList || null, h = e.faces, d = e.vertices, u = e.faceNormals, p = this.direction, g = this.from, _ = this.to, m = g.distanceTo(_), f = l ? l.length : h.length, v = this.result;
    for (let M = 0; !v.shouldStop && M < f; M++) {
      const y = l ? l[M] : M, w = h[y], C = u[y], P = t, I = n;
      c.copy(d[w[0]]), P.vmult(c, c), c.vadd(I, c), c.vsub(g, c), P.vmult(C, o);
      const S = p.dot(o);
      if (Math.abs(S) < this.precision)
        continue;
      const T = o.dot(c) / S;
      if (!(T < 0)) {
        p.scale(T, xt), xt.vadd(g, xt), Nt.copy(d[w[0]]), P.vmult(Nt, Nt), I.vadd(Nt, Nt);
        for (let O = 1; !v.shouldStop && O < w.length - 1; O++) {
          qt.copy(d[w[O]]), Xt.copy(d[w[O + 1]]), P.vmult(qt, qt), P.vmult(Xt, Xt), I.vadd(qt, qt), I.vadd(Xt, Xt);
          const k = xt.distanceTo(g);
          !(Yt.pointInTriangle(xt, Nt, qt, Xt) || Yt.pointInTriangle(xt, qt, Nt, Xt)) || k > m || this.reportIntersection(o, xt, s, i, y);
        }
      }
    }
  }
  /**
   * @todo Optimize by transforming the world to local space first.
   * @todo Use Octree lookup
   */
  _intersectTrimesh(e, t, n, i, s, r) {
    const o = Hl, c = $l, l = Zl, h = Fr, d = Wl, u = ql, p = Xl, g = Yl, _ = jl, m = e.indices;
    e.vertices;
    const f = this.from, v = this.to, M = this.direction;
    l.position.copy(n), l.quaternion.copy(t), Oe.vectorToLocalFrame(n, t, M, d), Oe.pointToLocalFrame(n, t, f, u), Oe.pointToLocalFrame(n, t, v, p), p.x *= e.scale.x, p.y *= e.scale.y, p.z *= e.scale.z, u.x *= e.scale.x, u.y *= e.scale.y, u.z *= e.scale.z, p.vsub(u, d), d.normalize();
    const y = u.distanceSquared(p);
    e.tree.rayQuery(this, l, c);
    for (let w = 0, C = c.length; !this.result.shouldStop && w !== C; w++) {
      const P = c[w];
      e.getNormal(P, o), e.getVertex(m[P * 3], Nt), Nt.vsub(u, h);
      const I = d.dot(o), S = o.dot(h) / I;
      if (S < 0)
        continue;
      d.scale(S, xt), xt.vadd(u, xt), e.getVertex(m[P * 3 + 1], qt), e.getVertex(m[P * 3 + 2], Xt);
      const T = xt.distanceSquared(u);
      !(Yt.pointInTriangle(xt, qt, Nt, Xt) || Yt.pointInTriangle(xt, Nt, qt, Xt)) || T > y || (Oe.vectorToWorldFrame(t, o, _), Oe.pointToWorldFrame(n, t, xt, g), this.reportIntersection(_, g, s, i, P));
    }
    c.length = 0;
  }
  /**
   * @return True if the intersections should continue
   */
  reportIntersection(e, t, n, i, s) {
    const r = this.from, o = this.to, c = r.distanceTo(t), l = this.result;
    if (!(this.skipBackfaces && e.dot(this.direction) > 0))
      switch (l.hitFaceIndex = typeof s < "u" ? s : -1, this.mode) {
        case Yt.ALL:
          this.hasHit = !0, l.set(r, o, e, t, n, i, c), l.hasHit = !0, this.callback(l);
          break;
        case Yt.CLOSEST:
          (c < l.distance || !l.hasHit) && (this.hasHit = !0, l.hasHit = !0, l.set(r, o, e, t, n, i, c));
          break;
        case Yt.ANY:
          this.hasHit = !0, l.hasHit = !0, l.set(r, o, e, t, n, i, c), l.shouldStop = !0;
          break;
      }
  }
  /**
   * As per "Barycentric Technique" as named
   * {@link https://www.blackpawn.com/texts/pointinpoly/default.html here} but without the division
   */
  static pointInTriangle(e, t, n, i) {
    i.vsub(t, Nn), n.vsub(t, Mi), e.vsub(t, Cs);
    const s = Nn.dot(Nn), r = Nn.dot(Mi), o = Nn.dot(Cs), c = Mi.dot(Mi), l = Mi.dot(Cs);
    let h, d;
    return (h = c * o - r * l) >= 0 && (d = s * l - r * o) >= 0 && h + d < s * c - r * r;
  }
};
Jt.CLOSEST = vr.CLOSEST;
Jt.ANY = vr.ANY;
Jt.ALL = vr.ALL;
const Nr = new Lt(), As = [], Mi = new x(), Cs = new x(), zl = new x(), Fl = new At(), xt = new x(), Nt = new x(), qt = new x(), Xt = new x();
new x();
new fs();
const zr = {
  faceList: [0]
}, Bi = new x(), Ol = new Jt(), Bl = [], Gl = new x(), Vl = new x(), kl = new x();
new x();
new x();
const Fr = new x(), Hl = new x(), Wl = new x(), ql = new x(), Xl = new x(), jl = new x(), Yl = new x();
new Lt();
const $l = [], Zl = new Oe(), Nn = new x(), Gi = new x();
function Kl(a, e, t) {
  t.vsub(a, Nn);
  const n = Nn.dot(e);
  return e.scale(n, Gi), Gi.vadd(a, Gi), t.distanceTo(Gi);
}
class Jl {
  /**
   * Extend an options object with default values.
   * @param options The options object. May be falsy: in this case, a new object is created and returned.
   * @param defaults An object containing default values.
   * @return The modified options object.
   */
  static defaults(e, t) {
    e === void 0 && (e = {});
    for (let n in t)
      n in e || (e[n] = t[n]);
    return e;
  }
}
class Or {
  /**
   * spatial
   */
  /**
   * rotational
   */
  constructor() {
    this.spatial = new x(), this.rotational = new x();
  }
  /**
   * Multiply with other JacobianElement
   */
  multiplyElement(e) {
    return e.spatial.dot(this.spatial) + e.rotational.dot(this.rotational);
  }
  /**
   * Multiply with two vectors
   */
  multiplyVectors(e, t) {
    return e.dot(this.spatial) + t.dot(this.rotational);
  }
}
class Ui {
  /**
   * Minimum (read: negative max) force to be applied by the constraint.
   */
  /**
   * Maximum (read: positive max) force to be applied by the constraint.
   */
  /**
   * SPOOK parameter
   */
  /**
   * SPOOK parameter
   */
  /**
   * SPOOK parameter
   */
  /**
   * A number, proportional to the force added to the bodies.
   */
  constructor(e, t, n, i) {
    n === void 0 && (n = -1e6), i === void 0 && (i = 1e6), this.id = Ui.idCounter++, this.minForce = n, this.maxForce = i, this.bi = e, this.bj = t, this.a = 0, this.b = 0, this.eps = 0, this.jacobianElementA = new Or(), this.jacobianElementB = new Or(), this.enabled = !0, this.multiplier = 0, this.setSpookParams(1e7, 4, 1 / 60);
  }
  /**
   * Recalculates a, b, and eps.
   *
   * The Equation constructor sets typical SPOOK parameters as such:
   * * `stiffness` = 1e7
   * * `relaxation` = 4
   * * `timeStep`= 1 / 60, _note the hardcoded refresh rate._
   */
  setSpookParams(e, t, n) {
    const i = t, s = e, r = n;
    this.a = 4 / (r * (1 + 4 * i)), this.b = 4 * i / (1 + 4 * i), this.eps = 4 / (r * r * s * (1 + 4 * i));
  }
  /**
   * Computes the right hand side of the SPOOK equation
   */
  computeB(e, t, n) {
    const i = this.computeGW(), s = this.computeGq(), r = this.computeGiMf();
    return -s * e - i * t - r * n;
  }
  /**
   * Computes G*q, where q are the generalized body coordinates
   */
  computeGq() {
    const e = this.jacobianElementA, t = this.jacobianElementB, n = this.bi, i = this.bj, s = n.position, r = i.position;
    return e.spatial.dot(s) + t.spatial.dot(r);
  }
  /**
   * Computes G*W, where W are the body velocities
   */
  computeGW() {
    const e = this.jacobianElementA, t = this.jacobianElementB, n = this.bi, i = this.bj, s = n.velocity, r = i.velocity, o = n.angularVelocity, c = i.angularVelocity;
    return e.multiplyVectors(s, o) + t.multiplyVectors(r, c);
  }
  /**
   * Computes G*Wlambda, where W are the body velocities
   */
  computeGWlambda() {
    const e = this.jacobianElementA, t = this.jacobianElementB, n = this.bi, i = this.bj, s = n.vlambda, r = i.vlambda, o = n.wlambda, c = i.wlambda;
    return e.multiplyVectors(s, o) + t.multiplyVectors(r, c);
  }
  /**
   * Computes G*inv(M)*f, where M is the mass matrix with diagonal blocks for each body, and f are the forces on the bodies.
   */
  computeGiMf() {
    const e = this.jacobianElementA, t = this.jacobianElementB, n = this.bi, i = this.bj, s = n.force, r = n.torque, o = i.force, c = i.torque, l = n.invMassSolve, h = i.invMassSolve;
    return s.scale(l, Br), o.scale(h, Gr), n.invInertiaWorldSolve.vmult(r, Vr), i.invInertiaWorldSolve.vmult(c, kr), e.multiplyVectors(Br, Vr) + t.multiplyVectors(Gr, kr);
  }
  /**
   * Computes G*inv(M)*G'
   */
  computeGiMGt() {
    const e = this.jacobianElementA, t = this.jacobianElementB, n = this.bi, i = this.bj, s = n.invMassSolve, r = i.invMassSolve, o = n.invInertiaWorldSolve, c = i.invInertiaWorldSolve;
    let l = s + r;
    return o.vmult(e.rotational, Vi), l += Vi.dot(e.rotational), c.vmult(t.rotational, Vi), l += Vi.dot(t.rotational), l;
  }
  /**
   * Add constraint velocity to the bodies.
   */
  addToWlambda(e) {
    const t = this.jacobianElementA, n = this.jacobianElementB, i = this.bi, s = this.bj, r = Ql;
    i.vlambda.addScaledVector(i.invMassSolve * e, t.spatial, i.vlambda), s.vlambda.addScaledVector(s.invMassSolve * e, n.spatial, s.vlambda), i.invInertiaWorldSolve.vmult(t.rotational, r), i.wlambda.addScaledVector(e, r, i.wlambda), s.invInertiaWorldSolve.vmult(n.rotational, r), s.wlambda.addScaledVector(e, r, s.wlambda);
  }
  /**
   * Compute the denominator part of the SPOOK equation: C = G*inv(M)*G' + eps
   */
  computeC() {
    return this.computeGiMGt() + this.eps;
  }
}
Ui.idCounter = 0;
const Br = new x(), Gr = new x(), Vr = new x(), kr = new x(), Vi = new x(), Ql = new x();
class ec extends Ui {
  /**
   * "bounciness": u1 = -e*u0
   */
  /**
   * World-oriented vector that goes from the center of bi to the contact point.
   */
  /**
   * World-oriented vector that starts in body j position and goes to the contact point.
   */
  /**
   * Contact normal, pointing out of body i.
   */
  constructor(e, t, n) {
    n === void 0 && (n = 1e6), super(e, t, 0, n), this.restitution = 0, this.ri = new x(), this.rj = new x(), this.ni = new x();
  }
  computeB(e) {
    const t = this.a, n = this.b, i = this.bi, s = this.bj, r = this.ri, o = this.rj, c = tc, l = nc, h = i.velocity, d = i.angularVelocity;
    i.force, i.torque;
    const u = s.velocity, p = s.angularVelocity;
    s.force, s.torque;
    const g = ic, _ = this.jacobianElementA, m = this.jacobianElementB, f = this.ni;
    r.cross(f, c), o.cross(f, l), f.negate(_.spatial), c.negate(_.rotational), m.spatial.copy(f), m.rotational.copy(l), g.copy(s.position), g.vadd(o, g), g.vsub(i.position, g), g.vsub(r, g);
    const v = f.dot(g), M = this.restitution + 1, y = M * u.dot(f) - M * h.dot(f) + p.dot(l) - d.dot(c), w = this.computeGiMf();
    return -v * t - y * n - e * w;
  }
  /**
   * Get the current relative velocity in the contact point.
   */
  getImpactVelocityAlongNormal() {
    const e = sc, t = rc, n = oc, i = ac, s = lc;
    return this.bi.position.vadd(this.ri, n), this.bj.position.vadd(this.rj, i), this.bi.getVelocityAtWorldPoint(n, e), this.bj.getVelocityAtWorldPoint(i, t), e.vsub(t, s), this.ni.dot(s);
  }
}
const tc = new x(), nc = new x(), ic = new x(), sc = new x(), rc = new x(), oc = new x(), ac = new x(), lc = new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
class Hr extends Ui {
  // Tangent
  /**
   * @param slipForce should be +-F_friction = +-mu * F_normal = +-mu * m * g
   */
  constructor(e, t, n) {
    super(e, t, -n, n), this.ri = new x(), this.rj = new x(), this.t = new x();
  }
  computeB(e) {
    this.a;
    const t = this.b;
    this.bi, this.bj;
    const n = this.ri, i = this.rj, s = cc, r = hc, o = this.t;
    n.cross(o, s), i.cross(o, r);
    const c = this.jacobianElementA, l = this.jacobianElementB;
    o.negate(c.spatial), s.negate(c.rotational), l.spatial.copy(o), l.rotational.copy(r);
    const h = this.computeGW(), d = this.computeGiMf();
    return -h * t - e * d;
  }
}
const cc = new x(), hc = new x();
class gs {
  /**
   * Identifier of this material.
   */
  /**
   * Participating materials.
   */
  /**
   * Friction coefficient.
   * @default 0.3
   */
  /**
   * Restitution coefficient.
   * @default 0.3
   */
  /**
   * Stiffness of the produced contact equations.
   * @default 1e7
   */
  /**
   * Relaxation time of the produced contact equations.
   * @default 3
   */
  /**
   * Stiffness of the produced friction equations.
   * @default 1e7
   */
  /**
   * Relaxation time of the produced friction equations
   * @default 3
   */
  constructor(e, t, n) {
    n = Jl.defaults(n, {
      friction: 0.3,
      restitution: 0.3,
      contactEquationStiffness: 1e7,
      contactEquationRelaxation: 3,
      frictionEquationStiffness: 1e7,
      frictionEquationRelaxation: 3
    }), this.id = gs.idCounter++, this.materials = [e, t], this.friction = n.friction, this.restitution = n.restitution, this.contactEquationStiffness = n.contactEquationStiffness, this.contactEquationRelaxation = n.contactEquationRelaxation, this.frictionEquationStiffness = n.frictionEquationStiffness, this.frictionEquationRelaxation = n.frictionEquationRelaxation;
  }
}
gs.idCounter = 0;
let wa = class ba {
  /**
   * Material name.
   * If options is a string, name will be set to that string.
   * @todo Deprecate this
   */
  /** Material id. */
  /**
   * Friction for this material.
   * If non-negative, it will be used instead of the friction given by ContactMaterials. If there's no matching ContactMaterial, the value from `defaultContactMaterial` in the World will be used.
   */
  /**
   * Restitution for this material.
   * If non-negative, it will be used instead of the restitution given by ContactMaterials. If there's no matching ContactMaterial, the value from `defaultContactMaterial` in the World will be used.
   */
  constructor(e) {
    e === void 0 && (e = {});
    let t = "";
    typeof e == "string" && (t = e, e = {}), this.name = t, this.id = ba.idCounter++, this.friction = typeof e.friction < "u" ? e.friction : -1, this.restitution = typeof e.restitution < "u" ? e.restitution : -1;
  }
};
wa.idCounter = 0;
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new Jt();
new x();
new x();
new x();
new x(1, 0, 0), new x(0, 1, 0), new x(0, 0, 1);
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new Lt();
new x();
new Lt();
new x();
new x();
new x();
new x();
new x();
new x();
new x();
new Lt();
new x();
new Oe();
new Lt();
class uc {
  /**
   * All equations to be solved
   */
  /**
   * @todo remove useless constructor
   */
  constructor() {
    this.equations = [];
  }
  /**
   * Should be implemented in subclasses!
   * @todo use abstract
   * @return number of iterations performed
   */
  solve(e, t) {
    return (
      // Should return the number of iterations done!
      0
    );
  }
  /**
   * Add an equation
   */
  addEquation(e) {
    e.enabled && !e.bi.isTrigger && !e.bj.isTrigger && this.equations.push(e);
  }
  /**
   * Remove an equation
   */
  removeEquation(e) {
    const t = this.equations, n = t.indexOf(e);
    n !== -1 && t.splice(n, 1);
  }
  /**
   * Add all equations
   */
  removeAllEquations() {
    this.equations.length = 0;
  }
}
class dc extends uc {
  /**
   * The number of solver iterations determines quality of the constraints in the world.
   * The more iterations, the more correct simulation. More iterations need more computations though. If you have a large gravity force in your world, you will need more iterations.
   */
  /**
   * When tolerance is reached, the system is assumed to be converged.
   */
  /**
   * @todo remove useless constructor
   */
  constructor() {
    super(), this.iterations = 10, this.tolerance = 1e-7;
  }
  /**
   * Solve
   * @return number of iterations performed
   */
  solve(e, t) {
    let n = 0;
    const i = this.iterations, s = this.tolerance * this.tolerance, r = this.equations, o = r.length, c = t.bodies, l = c.length, h = e;
    let d, u, p, g, _, m;
    if (o !== 0)
      for (let y = 0; y !== l; y++)
        c[y].updateSolveMassProperties();
    const f = pc, v = mc, M = fc;
    f.length = o, v.length = o, M.length = o;
    for (let y = 0; y !== o; y++) {
      const w = r[y];
      M[y] = 0, v[y] = w.computeB(h), f[y] = 1 / w.computeC();
    }
    if (o !== 0) {
      for (let C = 0; C !== l; C++) {
        const P = c[C], I = P.vlambda, S = P.wlambda;
        I.set(0, 0, 0), S.set(0, 0, 0);
      }
      for (n = 0; n !== i; n++) {
        g = 0;
        for (let C = 0; C !== o; C++) {
          const P = r[C];
          d = v[C], u = f[C], m = M[C], _ = P.computeGWlambda(), p = u * (d - _ - P.eps * m), m + p < P.minForce ? p = P.minForce - m : m + p > P.maxForce && (p = P.maxForce - m), M[C] += p, g += p > 0 ? p : -p, P.addToWlambda(p);
        }
        if (g * g < s)
          break;
      }
      for (let C = 0; C !== l; C++) {
        const P = c[C], I = P.velocity, S = P.angularVelocity;
        P.vlambda.vmul(P.linearFactor, P.vlambda), I.vadd(P.vlambda, I), P.wlambda.vmul(P.angularFactor, P.wlambda), S.vadd(P.wlambda, S);
      }
      let y = r.length;
      const w = 1 / h;
      for (; y--; )
        r[y].multiplier = M[y] * w;
    }
    return n;
  }
}
const fc = [], pc = [], mc = [];
he.STATIC;
class gc {
  constructor() {
    this.objects = [], this.type = Object;
  }
  /**
   * Release an object after use
   */
  release() {
    const e = arguments.length;
    for (let t = 0; t !== e; t++)
      this.objects.push(t < 0 || arguments.length <= t ? void 0 : arguments[t]);
    return this;
  }
  /**
   * Get an object
   */
  get() {
    return this.objects.length === 0 ? this.constructObject() : this.objects.pop();
  }
  /**
   * Construct an object. Should be implemented in each subclass.
   */
  constructObject() {
    throw new Error("constructObject() not implemented in this Pool subclass yet!");
  }
  /**
   * @return Self, for chaining
   */
  resize(e) {
    const t = this.objects;
    for (; t.length > e; )
      t.pop();
    for (; t.length < e; )
      t.push(this.constructObject());
    return this;
  }
}
class _c extends gc {
  constructor() {
    super(...arguments), this.type = x;
  }
  /**
   * Construct a vector
   */
  constructObject() {
    return new x();
  }
}
const qe = {
  sphereSphere: fe.types.SPHERE,
  spherePlane: fe.types.SPHERE | fe.types.PLANE,
  boxBox: fe.types.BOX | fe.types.BOX,
  sphereBox: fe.types.SPHERE | fe.types.BOX,
  planeBox: fe.types.PLANE | fe.types.BOX,
  convexConvex: fe.types.CONVEXPOLYHEDRON,
  sphereConvex: fe.types.SPHERE | fe.types.CONVEXPOLYHEDRON,
  planeConvex: fe.types.PLANE | fe.types.CONVEXPOLYHEDRON,
  boxConvex: fe.types.BOX | fe.types.CONVEXPOLYHEDRON,
  sphereHeightfield: fe.types.SPHERE | fe.types.HEIGHTFIELD,
  boxHeightfield: fe.types.BOX | fe.types.HEIGHTFIELD,
  convexHeightfield: fe.types.CONVEXPOLYHEDRON | fe.types.HEIGHTFIELD,
  sphereParticle: fe.types.PARTICLE | fe.types.SPHERE,
  planeParticle: fe.types.PLANE | fe.types.PARTICLE,
  boxParticle: fe.types.BOX | fe.types.PARTICLE,
  convexParticle: fe.types.PARTICLE | fe.types.CONVEXPOLYHEDRON,
  cylinderCylinder: fe.types.CYLINDER,
  sphereCylinder: fe.types.SPHERE | fe.types.CYLINDER,
  planeCylinder: fe.types.PLANE | fe.types.CYLINDER,
  boxCylinder: fe.types.BOX | fe.types.CYLINDER,
  convexCylinder: fe.types.CONVEXPOLYHEDRON | fe.types.CYLINDER,
  heightfieldCylinder: fe.types.HEIGHTFIELD | fe.types.CYLINDER,
  particleCylinder: fe.types.PARTICLE | fe.types.CYLINDER,
  sphereTrimesh: fe.types.SPHERE | fe.types.TRIMESH,
  planeTrimesh: fe.types.PLANE | fe.types.TRIMESH
};
class vc {
  /**
   * Internal storage of pooled contact points.
   */
  /**
   * Pooled vectors.
   */
  get [qe.sphereSphere]() {
    return this.sphereSphere;
  }
  get [qe.spherePlane]() {
    return this.spherePlane;
  }
  get [qe.boxBox]() {
    return this.boxBox;
  }
  get [qe.sphereBox]() {
    return this.sphereBox;
  }
  get [qe.planeBox]() {
    return this.planeBox;
  }
  get [qe.convexConvex]() {
    return this.convexConvex;
  }
  get [qe.sphereConvex]() {
    return this.sphereConvex;
  }
  get [qe.planeConvex]() {
    return this.planeConvex;
  }
  get [qe.boxConvex]() {
    return this.boxConvex;
  }
  get [qe.sphereHeightfield]() {
    return this.sphereHeightfield;
  }
  get [qe.boxHeightfield]() {
    return this.boxHeightfield;
  }
  get [qe.convexHeightfield]() {
    return this.convexHeightfield;
  }
  get [qe.sphereParticle]() {
    return this.sphereParticle;
  }
  get [qe.planeParticle]() {
    return this.planeParticle;
  }
  get [qe.boxParticle]() {
    return this.boxParticle;
  }
  get [qe.convexParticle]() {
    return this.convexParticle;
  }
  get [qe.cylinderCylinder]() {
    return this.convexConvex;
  }
  get [qe.sphereCylinder]() {
    return this.sphereConvex;
  }
  get [qe.planeCylinder]() {
    return this.planeConvex;
  }
  get [qe.boxCylinder]() {
    return this.boxConvex;
  }
  get [qe.convexCylinder]() {
    return this.convexConvex;
  }
  get [qe.heightfieldCylinder]() {
    return this.heightfieldCylinder;
  }
  get [qe.particleCylinder]() {
    return this.particleCylinder;
  }
  get [qe.sphereTrimesh]() {
    return this.sphereTrimesh;
  }
  get [qe.planeTrimesh]() {
    return this.planeTrimesh;
  }
  // get [COLLISION_TYPES.convexTrimesh]() {
  //   return this.convexTrimesh
  // }
  constructor(e) {
    this.contactPointPool = [], this.frictionEquationPool = [], this.result = [], this.frictionResult = [], this.v3pool = new _c(), this.world = e, this.currentContactMaterial = e.defaultContactMaterial, this.enableFrictionReduction = !1;
  }
  /**
   * Make a contact object, by using the internal pool or creating a new one.
   */
  createContactEquation(e, t, n, i, s, r) {
    let o;
    this.contactPointPool.length ? (o = this.contactPointPool.pop(), o.bi = e, o.bj = t) : o = new ec(e, t), o.enabled = e.collisionResponse && t.collisionResponse && n.collisionResponse && i.collisionResponse;
    const c = this.currentContactMaterial;
    o.restitution = c.restitution, o.setSpookParams(c.contactEquationStiffness, c.contactEquationRelaxation, this.world.dt);
    const l = n.material || e.material, h = i.material || t.material;
    return l && h && l.restitution >= 0 && h.restitution >= 0 && (o.restitution = l.restitution * h.restitution), o.si = s || n, o.sj = r || i, o;
  }
  createFrictionEquationsFromContact(e, t) {
    const n = e.bi, i = e.bj, s = e.si, r = e.sj, o = this.world, c = this.currentContactMaterial;
    let l = c.friction;
    const h = s.material || n.material, d = r.material || i.material;
    if (h && d && h.friction >= 0 && d.friction >= 0 && (l = h.friction * d.friction), l > 0) {
      const u = l * (o.frictionGravity || o.gravity).length();
      let p = n.invMass + i.invMass;
      p > 0 && (p = 1 / p);
      const g = this.frictionEquationPool, _ = g.length ? g.pop() : new Hr(n, i, u * p), m = g.length ? g.pop() : new Hr(n, i, u * p);
      return _.bi = m.bi = n, _.bj = m.bj = i, _.minForce = m.minForce = -u * p, _.maxForce = m.maxForce = u * p, _.ri.copy(e.ri), _.rj.copy(e.rj), m.ri.copy(e.ri), m.rj.copy(e.rj), e.ni.tangents(_.t, m.t), _.setSpookParams(c.frictionEquationStiffness, c.frictionEquationRelaxation, o.dt), m.setSpookParams(c.frictionEquationStiffness, c.frictionEquationRelaxation, o.dt), _.enabled = m.enabled = e.enabled, t.push(_, m), !0;
    }
    return !1;
  }
  /**
   * Take the average N latest contact point on the plane.
   */
  createFrictionFromAverage(e) {
    let t = this.result[this.result.length - 1];
    if (!this.createFrictionEquationsFromContact(t, this.frictionResult) || e === 1)
      return;
    const n = this.frictionResult[this.frictionResult.length - 2], i = this.frictionResult[this.frictionResult.length - 1];
    Cn.setZero(), kn.setZero(), Hn.setZero();
    const s = t.bi;
    t.bj;
    for (let o = 0; o !== e; o++)
      t = this.result[this.result.length - 1 - o], t.bi !== s ? (Cn.vadd(t.ni, Cn), kn.vadd(t.ri, kn), Hn.vadd(t.rj, Hn)) : (Cn.vsub(t.ni, Cn), kn.vadd(t.rj, kn), Hn.vadd(t.ri, Hn));
    const r = 1 / e;
    kn.scale(r, n.ri), Hn.scale(r, n.rj), i.ri.copy(n.ri), i.rj.copy(n.rj), Cn.normalize(), Cn.tangents(n.t, i.t);
  }
  /**
   * Generate all contacts between a list of body pairs
   * @param p1 Array of body indices
   * @param p2 Array of body indices
   * @param result Array to store generated contacts
   * @param oldcontacts Optional. Array of reusable contact objects
   */
  getContacts(e, t, n, i, s, r, o) {
    this.contactPointPool = s, this.frictionEquationPool = o, this.result = i, this.frictionResult = r;
    const c = yc, l = Sc, h = xc, d = Mc;
    for (let u = 0, p = e.length; u !== p; u++) {
      const g = e[u], _ = t[u];
      let m = null;
      g.material && _.material && (m = n.getContactMaterial(g.material, _.material) || null);
      const f = g.type & he.KINEMATIC && _.type & he.STATIC || g.type & he.STATIC && _.type & he.KINEMATIC || g.type & he.KINEMATIC && _.type & he.KINEMATIC;
      for (let v = 0; v < g.shapes.length; v++) {
        g.quaternion.mult(g.shapeOrientations[v], c), g.quaternion.vmult(g.shapeOffsets[v], h), h.vadd(g.position, h);
        const M = g.shapes[v];
        for (let y = 0; y < _.shapes.length; y++) {
          _.quaternion.mult(_.shapeOrientations[y], l), _.quaternion.vmult(_.shapeOffsets[y], d), d.vadd(_.position, d);
          const w = _.shapes[y];
          if (!(M.collisionFilterMask & w.collisionFilterGroup && w.collisionFilterMask & M.collisionFilterGroup) || h.distanceTo(d) > M.boundingSphereRadius + w.boundingSphereRadius)
            continue;
          let C = null;
          M.material && w.material && (C = n.getContactMaterial(M.material, w.material) || null), this.currentContactMaterial = C || m || n.defaultContactMaterial;
          const P = M.type | w.type, I = this[P];
          if (I) {
            let S = !1;
            M.type < w.type ? S = I.call(this, M, w, h, d, c, l, g, _, M, w, f) : S = I.call(this, w, M, d, h, l, c, _, g, M, w, f), S && f && (n.shapeOverlapKeeper.set(M.id, w.id), n.bodyOverlapKeeper.set(g.id, _.id));
          }
        }
      }
    }
  }
  sphereSphere(e, t, n, i, s, r, o, c, l, h, d) {
    if (d)
      return n.distanceSquared(i) < (e.radius + t.radius) ** 2;
    const u = this.createContactEquation(o, c, e, t, l, h);
    i.vsub(n, u.ni), u.ni.normalize(), u.ri.copy(u.ni), u.rj.copy(u.ni), u.ri.scale(e.radius, u.ri), u.rj.scale(-t.radius, u.rj), u.ri.vadd(n, u.ri), u.ri.vsub(o.position, u.ri), u.rj.vadd(i, u.rj), u.rj.vsub(c.position, u.rj), this.result.push(u), this.createFrictionEquationsFromContact(u, this.frictionResult);
  }
  spherePlane(e, t, n, i, s, r, o, c, l, h, d) {
    const u = this.createContactEquation(o, c, e, t, l, h);
    if (u.ni.set(0, 0, 1), r.vmult(u.ni, u.ni), u.ni.negate(u.ni), u.ni.normalize(), u.ni.scale(e.radius, u.ri), n.vsub(i, ki), u.ni.scale(u.ni.dot(ki), Wr), ki.vsub(Wr, u.rj), -ki.dot(u.ni) <= e.radius) {
      if (d)
        return !0;
      const p = u.ri, g = u.rj;
      p.vadd(n, p), p.vsub(o.position, p), g.vadd(i, g), g.vsub(c.position, g), this.result.push(u), this.createFrictionEquationsFromContact(u, this.frictionResult);
    }
  }
  boxBox(e, t, n, i, s, r, o, c, l, h, d) {
    return e.convexPolyhedronRepresentation.material = e.material, t.convexPolyhedronRepresentation.material = t.material, e.convexPolyhedronRepresentation.collisionResponse = e.collisionResponse, t.convexPolyhedronRepresentation.collisionResponse = t.collisionResponse, this.convexConvex(e.convexPolyhedronRepresentation, t.convexPolyhedronRepresentation, n, i, s, r, o, c, e, t, d);
  }
  sphereBox(e, t, n, i, s, r, o, c, l, h, d) {
    const u = this.v3pool, p = Yc;
    n.vsub(i, Hi), t.getSideNormals(p, r);
    const g = e.radius;
    let _ = !1;
    const m = Zc, f = Kc, v = Jc;
    let M = null, y = 0, w = 0, C = 0, P = null;
    for (let N = 0, K = p.length; N !== K && _ === !1; N++) {
      const B = qc;
      B.copy(p[N]);
      const H = B.length();
      B.normalize();
      const Q = Hi.dot(B);
      if (Q < H + g && Q > 0) {
        const ce = Xc, Z = jc;
        ce.copy(p[(N + 1) % 3]), Z.copy(p[(N + 2) % 3]);
        const W = ce.length(), J = Z.length();
        ce.normalize(), Z.normalize();
        const se = Hi.dot(ce), oe = Hi.dot(Z);
        if (se < W && se > -W && oe < J && oe > -J) {
          const V = Math.abs(Q - H - g);
          if ((P === null || V < P) && (P = V, w = se, C = oe, M = H, m.copy(B), f.copy(ce), v.copy(Z), y++, d))
            return !0;
        }
      }
    }
    if (y) {
      _ = !0;
      const N = this.createContactEquation(o, c, e, t, l, h);
      m.scale(-g, N.ri), N.ni.copy(m), N.ni.negate(N.ni), m.scale(M, m), f.scale(w, f), m.vadd(f, m), v.scale(C, v), m.vadd(v, N.rj), N.ri.vadd(n, N.ri), N.ri.vsub(o.position, N.ri), N.rj.vadd(i, N.rj), N.rj.vsub(c.position, N.rj), this.result.push(N), this.createFrictionEquationsFromContact(N, this.frictionResult);
    }
    let I = u.get();
    const S = $c;
    for (let N = 0; N !== 2 && !_; N++)
      for (let K = 0; K !== 2 && !_; K++)
        for (let B = 0; B !== 2 && !_; B++)
          if (I.set(0, 0, 0), N ? I.vadd(p[0], I) : I.vsub(p[0], I), K ? I.vadd(p[1], I) : I.vsub(p[1], I), B ? I.vadd(p[2], I) : I.vsub(p[2], I), i.vadd(I, S), S.vsub(n, S), S.lengthSquared() < g * g) {
            if (d)
              return !0;
            _ = !0;
            const H = this.createContactEquation(o, c, e, t, l, h);
            H.ri.copy(S), H.ri.normalize(), H.ni.copy(H.ri), H.ri.scale(g, H.ri), H.rj.copy(I), H.ri.vadd(n, H.ri), H.ri.vsub(o.position, H.ri), H.rj.vadd(i, H.rj), H.rj.vsub(c.position, H.rj), this.result.push(H), this.createFrictionEquationsFromContact(H, this.frictionResult);
          }
    u.release(I), I = null;
    const T = u.get(), O = u.get(), k = u.get(), L = u.get(), R = u.get(), D = p.length;
    for (let N = 0; N !== D && !_; N++)
      for (let K = 0; K !== D && !_; K++)
        if (N % 3 !== K % 3) {
          p[K].cross(p[N], T), T.normalize(), p[N].vadd(p[K], O), k.copy(n), k.vsub(O, k), k.vsub(i, k);
          const B = k.dot(T);
          T.scale(B, L);
          let H = 0;
          for (; H === N % 3 || H === K % 3; )
            H++;
          R.copy(n), R.vsub(L, R), R.vsub(O, R), R.vsub(i, R);
          const Q = Math.abs(B), ce = R.length();
          if (Q < p[H].length() && ce < g) {
            if (d)
              return !0;
            _ = !0;
            const Z = this.createContactEquation(o, c, e, t, l, h);
            O.vadd(L, Z.rj), Z.rj.copy(Z.rj), R.negate(Z.ni), Z.ni.normalize(), Z.ri.copy(Z.rj), Z.ri.vadd(i, Z.ri), Z.ri.vsub(n, Z.ri), Z.ri.normalize(), Z.ri.scale(g, Z.ri), Z.ri.vadd(n, Z.ri), Z.ri.vsub(o.position, Z.ri), Z.rj.vadd(i, Z.rj), Z.rj.vsub(c.position, Z.rj), this.result.push(Z), this.createFrictionEquationsFromContact(Z, this.frictionResult);
          }
        }
    u.release(T, O, k, L, R);
  }
  planeBox(e, t, n, i, s, r, o, c, l, h, d) {
    return t.convexPolyhedronRepresentation.material = t.material, t.convexPolyhedronRepresentation.collisionResponse = t.collisionResponse, t.convexPolyhedronRepresentation.id = t.id, this.planeConvex(e, t.convexPolyhedronRepresentation, n, i, s, r, o, c, e, t, d);
  }
  convexConvex(e, t, n, i, s, r, o, c, l, h, d, u, p) {
    const g = fh;
    if (!(n.distanceTo(i) > e.boundingSphereRadius + t.boundingSphereRadius) && e.findSeparatingAxis(t, n, s, i, r, g, u, p)) {
      const _ = [], m = ph;
      e.clipAgainstHull(n, s, t, i, r, g, -100, 100, _);
      let f = 0;
      for (let v = 0; v !== _.length; v++) {
        if (d)
          return !0;
        const M = this.createContactEquation(o, c, e, t, l, h), y = M.ri, w = M.rj;
        g.negate(M.ni), _[v].normal.negate(m), m.scale(_[v].depth, m), _[v].point.vadd(m, y), w.copy(_[v].point), y.vsub(n, y), w.vsub(i, w), y.vadd(n, y), y.vsub(o.position, y), w.vadd(i, w), w.vsub(c.position, w), this.result.push(M), f++, this.enableFrictionReduction || this.createFrictionEquationsFromContact(M, this.frictionResult);
      }
      this.enableFrictionReduction && f && this.createFrictionFromAverage(f);
    }
  }
  sphereConvex(e, t, n, i, s, r, o, c, l, h, d) {
    const u = this.v3pool;
    n.vsub(i, Qc);
    const p = t.faceNormals, g = t.faces, _ = t.vertices, m = e.radius;
    let f = !1;
    for (let v = 0; v !== _.length; v++) {
      const M = _[v], y = ih;
      r.vmult(M, y), i.vadd(y, y);
      const w = nh;
      if (y.vsub(n, w), w.lengthSquared() < m * m) {
        if (d)
          return !0;
        f = !0;
        const C = this.createContactEquation(o, c, e, t, l, h);
        C.ri.copy(w), C.ri.normalize(), C.ni.copy(C.ri), C.ri.scale(m, C.ri), y.vsub(i, C.rj), C.ri.vadd(n, C.ri), C.ri.vsub(o.position, C.ri), C.rj.vadd(i, C.rj), C.rj.vsub(c.position, C.rj), this.result.push(C), this.createFrictionEquationsFromContact(C, this.frictionResult);
        return;
      }
    }
    for (let v = 0, M = g.length; v !== M && f === !1; v++) {
      const y = p[v], w = g[v], C = sh;
      r.vmult(y, C);
      const P = rh;
      r.vmult(_[w[0]], P), P.vadd(i, P);
      const I = oh;
      C.scale(-m, I), n.vadd(I, I);
      const S = ah;
      I.vsub(P, S);
      const T = S.dot(C), O = lh;
      if (n.vsub(P, O), T < 0 && O.dot(C) > 0) {
        const k = [];
        for (let L = 0, R = w.length; L !== R; L++) {
          const D = u.get();
          r.vmult(_[w[L]], D), i.vadd(D, D), k.push(D);
        }
        if (Wc(k, C, n)) {
          if (d)
            return !0;
          f = !0;
          const L = this.createContactEquation(o, c, e, t, l, h);
          C.scale(-m, L.ri), C.negate(L.ni);
          const R = u.get();
          C.scale(-T, R);
          const D = u.get();
          C.scale(-m, D), n.vsub(i, L.rj), L.rj.vadd(D, L.rj), L.rj.vadd(R, L.rj), L.rj.vadd(i, L.rj), L.rj.vsub(c.position, L.rj), L.ri.vadd(n, L.ri), L.ri.vsub(o.position, L.ri), u.release(R), u.release(D), this.result.push(L), this.createFrictionEquationsFromContact(L, this.frictionResult);
          for (let N = 0, K = k.length; N !== K; N++)
            u.release(k[N]);
          return;
        } else
          for (let L = 0; L !== w.length; L++) {
            const R = u.get(), D = u.get();
            r.vmult(_[w[(L + 1) % w.length]], R), r.vmult(_[w[(L + 2) % w.length]], D), i.vadd(R, R), i.vadd(D, D);
            const N = eh;
            D.vsub(R, N);
            const K = th;
            N.unit(K);
            const B = u.get(), H = u.get();
            n.vsub(R, H);
            const Q = H.dot(K);
            K.scale(Q, B), B.vadd(R, B);
            const ce = u.get();
            if (B.vsub(n, ce), Q > 0 && Q * Q < N.lengthSquared() && ce.lengthSquared() < m * m) {
              if (d)
                return !0;
              const Z = this.createContactEquation(o, c, e, t, l, h);
              B.vsub(i, Z.rj), B.vsub(n, Z.ni), Z.ni.normalize(), Z.ni.scale(m, Z.ri), Z.rj.vadd(i, Z.rj), Z.rj.vsub(c.position, Z.rj), Z.ri.vadd(n, Z.ri), Z.ri.vsub(o.position, Z.ri), this.result.push(Z), this.createFrictionEquationsFromContact(Z, this.frictionResult);
              for (let W = 0, J = k.length; W !== J; W++)
                u.release(k[W]);
              u.release(R), u.release(D), u.release(B), u.release(ce), u.release(H);
              return;
            }
            u.release(R), u.release(D), u.release(B), u.release(ce), u.release(H);
          }
        for (let L = 0, R = k.length; L !== R; L++)
          u.release(k[L]);
      }
    }
  }
  planeConvex(e, t, n, i, s, r, o, c, l, h, d) {
    const u = ch, p = hh;
    p.set(0, 0, 1), s.vmult(p, p);
    let g = 0;
    const _ = uh;
    for (let m = 0; m !== t.vertices.length; m++)
      if (u.copy(t.vertices[m]), r.vmult(u, u), i.vadd(u, u), u.vsub(n, _), p.dot(_) <= 0) {
        if (d)
          return !0;
        const v = this.createContactEquation(o, c, e, t, l, h), M = dh;
        p.scale(p.dot(_), M), u.vsub(M, M), M.vsub(n, v.ri), v.ni.copy(p), u.vsub(i, v.rj), v.ri.vadd(n, v.ri), v.ri.vsub(o.position, v.ri), v.rj.vadd(i, v.rj), v.rj.vsub(c.position, v.rj), this.result.push(v), g++, this.enableFrictionReduction || this.createFrictionEquationsFromContact(v, this.frictionResult);
      }
    this.enableFrictionReduction && g && this.createFrictionFromAverage(g);
  }
  boxConvex(e, t, n, i, s, r, o, c, l, h, d) {
    return e.convexPolyhedronRepresentation.material = e.material, e.convexPolyhedronRepresentation.collisionResponse = e.collisionResponse, this.convexConvex(e.convexPolyhedronRepresentation, t, n, i, s, r, o, c, e, t, d);
  }
  sphereHeightfield(e, t, n, i, s, r, o, c, l, h, d) {
    const u = t.data, p = e.radius, g = t.elementSize, _ = Th, m = Eh;
    Oe.pointToLocalFrame(i, r, n, m);
    let f = Math.floor((m.x - p) / g) - 1, v = Math.ceil((m.x + p) / g) + 1, M = Math.floor((m.y - p) / g) - 1, y = Math.ceil((m.y + p) / g) + 1;
    if (v < 0 || y < 0 || f > u.length || M > u[0].length)
      return;
    f < 0 && (f = 0), v < 0 && (v = 0), M < 0 && (M = 0), y < 0 && (y = 0), f >= u.length && (f = u.length - 1), v >= u.length && (v = u.length - 1), y >= u[0].length && (y = u[0].length - 1), M >= u[0].length && (M = u[0].length - 1);
    const w = [];
    t.getRectMinMax(f, M, v, y, w);
    const C = w[0], P = w[1];
    if (m.z - p > P || m.z + p < C)
      return;
    const I = this.result;
    for (let S = f; S < v; S++)
      for (let T = M; T < y; T++) {
        const O = I.length;
        let k = !1;
        if (t.getConvexTrianglePillar(S, T, !1), Oe.pointToWorldFrame(i, r, t.pillarOffset, _), n.distanceTo(_) < t.pillarConvex.boundingSphereRadius + e.boundingSphereRadius && (k = this.sphereConvex(e, t.pillarConvex, n, _, s, r, o, c, e, t, d)), d && k || (t.getConvexTrianglePillar(S, T, !0), Oe.pointToWorldFrame(i, r, t.pillarOffset, _), n.distanceTo(_) < t.pillarConvex.boundingSphereRadius + e.boundingSphereRadius && (k = this.sphereConvex(e, t.pillarConvex, n, _, s, r, o, c, e, t, d)), d && k))
          return !0;
        if (I.length - O > 2)
          return;
      }
  }
  boxHeightfield(e, t, n, i, s, r, o, c, l, h, d) {
    return e.convexPolyhedronRepresentation.material = e.material, e.convexPolyhedronRepresentation.collisionResponse = e.collisionResponse, this.convexHeightfield(e.convexPolyhedronRepresentation, t, n, i, s, r, o, c, e, t, d);
  }
  convexHeightfield(e, t, n, i, s, r, o, c, l, h, d) {
    const u = t.data, p = t.elementSize, g = e.boundingSphereRadius, _ = wh, m = bh, f = Sh;
    Oe.pointToLocalFrame(i, r, n, f);
    let v = Math.floor((f.x - g) / p) - 1, M = Math.ceil((f.x + g) / p) + 1, y = Math.floor((f.y - g) / p) - 1, w = Math.ceil((f.y + g) / p) + 1;
    if (M < 0 || w < 0 || v > u.length || y > u[0].length)
      return;
    v < 0 && (v = 0), M < 0 && (M = 0), y < 0 && (y = 0), w < 0 && (w = 0), v >= u.length && (v = u.length - 1), M >= u.length && (M = u.length - 1), w >= u[0].length && (w = u[0].length - 1), y >= u[0].length && (y = u[0].length - 1);
    const C = [];
    t.getRectMinMax(v, y, M, w, C);
    const P = C[0], I = C[1];
    if (!(f.z - g > I || f.z + g < P))
      for (let S = v; S < M; S++)
        for (let T = y; T < w; T++) {
          let O = !1;
          if (t.getConvexTrianglePillar(S, T, !1), Oe.pointToWorldFrame(i, r, t.pillarOffset, _), n.distanceTo(_) < t.pillarConvex.boundingSphereRadius + e.boundingSphereRadius && (O = this.convexConvex(e, t.pillarConvex, n, _, s, r, o, c, null, null, d, m, null)), d && O || (t.getConvexTrianglePillar(S, T, !0), Oe.pointToWorldFrame(i, r, t.pillarOffset, _), n.distanceTo(_) < t.pillarConvex.boundingSphereRadius + e.boundingSphereRadius && (O = this.convexConvex(e, t.pillarConvex, n, _, s, r, o, c, null, null, d, m, null)), d && O))
            return !0;
        }
  }
  sphereParticle(e, t, n, i, s, r, o, c, l, h, d) {
    const u = vh;
    if (u.set(0, 0, 1), i.vsub(n, u), u.lengthSquared() <= e.radius * e.radius) {
      if (d)
        return !0;
      const g = this.createContactEquation(c, o, t, e, l, h);
      u.normalize(), g.rj.copy(u), g.rj.scale(e.radius, g.rj), g.ni.copy(u), g.ni.negate(g.ni), g.ri.set(0, 0, 0), this.result.push(g), this.createFrictionEquationsFromContact(g, this.frictionResult);
    }
  }
  planeParticle(e, t, n, i, s, r, o, c, l, h, d) {
    const u = mh;
    u.set(0, 0, 1), o.quaternion.vmult(u, u);
    const p = gh;
    if (i.vsub(o.position, p), u.dot(p) <= 0) {
      if (d)
        return !0;
      const _ = this.createContactEquation(c, o, t, e, l, h);
      _.ni.copy(u), _.ni.negate(_.ni), _.ri.set(0, 0, 0);
      const m = _h;
      u.scale(u.dot(i), m), i.vsub(m, m), _.rj.copy(m), this.result.push(_), this.createFrictionEquationsFromContact(_, this.frictionResult);
    }
  }
  boxParticle(e, t, n, i, s, r, o, c, l, h, d) {
    return e.convexPolyhedronRepresentation.material = e.material, e.convexPolyhedronRepresentation.collisionResponse = e.collisionResponse, this.convexParticle(e.convexPolyhedronRepresentation, t, n, i, s, r, o, c, e, t, d);
  }
  convexParticle(e, t, n, i, s, r, o, c, l, h, d) {
    let u = -1;
    const p = Mh, g = yh;
    let _ = null;
    const m = xh;
    if (m.copy(i), m.vsub(n, m), s.conjugate(qr), qr.vmult(m, m), e.pointIsInside(m)) {
      e.worldVerticesNeedsUpdate && e.computeWorldVertices(n, s), e.worldFaceNormalsNeedsUpdate && e.computeWorldFaceNormals(s);
      for (let f = 0, v = e.faces.length; f !== v; f++) {
        const M = [e.worldVertices[e.faces[f][0]]], y = e.worldFaceNormals[f];
        i.vsub(M[0], Xr);
        const w = -y.dot(Xr);
        if (_ === null || Math.abs(w) < Math.abs(_)) {
          if (d)
            return !0;
          _ = w, u = f, p.copy(y);
        }
      }
      if (u !== -1) {
        const f = this.createContactEquation(c, o, t, e, l, h);
        p.scale(_, g), g.vadd(i, g), g.vsub(n, g), f.rj.copy(g), p.negate(f.ni), f.ri.set(0, 0, 0);
        const v = f.ri, M = f.rj;
        v.vadd(i, v), v.vsub(c.position, v), M.vadd(n, M), M.vsub(o.position, M), this.result.push(f), this.createFrictionEquationsFromContact(f, this.frictionResult);
      } else
        console.warn("Point found inside convex, but did not find penetrating face!");
    }
  }
  heightfieldCylinder(e, t, n, i, s, r, o, c, l, h, d) {
    return this.convexHeightfield(t, e, i, n, r, s, c, o, l, h, d);
  }
  particleCylinder(e, t, n, i, s, r, o, c, l, h, d) {
    return this.convexParticle(t, e, i, n, r, s, c, o, l, h, d);
  }
  sphereTrimesh(e, t, n, i, s, r, o, c, l, h, d) {
    const u = Pc, p = Rc, g = Dc, _ = Ic, m = Uc, f = Nc, v = Bc, M = Lc, y = Ac, w = Gc;
    Oe.pointToLocalFrame(i, r, n, m);
    const C = e.radius;
    v.lowerBound.set(m.x - C, m.y - C, m.z - C), v.upperBound.set(m.x + C, m.y + C, m.z + C), t.getTrianglesInAABB(v, w);
    const P = Cc, I = e.radius * e.radius;
    for (let L = 0; L < w.length; L++)
      for (let R = 0; R < 3; R++)
        if (t.getVertex(t.indices[w[L] * 3 + R], P), P.vsub(m, y), y.lengthSquared() <= I) {
          if (M.copy(P), Oe.pointToWorldFrame(i, r, M, P), P.vsub(n, y), d)
            return !0;
          let D = this.createContactEquation(o, c, e, t, l, h);
          D.ni.copy(y), D.ni.normalize(), D.ri.copy(D.ni), D.ri.scale(e.radius, D.ri), D.ri.vadd(n, D.ri), D.ri.vsub(o.position, D.ri), D.rj.copy(P), D.rj.vsub(c.position, D.rj), this.result.push(D), this.createFrictionEquationsFromContact(D, this.frictionResult);
        }
    for (let L = 0; L < w.length; L++)
      for (let R = 0; R < 3; R++) {
        t.getVertex(t.indices[w[L] * 3 + R], u), t.getVertex(t.indices[w[L] * 3 + (R + 1) % 3], p), p.vsub(u, g), m.vsub(p, f);
        const D = f.dot(g);
        m.vsub(u, f);
        let N = f.dot(g);
        if (N > 0 && D < 0 && (m.vsub(u, f), _.copy(g), _.normalize(), N = f.dot(_), _.scale(N, f), f.vadd(u, f), f.distanceTo(m) < e.radius)) {
          if (d)
            return !0;
          const B = this.createContactEquation(o, c, e, t, l, h);
          f.vsub(m, B.ni), B.ni.normalize(), B.ni.scale(e.radius, B.ri), B.ri.vadd(n, B.ri), B.ri.vsub(o.position, B.ri), Oe.pointToWorldFrame(i, r, f, f), f.vsub(c.position, B.rj), Oe.vectorToWorldFrame(r, B.ni, B.ni), Oe.vectorToWorldFrame(r, B.ri, B.ri), this.result.push(B), this.createFrictionEquationsFromContact(B, this.frictionResult);
        }
      }
    const S = zc, T = Fc, O = Oc, k = Tc;
    for (let L = 0, R = w.length; L !== R; L++) {
      t.getTriangleVertices(w[L], S, T, O), t.getNormal(w[L], k), m.vsub(S, f);
      let D = f.dot(k);
      if (k.scale(D, f), m.vsub(f, f), D = f.distanceTo(m), Jt.pointInTriangle(f, S, T, O) && D < e.radius) {
        if (d)
          return !0;
        let N = this.createContactEquation(o, c, e, t, l, h);
        f.vsub(m, N.ni), N.ni.normalize(), N.ni.scale(e.radius, N.ri), N.ri.vadd(n, N.ri), N.ri.vsub(o.position, N.ri), Oe.pointToWorldFrame(i, r, f, f), f.vsub(c.position, N.rj), Oe.vectorToWorldFrame(r, N.ni, N.ni), Oe.vectorToWorldFrame(r, N.ri, N.ri), this.result.push(N), this.createFrictionEquationsFromContact(N, this.frictionResult);
      }
    }
    w.length = 0;
  }
  planeTrimesh(e, t, n, i, s, r, o, c, l, h, d) {
    const u = new x(), p = wc;
    p.set(0, 0, 1), s.vmult(p, p);
    for (let g = 0; g < t.vertices.length / 3; g++) {
      t.getVertex(g, u);
      const _ = new x();
      _.copy(u), Oe.pointToWorldFrame(i, r, _, u);
      const m = bc;
      if (u.vsub(n, m), p.dot(m) <= 0) {
        if (d)
          return !0;
        const v = this.createContactEquation(o, c, e, t, l, h);
        v.ni.copy(p);
        const M = Ec;
        p.scale(m.dot(p), M), u.vsub(M, M), v.ri.copy(M), v.ri.vsub(o.position, v.ri), v.rj.copy(u), v.rj.vsub(c.position, v.rj), this.result.push(v), this.createFrictionEquationsFromContact(v, this.frictionResult);
      }
    }
  }
  // convexTrimesh(
  //   si: ConvexPolyhedron, sj: Trimesh, xi: Vec3, xj: Vec3, qi: Quaternion, qj: Quaternion,
  //   bi: Body, bj: Body, rsi?: Shape | null, rsj?: Shape | null,
  //   faceListA?: number[] | null, faceListB?: number[] | null,
  // ) {
  //   const sepAxis = convexConvex_sepAxis;
  //   if(xi.distanceTo(xj) > si.boundingSphereRadius + sj.boundingSphereRadius){
  //       return;
  //   }
  //   // Construct a temp hull for each triangle
  //   const hullB = new ConvexPolyhedron();
  //   hullB.faces = [[0,1,2]];
  //   const va = new Vec3();
  //   const vb = new Vec3();
  //   const vc = new Vec3();
  //   hullB.vertices = [
  //       va,
  //       vb,
  //       vc
  //   ];
  //   for (let i = 0; i < sj.indices.length / 3; i++) {
  //       const triangleNormal = new Vec3();
  //       sj.getNormal(i, triangleNormal);
  //       hullB.faceNormals = [triangleNormal];
  //       sj.getTriangleVertices(i, va, vb, vc);
  //       let d = si.testSepAxis(triangleNormal, hullB, xi, qi, xj, qj);
  //       if(!d){
  //           triangleNormal.scale(-1, triangleNormal);
  //           d = si.testSepAxis(triangleNormal, hullB, xi, qi, xj, qj);
  //           if(!d){
  //               continue;
  //           }
  //       }
  //       const res: ConvexPolyhedronContactPoint[] = [];
  //       const q = convexConvex_q;
  //       si.clipAgainstHull(xi,qi,hullB,xj,qj,triangleNormal,-100,100,res);
  //       for(let j = 0; j !== res.length; j++){
  //           const r = this.createContactEquation(bi,bj,si,sj,rsi,rsj),
  //               ri = r.ri,
  //               rj = r.rj;
  //           r.ni.copy(triangleNormal);
  //           r.ni.negate(r.ni);
  //           res[j].normal.negate(q);
  //           q.mult(res[j].depth, q);
  //           res[j].point.vadd(q, ri);
  //           rj.copy(res[j].point);
  //           // Contact points are in world coordinates. Transform back to relative
  //           ri.vsub(xi,ri);
  //           rj.vsub(xj,rj);
  //           // Make relative to bodies
  //           ri.vadd(xi, ri);
  //           ri.vsub(bi.position, ri);
  //           rj.vadd(xj, rj);
  //           rj.vsub(bj.position, rj);
  //           result.push(r);
  //       }
  //   }
  // }
}
const Cn = new x(), kn = new x(), Hn = new x(), xc = new x(), Mc = new x(), yc = new At(), Sc = new At(), wc = new x(), bc = new x(), Ec = new x(), Tc = new x(), Ac = new x();
new x();
const Cc = new x(), Lc = new x(), Pc = new x(), Rc = new x(), Dc = new x(), Ic = new x(), Uc = new x(), Nc = new x(), zc = new x(), Fc = new x(), Oc = new x(), Bc = new Lt(), Gc = [], ki = new x(), Wr = new x(), Vc = new x(), kc = new x(), Hc = new x();
function Wc(a, e, t) {
  let n = null;
  const i = a.length;
  for (let s = 0; s !== i; s++) {
    const r = a[s], o = Vc;
    a[(s + 1) % i].vsub(r, o);
    const c = kc;
    o.cross(e, c);
    const l = Hc;
    t.vsub(r, l);
    const h = c.dot(l);
    if (n === null || h > 0 && n === !0 || h <= 0 && n === !1) {
      n === null && (n = h > 0);
      continue;
    } else
      return !1;
  }
  return !0;
}
const Hi = new x(), qc = new x(), Xc = new x(), jc = new x(), Yc = [new x(), new x(), new x(), new x(), new x(), new x()], $c = new x(), Zc = new x(), Kc = new x(), Jc = new x(), Qc = new x(), eh = new x(), th = new x(), nh = new x(), ih = new x(), sh = new x(), rh = new x(), oh = new x(), ah = new x(), lh = new x();
new x();
new x();
const ch = new x(), hh = new x(), uh = new x(), dh = new x(), fh = new x(), ph = new x(), mh = new x(), gh = new x(), _h = new x(), vh = new x(), qr = new At(), xh = new x();
new x();
const Mh = new x(), Xr = new x(), yh = new x(), Sh = new x(), wh = new x(), bh = [0], Eh = new x(), Th = new x();
class jr {
  /**
   * @todo Remove useless constructor
   */
  constructor() {
    this.current = [], this.previous = [];
  }
  /**
   * getKey
   */
  getKey(e, t) {
    if (t < e) {
      const n = t;
      t = e, e = n;
    }
    return e << 16 | t;
  }
  /**
   * set
   */
  set(e, t) {
    const n = this.getKey(e, t), i = this.current;
    let s = 0;
    for (; n > i[s]; )
      s++;
    if (n !== i[s]) {
      for (let r = i.length - 1; r >= s; r--)
        i[r + 1] = i[r];
      i[s] = n;
    }
  }
  /**
   * tick
   */
  tick() {
    const e = this.current;
    this.current = this.previous, this.previous = e, this.current.length = 0;
  }
  /**
   * getDiff
   */
  getDiff(e, t) {
    const n = this.current, i = this.previous, s = n.length, r = i.length;
    let o = 0;
    for (let c = 0; c < s; c++) {
      let l = !1;
      const h = n[c];
      for (; h > i[o]; )
        o++;
      l = h === i[o], l || Yr(e, h);
    }
    o = 0;
    for (let c = 0; c < r; c++) {
      let l = !1;
      const h = i[c];
      for (; h > n[o]; )
        o++;
      l = n[o] === h, l || Yr(t, h);
    }
  }
}
function Yr(a, e) {
  a.push((e & 4294901760) >> 16, e & 65535);
}
const Ls = (a, e) => a < e ? `${a}-${e}` : `${e}-${a}`;
class Ah {
  constructor() {
    this.data = {
      keys: []
    };
  }
  /** get */
  get(e, t) {
    const n = Ls(e, t);
    return this.data[n];
  }
  /** set */
  set(e, t, n) {
    const i = Ls(e, t);
    this.get(e, t) || this.data.keys.push(i), this.data[i] = n;
  }
  /** delete */
  delete(e, t) {
    const n = Ls(e, t), i = this.data.keys.indexOf(n);
    i !== -1 && this.data.keys.splice(i, 1), delete this.data[n];
  }
  /** reset */
  reset() {
    const e = this.data, t = e.keys;
    for (; t.length > 0; ) {
      const n = t.pop();
      delete e[n];
    }
  }
}
class Ch extends ma {
  /**
   * Currently / last used timestep. Is set to -1 if not available. This value is updated before each internal step, which means that it is "fresh" inside event callbacks.
   */
  /**
   * Makes bodies go to sleep when they've been inactive.
   * @default false
   */
  /**
   * All the current contacts (instances of ContactEquation) in the world.
   */
  /**
   * How often to normalize quaternions. Set to 0 for every step, 1 for every second etc.. A larger value increases performance. If bodies tend to explode, set to a smaller value (zero to be sure nothing can go wrong).
   * @default 0
   */
  /**
   * Set to true to use fast quaternion normalization. It is often enough accurate to use.
   * If bodies tend to explode, set to false.
   * @default false
   */
  /**
   * The wall-clock time since simulation start.
   */
  /**
   * Number of timesteps taken since start.
   */
  /**
   * Default and last timestep sizes.
   */
  /**
   * The gravity of the world.
   */
  /**
   * Gravity to use when approximating the friction max force (mu*mass*gravity).
   * If undefined, global gravity will be used.
   * Use to enable friction in a World with a null gravity vector (no gravity).
   */
  /**
   * The broadphase algorithm to use.
   * @default NaiveBroadphase
   */
  /**
   * All bodies in this world
   */
  /**
   * True if any bodies are not sleeping, false if every body is sleeping.
   */
  /**
   * The solver algorithm to use.
   * @default GSSolver
   */
  /**
   * collisionMatrix
   */
  /**
   * CollisionMatrix from the previous step.
   */
  /**
   * All added contactmaterials.
   */
  /**
   * Used to look up a ContactMaterial given two instances of Material.
   */
  /**
   * The default material of the bodies.
   */
  /**
   * This contact material is used if no suitable contactmaterial is found for a contact.
   */
  /**
   * Time accumulator for interpolation.
   * @see https://gafferongames.com/game-physics/fix-your-timestep/
   */
  /**
   * Dispatched after a body has been added to the world.
   */
  /**
   * Dispatched after a body has been removed from the world.
   */
  constructor(e) {
    e === void 0 && (e = {}), super(), this.dt = -1, this.allowSleep = !!e.allowSleep, this.contacts = [], this.frictionEquations = [], this.quatNormalizeSkip = e.quatNormalizeSkip !== void 0 ? e.quatNormalizeSkip : 0, this.quatNormalizeFast = e.quatNormalizeFast !== void 0 ? e.quatNormalizeFast : !1, this.time = 0, this.stepnumber = 0, this.default_dt = 1 / 60, this.nextId = 0, this.gravity = new x(), e.gravity && this.gravity.copy(e.gravity), e.frictionGravity && (this.frictionGravity = new x(), this.frictionGravity.copy(e.frictionGravity)), this.broadphase = e.broadphase !== void 0 ? e.broadphase : new Nl(), this.bodies = [], this.hasActiveBodies = !1, this.solver = e.solver !== void 0 ? e.solver : new dc(), this.constraints = [], this.narrowphase = new vc(this), this.collisionMatrix = new Ir(), this.collisionMatrixPrevious = new Ir(), this.bodyOverlapKeeper = new jr(), this.shapeOverlapKeeper = new jr(), this.contactmaterials = [], this.contactMaterialTable = new Ah(), this.defaultMaterial = new wa("default"), this.defaultContactMaterial = new gs(this.defaultMaterial, this.defaultMaterial, {
      friction: 0.3,
      restitution: 0
    }), this.doProfiling = !1, this.profile = {
      solve: 0,
      makeContactConstraints: 0,
      broadphase: 0,
      integrate: 0,
      narrowphase: 0
    }, this.accumulator = 0, this.subsystems = [], this.addBodyEvent = {
      type: "addBody",
      body: null
    }, this.removeBodyEvent = {
      type: "removeBody",
      body: null
    }, this.idToBodyMap = {}, this.broadphase.setWorld(this);
  }
  /**
   * Get the contact material between materials m1 and m2
   * @return The contact material if it was found.
   */
  getContactMaterial(e, t) {
    return this.contactMaterialTable.get(e.id, t.id);
  }
  /**
   * Store old collision state info
   */
  collisionMatrixTick() {
    const e = this.collisionMatrixPrevious;
    this.collisionMatrixPrevious = this.collisionMatrix, this.collisionMatrix = e, this.collisionMatrix.reset(), this.bodyOverlapKeeper.tick(), this.shapeOverlapKeeper.tick();
  }
  /**
   * Add a constraint to the simulation.
   */
  addConstraint(e) {
    this.constraints.push(e);
  }
  /**
   * Removes a constraint
   */
  removeConstraint(e) {
    const t = this.constraints.indexOf(e);
    t !== -1 && this.constraints.splice(t, 1);
  }
  /**
   * Raycast test
   * @deprecated Use .raycastAll, .raycastClosest or .raycastAny instead.
   */
  rayTest(e, t, n) {
    n instanceof fs ? this.raycastClosest(e, t, {
      skipBackfaces: !0
    }, n) : this.raycastAll(e, t, {
      skipBackfaces: !0
    }, n);
  }
  /**
   * Ray cast against all bodies. The provided callback will be executed for each hit with a RaycastResult as single argument.
   * @return True if any body was hit.
   */
  raycastAll(e, t, n, i) {
    return n === void 0 && (n = {}), n.mode = Jt.ALL, n.from = e, n.to = t, n.callback = i, Ps.intersectWorld(this, n);
  }
  /**
   * Ray cast, and stop at the first result. Note that the order is random - but the method is fast.
   * @return True if any body was hit.
   */
  raycastAny(e, t, n, i) {
    return n === void 0 && (n = {}), n.mode = Jt.ANY, n.from = e, n.to = t, n.result = i, Ps.intersectWorld(this, n);
  }
  /**
   * Ray cast, and return information of the closest hit.
   * @return True if any body was hit.
   */
  raycastClosest(e, t, n, i) {
    return n === void 0 && (n = {}), n.mode = Jt.CLOSEST, n.from = e, n.to = t, n.result = i, Ps.intersectWorld(this, n);
  }
  /**
   * Add a rigid body to the simulation.
   * @todo If the simulation has not yet started, why recrete and copy arrays for each body? Accumulate in dynamic arrays in this case.
   * @todo Adding an array of bodies should be possible. This would save some loops too
   */
  addBody(e) {
    this.bodies.includes(e) || (e.index = this.bodies.length, this.bodies.push(e), e.world = this, e.initPosition.copy(e.position), e.initVelocity.copy(e.velocity), e.timeLastSleepy = this.time, e instanceof he && (e.initAngularVelocity.copy(e.angularVelocity), e.initQuaternion.copy(e.quaternion)), this.collisionMatrix.setNumObjects(this.bodies.length), this.addBodyEvent.body = e, this.idToBodyMap[e.id] = e, this.dispatchEvent(this.addBodyEvent));
  }
  /**
   * Remove a rigid body from the simulation.
   */
  removeBody(e) {
    e.world = null;
    const t = this.bodies.length - 1, n = this.bodies, i = n.indexOf(e);
    if (i !== -1) {
      n.splice(i, 1);
      for (let s = 0; s !== n.length; s++)
        n[s].index = s;
      this.collisionMatrix.setNumObjects(t), this.removeBodyEvent.body = e, delete this.idToBodyMap[e.id], this.dispatchEvent(this.removeBodyEvent);
    }
  }
  getBodyById(e) {
    return this.idToBodyMap[e];
  }
  /**
   * @todo Make a faster map
   */
  getShapeById(e) {
    const t = this.bodies;
    for (let n = 0; n < t.length; n++) {
      const i = t[n].shapes;
      for (let s = 0; s < i.length; s++) {
        const r = i[s];
        if (r.id === e)
          return r;
      }
    }
    return null;
  }
  /**
   * Adds a contact material to the World
   */
  addContactMaterial(e) {
    this.contactmaterials.push(e), this.contactMaterialTable.set(e.materials[0].id, e.materials[1].id, e);
  }
  /**
   * Removes a contact material from the World.
   */
  removeContactMaterial(e) {
    const t = this.contactmaterials.indexOf(e);
    t !== -1 && (this.contactmaterials.splice(t, 1), this.contactMaterialTable.delete(e.materials[0].id, e.materials[1].id));
  }
  /**
   * Step the simulation forward keeping track of last called time
   * to be able to step the world at a fixed rate, independently of framerate.
   *
   * @param dt The fixed time step size to use (default: 1 / 60).
   * @param maxSubSteps Maximum number of fixed steps to take per function call (default: 10).
   * @see https://gafferongames.com/post/fix_your_timestep/
   * @example
   *     // Run the simulation independently of framerate every 1 / 60 ms
   *     world.fixedStep()
   */
  fixedStep(e, t) {
    e === void 0 && (e = 1 / 60), t === void 0 && (t = 10);
    const n = et.now() / 1e3;
    if (!this.lastCallTime)
      this.step(e, void 0, t);
    else {
      const i = n - this.lastCallTime;
      this.step(e, i, t);
    }
    this.lastCallTime = n;
  }
  /**
   * Step the physics world forward in time.
   *
   * There are two modes. The simple mode is fixed timestepping without interpolation. In this case you only use the first argument. The second case uses interpolation. In that you also provide the time since the function was last used, as well as the maximum fixed timesteps to take.
   *
   * @param dt The fixed time step size to use.
   * @param timeSinceLastCalled The time elapsed since the function was last called.
   * @param maxSubSteps Maximum number of fixed steps to take per function call (default: 10).
   * @see https://web.archive.org/web/20180426154531/http://bulletphysics.org/mediawiki-1.5.8/index.php/Stepping_The_World#What_do_the_parameters_to_btDynamicsWorld::stepSimulation_mean.3F
   * @example
   *     // fixed timestepping without interpolation
   *     world.step(1 / 60)
   */
  step(e, t, n) {
    if (n === void 0 && (n = 10), t === void 0)
      this.internalStep(e), this.time += e;
    else {
      this.accumulator += t;
      const i = et.now();
      let s = 0;
      for (; this.accumulator >= e && s < n && (this.internalStep(e), this.accumulator -= e, s++, !(et.now() - i > e * 1e3)); )
        ;
      this.accumulator = this.accumulator % e;
      const r = this.accumulator / e;
      for (let o = 0; o !== this.bodies.length; o++) {
        const c = this.bodies[o];
        c.previousPosition.lerp(c.position, r, c.interpolatedPosition), c.previousQuaternion.slerp(c.quaternion, r, c.interpolatedQuaternion), c.previousQuaternion.normalize();
      }
      this.time += t;
    }
  }
  internalStep(e) {
    this.dt = e;
    const t = this.contacts, n = Ih, i = Uh, s = this.bodies.length, r = this.bodies, o = this.solver, c = this.gravity, l = this.doProfiling, h = this.profile, d = he.DYNAMIC;
    let u = -1 / 0;
    const p = this.constraints, g = Dh;
    c.length();
    const _ = c.x, m = c.y, f = c.z;
    let v = 0;
    for (l && (u = et.now()), v = 0; v !== s; v++) {
      const L = r[v];
      if (L.type === d) {
        const R = L.force, D = L.mass;
        R.x += D * _, R.y += D * m, R.z += D * f;
      }
    }
    for (let L = 0, R = this.subsystems.length; L !== R; L++)
      this.subsystems[L].update();
    l && (u = et.now()), n.length = 0, i.length = 0, this.broadphase.collisionPairs(this, n, i), l && (h.broadphase = et.now() - u);
    let M = p.length;
    for (v = 0; v !== M; v++) {
      const L = p[v];
      if (!L.collideConnected)
        for (let R = n.length - 1; R >= 0; R -= 1)
          (L.bodyA === n[R] && L.bodyB === i[R] || L.bodyB === n[R] && L.bodyA === i[R]) && (n.splice(R, 1), i.splice(R, 1));
    }
    this.collisionMatrixTick(), l && (u = et.now());
    const y = Rh, w = t.length;
    for (v = 0; v !== w; v++)
      y.push(t[v]);
    t.length = 0;
    const C = this.frictionEquations.length;
    for (v = 0; v !== C; v++)
      g.push(this.frictionEquations[v]);
    for (this.frictionEquations.length = 0, this.narrowphase.getContacts(
      n,
      i,
      this,
      t,
      y,
      // To be reused
      this.frictionEquations,
      g
    ), l && (h.narrowphase = et.now() - u), l && (u = et.now()), v = 0; v < this.frictionEquations.length; v++)
      o.addEquation(this.frictionEquations[v]);
    const P = t.length;
    for (let L = 0; L !== P; L++) {
      const R = t[L], D = R.bi, N = R.bj, K = R.si, B = R.sj;
      let H;
      if (D.material && N.material ? H = this.getContactMaterial(D.material, N.material) || this.defaultContactMaterial : H = this.defaultContactMaterial, H.friction, D.material && N.material && (D.material.friction >= 0 && N.material.friction >= 0 && D.material.friction * N.material.friction, D.material.restitution >= 0 && N.material.restitution >= 0 && (R.restitution = D.material.restitution * N.material.restitution)), o.addEquation(R), D.allowSleep && D.type === he.DYNAMIC && D.sleepState === he.SLEEPING && N.sleepState === he.AWAKE && N.type !== he.STATIC) {
        const Q = N.velocity.lengthSquared() + N.angularVelocity.lengthSquared(), ce = N.sleepSpeedLimit ** 2;
        Q >= ce * 2 && (D.wakeUpAfterNarrowphase = !0);
      }
      if (N.allowSleep && N.type === he.DYNAMIC && N.sleepState === he.SLEEPING && D.sleepState === he.AWAKE && D.type !== he.STATIC) {
        const Q = D.velocity.lengthSquared() + D.angularVelocity.lengthSquared(), ce = D.sleepSpeedLimit ** 2;
        Q >= ce * 2 && (N.wakeUpAfterNarrowphase = !0);
      }
      this.collisionMatrix.set(D, N, !0), this.collisionMatrixPrevious.get(D, N) || (yi.body = N, yi.contact = R, D.dispatchEvent(yi), yi.body = D, N.dispatchEvent(yi)), this.bodyOverlapKeeper.set(D.id, N.id), this.shapeOverlapKeeper.set(K.id, B.id);
    }
    for (this.emitContactEvents(), l && (h.makeContactConstraints = et.now() - u, u = et.now()), v = 0; v !== s; v++) {
      const L = r[v];
      L.wakeUpAfterNarrowphase && (L.wakeUp(), L.wakeUpAfterNarrowphase = !1);
    }
    for (M = p.length, v = 0; v !== M; v++) {
      const L = p[v];
      L.update();
      for (let R = 0, D = L.equations.length; R !== D; R++) {
        const N = L.equations[R];
        o.addEquation(N);
      }
    }
    o.solve(e, this), l && (h.solve = et.now() - u), o.removeAllEquations();
    const I = Math.pow;
    for (v = 0; v !== s; v++) {
      const L = r[v];
      if (L.type & d) {
        const R = I(1 - L.linearDamping, e), D = L.velocity;
        D.scale(R, D);
        const N = L.angularVelocity;
        if (N) {
          const K = I(1 - L.angularDamping, e);
          N.scale(K, N);
        }
      }
    }
    this.dispatchEvent(Ph), l && (u = et.now());
    const T = this.stepnumber % (this.quatNormalizeSkip + 1) === 0, O = this.quatNormalizeFast;
    for (v = 0; v !== s; v++)
      r[v].integrate(e, T, O);
    this.clearForces(), this.broadphase.dirty = !0, l && (h.integrate = et.now() - u), this.stepnumber += 1, this.dispatchEvent(Lh);
    let k = !0;
    if (this.allowSleep)
      for (k = !1, v = 0; v !== s; v++) {
        const L = r[v];
        L.sleepTick(this.time), L.sleepState !== he.SLEEPING && (k = !0);
      }
    this.hasActiveBodies = k;
  }
  emitContactEvents() {
    const e = this.hasAnyEventListener("beginContact"), t = this.hasAnyEventListener("endContact");
    if ((e || t) && this.bodyOverlapKeeper.getDiff(nn, sn), e) {
      for (let s = 0, r = nn.length; s < r; s += 2)
        Si.bodyA = this.getBodyById(nn[s]), Si.bodyB = this.getBodyById(nn[s + 1]), this.dispatchEvent(Si);
      Si.bodyA = Si.bodyB = null;
    }
    if (t) {
      for (let s = 0, r = sn.length; s < r; s += 2)
        wi.bodyA = this.getBodyById(sn[s]), wi.bodyB = this.getBodyById(sn[s + 1]), this.dispatchEvent(wi);
      wi.bodyA = wi.bodyB = null;
    }
    nn.length = sn.length = 0;
    const n = this.hasAnyEventListener("beginShapeContact"), i = this.hasAnyEventListener("endShapeContact");
    if ((n || i) && this.shapeOverlapKeeper.getDiff(nn, sn), n) {
      for (let s = 0, r = nn.length; s < r; s += 2) {
        const o = this.getShapeById(nn[s]), c = this.getShapeById(nn[s + 1]);
        rn.shapeA = o, rn.shapeB = c, o && (rn.bodyA = o.body), c && (rn.bodyB = c.body), this.dispatchEvent(rn);
      }
      rn.bodyA = rn.bodyB = rn.shapeA = rn.shapeB = null;
    }
    if (i) {
      for (let s = 0, r = sn.length; s < r; s += 2) {
        const o = this.getShapeById(sn[s]), c = this.getShapeById(sn[s + 1]);
        on.shapeA = o, on.shapeB = c, o && (on.bodyA = o.body), c && (on.bodyB = c.body), this.dispatchEvent(on);
      }
      on.bodyA = on.bodyB = on.shapeA = on.shapeB = null;
    }
  }
  /**
   * Sets all body forces in the world to zero.
   */
  clearForces() {
    const e = this.bodies, t = e.length;
    for (let n = 0; n !== t; n++) {
      const i = e[n];
      i.force, i.torque, i.force.set(0, 0, 0), i.torque.set(0, 0, 0);
    }
  }
}
new Lt();
const Ps = new Jt(), et = globalThis.performance || {};
if (!et.now) {
  let a = Date.now();
  et.timing && et.timing.navigationStart && (a = et.timing.navigationStart), et.now = () => Date.now() - a;
}
new x();
const Lh = {
  type: "postStep"
}, Ph = {
  type: "preStep"
}, yi = {
  type: he.COLLIDE_EVENT_NAME,
  body: null,
  contact: null
}, Rh = [], Dh = [], Ih = [], Uh = [], nn = [], sn = [], Si = {
  type: "beginContact",
  bodyA: null,
  bodyB: null
}, wi = {
  type: "endContact",
  bodyA: null,
  bodyB: null
}, rn = {
  type: "beginShapeContact",
  bodyA: null,
  bodyB: null,
  shapeA: null,
  shapeB: null
}, on = {
  type: "endShapeContact",
  bodyA: null,
  bodyB: null,
  shapeA: null,
  shapeB: null
};
class Nh {
  constructor() {
    ze(this, "type", "World");
    ze(this, "world");
    this.world = new Ch({
      // gravity: new CANNON.Vec3(0, -9.82, 0),
      gravity: new x(0, -0.05, 0)
    });
  }
  addEntity(e) {
    this.world.addBody(e.body);
  }
  setup() {
  }
  update(e) {
    this.world && this.world.fixedStep();
  }
  destroy() {
  }
}
/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
const xr = "151", zh = 0, $r = 1, Fh = 2, Ea = 1, Oh = 2, Ci = 3, wn = 0, yt = 1, fn = 2, Sn = 0, li = 1, Zr = 2, Kr = 3, Jr = 4, Bh = 5, oi = 100, Gh = 101, Vh = 102, Qr = 103, eo = 104, kh = 200, Hh = 201, Wh = 202, qh = 203, Ta = 204, Aa = 205, Xh = 206, jh = 207, Yh = 208, $h = 209, Zh = 210, Kh = 0, Jh = 1, Qh = 2, lr = 3, eu = 4, tu = 5, nu = 6, iu = 7, Ca = 0, su = 1, ru = 2, pn = 0, ou = 1, au = 2, lu = 3, cu = 4, hu = 5, La = 300, ui = 301, di = 302, cr = 303, hr = 304, _s = 306, ur = 1e3, Gt = 1001, dr = 1002, _t = 1003, to = 1004, Rs = 1005, Dt = 1006, uu = 1007, Ri = 1008, Gn = 1009, du = 1010, fu = 1011, Pa = 1012, pu = 1013, Fn = 1014, On = 1015, Di = 1016, mu = 1017, gu = 1018, ci = 1020, _u = 1021, Vt = 1023, vu = 1024, xu = 1025, Bn = 1026, fi = 1027, Mu = 1028, yu = 1029, Su = 1030, wu = 1031, bu = 1033, Ds = 33776, Is = 33777, Us = 33778, Ns = 33779, no = 35840, io = 35841, so = 35842, ro = 35843, Eu = 36196, oo = 37492, ao = 37496, lo = 37808, co = 37809, ho = 37810, uo = 37811, fo = 37812, po = 37813, mo = 37814, go = 37815, _o = 37816, vo = 37817, xo = 37818, Mo = 37819, yo = 37820, So = 37821, zs = 36492, Tu = 36283, wo = 36284, bo = 36285, Eo = 36286, Vn = 3e3, Xe = 3001, Au = 3200, Cu = 3201, Mr = 0, Lu = 1, $t = "srgb", Ii = "srgb-linear", Ra = "display-p3", Fs = 7680, Pu = 519, To = 35044, Ao = "300 es", fr = 1035;
class mi {
  addEventListener(e, t) {
    this._listeners === void 0 && (this._listeners = {});
    const n = this._listeners;
    n[e] === void 0 && (n[e] = []), n[e].indexOf(t) === -1 && n[e].push(t);
  }
  hasEventListener(e, t) {
    if (this._listeners === void 0)
      return !1;
    const n = this._listeners;
    return n[e] !== void 0 && n[e].indexOf(t) !== -1;
  }
  removeEventListener(e, t) {
    if (this._listeners === void 0)
      return;
    const i = this._listeners[e];
    if (i !== void 0) {
      const s = i.indexOf(t);
      s !== -1 && i.splice(s, 1);
    }
  }
  dispatchEvent(e) {
    if (this._listeners === void 0)
      return;
    const n = this._listeners[e.type];
    if (n !== void 0) {
      e.target = this;
      const i = n.slice(0);
      for (let s = 0, r = i.length; s < r; s++)
        i[s].call(this, e);
      e.target = null;
    }
  }
}
const dt = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "0a", "0b", "0c", "0d", "0e", "0f", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "1a", "1b", "1c", "1d", "1e", "1f", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "2a", "2b", "2c", "2d", "2e", "2f", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "3a", "3b", "3c", "3d", "3e", "3f", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "4a", "4b", "4c", "4d", "4e", "4f", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "5a", "5b", "5c", "5d", "5e", "5f", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "6a", "6b", "6c", "6d", "6e", "6f", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "7a", "7b", "7c", "7d", "7e", "7f", "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "8a", "8b", "8c", "8d", "8e", "8f", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", "9a", "9b", "9c", "9d", "9e", "9f", "a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "aa", "ab", "ac", "ad", "ae", "af", "b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "ba", "bb", "bc", "bd", "be", "bf", "c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "ca", "cb", "cc", "cd", "ce", "cf", "d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "da", "db", "dc", "dd", "de", "df", "e0", "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "ea", "eb", "ec", "ed", "ee", "ef", "f0", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "fa", "fb", "fc", "fd", "fe", "ff"], Os = Math.PI / 180, pr = 180 / Math.PI;
function Ni() {
  const a = Math.random() * 4294967295 | 0, e = Math.random() * 4294967295 | 0, t = Math.random() * 4294967295 | 0, n = Math.random() * 4294967295 | 0;
  return (dt[a & 255] + dt[a >> 8 & 255] + dt[a >> 16 & 255] + dt[a >> 24 & 255] + "-" + dt[e & 255] + dt[e >> 8 & 255] + "-" + dt[e >> 16 & 15 | 64] + dt[e >> 24 & 255] + "-" + dt[t & 63 | 128] + dt[t >> 8 & 255] + "-" + dt[t >> 16 & 255] + dt[t >> 24 & 255] + dt[n & 255] + dt[n >> 8 & 255] + dt[n >> 16 & 255] + dt[n >> 24 & 255]).toLowerCase();
}
function Mt(a, e, t) {
  return Math.max(e, Math.min(t, a));
}
function Ru(a, e) {
  return (a % e + e) % e;
}
function Bs(a, e, t) {
  return (1 - t) * a + t * e;
}
function Co(a) {
  return (a & a - 1) === 0 && a !== 0;
}
function Du(a) {
  return Math.pow(2, Math.floor(Math.log(a) / Math.LN2));
}
function Wi(a, e) {
  switch (e.constructor) {
    case Float32Array:
      return a;
    case Uint16Array:
      return a / 65535;
    case Uint8Array:
      return a / 255;
    case Int16Array:
      return Math.max(a / 32767, -1);
    case Int8Array:
      return Math.max(a / 127, -1);
    default:
      throw new Error("Invalid component type.");
  }
}
function wt(a, e) {
  switch (e.constructor) {
    case Float32Array:
      return a;
    case Uint16Array:
      return Math.round(a * 65535);
    case Uint8Array:
      return Math.round(a * 255);
    case Int16Array:
      return Math.round(a * 32767);
    case Int8Array:
      return Math.round(a * 127);
    default:
      throw new Error("Invalid component type.");
  }
}
class Fe {
  constructor(e = 0, t = 0) {
    Fe.prototype.isVector2 = !0, this.x = e, this.y = t;
  }
  get width() {
    return this.x;
  }
  set width(e) {
    this.x = e;
  }
  get height() {
    return this.y;
  }
  set height(e) {
    this.y = e;
  }
  set(e, t) {
    return this.x = e, this.y = t, this;
  }
  setScalar(e) {
    return this.x = e, this.y = e, this;
  }
  setX(e) {
    return this.x = e, this;
  }
  setY(e) {
    return this.y = e, this;
  }
  setComponent(e, t) {
    switch (e) {
      case 0:
        this.x = t;
        break;
      case 1:
        this.y = t;
        break;
      default:
        throw new Error("index is out of range: " + e);
    }
    return this;
  }
  getComponent(e) {
    switch (e) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      default:
        throw new Error("index is out of range: " + e);
    }
  }
  clone() {
    return new this.constructor(this.x, this.y);
  }
  copy(e) {
    return this.x = e.x, this.y = e.y, this;
  }
  add(e) {
    return this.x += e.x, this.y += e.y, this;
  }
  addScalar(e) {
    return this.x += e, this.y += e, this;
  }
  addVectors(e, t) {
    return this.x = e.x + t.x, this.y = e.y + t.y, this;
  }
  addScaledVector(e, t) {
    return this.x += e.x * t, this.y += e.y * t, this;
  }
  sub(e) {
    return this.x -= e.x, this.y -= e.y, this;
  }
  subScalar(e) {
    return this.x -= e, this.y -= e, this;
  }
  subVectors(e, t) {
    return this.x = e.x - t.x, this.y = e.y - t.y, this;
  }
  multiply(e) {
    return this.x *= e.x, this.y *= e.y, this;
  }
  multiplyScalar(e) {
    return this.x *= e, this.y *= e, this;
  }
  divide(e) {
    return this.x /= e.x, this.y /= e.y, this;
  }
  divideScalar(e) {
    return this.multiplyScalar(1 / e);
  }
  applyMatrix3(e) {
    const t = this.x, n = this.y, i = e.elements;
    return this.x = i[0] * t + i[3] * n + i[6], this.y = i[1] * t + i[4] * n + i[7], this;
  }
  min(e) {
    return this.x = Math.min(this.x, e.x), this.y = Math.min(this.y, e.y), this;
  }
  max(e) {
    return this.x = Math.max(this.x, e.x), this.y = Math.max(this.y, e.y), this;
  }
  clamp(e, t) {
    return this.x = Math.max(e.x, Math.min(t.x, this.x)), this.y = Math.max(e.y, Math.min(t.y, this.y)), this;
  }
  clampScalar(e, t) {
    return this.x = Math.max(e, Math.min(t, this.x)), this.y = Math.max(e, Math.min(t, this.y)), this;
  }
  clampLength(e, t) {
    const n = this.length();
    return this.divideScalar(n || 1).multiplyScalar(Math.max(e, Math.min(t, n)));
  }
  floor() {
    return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this;
  }
  ceil() {
    return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this;
  }
  round() {
    return this.x = Math.round(this.x), this.y = Math.round(this.y), this;
  }
  roundToZero() {
    return this.x = this.x < 0 ? Math.ceil(this.x) : Math.floor(this.x), this.y = this.y < 0 ? Math.ceil(this.y) : Math.floor(this.y), this;
  }
  negate() {
    return this.x = -this.x, this.y = -this.y, this;
  }
  dot(e) {
    return this.x * e.x + this.y * e.y;
  }
  cross(e) {
    return this.x * e.y - this.y * e.x;
  }
  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  manhattanLength() {
    return Math.abs(this.x) + Math.abs(this.y);
  }
  normalize() {
    return this.divideScalar(this.length() || 1);
  }
  angle() {
    return Math.atan2(-this.y, -this.x) + Math.PI;
  }
  angleTo(e) {
    const t = Math.sqrt(this.lengthSq() * e.lengthSq());
    if (t === 0)
      return Math.PI / 2;
    const n = this.dot(e) / t;
    return Math.acos(Mt(n, -1, 1));
  }
  distanceTo(e) {
    return Math.sqrt(this.distanceToSquared(e));
  }
  distanceToSquared(e) {
    const t = this.x - e.x, n = this.y - e.y;
    return t * t + n * n;
  }
  manhattanDistanceTo(e) {
    return Math.abs(this.x - e.x) + Math.abs(this.y - e.y);
  }
  setLength(e) {
    return this.normalize().multiplyScalar(e);
  }
  lerp(e, t) {
    return this.x += (e.x - this.x) * t, this.y += (e.y - this.y) * t, this;
  }
  lerpVectors(e, t, n) {
    return this.x = e.x + (t.x - e.x) * n, this.y = e.y + (t.y - e.y) * n, this;
  }
  equals(e) {
    return e.x === this.x && e.y === this.y;
  }
  fromArray(e, t = 0) {
    return this.x = e[t], this.y = e[t + 1], this;
  }
  toArray(e = [], t = 0) {
    return e[t] = this.x, e[t + 1] = this.y, e;
  }
  fromBufferAttribute(e, t) {
    return this.x = e.getX(t), this.y = e.getY(t), this;
  }
  rotateAround(e, t) {
    const n = Math.cos(t), i = Math.sin(t), s = this.x - e.x, r = this.y - e.y;
    return this.x = s * n - r * i + e.x, this.y = s * i + r * n + e.y, this;
  }
  random() {
    return this.x = Math.random(), this.y = Math.random(), this;
  }
  *[Symbol.iterator]() {
    yield this.x, yield this.y;
  }
}
class Ie {
  constructor() {
    Ie.prototype.isMatrix3 = !0, this.elements = [
      1,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      1
    ];
  }
  set(e, t, n, i, s, r, o, c, l) {
    const h = this.elements;
    return h[0] = e, h[1] = i, h[2] = o, h[3] = t, h[4] = s, h[5] = c, h[6] = n, h[7] = r, h[8] = l, this;
  }
  identity() {
    return this.set(
      1,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      1
    ), this;
  }
  copy(e) {
    const t = this.elements, n = e.elements;
    return t[0] = n[0], t[1] = n[1], t[2] = n[2], t[3] = n[3], t[4] = n[4], t[5] = n[5], t[6] = n[6], t[7] = n[7], t[8] = n[8], this;
  }
  extractBasis(e, t, n) {
    return e.setFromMatrix3Column(this, 0), t.setFromMatrix3Column(this, 1), n.setFromMatrix3Column(this, 2), this;
  }
  setFromMatrix4(e) {
    const t = e.elements;
    return this.set(
      t[0],
      t[4],
      t[8],
      t[1],
      t[5],
      t[9],
      t[2],
      t[6],
      t[10]
    ), this;
  }
  multiply(e) {
    return this.multiplyMatrices(this, e);
  }
  premultiply(e) {
    return this.multiplyMatrices(e, this);
  }
  multiplyMatrices(e, t) {
    const n = e.elements, i = t.elements, s = this.elements, r = n[0], o = n[3], c = n[6], l = n[1], h = n[4], d = n[7], u = n[2], p = n[5], g = n[8], _ = i[0], m = i[3], f = i[6], v = i[1], M = i[4], y = i[7], w = i[2], C = i[5], P = i[8];
    return s[0] = r * _ + o * v + c * w, s[3] = r * m + o * M + c * C, s[6] = r * f + o * y + c * P, s[1] = l * _ + h * v + d * w, s[4] = l * m + h * M + d * C, s[7] = l * f + h * y + d * P, s[2] = u * _ + p * v + g * w, s[5] = u * m + p * M + g * C, s[8] = u * f + p * y + g * P, this;
  }
  multiplyScalar(e) {
    const t = this.elements;
    return t[0] *= e, t[3] *= e, t[6] *= e, t[1] *= e, t[4] *= e, t[7] *= e, t[2] *= e, t[5] *= e, t[8] *= e, this;
  }
  determinant() {
    const e = this.elements, t = e[0], n = e[1], i = e[2], s = e[3], r = e[4], o = e[5], c = e[6], l = e[7], h = e[8];
    return t * r * h - t * o * l - n * s * h + n * o * c + i * s * l - i * r * c;
  }
  invert() {
    const e = this.elements, t = e[0], n = e[1], i = e[2], s = e[3], r = e[4], o = e[5], c = e[6], l = e[7], h = e[8], d = h * r - o * l, u = o * c - h * s, p = l * s - r * c, g = t * d + n * u + i * p;
    if (g === 0)
      return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
    const _ = 1 / g;
    return e[0] = d * _, e[1] = (i * l - h * n) * _, e[2] = (o * n - i * r) * _, e[3] = u * _, e[4] = (h * t - i * c) * _, e[5] = (i * s - o * t) * _, e[6] = p * _, e[7] = (n * c - l * t) * _, e[8] = (r * t - n * s) * _, this;
  }
  transpose() {
    let e;
    const t = this.elements;
    return e = t[1], t[1] = t[3], t[3] = e, e = t[2], t[2] = t[6], t[6] = e, e = t[5], t[5] = t[7], t[7] = e, this;
  }
  getNormalMatrix(e) {
    return this.setFromMatrix4(e).invert().transpose();
  }
  transposeIntoArray(e) {
    const t = this.elements;
    return e[0] = t[0], e[1] = t[3], e[2] = t[6], e[3] = t[1], e[4] = t[4], e[5] = t[7], e[6] = t[2], e[7] = t[5], e[8] = t[8], this;
  }
  setUvTransform(e, t, n, i, s, r, o) {
    const c = Math.cos(s), l = Math.sin(s);
    return this.set(
      n * c,
      n * l,
      -n * (c * r + l * o) + r + e,
      -i * l,
      i * c,
      -i * (-l * r + c * o) + o + t,
      0,
      0,
      1
    ), this;
  }
  //
  scale(e, t) {
    return this.premultiply(Gs.makeScale(e, t)), this;
  }
  rotate(e) {
    return this.premultiply(Gs.makeRotation(-e)), this;
  }
  translate(e, t) {
    return this.premultiply(Gs.makeTranslation(e, t)), this;
  }
  // for 2D Transforms
  makeTranslation(e, t) {
    return this.set(
      1,
      0,
      e,
      0,
      1,
      t,
      0,
      0,
      1
    ), this;
  }
  makeRotation(e) {
    const t = Math.cos(e), n = Math.sin(e);
    return this.set(
      t,
      -n,
      0,
      n,
      t,
      0,
      0,
      0,
      1
    ), this;
  }
  makeScale(e, t) {
    return this.set(
      e,
      0,
      0,
      0,
      t,
      0,
      0,
      0,
      1
    ), this;
  }
  //
  equals(e) {
    const t = this.elements, n = e.elements;
    for (let i = 0; i < 9; i++)
      if (t[i] !== n[i])
        return !1;
    return !0;
  }
  fromArray(e, t = 0) {
    for (let n = 0; n < 9; n++)
      this.elements[n] = e[n + t];
    return this;
  }
  toArray(e = [], t = 0) {
    const n = this.elements;
    return e[t] = n[0], e[t + 1] = n[1], e[t + 2] = n[2], e[t + 3] = n[3], e[t + 4] = n[4], e[t + 5] = n[5], e[t + 6] = n[6], e[t + 7] = n[7], e[t + 8] = n[8], e;
  }
  clone() {
    return new this.constructor().fromArray(this.elements);
  }
}
const Gs = /* @__PURE__ */ new Ie();
function Da(a) {
  for (let e = a.length - 1; e >= 0; --e)
    if (a[e] >= 65535)
      return !0;
  return !1;
}
function ps(a) {
  return document.createElementNS("http://www.w3.org/1999/xhtml", a);
}
function hi(a) {
  return a < 0.04045 ? a * 0.0773993808 : Math.pow(a * 0.9478672986 + 0.0521327014, 2.4);
}
function Vs(a) {
  return a < 31308e-7 ? a * 12.92 : 1.055 * Math.pow(a, 0.41666) - 0.055;
}
const Iu = /* @__PURE__ */ new Ie().fromArray([
  0.8224621,
  0.0331941,
  0.0170827,
  0.177538,
  0.9668058,
  0.0723974,
  -1e-7,
  1e-7,
  0.9105199
]), Uu = /* @__PURE__ */ new Ie().fromArray([
  1.2249401,
  -0.0420569,
  -0.0196376,
  -0.2249404,
  1.0420571,
  -0.0786361,
  1e-7,
  0,
  1.0982735
]);
function Nu(a) {
  return a.convertSRGBToLinear().applyMatrix3(Uu);
}
function zu(a) {
  return a.applyMatrix3(Iu).convertLinearToSRGB();
}
const Fu = {
  [Ii]: (a) => a,
  [$t]: (a) => a.convertSRGBToLinear(),
  [Ra]: Nu
}, Ou = {
  [Ii]: (a) => a,
  [$t]: (a) => a.convertLinearToSRGB(),
  [Ra]: zu
}, bt = {
  enabled: !1,
  get legacyMode() {
    return console.warn("THREE.ColorManagement: .legacyMode=false renamed to .enabled=true in r150."), !this.enabled;
  },
  set legacyMode(a) {
    console.warn("THREE.ColorManagement: .legacyMode=false renamed to .enabled=true in r150."), this.enabled = !a;
  },
  get workingColorSpace() {
    return Ii;
  },
  set workingColorSpace(a) {
    console.warn("THREE.ColorManagement: .workingColorSpace is readonly.");
  },
  convert: function(a, e, t) {
    if (this.enabled === !1 || e === t || !e || !t)
      return a;
    const n = Fu[e], i = Ou[t];
    if (n === void 0 || i === void 0)
      throw new Error(`Unsupported color space conversion, "${e}" to "${t}".`);
    return i(n(a));
  },
  fromWorkingColorSpace: function(a, e) {
    return this.convert(a, this.workingColorSpace, e);
  },
  toWorkingColorSpace: function(a, e) {
    return this.convert(a, e, this.workingColorSpace);
  }
};
let Wn;
class Ia {
  static getDataURL(e) {
    if (/^data:/i.test(e.src) || typeof HTMLCanvasElement > "u")
      return e.src;
    let t;
    if (e instanceof HTMLCanvasElement)
      t = e;
    else {
      Wn === void 0 && (Wn = ps("canvas")), Wn.width = e.width, Wn.height = e.height;
      const n = Wn.getContext("2d");
      e instanceof ImageData ? n.putImageData(e, 0, 0) : n.drawImage(e, 0, 0, e.width, e.height), t = Wn;
    }
    return t.width > 2048 || t.height > 2048 ? (console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons", e), t.toDataURL("image/jpeg", 0.6)) : t.toDataURL("image/png");
  }
  static sRGBToLinear(e) {
    if (typeof HTMLImageElement < "u" && e instanceof HTMLImageElement || typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement || typeof ImageBitmap < "u" && e instanceof ImageBitmap) {
      const t = ps("canvas");
      t.width = e.width, t.height = e.height;
      const n = t.getContext("2d");
      n.drawImage(e, 0, 0, e.width, e.height);
      const i = n.getImageData(0, 0, e.width, e.height), s = i.data;
      for (let r = 0; r < s.length; r++)
        s[r] = hi(s[r] / 255) * 255;
      return n.putImageData(i, 0, 0), t;
    } else if (e.data) {
      const t = e.data.slice(0);
      for (let n = 0; n < t.length; n++)
        t instanceof Uint8Array || t instanceof Uint8ClampedArray ? t[n] = Math.floor(hi(t[n] / 255) * 255) : t[n] = hi(t[n]);
      return {
        data: t,
        width: e.width,
        height: e.height
      };
    } else
      return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."), e;
  }
}
class Ua {
  constructor(e = null) {
    this.isSource = !0, this.uuid = Ni(), this.data = e, this.version = 0;
  }
  set needsUpdate(e) {
    e === !0 && this.version++;
  }
  toJSON(e) {
    const t = e === void 0 || typeof e == "string";
    if (!t && e.images[this.uuid] !== void 0)
      return e.images[this.uuid];
    const n = {
      uuid: this.uuid,
      url: ""
    }, i = this.data;
    if (i !== null) {
      let s;
      if (Array.isArray(i)) {
        s = [];
        for (let r = 0, o = i.length; r < o; r++)
          i[r].isDataTexture ? s.push(ks(i[r].image)) : s.push(ks(i[r]));
      } else
        s = ks(i);
      n.url = s;
    }
    return t || (e.images[this.uuid] = n), n;
  }
}
function ks(a) {
  return typeof HTMLImageElement < "u" && a instanceof HTMLImageElement || typeof HTMLCanvasElement < "u" && a instanceof HTMLCanvasElement || typeof ImageBitmap < "u" && a instanceof ImageBitmap ? Ia.getDataURL(a) : a.data ? {
    data: Array.from(a.data),
    width: a.width,
    height: a.height,
    type: a.data.constructor.name
  } : (console.warn("THREE.Texture: Unable to serialize Texture."), {});
}
let Bu = 0;
class Ct extends mi {
  constructor(e = Ct.DEFAULT_IMAGE, t = Ct.DEFAULT_MAPPING, n = Gt, i = Gt, s = Dt, r = Ri, o = Vt, c = Gn, l = Ct.DEFAULT_ANISOTROPY, h = Vn) {
    super(), this.isTexture = !0, Object.defineProperty(this, "id", { value: Bu++ }), this.uuid = Ni(), this.name = "", this.source = new Ua(e), this.mipmaps = [], this.mapping = t, this.channel = 0, this.wrapS = n, this.wrapT = i, this.magFilter = s, this.minFilter = r, this.anisotropy = l, this.format = o, this.internalFormat = null, this.type = c, this.offset = new Fe(0, 0), this.repeat = new Fe(1, 1), this.center = new Fe(0, 0), this.rotation = 0, this.matrixAutoUpdate = !0, this.matrix = new Ie(), this.generateMipmaps = !0, this.premultiplyAlpha = !1, this.flipY = !0, this.unpackAlignment = 4, this.encoding = h, this.userData = {}, this.version = 0, this.onUpdate = null, this.isRenderTargetTexture = !1, this.needsPMREMUpdate = !1;
  }
  get image() {
    return this.source.data;
  }
  set image(e = null) {
    this.source.data = e;
  }
  updateMatrix() {
    this.matrix.setUvTransform(this.offset.x, this.offset.y, this.repeat.x, this.repeat.y, this.rotation, this.center.x, this.center.y);
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(e) {
    return this.name = e.name, this.source = e.source, this.mipmaps = e.mipmaps.slice(0), this.mapping = e.mapping, this.channel = e.channel, this.wrapS = e.wrapS, this.wrapT = e.wrapT, this.magFilter = e.magFilter, this.minFilter = e.minFilter, this.anisotropy = e.anisotropy, this.format = e.format, this.internalFormat = e.internalFormat, this.type = e.type, this.offset.copy(e.offset), this.repeat.copy(e.repeat), this.center.copy(e.center), this.rotation = e.rotation, this.matrixAutoUpdate = e.matrixAutoUpdate, this.matrix.copy(e.matrix), this.generateMipmaps = e.generateMipmaps, this.premultiplyAlpha = e.premultiplyAlpha, this.flipY = e.flipY, this.unpackAlignment = e.unpackAlignment, this.encoding = e.encoding, this.userData = JSON.parse(JSON.stringify(e.userData)), this.needsUpdate = !0, this;
  }
  toJSON(e) {
    const t = e === void 0 || typeof e == "string";
    if (!t && e.textures[this.uuid] !== void 0)
      return e.textures[this.uuid];
    const n = {
      metadata: {
        version: 4.5,
        type: "Texture",
        generator: "Texture.toJSON"
      },
      uuid: this.uuid,
      name: this.name,
      image: this.source.toJSON(e).uuid,
      mapping: this.mapping,
      channel: this.channel,
      repeat: [this.repeat.x, this.repeat.y],
      offset: [this.offset.x, this.offset.y],
      center: [this.center.x, this.center.y],
      rotation: this.rotation,
      wrap: [this.wrapS, this.wrapT],
      format: this.format,
      internalFormat: this.internalFormat,
      type: this.type,
      encoding: this.encoding,
      minFilter: this.minFilter,
      magFilter: this.magFilter,
      anisotropy: this.anisotropy,
      flipY: this.flipY,
      generateMipmaps: this.generateMipmaps,
      premultiplyAlpha: this.premultiplyAlpha,
      unpackAlignment: this.unpackAlignment
    };
    return Object.keys(this.userData).length > 0 && (n.userData = this.userData), t || (e.textures[this.uuid] = n), n;
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
  transformUv(e) {
    if (this.mapping !== La)
      return e;
    if (e.applyMatrix3(this.matrix), e.x < 0 || e.x > 1)
      switch (this.wrapS) {
        case ur:
          e.x = e.x - Math.floor(e.x);
          break;
        case Gt:
          e.x = e.x < 0 ? 0 : 1;
          break;
        case dr:
          Math.abs(Math.floor(e.x) % 2) === 1 ? e.x = Math.ceil(e.x) - e.x : e.x = e.x - Math.floor(e.x);
          break;
      }
    if (e.y < 0 || e.y > 1)
      switch (this.wrapT) {
        case ur:
          e.y = e.y - Math.floor(e.y);
          break;
        case Gt:
          e.y = e.y < 0 ? 0 : 1;
          break;
        case dr:
          Math.abs(Math.floor(e.y) % 2) === 1 ? e.y = Math.ceil(e.y) - e.y : e.y = e.y - Math.floor(e.y);
          break;
      }
    return this.flipY && (e.y = 1 - e.y), e;
  }
  set needsUpdate(e) {
    e === !0 && (this.version++, this.source.needsUpdate = !0);
  }
}
Ct.DEFAULT_IMAGE = null;
Ct.DEFAULT_MAPPING = La;
Ct.DEFAULT_ANISOTROPY = 1;
class tt {
  constructor(e = 0, t = 0, n = 0, i = 1) {
    tt.prototype.isVector4 = !0, this.x = e, this.y = t, this.z = n, this.w = i;
  }
  get width() {
    return this.z;
  }
  set width(e) {
    this.z = e;
  }
  get height() {
    return this.w;
  }
  set height(e) {
    this.w = e;
  }
  set(e, t, n, i) {
    return this.x = e, this.y = t, this.z = n, this.w = i, this;
  }
  setScalar(e) {
    return this.x = e, this.y = e, this.z = e, this.w = e, this;
  }
  setX(e) {
    return this.x = e, this;
  }
  setY(e) {
    return this.y = e, this;
  }
  setZ(e) {
    return this.z = e, this;
  }
  setW(e) {
    return this.w = e, this;
  }
  setComponent(e, t) {
    switch (e) {
      case 0:
        this.x = t;
        break;
      case 1:
        this.y = t;
        break;
      case 2:
        this.z = t;
        break;
      case 3:
        this.w = t;
        break;
      default:
        throw new Error("index is out of range: " + e);
    }
    return this;
  }
  getComponent(e) {
    switch (e) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      case 2:
        return this.z;
      case 3:
        return this.w;
      default:
        throw new Error("index is out of range: " + e);
    }
  }
  clone() {
    return new this.constructor(this.x, this.y, this.z, this.w);
  }
  copy(e) {
    return this.x = e.x, this.y = e.y, this.z = e.z, this.w = e.w !== void 0 ? e.w : 1, this;
  }
  add(e) {
    return this.x += e.x, this.y += e.y, this.z += e.z, this.w += e.w, this;
  }
  addScalar(e) {
    return this.x += e, this.y += e, this.z += e, this.w += e, this;
  }
  addVectors(e, t) {
    return this.x = e.x + t.x, this.y = e.y + t.y, this.z = e.z + t.z, this.w = e.w + t.w, this;
  }
  addScaledVector(e, t) {
    return this.x += e.x * t, this.y += e.y * t, this.z += e.z * t, this.w += e.w * t, this;
  }
  sub(e) {
    return this.x -= e.x, this.y -= e.y, this.z -= e.z, this.w -= e.w, this;
  }
  subScalar(e) {
    return this.x -= e, this.y -= e, this.z -= e, this.w -= e, this;
  }
  subVectors(e, t) {
    return this.x = e.x - t.x, this.y = e.y - t.y, this.z = e.z - t.z, this.w = e.w - t.w, this;
  }
  multiply(e) {
    return this.x *= e.x, this.y *= e.y, this.z *= e.z, this.w *= e.w, this;
  }
  multiplyScalar(e) {
    return this.x *= e, this.y *= e, this.z *= e, this.w *= e, this;
  }
  applyMatrix4(e) {
    const t = this.x, n = this.y, i = this.z, s = this.w, r = e.elements;
    return this.x = r[0] * t + r[4] * n + r[8] * i + r[12] * s, this.y = r[1] * t + r[5] * n + r[9] * i + r[13] * s, this.z = r[2] * t + r[6] * n + r[10] * i + r[14] * s, this.w = r[3] * t + r[7] * n + r[11] * i + r[15] * s, this;
  }
  divideScalar(e) {
    return this.multiplyScalar(1 / e);
  }
  setAxisAngleFromQuaternion(e) {
    this.w = 2 * Math.acos(e.w);
    const t = Math.sqrt(1 - e.w * e.w);
    return t < 1e-4 ? (this.x = 1, this.y = 0, this.z = 0) : (this.x = e.x / t, this.y = e.y / t, this.z = e.z / t), this;
  }
  setAxisAngleFromRotationMatrix(e) {
    let t, n, i, s;
    const c = e.elements, l = c[0], h = c[4], d = c[8], u = c[1], p = c[5], g = c[9], _ = c[2], m = c[6], f = c[10];
    if (Math.abs(h - u) < 0.01 && Math.abs(d - _) < 0.01 && Math.abs(g - m) < 0.01) {
      if (Math.abs(h + u) < 0.1 && Math.abs(d + _) < 0.1 && Math.abs(g + m) < 0.1 && Math.abs(l + p + f - 3) < 0.1)
        return this.set(1, 0, 0, 0), this;
      t = Math.PI;
      const M = (l + 1) / 2, y = (p + 1) / 2, w = (f + 1) / 2, C = (h + u) / 4, P = (d + _) / 4, I = (g + m) / 4;
      return M > y && M > w ? M < 0.01 ? (n = 0, i = 0.707106781, s = 0.707106781) : (n = Math.sqrt(M), i = C / n, s = P / n) : y > w ? y < 0.01 ? (n = 0.707106781, i = 0, s = 0.707106781) : (i = Math.sqrt(y), n = C / i, s = I / i) : w < 0.01 ? (n = 0.707106781, i = 0.707106781, s = 0) : (s = Math.sqrt(w), n = P / s, i = I / s), this.set(n, i, s, t), this;
    }
    let v = Math.sqrt((m - g) * (m - g) + (d - _) * (d - _) + (u - h) * (u - h));
    return Math.abs(v) < 1e-3 && (v = 1), this.x = (m - g) / v, this.y = (d - _) / v, this.z = (u - h) / v, this.w = Math.acos((l + p + f - 1) / 2), this;
  }
  min(e) {
    return this.x = Math.min(this.x, e.x), this.y = Math.min(this.y, e.y), this.z = Math.min(this.z, e.z), this.w = Math.min(this.w, e.w), this;
  }
  max(e) {
    return this.x = Math.max(this.x, e.x), this.y = Math.max(this.y, e.y), this.z = Math.max(this.z, e.z), this.w = Math.max(this.w, e.w), this;
  }
  clamp(e, t) {
    return this.x = Math.max(e.x, Math.min(t.x, this.x)), this.y = Math.max(e.y, Math.min(t.y, this.y)), this.z = Math.max(e.z, Math.min(t.z, this.z)), this.w = Math.max(e.w, Math.min(t.w, this.w)), this;
  }
  clampScalar(e, t) {
    return this.x = Math.max(e, Math.min(t, this.x)), this.y = Math.max(e, Math.min(t, this.y)), this.z = Math.max(e, Math.min(t, this.z)), this.w = Math.max(e, Math.min(t, this.w)), this;
  }
  clampLength(e, t) {
    const n = this.length();
    return this.divideScalar(n || 1).multiplyScalar(Math.max(e, Math.min(t, n)));
  }
  floor() {
    return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this.z = Math.floor(this.z), this.w = Math.floor(this.w), this;
  }
  ceil() {
    return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this.z = Math.ceil(this.z), this.w = Math.ceil(this.w), this;
  }
  round() {
    return this.x = Math.round(this.x), this.y = Math.round(this.y), this.z = Math.round(this.z), this.w = Math.round(this.w), this;
  }
  roundToZero() {
    return this.x = this.x < 0 ? Math.ceil(this.x) : Math.floor(this.x), this.y = this.y < 0 ? Math.ceil(this.y) : Math.floor(this.y), this.z = this.z < 0 ? Math.ceil(this.z) : Math.floor(this.z), this.w = this.w < 0 ? Math.ceil(this.w) : Math.floor(this.w), this;
  }
  negate() {
    return this.x = -this.x, this.y = -this.y, this.z = -this.z, this.w = -this.w, this;
  }
  dot(e) {
    return this.x * e.x + this.y * e.y + this.z * e.z + this.w * e.w;
  }
  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }
  manhattanLength() {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w);
  }
  normalize() {
    return this.divideScalar(this.length() || 1);
  }
  setLength(e) {
    return this.normalize().multiplyScalar(e);
  }
  lerp(e, t) {
    return this.x += (e.x - this.x) * t, this.y += (e.y - this.y) * t, this.z += (e.z - this.z) * t, this.w += (e.w - this.w) * t, this;
  }
  lerpVectors(e, t, n) {
    return this.x = e.x + (t.x - e.x) * n, this.y = e.y + (t.y - e.y) * n, this.z = e.z + (t.z - e.z) * n, this.w = e.w + (t.w - e.w) * n, this;
  }
  equals(e) {
    return e.x === this.x && e.y === this.y && e.z === this.z && e.w === this.w;
  }
  fromArray(e, t = 0) {
    return this.x = e[t], this.y = e[t + 1], this.z = e[t + 2], this.w = e[t + 3], this;
  }
  toArray(e = [], t = 0) {
    return e[t] = this.x, e[t + 1] = this.y, e[t + 2] = this.z, e[t + 3] = this.w, e;
  }
  fromBufferAttribute(e, t) {
    return this.x = e.getX(t), this.y = e.getY(t), this.z = e.getZ(t), this.w = e.getW(t), this;
  }
  random() {
    return this.x = Math.random(), this.y = Math.random(), this.z = Math.random(), this.w = Math.random(), this;
  }
  *[Symbol.iterator]() {
    yield this.x, yield this.y, yield this.z, yield this.w;
  }
}
class en extends mi {
  constructor(e = 1, t = 1, n = {}) {
    super(), this.isWebGLRenderTarget = !0, this.width = e, this.height = t, this.depth = 1, this.scissor = new tt(0, 0, e, t), this.scissorTest = !1, this.viewport = new tt(0, 0, e, t);
    const i = { width: e, height: t, depth: 1 };
    this.texture = new Ct(i, n.mapping, n.wrapS, n.wrapT, n.magFilter, n.minFilter, n.format, n.type, n.anisotropy, n.encoding), this.texture.isRenderTargetTexture = !0, this.texture.flipY = !1, this.texture.generateMipmaps = n.generateMipmaps !== void 0 ? n.generateMipmaps : !1, this.texture.internalFormat = n.internalFormat !== void 0 ? n.internalFormat : null, this.texture.minFilter = n.minFilter !== void 0 ? n.minFilter : Dt, this.depthBuffer = n.depthBuffer !== void 0 ? n.depthBuffer : !0, this.stencilBuffer = n.stencilBuffer !== void 0 ? n.stencilBuffer : !1, this.depthTexture = n.depthTexture !== void 0 ? n.depthTexture : null, this.samples = n.samples !== void 0 ? n.samples : 0;
  }
  setSize(e, t, n = 1) {
    (this.width !== e || this.height !== t || this.depth !== n) && (this.width = e, this.height = t, this.depth = n, this.texture.image.width = e, this.texture.image.height = t, this.texture.image.depth = n, this.dispose()), this.viewport.set(0, 0, e, t), this.scissor.set(0, 0, e, t);
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(e) {
    this.width = e.width, this.height = e.height, this.depth = e.depth, this.viewport.copy(e.viewport), this.texture = e.texture.clone(), this.texture.isRenderTargetTexture = !0;
    const t = Object.assign({}, e.texture.image);
    return this.texture.source = new Ua(t), this.depthBuffer = e.depthBuffer, this.stencilBuffer = e.stencilBuffer, e.depthTexture !== null && (this.depthTexture = e.depthTexture.clone()), this.samples = e.samples, this;
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
}
class Na extends Ct {
  constructor(e = null, t = 1, n = 1, i = 1) {
    super(null), this.isDataArrayTexture = !0, this.image = { data: e, width: t, height: n, depth: i }, this.magFilter = _t, this.minFilter = _t, this.wrapR = Gt, this.generateMipmaps = !1, this.flipY = !1, this.unpackAlignment = 1;
  }
}
class Gu extends Ct {
  constructor(e = null, t = 1, n = 1, i = 1) {
    super(null), this.isData3DTexture = !0, this.image = { data: e, width: t, height: n, depth: i }, this.magFilter = _t, this.minFilter = _t, this.wrapR = Gt, this.generateMipmaps = !1, this.flipY = !1, this.unpackAlignment = 1;
  }
}
class zi {
  constructor(e = 0, t = 0, n = 0, i = 1) {
    this.isQuaternion = !0, this._x = e, this._y = t, this._z = n, this._w = i;
  }
  static slerpFlat(e, t, n, i, s, r, o) {
    let c = n[i + 0], l = n[i + 1], h = n[i + 2], d = n[i + 3];
    const u = s[r + 0], p = s[r + 1], g = s[r + 2], _ = s[r + 3];
    if (o === 0) {
      e[t + 0] = c, e[t + 1] = l, e[t + 2] = h, e[t + 3] = d;
      return;
    }
    if (o === 1) {
      e[t + 0] = u, e[t + 1] = p, e[t + 2] = g, e[t + 3] = _;
      return;
    }
    if (d !== _ || c !== u || l !== p || h !== g) {
      let m = 1 - o;
      const f = c * u + l * p + h * g + d * _, v = f >= 0 ? 1 : -1, M = 1 - f * f;
      if (M > Number.EPSILON) {
        const w = Math.sqrt(M), C = Math.atan2(w, f * v);
        m = Math.sin(m * C) / w, o = Math.sin(o * C) / w;
      }
      const y = o * v;
      if (c = c * m + u * y, l = l * m + p * y, h = h * m + g * y, d = d * m + _ * y, m === 1 - o) {
        const w = 1 / Math.sqrt(c * c + l * l + h * h + d * d);
        c *= w, l *= w, h *= w, d *= w;
      }
    }
    e[t] = c, e[t + 1] = l, e[t + 2] = h, e[t + 3] = d;
  }
  static multiplyQuaternionsFlat(e, t, n, i, s, r) {
    const o = n[i], c = n[i + 1], l = n[i + 2], h = n[i + 3], d = s[r], u = s[r + 1], p = s[r + 2], g = s[r + 3];
    return e[t] = o * g + h * d + c * p - l * u, e[t + 1] = c * g + h * u + l * d - o * p, e[t + 2] = l * g + h * p + o * u - c * d, e[t + 3] = h * g - o * d - c * u - l * p, e;
  }
  get x() {
    return this._x;
  }
  set x(e) {
    this._x = e, this._onChangeCallback();
  }
  get y() {
    return this._y;
  }
  set y(e) {
    this._y = e, this._onChangeCallback();
  }
  get z() {
    return this._z;
  }
  set z(e) {
    this._z = e, this._onChangeCallback();
  }
  get w() {
    return this._w;
  }
  set w(e) {
    this._w = e, this._onChangeCallback();
  }
  set(e, t, n, i) {
    return this._x = e, this._y = t, this._z = n, this._w = i, this._onChangeCallback(), this;
  }
  clone() {
    return new this.constructor(this._x, this._y, this._z, this._w);
  }
  copy(e) {
    return this._x = e.x, this._y = e.y, this._z = e.z, this._w = e.w, this._onChangeCallback(), this;
  }
  setFromEuler(e, t) {
    const n = e._x, i = e._y, s = e._z, r = e._order, o = Math.cos, c = Math.sin, l = o(n / 2), h = o(i / 2), d = o(s / 2), u = c(n / 2), p = c(i / 2), g = c(s / 2);
    switch (r) {
      case "XYZ":
        this._x = u * h * d + l * p * g, this._y = l * p * d - u * h * g, this._z = l * h * g + u * p * d, this._w = l * h * d - u * p * g;
        break;
      case "YXZ":
        this._x = u * h * d + l * p * g, this._y = l * p * d - u * h * g, this._z = l * h * g - u * p * d, this._w = l * h * d + u * p * g;
        break;
      case "ZXY":
        this._x = u * h * d - l * p * g, this._y = l * p * d + u * h * g, this._z = l * h * g + u * p * d, this._w = l * h * d - u * p * g;
        break;
      case "ZYX":
        this._x = u * h * d - l * p * g, this._y = l * p * d + u * h * g, this._z = l * h * g - u * p * d, this._w = l * h * d + u * p * g;
        break;
      case "YZX":
        this._x = u * h * d + l * p * g, this._y = l * p * d + u * h * g, this._z = l * h * g - u * p * d, this._w = l * h * d - u * p * g;
        break;
      case "XZY":
        this._x = u * h * d - l * p * g, this._y = l * p * d - u * h * g, this._z = l * h * g + u * p * d, this._w = l * h * d + u * p * g;
        break;
      default:
        console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: " + r);
    }
    return t !== !1 && this._onChangeCallback(), this;
  }
  setFromAxisAngle(e, t) {
    const n = t / 2, i = Math.sin(n);
    return this._x = e.x * i, this._y = e.y * i, this._z = e.z * i, this._w = Math.cos(n), this._onChangeCallback(), this;
  }
  setFromRotationMatrix(e) {
    const t = e.elements, n = t[0], i = t[4], s = t[8], r = t[1], o = t[5], c = t[9], l = t[2], h = t[6], d = t[10], u = n + o + d;
    if (u > 0) {
      const p = 0.5 / Math.sqrt(u + 1);
      this._w = 0.25 / p, this._x = (h - c) * p, this._y = (s - l) * p, this._z = (r - i) * p;
    } else if (n > o && n > d) {
      const p = 2 * Math.sqrt(1 + n - o - d);
      this._w = (h - c) / p, this._x = 0.25 * p, this._y = (i + r) / p, this._z = (s + l) / p;
    } else if (o > d) {
      const p = 2 * Math.sqrt(1 + o - n - d);
      this._w = (s - l) / p, this._x = (i + r) / p, this._y = 0.25 * p, this._z = (c + h) / p;
    } else {
      const p = 2 * Math.sqrt(1 + d - n - o);
      this._w = (r - i) / p, this._x = (s + l) / p, this._y = (c + h) / p, this._z = 0.25 * p;
    }
    return this._onChangeCallback(), this;
  }
  setFromUnitVectors(e, t) {
    let n = e.dot(t) + 1;
    return n < Number.EPSILON ? (n = 0, Math.abs(e.x) > Math.abs(e.z) ? (this._x = -e.y, this._y = e.x, this._z = 0, this._w = n) : (this._x = 0, this._y = -e.z, this._z = e.y, this._w = n)) : (this._x = e.y * t.z - e.z * t.y, this._y = e.z * t.x - e.x * t.z, this._z = e.x * t.y - e.y * t.x, this._w = n), this.normalize();
  }
  angleTo(e) {
    return 2 * Math.acos(Math.abs(Mt(this.dot(e), -1, 1)));
  }
  rotateTowards(e, t) {
    const n = this.angleTo(e);
    if (n === 0)
      return this;
    const i = Math.min(1, t / n);
    return this.slerp(e, i), this;
  }
  identity() {
    return this.set(0, 0, 0, 1);
  }
  invert() {
    return this.conjugate();
  }
  conjugate() {
    return this._x *= -1, this._y *= -1, this._z *= -1, this._onChangeCallback(), this;
  }
  dot(e) {
    return this._x * e._x + this._y * e._y + this._z * e._z + this._w * e._w;
  }
  lengthSq() {
    return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;
  }
  length() {
    return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w);
  }
  normalize() {
    let e = this.length();
    return e === 0 ? (this._x = 0, this._y = 0, this._z = 0, this._w = 1) : (e = 1 / e, this._x = this._x * e, this._y = this._y * e, this._z = this._z * e, this._w = this._w * e), this._onChangeCallback(), this;
  }
  multiply(e) {
    return this.multiplyQuaternions(this, e);
  }
  premultiply(e) {
    return this.multiplyQuaternions(e, this);
  }
  multiplyQuaternions(e, t) {
    const n = e._x, i = e._y, s = e._z, r = e._w, o = t._x, c = t._y, l = t._z, h = t._w;
    return this._x = n * h + r * o + i * l - s * c, this._y = i * h + r * c + s * o - n * l, this._z = s * h + r * l + n * c - i * o, this._w = r * h - n * o - i * c - s * l, this._onChangeCallback(), this;
  }
  slerp(e, t) {
    if (t === 0)
      return this;
    if (t === 1)
      return this.copy(e);
    const n = this._x, i = this._y, s = this._z, r = this._w;
    let o = r * e._w + n * e._x + i * e._y + s * e._z;
    if (o < 0 ? (this._w = -e._w, this._x = -e._x, this._y = -e._y, this._z = -e._z, o = -o) : this.copy(e), o >= 1)
      return this._w = r, this._x = n, this._y = i, this._z = s, this;
    const c = 1 - o * o;
    if (c <= Number.EPSILON) {
      const p = 1 - t;
      return this._w = p * r + t * this._w, this._x = p * n + t * this._x, this._y = p * i + t * this._y, this._z = p * s + t * this._z, this.normalize(), this._onChangeCallback(), this;
    }
    const l = Math.sqrt(c), h = Math.atan2(l, o), d = Math.sin((1 - t) * h) / l, u = Math.sin(t * h) / l;
    return this._w = r * d + this._w * u, this._x = n * d + this._x * u, this._y = i * d + this._y * u, this._z = s * d + this._z * u, this._onChangeCallback(), this;
  }
  slerpQuaternions(e, t, n) {
    return this.copy(e).slerp(t, n);
  }
  random() {
    const e = Math.random(), t = Math.sqrt(1 - e), n = Math.sqrt(e), i = 2 * Math.PI * Math.random(), s = 2 * Math.PI * Math.random();
    return this.set(
      t * Math.cos(i),
      n * Math.sin(s),
      n * Math.cos(s),
      t * Math.sin(i)
    );
  }
  equals(e) {
    return e._x === this._x && e._y === this._y && e._z === this._z && e._w === this._w;
  }
  fromArray(e, t = 0) {
    return this._x = e[t], this._y = e[t + 1], this._z = e[t + 2], this._w = e[t + 3], this._onChangeCallback(), this;
  }
  toArray(e = [], t = 0) {
    return e[t] = this._x, e[t + 1] = this._y, e[t + 2] = this._z, e[t + 3] = this._w, e;
  }
  fromBufferAttribute(e, t) {
    return this._x = e.getX(t), this._y = e.getY(t), this._z = e.getZ(t), this._w = e.getW(t), this;
  }
  toJSON() {
    return this.toArray();
  }
  _onChange(e) {
    return this._onChangeCallback = e, this;
  }
  _onChangeCallback() {
  }
  *[Symbol.iterator]() {
    yield this._x, yield this._y, yield this._z, yield this._w;
  }
}
class G {
  constructor(e = 0, t = 0, n = 0) {
    G.prototype.isVector3 = !0, this.x = e, this.y = t, this.z = n;
  }
  set(e, t, n) {
    return n === void 0 && (n = this.z), this.x = e, this.y = t, this.z = n, this;
  }
  setScalar(e) {
    return this.x = e, this.y = e, this.z = e, this;
  }
  setX(e) {
    return this.x = e, this;
  }
  setY(e) {
    return this.y = e, this;
  }
  setZ(e) {
    return this.z = e, this;
  }
  setComponent(e, t) {
    switch (e) {
      case 0:
        this.x = t;
        break;
      case 1:
        this.y = t;
        break;
      case 2:
        this.z = t;
        break;
      default:
        throw new Error("index is out of range: " + e);
    }
    return this;
  }
  getComponent(e) {
    switch (e) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      case 2:
        return this.z;
      default:
        throw new Error("index is out of range: " + e);
    }
  }
  clone() {
    return new this.constructor(this.x, this.y, this.z);
  }
  copy(e) {
    return this.x = e.x, this.y = e.y, this.z = e.z, this;
  }
  add(e) {
    return this.x += e.x, this.y += e.y, this.z += e.z, this;
  }
  addScalar(e) {
    return this.x += e, this.y += e, this.z += e, this;
  }
  addVectors(e, t) {
    return this.x = e.x + t.x, this.y = e.y + t.y, this.z = e.z + t.z, this;
  }
  addScaledVector(e, t) {
    return this.x += e.x * t, this.y += e.y * t, this.z += e.z * t, this;
  }
  sub(e) {
    return this.x -= e.x, this.y -= e.y, this.z -= e.z, this;
  }
  subScalar(e) {
    return this.x -= e, this.y -= e, this.z -= e, this;
  }
  subVectors(e, t) {
    return this.x = e.x - t.x, this.y = e.y - t.y, this.z = e.z - t.z, this;
  }
  multiply(e) {
    return this.x *= e.x, this.y *= e.y, this.z *= e.z, this;
  }
  multiplyScalar(e) {
    return this.x *= e, this.y *= e, this.z *= e, this;
  }
  multiplyVectors(e, t) {
    return this.x = e.x * t.x, this.y = e.y * t.y, this.z = e.z * t.z, this;
  }
  applyEuler(e) {
    return this.applyQuaternion(Lo.setFromEuler(e));
  }
  applyAxisAngle(e, t) {
    return this.applyQuaternion(Lo.setFromAxisAngle(e, t));
  }
  applyMatrix3(e) {
    const t = this.x, n = this.y, i = this.z, s = e.elements;
    return this.x = s[0] * t + s[3] * n + s[6] * i, this.y = s[1] * t + s[4] * n + s[7] * i, this.z = s[2] * t + s[5] * n + s[8] * i, this;
  }
  applyNormalMatrix(e) {
    return this.applyMatrix3(e).normalize();
  }
  applyMatrix4(e) {
    const t = this.x, n = this.y, i = this.z, s = e.elements, r = 1 / (s[3] * t + s[7] * n + s[11] * i + s[15]);
    return this.x = (s[0] * t + s[4] * n + s[8] * i + s[12]) * r, this.y = (s[1] * t + s[5] * n + s[9] * i + s[13]) * r, this.z = (s[2] * t + s[6] * n + s[10] * i + s[14]) * r, this;
  }
  applyQuaternion(e) {
    const t = this.x, n = this.y, i = this.z, s = e.x, r = e.y, o = e.z, c = e.w, l = c * t + r * i - o * n, h = c * n + o * t - s * i, d = c * i + s * n - r * t, u = -s * t - r * n - o * i;
    return this.x = l * c + u * -s + h * -o - d * -r, this.y = h * c + u * -r + d * -s - l * -o, this.z = d * c + u * -o + l * -r - h * -s, this;
  }
  project(e) {
    return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix);
  }
  unproject(e) {
    return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld);
  }
  transformDirection(e) {
    const t = this.x, n = this.y, i = this.z, s = e.elements;
    return this.x = s[0] * t + s[4] * n + s[8] * i, this.y = s[1] * t + s[5] * n + s[9] * i, this.z = s[2] * t + s[6] * n + s[10] * i, this.normalize();
  }
  divide(e) {
    return this.x /= e.x, this.y /= e.y, this.z /= e.z, this;
  }
  divideScalar(e) {
    return this.multiplyScalar(1 / e);
  }
  min(e) {
    return this.x = Math.min(this.x, e.x), this.y = Math.min(this.y, e.y), this.z = Math.min(this.z, e.z), this;
  }
  max(e) {
    return this.x = Math.max(this.x, e.x), this.y = Math.max(this.y, e.y), this.z = Math.max(this.z, e.z), this;
  }
  clamp(e, t) {
    return this.x = Math.max(e.x, Math.min(t.x, this.x)), this.y = Math.max(e.y, Math.min(t.y, this.y)), this.z = Math.max(e.z, Math.min(t.z, this.z)), this;
  }
  clampScalar(e, t) {
    return this.x = Math.max(e, Math.min(t, this.x)), this.y = Math.max(e, Math.min(t, this.y)), this.z = Math.max(e, Math.min(t, this.z)), this;
  }
  clampLength(e, t) {
    const n = this.length();
    return this.divideScalar(n || 1).multiplyScalar(Math.max(e, Math.min(t, n)));
  }
  floor() {
    return this.x = Math.floor(this.x), this.y = Math.floor(this.y), this.z = Math.floor(this.z), this;
  }
  ceil() {
    return this.x = Math.ceil(this.x), this.y = Math.ceil(this.y), this.z = Math.ceil(this.z), this;
  }
  round() {
    return this.x = Math.round(this.x), this.y = Math.round(this.y), this.z = Math.round(this.z), this;
  }
  roundToZero() {
    return this.x = this.x < 0 ? Math.ceil(this.x) : Math.floor(this.x), this.y = this.y < 0 ? Math.ceil(this.y) : Math.floor(this.y), this.z = this.z < 0 ? Math.ceil(this.z) : Math.floor(this.z), this;
  }
  negate() {
    return this.x = -this.x, this.y = -this.y, this.z = -this.z, this;
  }
  dot(e) {
    return this.x * e.x + this.y * e.y + this.z * e.z;
  }
  // TODO lengthSquared?
  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  manhattanLength() {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
  }
  normalize() {
    return this.divideScalar(this.length() || 1);
  }
  setLength(e) {
    return this.normalize().multiplyScalar(e);
  }
  lerp(e, t) {
    return this.x += (e.x - this.x) * t, this.y += (e.y - this.y) * t, this.z += (e.z - this.z) * t, this;
  }
  lerpVectors(e, t, n) {
    return this.x = e.x + (t.x - e.x) * n, this.y = e.y + (t.y - e.y) * n, this.z = e.z + (t.z - e.z) * n, this;
  }
  cross(e) {
    return this.crossVectors(this, e);
  }
  crossVectors(e, t) {
    const n = e.x, i = e.y, s = e.z, r = t.x, o = t.y, c = t.z;
    return this.x = i * c - s * o, this.y = s * r - n * c, this.z = n * o - i * r, this;
  }
  projectOnVector(e) {
    const t = e.lengthSq();
    if (t === 0)
      return this.set(0, 0, 0);
    const n = e.dot(this) / t;
    return this.copy(e).multiplyScalar(n);
  }
  projectOnPlane(e) {
    return Hs.copy(this).projectOnVector(e), this.sub(Hs);
  }
  reflect(e) {
    return this.sub(Hs.copy(e).multiplyScalar(2 * this.dot(e)));
  }
  angleTo(e) {
    const t = Math.sqrt(this.lengthSq() * e.lengthSq());
    if (t === 0)
      return Math.PI / 2;
    const n = this.dot(e) / t;
    return Math.acos(Mt(n, -1, 1));
  }
  distanceTo(e) {
    return Math.sqrt(this.distanceToSquared(e));
  }
  distanceToSquared(e) {
    const t = this.x - e.x, n = this.y - e.y, i = this.z - e.z;
    return t * t + n * n + i * i;
  }
  manhattanDistanceTo(e) {
    return Math.abs(this.x - e.x) + Math.abs(this.y - e.y) + Math.abs(this.z - e.z);
  }
  setFromSpherical(e) {
    return this.setFromSphericalCoords(e.radius, e.phi, e.theta);
  }
  setFromSphericalCoords(e, t, n) {
    const i = Math.sin(t) * e;
    return this.x = i * Math.sin(n), this.y = Math.cos(t) * e, this.z = i * Math.cos(n), this;
  }
  setFromCylindrical(e) {
    return this.setFromCylindricalCoords(e.radius, e.theta, e.y);
  }
  setFromCylindricalCoords(e, t, n) {
    return this.x = e * Math.sin(t), this.y = n, this.z = e * Math.cos(t), this;
  }
  setFromMatrixPosition(e) {
    const t = e.elements;
    return this.x = t[12], this.y = t[13], this.z = t[14], this;
  }
  setFromMatrixScale(e) {
    const t = this.setFromMatrixColumn(e, 0).length(), n = this.setFromMatrixColumn(e, 1).length(), i = this.setFromMatrixColumn(e, 2).length();
    return this.x = t, this.y = n, this.z = i, this;
  }
  setFromMatrixColumn(e, t) {
    return this.fromArray(e.elements, t * 4);
  }
  setFromMatrix3Column(e, t) {
    return this.fromArray(e.elements, t * 3);
  }
  setFromEuler(e) {
    return this.x = e._x, this.y = e._y, this.z = e._z, this;
  }
  setFromColor(e) {
    return this.x = e.r, this.y = e.g, this.z = e.b, this;
  }
  equals(e) {
    return e.x === this.x && e.y === this.y && e.z === this.z;
  }
  fromArray(e, t = 0) {
    return this.x = e[t], this.y = e[t + 1], this.z = e[t + 2], this;
  }
  toArray(e = [], t = 0) {
    return e[t] = this.x, e[t + 1] = this.y, e[t + 2] = this.z, e;
  }
  fromBufferAttribute(e, t) {
    return this.x = e.getX(t), this.y = e.getY(t), this.z = e.getZ(t), this;
  }
  random() {
    return this.x = Math.random(), this.y = Math.random(), this.z = Math.random(), this;
  }
  randomDirection() {
    const e = (Math.random() - 0.5) * 2, t = Math.random() * Math.PI * 2, n = Math.sqrt(1 - e ** 2);
    return this.x = n * Math.cos(t), this.y = n * Math.sin(t), this.z = e, this;
  }
  *[Symbol.iterator]() {
    yield this.x, yield this.y, yield this.z;
  }
}
const Hs = /* @__PURE__ */ new G(), Lo = /* @__PURE__ */ new zi();
class Fi {
  constructor(e = new G(1 / 0, 1 / 0, 1 / 0), t = new G(-1 / 0, -1 / 0, -1 / 0)) {
    this.isBox3 = !0, this.min = e, this.max = t;
  }
  set(e, t) {
    return this.min.copy(e), this.max.copy(t), this;
  }
  setFromArray(e) {
    this.makeEmpty();
    for (let t = 0, n = e.length; t < n; t += 3)
      this.expandByPoint(ln.fromArray(e, t));
    return this;
  }
  setFromBufferAttribute(e) {
    this.makeEmpty();
    for (let t = 0, n = e.count; t < n; t++)
      this.expandByPoint(ln.fromBufferAttribute(e, t));
    return this;
  }
  setFromPoints(e) {
    this.makeEmpty();
    for (let t = 0, n = e.length; t < n; t++)
      this.expandByPoint(e[t]);
    return this;
  }
  setFromCenterAndSize(e, t) {
    const n = ln.copy(t).multiplyScalar(0.5);
    return this.min.copy(e).sub(n), this.max.copy(e).add(n), this;
  }
  setFromObject(e, t = !1) {
    return this.makeEmpty(), this.expandByObject(e, t);
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(e) {
    return this.min.copy(e.min), this.max.copy(e.max), this;
  }
  makeEmpty() {
    return this.min.x = this.min.y = this.min.z = 1 / 0, this.max.x = this.max.y = this.max.z = -1 / 0, this;
  }
  isEmpty() {
    return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
  }
  getCenter(e) {
    return this.isEmpty() ? e.set(0, 0, 0) : e.addVectors(this.min, this.max).multiplyScalar(0.5);
  }
  getSize(e) {
    return this.isEmpty() ? e.set(0, 0, 0) : e.subVectors(this.max, this.min);
  }
  expandByPoint(e) {
    return this.min.min(e), this.max.max(e), this;
  }
  expandByVector(e) {
    return this.min.sub(e), this.max.add(e), this;
  }
  expandByScalar(e) {
    return this.min.addScalar(-e), this.max.addScalar(e), this;
  }
  expandByObject(e, t = !1) {
    if (e.updateWorldMatrix(!1, !1), e.boundingBox !== void 0)
      e.boundingBox === null && e.computeBoundingBox(), qn.copy(e.boundingBox), qn.applyMatrix4(e.matrixWorld), this.union(qn);
    else {
      const i = e.geometry;
      if (i !== void 0)
        if (t && i.attributes !== void 0 && i.attributes.position !== void 0) {
          const s = i.attributes.position;
          for (let r = 0, o = s.count; r < o; r++)
            ln.fromBufferAttribute(s, r).applyMatrix4(e.matrixWorld), this.expandByPoint(ln);
        } else
          i.boundingBox === null && i.computeBoundingBox(), qn.copy(i.boundingBox), qn.applyMatrix4(e.matrixWorld), this.union(qn);
    }
    const n = e.children;
    for (let i = 0, s = n.length; i < s; i++)
      this.expandByObject(n[i], t);
    return this;
  }
  containsPoint(e) {
    return !(e.x < this.min.x || e.x > this.max.x || e.y < this.min.y || e.y > this.max.y || e.z < this.min.z || e.z > this.max.z);
  }
  containsBox(e) {
    return this.min.x <= e.min.x && e.max.x <= this.max.x && this.min.y <= e.min.y && e.max.y <= this.max.y && this.min.z <= e.min.z && e.max.z <= this.max.z;
  }
  getParameter(e, t) {
    return t.set(
      (e.x - this.min.x) / (this.max.x - this.min.x),
      (e.y - this.min.y) / (this.max.y - this.min.y),
      (e.z - this.min.z) / (this.max.z - this.min.z)
    );
  }
  intersectsBox(e) {
    return !(e.max.x < this.min.x || e.min.x > this.max.x || e.max.y < this.min.y || e.min.y > this.max.y || e.max.z < this.min.z || e.min.z > this.max.z);
  }
  intersectsSphere(e) {
    return this.clampPoint(e.center, ln), ln.distanceToSquared(e.center) <= e.radius * e.radius;
  }
  intersectsPlane(e) {
    let t, n;
    return e.normal.x > 0 ? (t = e.normal.x * this.min.x, n = e.normal.x * this.max.x) : (t = e.normal.x * this.max.x, n = e.normal.x * this.min.x), e.normal.y > 0 ? (t += e.normal.y * this.min.y, n += e.normal.y * this.max.y) : (t += e.normal.y * this.max.y, n += e.normal.y * this.min.y), e.normal.z > 0 ? (t += e.normal.z * this.min.z, n += e.normal.z * this.max.z) : (t += e.normal.z * this.max.z, n += e.normal.z * this.min.z), t <= -e.constant && n >= -e.constant;
  }
  intersectsTriangle(e) {
    if (this.isEmpty())
      return !1;
    this.getCenter(bi), qi.subVectors(this.max, bi), Xn.subVectors(e.a, bi), jn.subVectors(e.b, bi), Yn.subVectors(e.c, bi), vn.subVectors(jn, Xn), xn.subVectors(Yn, jn), Ln.subVectors(Xn, Yn);
    let t = [
      0,
      -vn.z,
      vn.y,
      0,
      -xn.z,
      xn.y,
      0,
      -Ln.z,
      Ln.y,
      vn.z,
      0,
      -vn.x,
      xn.z,
      0,
      -xn.x,
      Ln.z,
      0,
      -Ln.x,
      -vn.y,
      vn.x,
      0,
      -xn.y,
      xn.x,
      0,
      -Ln.y,
      Ln.x,
      0
    ];
    return !Ws(t, Xn, jn, Yn, qi) || (t = [1, 0, 0, 0, 1, 0, 0, 0, 1], !Ws(t, Xn, jn, Yn, qi)) ? !1 : (Xi.crossVectors(vn, xn), t = [Xi.x, Xi.y, Xi.z], Ws(t, Xn, jn, Yn, qi));
  }
  clampPoint(e, t) {
    return t.copy(e).clamp(this.min, this.max);
  }
  distanceToPoint(e) {
    return this.clampPoint(e, ln).distanceTo(e);
  }
  getBoundingSphere(e) {
    return this.isEmpty() ? e.makeEmpty() : (this.getCenter(e.center), e.radius = this.getSize(ln).length() * 0.5), e;
  }
  intersect(e) {
    return this.min.max(e.min), this.max.min(e.max), this.isEmpty() && this.makeEmpty(), this;
  }
  union(e) {
    return this.min.min(e.min), this.max.max(e.max), this;
  }
  applyMatrix4(e) {
    return this.isEmpty() ? this : (an[0].set(this.min.x, this.min.y, this.min.z).applyMatrix4(e), an[1].set(this.min.x, this.min.y, this.max.z).applyMatrix4(e), an[2].set(this.min.x, this.max.y, this.min.z).applyMatrix4(e), an[3].set(this.min.x, this.max.y, this.max.z).applyMatrix4(e), an[4].set(this.max.x, this.min.y, this.min.z).applyMatrix4(e), an[5].set(this.max.x, this.min.y, this.max.z).applyMatrix4(e), an[6].set(this.max.x, this.max.y, this.min.z).applyMatrix4(e), an[7].set(this.max.x, this.max.y, this.max.z).applyMatrix4(e), this.setFromPoints(an), this);
  }
  translate(e) {
    return this.min.add(e), this.max.add(e), this;
  }
  equals(e) {
    return e.min.equals(this.min) && e.max.equals(this.max);
  }
}
const an = [
  /* @__PURE__ */ new G(),
  /* @__PURE__ */ new G(),
  /* @__PURE__ */ new G(),
  /* @__PURE__ */ new G(),
  /* @__PURE__ */ new G(),
  /* @__PURE__ */ new G(),
  /* @__PURE__ */ new G(),
  /* @__PURE__ */ new G()
], ln = /* @__PURE__ */ new G(), qn = /* @__PURE__ */ new Fi(), Xn = /* @__PURE__ */ new G(), jn = /* @__PURE__ */ new G(), Yn = /* @__PURE__ */ new G(), vn = /* @__PURE__ */ new G(), xn = /* @__PURE__ */ new G(), Ln = /* @__PURE__ */ new G(), bi = /* @__PURE__ */ new G(), qi = /* @__PURE__ */ new G(), Xi = /* @__PURE__ */ new G(), Pn = /* @__PURE__ */ new G();
function Ws(a, e, t, n, i) {
  for (let s = 0, r = a.length - 3; s <= r; s += 3) {
    Pn.fromArray(a, s);
    const o = i.x * Math.abs(Pn.x) + i.y * Math.abs(Pn.y) + i.z * Math.abs(Pn.z), c = e.dot(Pn), l = t.dot(Pn), h = n.dot(Pn);
    if (Math.max(-Math.max(c, l, h), Math.min(c, l, h)) > o)
      return !1;
  }
  return !0;
}
const Vu = /* @__PURE__ */ new Fi(), Ei = /* @__PURE__ */ new G(), qs = /* @__PURE__ */ new G();
class yr {
  constructor(e = new G(), t = -1) {
    this.center = e, this.radius = t;
  }
  set(e, t) {
    return this.center.copy(e), this.radius = t, this;
  }
  setFromPoints(e, t) {
    const n = this.center;
    t !== void 0 ? n.copy(t) : Vu.setFromPoints(e).getCenter(n);
    let i = 0;
    for (let s = 0, r = e.length; s < r; s++)
      i = Math.max(i, n.distanceToSquared(e[s]));
    return this.radius = Math.sqrt(i), this;
  }
  copy(e) {
    return this.center.copy(e.center), this.radius = e.radius, this;
  }
  isEmpty() {
    return this.radius < 0;
  }
  makeEmpty() {
    return this.center.set(0, 0, 0), this.radius = -1, this;
  }
  containsPoint(e) {
    return e.distanceToSquared(this.center) <= this.radius * this.radius;
  }
  distanceToPoint(e) {
    return e.distanceTo(this.center) - this.radius;
  }
  intersectsSphere(e) {
    const t = this.radius + e.radius;
    return e.center.distanceToSquared(this.center) <= t * t;
  }
  intersectsBox(e) {
    return e.intersectsSphere(this);
  }
  intersectsPlane(e) {
    return Math.abs(e.distanceToPoint(this.center)) <= this.radius;
  }
  clampPoint(e, t) {
    const n = this.center.distanceToSquared(e);
    return t.copy(e), n > this.radius * this.radius && (t.sub(this.center).normalize(), t.multiplyScalar(this.radius).add(this.center)), t;
  }
  getBoundingBox(e) {
    return this.isEmpty() ? (e.makeEmpty(), e) : (e.set(this.center, this.center), e.expandByScalar(this.radius), e);
  }
  applyMatrix4(e) {
    return this.center.applyMatrix4(e), this.radius = this.radius * e.getMaxScaleOnAxis(), this;
  }
  translate(e) {
    return this.center.add(e), this;
  }
  expandByPoint(e) {
    if (this.isEmpty())
      return this.center.copy(e), this.radius = 0, this;
    Ei.subVectors(e, this.center);
    const t = Ei.lengthSq();
    if (t > this.radius * this.radius) {
      const n = Math.sqrt(t), i = (n - this.radius) * 0.5;
      this.center.addScaledVector(Ei, i / n), this.radius += i;
    }
    return this;
  }
  union(e) {
    return e.isEmpty() ? this : this.isEmpty() ? (this.copy(e), this) : (this.center.equals(e.center) === !0 ? this.radius = Math.max(this.radius, e.radius) : (qs.subVectors(e.center, this.center).setLength(e.radius), this.expandByPoint(Ei.copy(e.center).add(qs)), this.expandByPoint(Ei.copy(e.center).sub(qs))), this);
  }
  equals(e) {
    return e.center.equals(this.center) && e.radius === this.radius;
  }
  clone() {
    return new this.constructor().copy(this);
  }
}
const cn = /* @__PURE__ */ new G(), Xs = /* @__PURE__ */ new G(), ji = /* @__PURE__ */ new G(), Mn = /* @__PURE__ */ new G(), js = /* @__PURE__ */ new G(), Yi = /* @__PURE__ */ new G(), Ys = /* @__PURE__ */ new G();
class ku {
  constructor(e = new G(), t = new G(0, 0, -1)) {
    this.origin = e, this.direction = t;
  }
  set(e, t) {
    return this.origin.copy(e), this.direction.copy(t), this;
  }
  copy(e) {
    return this.origin.copy(e.origin), this.direction.copy(e.direction), this;
  }
  at(e, t) {
    return t.copy(this.origin).addScaledVector(this.direction, e);
  }
  lookAt(e) {
    return this.direction.copy(e).sub(this.origin).normalize(), this;
  }
  recast(e) {
    return this.origin.copy(this.at(e, cn)), this;
  }
  closestPointToPoint(e, t) {
    t.subVectors(e, this.origin);
    const n = t.dot(this.direction);
    return n < 0 ? t.copy(this.origin) : t.copy(this.origin).addScaledVector(this.direction, n);
  }
  distanceToPoint(e) {
    return Math.sqrt(this.distanceSqToPoint(e));
  }
  distanceSqToPoint(e) {
    const t = cn.subVectors(e, this.origin).dot(this.direction);
    return t < 0 ? this.origin.distanceToSquared(e) : (cn.copy(this.origin).addScaledVector(this.direction, t), cn.distanceToSquared(e));
  }
  distanceSqToSegment(e, t, n, i) {
    Xs.copy(e).add(t).multiplyScalar(0.5), ji.copy(t).sub(e).normalize(), Mn.copy(this.origin).sub(Xs);
    const s = e.distanceTo(t) * 0.5, r = -this.direction.dot(ji), o = Mn.dot(this.direction), c = -Mn.dot(ji), l = Mn.lengthSq(), h = Math.abs(1 - r * r);
    let d, u, p, g;
    if (h > 0)
      if (d = r * c - o, u = r * o - c, g = s * h, d >= 0)
        if (u >= -g)
          if (u <= g) {
            const _ = 1 / h;
            d *= _, u *= _, p = d * (d + r * u + 2 * o) + u * (r * d + u + 2 * c) + l;
          } else
            u = s, d = Math.max(0, -(r * u + o)), p = -d * d + u * (u + 2 * c) + l;
        else
          u = -s, d = Math.max(0, -(r * u + o)), p = -d * d + u * (u + 2 * c) + l;
      else
        u <= -g ? (d = Math.max(0, -(-r * s + o)), u = d > 0 ? -s : Math.min(Math.max(-s, -c), s), p = -d * d + u * (u + 2 * c) + l) : u <= g ? (d = 0, u = Math.min(Math.max(-s, -c), s), p = u * (u + 2 * c) + l) : (d = Math.max(0, -(r * s + o)), u = d > 0 ? s : Math.min(Math.max(-s, -c), s), p = -d * d + u * (u + 2 * c) + l);
    else
      u = r > 0 ? -s : s, d = Math.max(0, -(r * u + o)), p = -d * d + u * (u + 2 * c) + l;
    return n && n.copy(this.origin).addScaledVector(this.direction, d), i && i.copy(Xs).addScaledVector(ji, u), p;
  }
  intersectSphere(e, t) {
    cn.subVectors(e.center, this.origin);
    const n = cn.dot(this.direction), i = cn.dot(cn) - n * n, s = e.radius * e.radius;
    if (i > s)
      return null;
    const r = Math.sqrt(s - i), o = n - r, c = n + r;
    return c < 0 ? null : o < 0 ? this.at(c, t) : this.at(o, t);
  }
  intersectsSphere(e) {
    return this.distanceSqToPoint(e.center) <= e.radius * e.radius;
  }
  distanceToPlane(e) {
    const t = e.normal.dot(this.direction);
    if (t === 0)
      return e.distanceToPoint(this.origin) === 0 ? 0 : null;
    const n = -(this.origin.dot(e.normal) + e.constant) / t;
    return n >= 0 ? n : null;
  }
  intersectPlane(e, t) {
    const n = this.distanceToPlane(e);
    return n === null ? null : this.at(n, t);
  }
  intersectsPlane(e) {
    const t = e.distanceToPoint(this.origin);
    return t === 0 || e.normal.dot(this.direction) * t < 0;
  }
  intersectBox(e, t) {
    let n, i, s, r, o, c;
    const l = 1 / this.direction.x, h = 1 / this.direction.y, d = 1 / this.direction.z, u = this.origin;
    return l >= 0 ? (n = (e.min.x - u.x) * l, i = (e.max.x - u.x) * l) : (n = (e.max.x - u.x) * l, i = (e.min.x - u.x) * l), h >= 0 ? (s = (e.min.y - u.y) * h, r = (e.max.y - u.y) * h) : (s = (e.max.y - u.y) * h, r = (e.min.y - u.y) * h), n > r || s > i || ((s > n || isNaN(n)) && (n = s), (r < i || isNaN(i)) && (i = r), d >= 0 ? (o = (e.min.z - u.z) * d, c = (e.max.z - u.z) * d) : (o = (e.max.z - u.z) * d, c = (e.min.z - u.z) * d), n > c || o > i) || ((o > n || n !== n) && (n = o), (c < i || i !== i) && (i = c), i < 0) ? null : this.at(n >= 0 ? n : i, t);
  }
  intersectsBox(e) {
    return this.intersectBox(e, cn) !== null;
  }
  intersectTriangle(e, t, n, i, s) {
    js.subVectors(t, e), Yi.subVectors(n, e), Ys.crossVectors(js, Yi);
    let r = this.direction.dot(Ys), o;
    if (r > 0) {
      if (i)
        return null;
      o = 1;
    } else if (r < 0)
      o = -1, r = -r;
    else
      return null;
    Mn.subVectors(this.origin, e);
    const c = o * this.direction.dot(Yi.crossVectors(Mn, Yi));
    if (c < 0)
      return null;
    const l = o * this.direction.dot(js.cross(Mn));
    if (l < 0 || c + l > r)
      return null;
    const h = -o * Mn.dot(Ys);
    return h < 0 ? null : this.at(h / r, s);
  }
  applyMatrix4(e) {
    return this.origin.applyMatrix4(e), this.direction.transformDirection(e), this;
  }
  equals(e) {
    return e.origin.equals(this.origin) && e.direction.equals(this.direction);
  }
  clone() {
    return new this.constructor().copy(this);
  }
}
class nt {
  constructor() {
    nt.prototype.isMatrix4 = !0, this.elements = [
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    ];
  }
  set(e, t, n, i, s, r, o, c, l, h, d, u, p, g, _, m) {
    const f = this.elements;
    return f[0] = e, f[4] = t, f[8] = n, f[12] = i, f[1] = s, f[5] = r, f[9] = o, f[13] = c, f[2] = l, f[6] = h, f[10] = d, f[14] = u, f[3] = p, f[7] = g, f[11] = _, f[15] = m, this;
  }
  identity() {
    return this.set(
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  clone() {
    return new nt().fromArray(this.elements);
  }
  copy(e) {
    const t = this.elements, n = e.elements;
    return t[0] = n[0], t[1] = n[1], t[2] = n[2], t[3] = n[3], t[4] = n[4], t[5] = n[5], t[6] = n[6], t[7] = n[7], t[8] = n[8], t[9] = n[9], t[10] = n[10], t[11] = n[11], t[12] = n[12], t[13] = n[13], t[14] = n[14], t[15] = n[15], this;
  }
  copyPosition(e) {
    const t = this.elements, n = e.elements;
    return t[12] = n[12], t[13] = n[13], t[14] = n[14], this;
  }
  setFromMatrix3(e) {
    const t = e.elements;
    return this.set(
      t[0],
      t[3],
      t[6],
      0,
      t[1],
      t[4],
      t[7],
      0,
      t[2],
      t[5],
      t[8],
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  extractBasis(e, t, n) {
    return e.setFromMatrixColumn(this, 0), t.setFromMatrixColumn(this, 1), n.setFromMatrixColumn(this, 2), this;
  }
  makeBasis(e, t, n) {
    return this.set(
      e.x,
      t.x,
      n.x,
      0,
      e.y,
      t.y,
      n.y,
      0,
      e.z,
      t.z,
      n.z,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  extractRotation(e) {
    const t = this.elements, n = e.elements, i = 1 / $n.setFromMatrixColumn(e, 0).length(), s = 1 / $n.setFromMatrixColumn(e, 1).length(), r = 1 / $n.setFromMatrixColumn(e, 2).length();
    return t[0] = n[0] * i, t[1] = n[1] * i, t[2] = n[2] * i, t[3] = 0, t[4] = n[4] * s, t[5] = n[5] * s, t[6] = n[6] * s, t[7] = 0, t[8] = n[8] * r, t[9] = n[9] * r, t[10] = n[10] * r, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, this;
  }
  makeRotationFromEuler(e) {
    const t = this.elements, n = e.x, i = e.y, s = e.z, r = Math.cos(n), o = Math.sin(n), c = Math.cos(i), l = Math.sin(i), h = Math.cos(s), d = Math.sin(s);
    if (e.order === "XYZ") {
      const u = r * h, p = r * d, g = o * h, _ = o * d;
      t[0] = c * h, t[4] = -c * d, t[8] = l, t[1] = p + g * l, t[5] = u - _ * l, t[9] = -o * c, t[2] = _ - u * l, t[6] = g + p * l, t[10] = r * c;
    } else if (e.order === "YXZ") {
      const u = c * h, p = c * d, g = l * h, _ = l * d;
      t[0] = u + _ * o, t[4] = g * o - p, t[8] = r * l, t[1] = r * d, t[5] = r * h, t[9] = -o, t[2] = p * o - g, t[6] = _ + u * o, t[10] = r * c;
    } else if (e.order === "ZXY") {
      const u = c * h, p = c * d, g = l * h, _ = l * d;
      t[0] = u - _ * o, t[4] = -r * d, t[8] = g + p * o, t[1] = p + g * o, t[5] = r * h, t[9] = _ - u * o, t[2] = -r * l, t[6] = o, t[10] = r * c;
    } else if (e.order === "ZYX") {
      const u = r * h, p = r * d, g = o * h, _ = o * d;
      t[0] = c * h, t[4] = g * l - p, t[8] = u * l + _, t[1] = c * d, t[5] = _ * l + u, t[9] = p * l - g, t[2] = -l, t[6] = o * c, t[10] = r * c;
    } else if (e.order === "YZX") {
      const u = r * c, p = r * l, g = o * c, _ = o * l;
      t[0] = c * h, t[4] = _ - u * d, t[8] = g * d + p, t[1] = d, t[5] = r * h, t[9] = -o * h, t[2] = -l * h, t[6] = p * d + g, t[10] = u - _ * d;
    } else if (e.order === "XZY") {
      const u = r * c, p = r * l, g = o * c, _ = o * l;
      t[0] = c * h, t[4] = -d, t[8] = l * h, t[1] = u * d + _, t[5] = r * h, t[9] = p * d - g, t[2] = g * d - p, t[6] = o * h, t[10] = _ * d + u;
    }
    return t[3] = 0, t[7] = 0, t[11] = 0, t[12] = 0, t[13] = 0, t[14] = 0, t[15] = 1, this;
  }
  makeRotationFromQuaternion(e) {
    return this.compose(Hu, e, Wu);
  }
  lookAt(e, t, n) {
    const i = this.elements;
    return Et.subVectors(e, t), Et.lengthSq() === 0 && (Et.z = 1), Et.normalize(), yn.crossVectors(n, Et), yn.lengthSq() === 0 && (Math.abs(n.z) === 1 ? Et.x += 1e-4 : Et.z += 1e-4, Et.normalize(), yn.crossVectors(n, Et)), yn.normalize(), $i.crossVectors(Et, yn), i[0] = yn.x, i[4] = $i.x, i[8] = Et.x, i[1] = yn.y, i[5] = $i.y, i[9] = Et.y, i[2] = yn.z, i[6] = $i.z, i[10] = Et.z, this;
  }
  multiply(e) {
    return this.multiplyMatrices(this, e);
  }
  premultiply(e) {
    return this.multiplyMatrices(e, this);
  }
  multiplyMatrices(e, t) {
    const n = e.elements, i = t.elements, s = this.elements, r = n[0], o = n[4], c = n[8], l = n[12], h = n[1], d = n[5], u = n[9], p = n[13], g = n[2], _ = n[6], m = n[10], f = n[14], v = n[3], M = n[7], y = n[11], w = n[15], C = i[0], P = i[4], I = i[8], S = i[12], T = i[1], O = i[5], k = i[9], L = i[13], R = i[2], D = i[6], N = i[10], K = i[14], B = i[3], H = i[7], Q = i[11], ce = i[15];
    return s[0] = r * C + o * T + c * R + l * B, s[4] = r * P + o * O + c * D + l * H, s[8] = r * I + o * k + c * N + l * Q, s[12] = r * S + o * L + c * K + l * ce, s[1] = h * C + d * T + u * R + p * B, s[5] = h * P + d * O + u * D + p * H, s[9] = h * I + d * k + u * N + p * Q, s[13] = h * S + d * L + u * K + p * ce, s[2] = g * C + _ * T + m * R + f * B, s[6] = g * P + _ * O + m * D + f * H, s[10] = g * I + _ * k + m * N + f * Q, s[14] = g * S + _ * L + m * K + f * ce, s[3] = v * C + M * T + y * R + w * B, s[7] = v * P + M * O + y * D + w * H, s[11] = v * I + M * k + y * N + w * Q, s[15] = v * S + M * L + y * K + w * ce, this;
  }
  multiplyScalar(e) {
    const t = this.elements;
    return t[0] *= e, t[4] *= e, t[8] *= e, t[12] *= e, t[1] *= e, t[5] *= e, t[9] *= e, t[13] *= e, t[2] *= e, t[6] *= e, t[10] *= e, t[14] *= e, t[3] *= e, t[7] *= e, t[11] *= e, t[15] *= e, this;
  }
  determinant() {
    const e = this.elements, t = e[0], n = e[4], i = e[8], s = e[12], r = e[1], o = e[5], c = e[9], l = e[13], h = e[2], d = e[6], u = e[10], p = e[14], g = e[3], _ = e[7], m = e[11], f = e[15];
    return g * (+s * c * d - i * l * d - s * o * u + n * l * u + i * o * p - n * c * p) + _ * (+t * c * p - t * l * u + s * r * u - i * r * p + i * l * h - s * c * h) + m * (+t * l * d - t * o * p - s * r * d + n * r * p + s * o * h - n * l * h) + f * (-i * o * h - t * c * d + t * o * u + i * r * d - n * r * u + n * c * h);
  }
  transpose() {
    const e = this.elements;
    let t;
    return t = e[1], e[1] = e[4], e[4] = t, t = e[2], e[2] = e[8], e[8] = t, t = e[6], e[6] = e[9], e[9] = t, t = e[3], e[3] = e[12], e[12] = t, t = e[7], e[7] = e[13], e[13] = t, t = e[11], e[11] = e[14], e[14] = t, this;
  }
  setPosition(e, t, n) {
    const i = this.elements;
    return e.isVector3 ? (i[12] = e.x, i[13] = e.y, i[14] = e.z) : (i[12] = e, i[13] = t, i[14] = n), this;
  }
  invert() {
    const e = this.elements, t = e[0], n = e[1], i = e[2], s = e[3], r = e[4], o = e[5], c = e[6], l = e[7], h = e[8], d = e[9], u = e[10], p = e[11], g = e[12], _ = e[13], m = e[14], f = e[15], v = d * m * l - _ * u * l + _ * c * p - o * m * p - d * c * f + o * u * f, M = g * u * l - h * m * l - g * c * p + r * m * p + h * c * f - r * u * f, y = h * _ * l - g * d * l + g * o * p - r * _ * p - h * o * f + r * d * f, w = g * d * c - h * _ * c - g * o * u + r * _ * u + h * o * m - r * d * m, C = t * v + n * M + i * y + s * w;
    if (C === 0)
      return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    const P = 1 / C;
    return e[0] = v * P, e[1] = (_ * u * s - d * m * s - _ * i * p + n * m * p + d * i * f - n * u * f) * P, e[2] = (o * m * s - _ * c * s + _ * i * l - n * m * l - o * i * f + n * c * f) * P, e[3] = (d * c * s - o * u * s - d * i * l + n * u * l + o * i * p - n * c * p) * P, e[4] = M * P, e[5] = (h * m * s - g * u * s + g * i * p - t * m * p - h * i * f + t * u * f) * P, e[6] = (g * c * s - r * m * s - g * i * l + t * m * l + r * i * f - t * c * f) * P, e[7] = (r * u * s - h * c * s + h * i * l - t * u * l - r * i * p + t * c * p) * P, e[8] = y * P, e[9] = (g * d * s - h * _ * s - g * n * p + t * _ * p + h * n * f - t * d * f) * P, e[10] = (r * _ * s - g * o * s + g * n * l - t * _ * l - r * n * f + t * o * f) * P, e[11] = (h * o * s - r * d * s - h * n * l + t * d * l + r * n * p - t * o * p) * P, e[12] = w * P, e[13] = (h * _ * i - g * d * i + g * n * u - t * _ * u - h * n * m + t * d * m) * P, e[14] = (g * o * i - r * _ * i - g * n * c + t * _ * c + r * n * m - t * o * m) * P, e[15] = (r * d * i - h * o * i + h * n * c - t * d * c - r * n * u + t * o * u) * P, this;
  }
  scale(e) {
    const t = this.elements, n = e.x, i = e.y, s = e.z;
    return t[0] *= n, t[4] *= i, t[8] *= s, t[1] *= n, t[5] *= i, t[9] *= s, t[2] *= n, t[6] *= i, t[10] *= s, t[3] *= n, t[7] *= i, t[11] *= s, this;
  }
  getMaxScaleOnAxis() {
    const e = this.elements, t = e[0] * e[0] + e[1] * e[1] + e[2] * e[2], n = e[4] * e[4] + e[5] * e[5] + e[6] * e[6], i = e[8] * e[8] + e[9] * e[9] + e[10] * e[10];
    return Math.sqrt(Math.max(t, n, i));
  }
  makeTranslation(e, t, n) {
    return this.set(
      1,
      0,
      0,
      e,
      0,
      1,
      0,
      t,
      0,
      0,
      1,
      n,
      0,
      0,
      0,
      1
    ), this;
  }
  makeRotationX(e) {
    const t = Math.cos(e), n = Math.sin(e);
    return this.set(
      1,
      0,
      0,
      0,
      0,
      t,
      -n,
      0,
      0,
      n,
      t,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  makeRotationY(e) {
    const t = Math.cos(e), n = Math.sin(e);
    return this.set(
      t,
      0,
      n,
      0,
      0,
      1,
      0,
      0,
      -n,
      0,
      t,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  makeRotationZ(e) {
    const t = Math.cos(e), n = Math.sin(e);
    return this.set(
      t,
      -n,
      0,
      0,
      n,
      t,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  makeRotationAxis(e, t) {
    const n = Math.cos(t), i = Math.sin(t), s = 1 - n, r = e.x, o = e.y, c = e.z, l = s * r, h = s * o;
    return this.set(
      l * r + n,
      l * o - i * c,
      l * c + i * o,
      0,
      l * o + i * c,
      h * o + n,
      h * c - i * r,
      0,
      l * c - i * o,
      h * c + i * r,
      s * c * c + n,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  makeScale(e, t, n) {
    return this.set(
      e,
      0,
      0,
      0,
      0,
      t,
      0,
      0,
      0,
      0,
      n,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  makeShear(e, t, n, i, s, r) {
    return this.set(
      1,
      n,
      s,
      0,
      e,
      1,
      r,
      0,
      t,
      i,
      1,
      0,
      0,
      0,
      0,
      1
    ), this;
  }
  compose(e, t, n) {
    const i = this.elements, s = t._x, r = t._y, o = t._z, c = t._w, l = s + s, h = r + r, d = o + o, u = s * l, p = s * h, g = s * d, _ = r * h, m = r * d, f = o * d, v = c * l, M = c * h, y = c * d, w = n.x, C = n.y, P = n.z;
    return i[0] = (1 - (_ + f)) * w, i[1] = (p + y) * w, i[2] = (g - M) * w, i[3] = 0, i[4] = (p - y) * C, i[5] = (1 - (u + f)) * C, i[6] = (m + v) * C, i[7] = 0, i[8] = (g + M) * P, i[9] = (m - v) * P, i[10] = (1 - (u + _)) * P, i[11] = 0, i[12] = e.x, i[13] = e.y, i[14] = e.z, i[15] = 1, this;
  }
  decompose(e, t, n) {
    const i = this.elements;
    let s = $n.set(i[0], i[1], i[2]).length();
    const r = $n.set(i[4], i[5], i[6]).length(), o = $n.set(i[8], i[9], i[10]).length();
    this.determinant() < 0 && (s = -s), e.x = i[12], e.y = i[13], e.z = i[14], zt.copy(this);
    const l = 1 / s, h = 1 / r, d = 1 / o;
    return zt.elements[0] *= l, zt.elements[1] *= l, zt.elements[2] *= l, zt.elements[4] *= h, zt.elements[5] *= h, zt.elements[6] *= h, zt.elements[8] *= d, zt.elements[9] *= d, zt.elements[10] *= d, t.setFromRotationMatrix(zt), n.x = s, n.y = r, n.z = o, this;
  }
  makePerspective(e, t, n, i, s, r) {
    const o = this.elements, c = 2 * s / (t - e), l = 2 * s / (n - i), h = (t + e) / (t - e), d = (n + i) / (n - i), u = -(r + s) / (r - s), p = -2 * r * s / (r - s);
    return o[0] = c, o[4] = 0, o[8] = h, o[12] = 0, o[1] = 0, o[5] = l, o[9] = d, o[13] = 0, o[2] = 0, o[6] = 0, o[10] = u, o[14] = p, o[3] = 0, o[7] = 0, o[11] = -1, o[15] = 0, this;
  }
  makeOrthographic(e, t, n, i, s, r) {
    const o = this.elements, c = 1 / (t - e), l = 1 / (n - i), h = 1 / (r - s), d = (t + e) * c, u = (n + i) * l, p = (r + s) * h;
    return o[0] = 2 * c, o[4] = 0, o[8] = 0, o[12] = -d, o[1] = 0, o[5] = 2 * l, o[9] = 0, o[13] = -u, o[2] = 0, o[6] = 0, o[10] = -2 * h, o[14] = -p, o[3] = 0, o[7] = 0, o[11] = 0, o[15] = 1, this;
  }
  equals(e) {
    const t = this.elements, n = e.elements;
    for (let i = 0; i < 16; i++)
      if (t[i] !== n[i])
        return !1;
    return !0;
  }
  fromArray(e, t = 0) {
    for (let n = 0; n < 16; n++)
      this.elements[n] = e[n + t];
    return this;
  }
  toArray(e = [], t = 0) {
    const n = this.elements;
    return e[t] = n[0], e[t + 1] = n[1], e[t + 2] = n[2], e[t + 3] = n[3], e[t + 4] = n[4], e[t + 5] = n[5], e[t + 6] = n[6], e[t + 7] = n[7], e[t + 8] = n[8], e[t + 9] = n[9], e[t + 10] = n[10], e[t + 11] = n[11], e[t + 12] = n[12], e[t + 13] = n[13], e[t + 14] = n[14], e[t + 15] = n[15], e;
  }
}
const $n = /* @__PURE__ */ new G(), zt = /* @__PURE__ */ new nt(), Hu = /* @__PURE__ */ new G(0, 0, 0), Wu = /* @__PURE__ */ new G(1, 1, 1), yn = /* @__PURE__ */ new G(), $i = /* @__PURE__ */ new G(), Et = /* @__PURE__ */ new G(), Po = /* @__PURE__ */ new nt(), Ro = /* @__PURE__ */ new zi();
class vs {
  constructor(e = 0, t = 0, n = 0, i = vs.DEFAULT_ORDER) {
    this.isEuler = !0, this._x = e, this._y = t, this._z = n, this._order = i;
  }
  get x() {
    return this._x;
  }
  set x(e) {
    this._x = e, this._onChangeCallback();
  }
  get y() {
    return this._y;
  }
  set y(e) {
    this._y = e, this._onChangeCallback();
  }
  get z() {
    return this._z;
  }
  set z(e) {
    this._z = e, this._onChangeCallback();
  }
  get order() {
    return this._order;
  }
  set order(e) {
    this._order = e, this._onChangeCallback();
  }
  set(e, t, n, i = this._order) {
    return this._x = e, this._y = t, this._z = n, this._order = i, this._onChangeCallback(), this;
  }
  clone() {
    return new this.constructor(this._x, this._y, this._z, this._order);
  }
  copy(e) {
    return this._x = e._x, this._y = e._y, this._z = e._z, this._order = e._order, this._onChangeCallback(), this;
  }
  setFromRotationMatrix(e, t = this._order, n = !0) {
    const i = e.elements, s = i[0], r = i[4], o = i[8], c = i[1], l = i[5], h = i[9], d = i[2], u = i[6], p = i[10];
    switch (t) {
      case "XYZ":
        this._y = Math.asin(Mt(o, -1, 1)), Math.abs(o) < 0.9999999 ? (this._x = Math.atan2(-h, p), this._z = Math.atan2(-r, s)) : (this._x = Math.atan2(u, l), this._z = 0);
        break;
      case "YXZ":
        this._x = Math.asin(-Mt(h, -1, 1)), Math.abs(h) < 0.9999999 ? (this._y = Math.atan2(o, p), this._z = Math.atan2(c, l)) : (this._y = Math.atan2(-d, s), this._z = 0);
        break;
      case "ZXY":
        this._x = Math.asin(Mt(u, -1, 1)), Math.abs(u) < 0.9999999 ? (this._y = Math.atan2(-d, p), this._z = Math.atan2(-r, l)) : (this._y = 0, this._z = Math.atan2(c, s));
        break;
      case "ZYX":
        this._y = Math.asin(-Mt(d, -1, 1)), Math.abs(d) < 0.9999999 ? (this._x = Math.atan2(u, p), this._z = Math.atan2(c, s)) : (this._x = 0, this._z = Math.atan2(-r, l));
        break;
      case "YZX":
        this._z = Math.asin(Mt(c, -1, 1)), Math.abs(c) < 0.9999999 ? (this._x = Math.atan2(-h, l), this._y = Math.atan2(-d, s)) : (this._x = 0, this._y = Math.atan2(o, p));
        break;
      case "XZY":
        this._z = Math.asin(-Mt(r, -1, 1)), Math.abs(r) < 0.9999999 ? (this._x = Math.atan2(u, l), this._y = Math.atan2(o, s)) : (this._x = Math.atan2(-h, p), this._y = 0);
        break;
      default:
        console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: " + t);
    }
    return this._order = t, n === !0 && this._onChangeCallback(), this;
  }
  setFromQuaternion(e, t, n) {
    return Po.makeRotationFromQuaternion(e), this.setFromRotationMatrix(Po, t, n);
  }
  setFromVector3(e, t = this._order) {
    return this.set(e.x, e.y, e.z, t);
  }
  reorder(e) {
    return Ro.setFromEuler(this), this.setFromQuaternion(Ro, e);
  }
  equals(e) {
    return e._x === this._x && e._y === this._y && e._z === this._z && e._order === this._order;
  }
  fromArray(e) {
    return this._x = e[0], this._y = e[1], this._z = e[2], e[3] !== void 0 && (this._order = e[3]), this._onChangeCallback(), this;
  }
  toArray(e = [], t = 0) {
    return e[t] = this._x, e[t + 1] = this._y, e[t + 2] = this._z, e[t + 3] = this._order, e;
  }
  _onChange(e) {
    return this._onChangeCallback = e, this;
  }
  _onChangeCallback() {
  }
  *[Symbol.iterator]() {
    yield this._x, yield this._y, yield this._z, yield this._order;
  }
}
vs.DEFAULT_ORDER = "XYZ";
class za {
  constructor() {
    this.mask = 1;
  }
  set(e) {
    this.mask = (1 << e | 0) >>> 0;
  }
  enable(e) {
    this.mask |= 1 << e | 0;
  }
  enableAll() {
    this.mask = -1;
  }
  toggle(e) {
    this.mask ^= 1 << e | 0;
  }
  disable(e) {
    this.mask &= ~(1 << e | 0);
  }
  disableAll() {
    this.mask = 0;
  }
  test(e) {
    return (this.mask & e.mask) !== 0;
  }
  isEnabled(e) {
    return (this.mask & (1 << e | 0)) !== 0;
  }
}
let qu = 0;
const Do = /* @__PURE__ */ new G(), Zn = /* @__PURE__ */ new zi(), hn = /* @__PURE__ */ new nt(), Zi = /* @__PURE__ */ new G(), Ti = /* @__PURE__ */ new G(), Xu = /* @__PURE__ */ new G(), ju = /* @__PURE__ */ new zi(), Io = /* @__PURE__ */ new G(1, 0, 0), Uo = /* @__PURE__ */ new G(0, 1, 0), No = /* @__PURE__ */ new G(0, 0, 1), Yu = { type: "added" }, zo = { type: "removed" };
class ht extends mi {
  constructor() {
    super(), this.isObject3D = !0, Object.defineProperty(this, "id", { value: qu++ }), this.uuid = Ni(), this.name = "", this.type = "Object3D", this.parent = null, this.children = [], this.up = ht.DEFAULT_UP.clone();
    const e = new G(), t = new vs(), n = new zi(), i = new G(1, 1, 1);
    function s() {
      n.setFromEuler(t, !1);
    }
    function r() {
      t.setFromQuaternion(n, void 0, !1);
    }
    t._onChange(s), n._onChange(r), Object.defineProperties(this, {
      position: {
        configurable: !0,
        enumerable: !0,
        value: e
      },
      rotation: {
        configurable: !0,
        enumerable: !0,
        value: t
      },
      quaternion: {
        configurable: !0,
        enumerable: !0,
        value: n
      },
      scale: {
        configurable: !0,
        enumerable: !0,
        value: i
      },
      modelViewMatrix: {
        value: new nt()
      },
      normalMatrix: {
        value: new Ie()
      }
    }), this.matrix = new nt(), this.matrixWorld = new nt(), this.matrixAutoUpdate = ht.DEFAULT_MATRIX_AUTO_UPDATE, this.matrixWorldNeedsUpdate = !1, this.matrixWorldAutoUpdate = ht.DEFAULT_MATRIX_WORLD_AUTO_UPDATE, this.layers = new za(), this.visible = !0, this.castShadow = !1, this.receiveShadow = !1, this.frustumCulled = !0, this.renderOrder = 0, this.animations = [], this.userData = {};
  }
  onBeforeRender() {
  }
  onAfterRender() {
  }
  applyMatrix4(e) {
    this.matrixAutoUpdate && this.updateMatrix(), this.matrix.premultiply(e), this.matrix.decompose(this.position, this.quaternion, this.scale);
  }
  applyQuaternion(e) {
    return this.quaternion.premultiply(e), this;
  }
  setRotationFromAxisAngle(e, t) {
    this.quaternion.setFromAxisAngle(e, t);
  }
  setRotationFromEuler(e) {
    this.quaternion.setFromEuler(e, !0);
  }
  setRotationFromMatrix(e) {
    this.quaternion.setFromRotationMatrix(e);
  }
  setRotationFromQuaternion(e) {
    this.quaternion.copy(e);
  }
  rotateOnAxis(e, t) {
    return Zn.setFromAxisAngle(e, t), this.quaternion.multiply(Zn), this;
  }
  rotateOnWorldAxis(e, t) {
    return Zn.setFromAxisAngle(e, t), this.quaternion.premultiply(Zn), this;
  }
  rotateX(e) {
    return this.rotateOnAxis(Io, e);
  }
  rotateY(e) {
    return this.rotateOnAxis(Uo, e);
  }
  rotateZ(e) {
    return this.rotateOnAxis(No, e);
  }
  translateOnAxis(e, t) {
    return Do.copy(e).applyQuaternion(this.quaternion), this.position.add(Do.multiplyScalar(t)), this;
  }
  translateX(e) {
    return this.translateOnAxis(Io, e);
  }
  translateY(e) {
    return this.translateOnAxis(Uo, e);
  }
  translateZ(e) {
    return this.translateOnAxis(No, e);
  }
  localToWorld(e) {
    return this.updateWorldMatrix(!0, !1), e.applyMatrix4(this.matrixWorld);
  }
  worldToLocal(e) {
    return this.updateWorldMatrix(!0, !1), e.applyMatrix4(hn.copy(this.matrixWorld).invert());
  }
  lookAt(e, t, n) {
    e.isVector3 ? Zi.copy(e) : Zi.set(e, t, n);
    const i = this.parent;
    this.updateWorldMatrix(!0, !1), Ti.setFromMatrixPosition(this.matrixWorld), this.isCamera || this.isLight ? hn.lookAt(Ti, Zi, this.up) : hn.lookAt(Zi, Ti, this.up), this.quaternion.setFromRotationMatrix(hn), i && (hn.extractRotation(i.matrixWorld), Zn.setFromRotationMatrix(hn), this.quaternion.premultiply(Zn.invert()));
  }
  add(e) {
    if (arguments.length > 1) {
      for (let t = 0; t < arguments.length; t++)
        this.add(arguments[t]);
      return this;
    }
    return e === this ? (console.error("THREE.Object3D.add: object can't be added as a child of itself.", e), this) : (e && e.isObject3D ? (e.parent !== null && e.parent.remove(e), e.parent = this, this.children.push(e), e.dispatchEvent(Yu)) : console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.", e), this);
  }
  remove(e) {
    if (arguments.length > 1) {
      for (let n = 0; n < arguments.length; n++)
        this.remove(arguments[n]);
      return this;
    }
    const t = this.children.indexOf(e);
    return t !== -1 && (e.parent = null, this.children.splice(t, 1), e.dispatchEvent(zo)), this;
  }
  removeFromParent() {
    const e = this.parent;
    return e !== null && e.remove(this), this;
  }
  clear() {
    for (let e = 0; e < this.children.length; e++) {
      const t = this.children[e];
      t.parent = null, t.dispatchEvent(zo);
    }
    return this.children.length = 0, this;
  }
  attach(e) {
    return this.updateWorldMatrix(!0, !1), hn.copy(this.matrixWorld).invert(), e.parent !== null && (e.parent.updateWorldMatrix(!0, !1), hn.multiply(e.parent.matrixWorld)), e.applyMatrix4(hn), this.add(e), e.updateWorldMatrix(!1, !0), this;
  }
  getObjectById(e) {
    return this.getObjectByProperty("id", e);
  }
  getObjectByName(e) {
    return this.getObjectByProperty("name", e);
  }
  getObjectByProperty(e, t) {
    if (this[e] === t)
      return this;
    for (let n = 0, i = this.children.length; n < i; n++) {
      const r = this.children[n].getObjectByProperty(e, t);
      if (r !== void 0)
        return r;
    }
  }
  getObjectsByProperty(e, t) {
    let n = [];
    this[e] === t && n.push(this);
    for (let i = 0, s = this.children.length; i < s; i++) {
      const r = this.children[i].getObjectsByProperty(e, t);
      r.length > 0 && (n = n.concat(r));
    }
    return n;
  }
  getWorldPosition(e) {
    return this.updateWorldMatrix(!0, !1), e.setFromMatrixPosition(this.matrixWorld);
  }
  getWorldQuaternion(e) {
    return this.updateWorldMatrix(!0, !1), this.matrixWorld.decompose(Ti, e, Xu), e;
  }
  getWorldScale(e) {
    return this.updateWorldMatrix(!0, !1), this.matrixWorld.decompose(Ti, ju, e), e;
  }
  getWorldDirection(e) {
    this.updateWorldMatrix(!0, !1);
    const t = this.matrixWorld.elements;
    return e.set(t[8], t[9], t[10]).normalize();
  }
  raycast() {
  }
  traverse(e) {
    e(this);
    const t = this.children;
    for (let n = 0, i = t.length; n < i; n++)
      t[n].traverse(e);
  }
  traverseVisible(e) {
    if (this.visible === !1)
      return;
    e(this);
    const t = this.children;
    for (let n = 0, i = t.length; n < i; n++)
      t[n].traverseVisible(e);
  }
  traverseAncestors(e) {
    const t = this.parent;
    t !== null && (e(t), t.traverseAncestors(e));
  }
  updateMatrix() {
    this.matrix.compose(this.position, this.quaternion, this.scale), this.matrixWorldNeedsUpdate = !0;
  }
  updateMatrixWorld(e) {
    this.matrixAutoUpdate && this.updateMatrix(), (this.matrixWorldNeedsUpdate || e) && (this.parent === null ? this.matrixWorld.copy(this.matrix) : this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix), this.matrixWorldNeedsUpdate = !1, e = !0);
    const t = this.children;
    for (let n = 0, i = t.length; n < i; n++) {
      const s = t[n];
      (s.matrixWorldAutoUpdate === !0 || e === !0) && s.updateMatrixWorld(e);
    }
  }
  updateWorldMatrix(e, t) {
    const n = this.parent;
    if (e === !0 && n !== null && n.matrixWorldAutoUpdate === !0 && n.updateWorldMatrix(!0, !1), this.matrixAutoUpdate && this.updateMatrix(), this.parent === null ? this.matrixWorld.copy(this.matrix) : this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix), t === !0) {
      const i = this.children;
      for (let s = 0, r = i.length; s < r; s++) {
        const o = i[s];
        o.matrixWorldAutoUpdate === !0 && o.updateWorldMatrix(!1, !0);
      }
    }
  }
  toJSON(e) {
    const t = e === void 0 || typeof e == "string", n = {};
    t && (e = {
      geometries: {},
      materials: {},
      textures: {},
      images: {},
      shapes: {},
      skeletons: {},
      animations: {},
      nodes: {}
    }, n.metadata = {
      version: 4.5,
      type: "Object",
      generator: "Object3D.toJSON"
    });
    const i = {};
    i.uuid = this.uuid, i.type = this.type, this.name !== "" && (i.name = this.name), this.castShadow === !0 && (i.castShadow = !0), this.receiveShadow === !0 && (i.receiveShadow = !0), this.visible === !1 && (i.visible = !1), this.frustumCulled === !1 && (i.frustumCulled = !1), this.renderOrder !== 0 && (i.renderOrder = this.renderOrder), Object.keys(this.userData).length > 0 && (i.userData = this.userData), i.layers = this.layers.mask, i.matrix = this.matrix.toArray(), i.up = this.up.toArray(), this.matrixAutoUpdate === !1 && (i.matrixAutoUpdate = !1), this.isInstancedMesh && (i.type = "InstancedMesh", i.count = this.count, i.instanceMatrix = this.instanceMatrix.toJSON(), this.instanceColor !== null && (i.instanceColor = this.instanceColor.toJSON()));
    function s(o, c) {
      return o[c.uuid] === void 0 && (o[c.uuid] = c.toJSON(e)), c.uuid;
    }
    if (this.isScene)
      this.background && (this.background.isColor ? i.background = this.background.toJSON() : this.background.isTexture && (i.background = this.background.toJSON(e).uuid)), this.environment && this.environment.isTexture && this.environment.isRenderTargetTexture !== !0 && (i.environment = this.environment.toJSON(e).uuid);
    else if (this.isMesh || this.isLine || this.isPoints) {
      i.geometry = s(e.geometries, this.geometry);
      const o = this.geometry.parameters;
      if (o !== void 0 && o.shapes !== void 0) {
        const c = o.shapes;
        if (Array.isArray(c))
          for (let l = 0, h = c.length; l < h; l++) {
            const d = c[l];
            s(e.shapes, d);
          }
        else
          s(e.shapes, c);
      }
    }
    if (this.isSkinnedMesh && (i.bindMode = this.bindMode, i.bindMatrix = this.bindMatrix.toArray(), this.skeleton !== void 0 && (s(e.skeletons, this.skeleton), i.skeleton = this.skeleton.uuid)), this.material !== void 0)
      if (Array.isArray(this.material)) {
        const o = [];
        for (let c = 0, l = this.material.length; c < l; c++)
          o.push(s(e.materials, this.material[c]));
        i.material = o;
      } else
        i.material = s(e.materials, this.material);
    if (this.children.length > 0) {
      i.children = [];
      for (let o = 0; o < this.children.length; o++)
        i.children.push(this.children[o].toJSON(e).object);
    }
    if (this.animations.length > 0) {
      i.animations = [];
      for (let o = 0; o < this.animations.length; o++) {
        const c = this.animations[o];
        i.animations.push(s(e.animations, c));
      }
    }
    if (t) {
      const o = r(e.geometries), c = r(e.materials), l = r(e.textures), h = r(e.images), d = r(e.shapes), u = r(e.skeletons), p = r(e.animations), g = r(e.nodes);
      o.length > 0 && (n.geometries = o), c.length > 0 && (n.materials = c), l.length > 0 && (n.textures = l), h.length > 0 && (n.images = h), d.length > 0 && (n.shapes = d), u.length > 0 && (n.skeletons = u), p.length > 0 && (n.animations = p), g.length > 0 && (n.nodes = g);
    }
    return n.object = i, n;
    function r(o) {
      const c = [];
      for (const l in o) {
        const h = o[l];
        delete h.metadata, c.push(h);
      }
      return c;
    }
  }
  clone(e) {
    return new this.constructor().copy(this, e);
  }
  copy(e, t = !0) {
    if (this.name = e.name, this.up.copy(e.up), this.position.copy(e.position), this.rotation.order = e.rotation.order, this.quaternion.copy(e.quaternion), this.scale.copy(e.scale), this.matrix.copy(e.matrix), this.matrixWorld.copy(e.matrixWorld), this.matrixAutoUpdate = e.matrixAutoUpdate, this.matrixWorldNeedsUpdate = e.matrixWorldNeedsUpdate, this.matrixWorldAutoUpdate = e.matrixWorldAutoUpdate, this.layers.mask = e.layers.mask, this.visible = e.visible, this.castShadow = e.castShadow, this.receiveShadow = e.receiveShadow, this.frustumCulled = e.frustumCulled, this.renderOrder = e.renderOrder, this.userData = JSON.parse(JSON.stringify(e.userData)), t === !0)
      for (let n = 0; n < e.children.length; n++) {
        const i = e.children[n];
        this.add(i.clone());
      }
    return this;
  }
}
ht.DEFAULT_UP = /* @__PURE__ */ new G(0, 1, 0);
ht.DEFAULT_MATRIX_AUTO_UPDATE = !0;
ht.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = !0;
const Ft = /* @__PURE__ */ new G(), un = /* @__PURE__ */ new G(), $s = /* @__PURE__ */ new G(), dn = /* @__PURE__ */ new G(), Kn = /* @__PURE__ */ new G(), Jn = /* @__PURE__ */ new G(), Fo = /* @__PURE__ */ new G(), Zs = /* @__PURE__ */ new G(), Ks = /* @__PURE__ */ new G(), Js = /* @__PURE__ */ new G();
let Ki = !1;
class Bt {
  constructor(e = new G(), t = new G(), n = new G()) {
    this.a = e, this.b = t, this.c = n;
  }
  static getNormal(e, t, n, i) {
    i.subVectors(n, t), Ft.subVectors(e, t), i.cross(Ft);
    const s = i.lengthSq();
    return s > 0 ? i.multiplyScalar(1 / Math.sqrt(s)) : i.set(0, 0, 0);
  }
  // static/instance method to calculate barycentric coordinates
  // based on: http://www.blackpawn.com/texts/pointinpoly/default.html
  static getBarycoord(e, t, n, i, s) {
    Ft.subVectors(i, t), un.subVectors(n, t), $s.subVectors(e, t);
    const r = Ft.dot(Ft), o = Ft.dot(un), c = Ft.dot($s), l = un.dot(un), h = un.dot($s), d = r * l - o * o;
    if (d === 0)
      return s.set(-2, -1, -1);
    const u = 1 / d, p = (l * c - o * h) * u, g = (r * h - o * c) * u;
    return s.set(1 - p - g, g, p);
  }
  static containsPoint(e, t, n, i) {
    return this.getBarycoord(e, t, n, i, dn), dn.x >= 0 && dn.y >= 0 && dn.x + dn.y <= 1;
  }
  static getUV(e, t, n, i, s, r, o, c) {
    return Ki === !1 && (console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."), Ki = !0), this.getInterpolation(e, t, n, i, s, r, o, c);
  }
  static getInterpolation(e, t, n, i, s, r, o, c) {
    return this.getBarycoord(e, t, n, i, dn), c.setScalar(0), c.addScaledVector(s, dn.x), c.addScaledVector(r, dn.y), c.addScaledVector(o, dn.z), c;
  }
  static isFrontFacing(e, t, n, i) {
    return Ft.subVectors(n, t), un.subVectors(e, t), Ft.cross(un).dot(i) < 0;
  }
  set(e, t, n) {
    return this.a.copy(e), this.b.copy(t), this.c.copy(n), this;
  }
  setFromPointsAndIndices(e, t, n, i) {
    return this.a.copy(e[t]), this.b.copy(e[n]), this.c.copy(e[i]), this;
  }
  setFromAttributeAndIndices(e, t, n, i) {
    return this.a.fromBufferAttribute(e, t), this.b.fromBufferAttribute(e, n), this.c.fromBufferAttribute(e, i), this;
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(e) {
    return this.a.copy(e.a), this.b.copy(e.b), this.c.copy(e.c), this;
  }
  getArea() {
    return Ft.subVectors(this.c, this.b), un.subVectors(this.a, this.b), Ft.cross(un).length() * 0.5;
  }
  getMidpoint(e) {
    return e.addVectors(this.a, this.b).add(this.c).multiplyScalar(1 / 3);
  }
  getNormal(e) {
    return Bt.getNormal(this.a, this.b, this.c, e);
  }
  getPlane(e) {
    return e.setFromCoplanarPoints(this.a, this.b, this.c);
  }
  getBarycoord(e, t) {
    return Bt.getBarycoord(e, this.a, this.b, this.c, t);
  }
  getUV(e, t, n, i, s) {
    return Ki === !1 && (console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."), Ki = !0), Bt.getInterpolation(e, this.a, this.b, this.c, t, n, i, s);
  }
  getInterpolation(e, t, n, i, s) {
    return Bt.getInterpolation(e, this.a, this.b, this.c, t, n, i, s);
  }
  containsPoint(e) {
    return Bt.containsPoint(e, this.a, this.b, this.c);
  }
  isFrontFacing(e) {
    return Bt.isFrontFacing(this.a, this.b, this.c, e);
  }
  intersectsBox(e) {
    return e.intersectsTriangle(this);
  }
  closestPointToPoint(e, t) {
    const n = this.a, i = this.b, s = this.c;
    let r, o;
    Kn.subVectors(i, n), Jn.subVectors(s, n), Zs.subVectors(e, n);
    const c = Kn.dot(Zs), l = Jn.dot(Zs);
    if (c <= 0 && l <= 0)
      return t.copy(n);
    Ks.subVectors(e, i);
    const h = Kn.dot(Ks), d = Jn.dot(Ks);
    if (h >= 0 && d <= h)
      return t.copy(i);
    const u = c * d - h * l;
    if (u <= 0 && c >= 0 && h <= 0)
      return r = c / (c - h), t.copy(n).addScaledVector(Kn, r);
    Js.subVectors(e, s);
    const p = Kn.dot(Js), g = Jn.dot(Js);
    if (g >= 0 && p <= g)
      return t.copy(s);
    const _ = p * l - c * g;
    if (_ <= 0 && l >= 0 && g <= 0)
      return o = l / (l - g), t.copy(n).addScaledVector(Jn, o);
    const m = h * g - p * d;
    if (m <= 0 && d - h >= 0 && p - g >= 0)
      return Fo.subVectors(s, i), o = (d - h) / (d - h + (p - g)), t.copy(i).addScaledVector(Fo, o);
    const f = 1 / (m + _ + u);
    return r = _ * f, o = u * f, t.copy(n).addScaledVector(Kn, r).addScaledVector(Jn, o);
  }
  equals(e) {
    return e.a.equals(this.a) && e.b.equals(this.b) && e.c.equals(this.c);
  }
}
let $u = 0;
class gi extends mi {
  constructor() {
    super(), this.isMaterial = !0, Object.defineProperty(this, "id", { value: $u++ }), this.uuid = Ni(), this.name = "", this.type = "Material", this.blending = li, this.side = wn, this.vertexColors = !1, this.opacity = 1, this.transparent = !1, this.blendSrc = Ta, this.blendDst = Aa, this.blendEquation = oi, this.blendSrcAlpha = null, this.blendDstAlpha = null, this.blendEquationAlpha = null, this.depthFunc = lr, this.depthTest = !0, this.depthWrite = !0, this.stencilWriteMask = 255, this.stencilFunc = Pu, this.stencilRef = 0, this.stencilFuncMask = 255, this.stencilFail = Fs, this.stencilZFail = Fs, this.stencilZPass = Fs, this.stencilWrite = !1, this.clippingPlanes = null, this.clipIntersection = !1, this.clipShadows = !1, this.shadowSide = null, this.colorWrite = !0, this.precision = null, this.polygonOffset = !1, this.polygonOffsetFactor = 0, this.polygonOffsetUnits = 0, this.dithering = !1, this.alphaToCoverage = !1, this.premultipliedAlpha = !1, this.forceSinglePass = !1, this.visible = !0, this.toneMapped = !0, this.userData = {}, this.version = 0, this._alphaTest = 0;
  }
  get alphaTest() {
    return this._alphaTest;
  }
  set alphaTest(e) {
    this._alphaTest > 0 != e > 0 && this.version++, this._alphaTest = e;
  }
  onBuild() {
  }
  onBeforeRender() {
  }
  onBeforeCompile() {
  }
  customProgramCacheKey() {
    return this.onBeforeCompile.toString();
  }
  setValues(e) {
    if (e !== void 0)
      for (const t in e) {
        const n = e[t];
        if (n === void 0) {
          console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);
          continue;
        }
        const i = this[t];
        if (i === void 0) {
          console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);
          continue;
        }
        i && i.isColor ? i.set(n) : i && i.isVector3 && n && n.isVector3 ? i.copy(n) : this[t] = n;
      }
  }
  toJSON(e) {
    const t = e === void 0 || typeof e == "string";
    t && (e = {
      textures: {},
      images: {}
    });
    const n = {
      metadata: {
        version: 4.5,
        type: "Material",
        generator: "Material.toJSON"
      }
    };
    n.uuid = this.uuid, n.type = this.type, this.name !== "" && (n.name = this.name), this.color && this.color.isColor && (n.color = this.color.getHex()), this.roughness !== void 0 && (n.roughness = this.roughness), this.metalness !== void 0 && (n.metalness = this.metalness), this.sheen !== void 0 && (n.sheen = this.sheen), this.sheenColor && this.sheenColor.isColor && (n.sheenColor = this.sheenColor.getHex()), this.sheenRoughness !== void 0 && (n.sheenRoughness = this.sheenRoughness), this.emissive && this.emissive.isColor && (n.emissive = this.emissive.getHex()), this.emissiveIntensity && this.emissiveIntensity !== 1 && (n.emissiveIntensity = this.emissiveIntensity), this.specular && this.specular.isColor && (n.specular = this.specular.getHex()), this.specularIntensity !== void 0 && (n.specularIntensity = this.specularIntensity), this.specularColor && this.specularColor.isColor && (n.specularColor = this.specularColor.getHex()), this.shininess !== void 0 && (n.shininess = this.shininess), this.clearcoat !== void 0 && (n.clearcoat = this.clearcoat), this.clearcoatRoughness !== void 0 && (n.clearcoatRoughness = this.clearcoatRoughness), this.clearcoatMap && this.clearcoatMap.isTexture && (n.clearcoatMap = this.clearcoatMap.toJSON(e).uuid), this.clearcoatRoughnessMap && this.clearcoatRoughnessMap.isTexture && (n.clearcoatRoughnessMap = this.clearcoatRoughnessMap.toJSON(e).uuid), this.clearcoatNormalMap && this.clearcoatNormalMap.isTexture && (n.clearcoatNormalMap = this.clearcoatNormalMap.toJSON(e).uuid, n.clearcoatNormalScale = this.clearcoatNormalScale.toArray()), this.iridescence !== void 0 && (n.iridescence = this.iridescence), this.iridescenceIOR !== void 0 && (n.iridescenceIOR = this.iridescenceIOR), this.iridescenceThicknessRange !== void 0 && (n.iridescenceThicknessRange = this.iridescenceThicknessRange), this.iridescenceMap && this.iridescenceMap.isTexture && (n.iridescenceMap = this.iridescenceMap.toJSON(e).uuid), this.iridescenceThicknessMap && this.iridescenceThicknessMap.isTexture && (n.iridescenceThicknessMap = this.iridescenceThicknessMap.toJSON(e).uuid), this.map && this.map.isTexture && (n.map = this.map.toJSON(e).uuid), this.matcap && this.matcap.isTexture && (n.matcap = this.matcap.toJSON(e).uuid), this.alphaMap && this.alphaMap.isTexture && (n.alphaMap = this.alphaMap.toJSON(e).uuid), this.lightMap && this.lightMap.isTexture && (n.lightMap = this.lightMap.toJSON(e).uuid, n.lightMapIntensity = this.lightMapIntensity), this.aoMap && this.aoMap.isTexture && (n.aoMap = this.aoMap.toJSON(e).uuid, n.aoMapIntensity = this.aoMapIntensity), this.bumpMap && this.bumpMap.isTexture && (n.bumpMap = this.bumpMap.toJSON(e).uuid, n.bumpScale = this.bumpScale), this.normalMap && this.normalMap.isTexture && (n.normalMap = this.normalMap.toJSON(e).uuid, n.normalMapType = this.normalMapType, n.normalScale = this.normalScale.toArray()), this.displacementMap && this.displacementMap.isTexture && (n.displacementMap = this.displacementMap.toJSON(e).uuid, n.displacementScale = this.displacementScale, n.displacementBias = this.displacementBias), this.roughnessMap && this.roughnessMap.isTexture && (n.roughnessMap = this.roughnessMap.toJSON(e).uuid), this.metalnessMap && this.metalnessMap.isTexture && (n.metalnessMap = this.metalnessMap.toJSON(e).uuid), this.emissiveMap && this.emissiveMap.isTexture && (n.emissiveMap = this.emissiveMap.toJSON(e).uuid), this.specularMap && this.specularMap.isTexture && (n.specularMap = this.specularMap.toJSON(e).uuid), this.specularIntensityMap && this.specularIntensityMap.isTexture && (n.specularIntensityMap = this.specularIntensityMap.toJSON(e).uuid), this.specularColorMap && this.specularColorMap.isTexture && (n.specularColorMap = this.specularColorMap.toJSON(e).uuid), this.envMap && this.envMap.isTexture && (n.envMap = this.envMap.toJSON(e).uuid, this.combine !== void 0 && (n.combine = this.combine)), this.envMapIntensity !== void 0 && (n.envMapIntensity = this.envMapIntensity), this.reflectivity !== void 0 && (n.reflectivity = this.reflectivity), this.refractionRatio !== void 0 && (n.refractionRatio = this.refractionRatio), this.gradientMap && this.gradientMap.isTexture && (n.gradientMap = this.gradientMap.toJSON(e).uuid), this.transmission !== void 0 && (n.transmission = this.transmission), this.transmissionMap && this.transmissionMap.isTexture && (n.transmissionMap = this.transmissionMap.toJSON(e).uuid), this.thickness !== void 0 && (n.thickness = this.thickness), this.thicknessMap && this.thicknessMap.isTexture && (n.thicknessMap = this.thicknessMap.toJSON(e).uuid), this.attenuationDistance !== void 0 && this.attenuationDistance !== 1 / 0 && (n.attenuationDistance = this.attenuationDistance), this.attenuationColor !== void 0 && (n.attenuationColor = this.attenuationColor.getHex()), this.size !== void 0 && (n.size = this.size), this.shadowSide !== null && (n.shadowSide = this.shadowSide), this.sizeAttenuation !== void 0 && (n.sizeAttenuation = this.sizeAttenuation), this.blending !== li && (n.blending = this.blending), this.side !== wn && (n.side = this.side), this.vertexColors && (n.vertexColors = !0), this.opacity < 1 && (n.opacity = this.opacity), this.transparent === !0 && (n.transparent = this.transparent), n.depthFunc = this.depthFunc, n.depthTest = this.depthTest, n.depthWrite = this.depthWrite, n.colorWrite = this.colorWrite, n.stencilWrite = this.stencilWrite, n.stencilWriteMask = this.stencilWriteMask, n.stencilFunc = this.stencilFunc, n.stencilRef = this.stencilRef, n.stencilFuncMask = this.stencilFuncMask, n.stencilFail = this.stencilFail, n.stencilZFail = this.stencilZFail, n.stencilZPass = this.stencilZPass, this.rotation !== void 0 && this.rotation !== 0 && (n.rotation = this.rotation), this.polygonOffset === !0 && (n.polygonOffset = !0), this.polygonOffsetFactor !== 0 && (n.polygonOffsetFactor = this.polygonOffsetFactor), this.polygonOffsetUnits !== 0 && (n.polygonOffsetUnits = this.polygonOffsetUnits), this.linewidth !== void 0 && this.linewidth !== 1 && (n.linewidth = this.linewidth), this.dashSize !== void 0 && (n.dashSize = this.dashSize), this.gapSize !== void 0 && (n.gapSize = this.gapSize), this.scale !== void 0 && (n.scale = this.scale), this.dithering === !0 && (n.dithering = !0), this.alphaTest > 0 && (n.alphaTest = this.alphaTest), this.alphaToCoverage === !0 && (n.alphaToCoverage = this.alphaToCoverage), this.premultipliedAlpha === !0 && (n.premultipliedAlpha = this.premultipliedAlpha), this.forceSinglePass === !0 && (n.forceSinglePass = this.forceSinglePass), this.wireframe === !0 && (n.wireframe = this.wireframe), this.wireframeLinewidth > 1 && (n.wireframeLinewidth = this.wireframeLinewidth), this.wireframeLinecap !== "round" && (n.wireframeLinecap = this.wireframeLinecap), this.wireframeLinejoin !== "round" && (n.wireframeLinejoin = this.wireframeLinejoin), this.flatShading === !0 && (n.flatShading = this.flatShading), this.visible === !1 && (n.visible = !1), this.toneMapped === !1 && (n.toneMapped = !1), this.fog === !1 && (n.fog = !1), Object.keys(this.userData).length > 0 && (n.userData = this.userData);
    function i(s) {
      const r = [];
      for (const o in s) {
        const c = s[o];
        delete c.metadata, r.push(c);
      }
      return r;
    }
    if (t) {
      const s = i(e.textures), r = i(e.images);
      s.length > 0 && (n.textures = s), r.length > 0 && (n.images = r);
    }
    return n;
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(e) {
    this.name = e.name, this.blending = e.blending, this.side = e.side, this.vertexColors = e.vertexColors, this.opacity = e.opacity, this.transparent = e.transparent, this.blendSrc = e.blendSrc, this.blendDst = e.blendDst, this.blendEquation = e.blendEquation, this.blendSrcAlpha = e.blendSrcAlpha, this.blendDstAlpha = e.blendDstAlpha, this.blendEquationAlpha = e.blendEquationAlpha, this.depthFunc = e.depthFunc, this.depthTest = e.depthTest, this.depthWrite = e.depthWrite, this.stencilWriteMask = e.stencilWriteMask, this.stencilFunc = e.stencilFunc, this.stencilRef = e.stencilRef, this.stencilFuncMask = e.stencilFuncMask, this.stencilFail = e.stencilFail, this.stencilZFail = e.stencilZFail, this.stencilZPass = e.stencilZPass, this.stencilWrite = e.stencilWrite;
    const t = e.clippingPlanes;
    let n = null;
    if (t !== null) {
      const i = t.length;
      n = new Array(i);
      for (let s = 0; s !== i; ++s)
        n[s] = t[s].clone();
    }
    return this.clippingPlanes = n, this.clipIntersection = e.clipIntersection, this.clipShadows = e.clipShadows, this.shadowSide = e.shadowSide, this.colorWrite = e.colorWrite, this.precision = e.precision, this.polygonOffset = e.polygonOffset, this.polygonOffsetFactor = e.polygonOffsetFactor, this.polygonOffsetUnits = e.polygonOffsetUnits, this.dithering = e.dithering, this.alphaTest = e.alphaTest, this.alphaToCoverage = e.alphaToCoverage, this.premultipliedAlpha = e.premultipliedAlpha, this.forceSinglePass = e.forceSinglePass, this.visible = e.visible, this.toneMapped = e.toneMapped, this.userData = JSON.parse(JSON.stringify(e.userData)), this;
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
  set needsUpdate(e) {
    e === !0 && this.version++;
  }
}
const Fa = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
}, Ot = { h: 0, s: 0, l: 0 }, Ji = { h: 0, s: 0, l: 0 };
function Qs(a, e, t) {
  return t < 0 && (t += 1), t > 1 && (t -= 1), t < 1 / 6 ? a + (e - a) * 6 * t : t < 1 / 2 ? e : t < 2 / 3 ? a + (e - a) * 6 * (2 / 3 - t) : a;
}
class He {
  constructor(e, t, n) {
    return this.isColor = !0, this.r = 1, this.g = 1, this.b = 1, t === void 0 && n === void 0 ? this.set(e) : this.setRGB(e, t, n);
  }
  set(e) {
    return e && e.isColor ? this.copy(e) : typeof e == "number" ? this.setHex(e) : typeof e == "string" && this.setStyle(e), this;
  }
  setScalar(e) {
    return this.r = e, this.g = e, this.b = e, this;
  }
  setHex(e, t = $t) {
    return e = Math.floor(e), this.r = (e >> 16 & 255) / 255, this.g = (e >> 8 & 255) / 255, this.b = (e & 255) / 255, bt.toWorkingColorSpace(this, t), this;
  }
  setRGB(e, t, n, i = bt.workingColorSpace) {
    return this.r = e, this.g = t, this.b = n, bt.toWorkingColorSpace(this, i), this;
  }
  setHSL(e, t, n, i = bt.workingColorSpace) {
    if (e = Ru(e, 1), t = Mt(t, 0, 1), n = Mt(n, 0, 1), t === 0)
      this.r = this.g = this.b = n;
    else {
      const s = n <= 0.5 ? n * (1 + t) : n + t - n * t, r = 2 * n - s;
      this.r = Qs(r, s, e + 1 / 3), this.g = Qs(r, s, e), this.b = Qs(r, s, e - 1 / 3);
    }
    return bt.toWorkingColorSpace(this, i), this;
  }
  setStyle(e, t = $t) {
    function n(s) {
      s !== void 0 && parseFloat(s) < 1 && console.warn("THREE.Color: Alpha component of " + e + " will be ignored.");
    }
    let i;
    if (i = /^(\w+)\(([^\)]*)\)/.exec(e)) {
      let s;
      const r = i[1], o = i[2];
      switch (r) {
        case "rgb":
        case "rgba":
          if (s = /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))
            return this.r = Math.min(255, parseInt(s[1], 10)) / 255, this.g = Math.min(255, parseInt(s[2], 10)) / 255, this.b = Math.min(255, parseInt(s[3], 10)) / 255, bt.toWorkingColorSpace(this, t), n(s[4]), this;
          if (s = /^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))
            return this.r = Math.min(100, parseInt(s[1], 10)) / 100, this.g = Math.min(100, parseInt(s[2], 10)) / 100, this.b = Math.min(100, parseInt(s[3], 10)) / 100, bt.toWorkingColorSpace(this, t), n(s[4]), this;
          break;
        case "hsl":
        case "hsla":
          if (s = /^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o)) {
            const c = parseFloat(s[1]) / 360, l = parseFloat(s[2]) / 100, h = parseFloat(s[3]) / 100;
            return n(s[4]), this.setHSL(c, l, h, t);
          }
          break;
        default:
          console.warn("THREE.Color: Unknown color model " + e);
      }
    } else if (i = /^\#([A-Fa-f\d]+)$/.exec(e)) {
      const s = i[1], r = s.length;
      if (r === 3)
        return this.setRGB(
          parseInt(s.charAt(0), 16) / 15,
          parseInt(s.charAt(1), 16) / 15,
          parseInt(s.charAt(2), 16) / 15,
          t
        );
      if (r === 6)
        return this.setHex(parseInt(s, 16), t);
      console.warn("THREE.Color: Invalid hex color " + e);
    } else if (e && e.length > 0)
      return this.setColorName(e, t);
    return this;
  }
  setColorName(e, t = $t) {
    const n = Fa[e.toLowerCase()];
    return n !== void 0 ? this.setHex(n, t) : console.warn("THREE.Color: Unknown color " + e), this;
  }
  clone() {
    return new this.constructor(this.r, this.g, this.b);
  }
  copy(e) {
    return this.r = e.r, this.g = e.g, this.b = e.b, this;
  }
  copySRGBToLinear(e) {
    return this.r = hi(e.r), this.g = hi(e.g), this.b = hi(e.b), this;
  }
  copyLinearToSRGB(e) {
    return this.r = Vs(e.r), this.g = Vs(e.g), this.b = Vs(e.b), this;
  }
  convertSRGBToLinear() {
    return this.copySRGBToLinear(this), this;
  }
  convertLinearToSRGB() {
    return this.copyLinearToSRGB(this), this;
  }
  getHex(e = $t) {
    return bt.fromWorkingColorSpace(ft.copy(this), e), Mt(ft.r * 255, 0, 255) << 16 ^ Mt(ft.g * 255, 0, 255) << 8 ^ Mt(ft.b * 255, 0, 255) << 0;
  }
  getHexString(e = $t) {
    return ("000000" + this.getHex(e).toString(16)).slice(-6);
  }
  getHSL(e, t = bt.workingColorSpace) {
    bt.fromWorkingColorSpace(ft.copy(this), t);
    const n = ft.r, i = ft.g, s = ft.b, r = Math.max(n, i, s), o = Math.min(n, i, s);
    let c, l;
    const h = (o + r) / 2;
    if (o === r)
      c = 0, l = 0;
    else {
      const d = r - o;
      switch (l = h <= 0.5 ? d / (r + o) : d / (2 - r - o), r) {
        case n:
          c = (i - s) / d + (i < s ? 6 : 0);
          break;
        case i:
          c = (s - n) / d + 2;
          break;
        case s:
          c = (n - i) / d + 4;
          break;
      }
      c /= 6;
    }
    return e.h = c, e.s = l, e.l = h, e;
  }
  getRGB(e, t = bt.workingColorSpace) {
    return bt.fromWorkingColorSpace(ft.copy(this), t), e.r = ft.r, e.g = ft.g, e.b = ft.b, e;
  }
  getStyle(e = $t) {
    bt.fromWorkingColorSpace(ft.copy(this), e);
    const t = ft.r, n = ft.g, i = ft.b;
    return e !== $t ? `color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})` : `rgb(${t * 255 | 0},${n * 255 | 0},${i * 255 | 0})`;
  }
  offsetHSL(e, t, n) {
    return this.getHSL(Ot), Ot.h += e, Ot.s += t, Ot.l += n, this.setHSL(Ot.h, Ot.s, Ot.l), this;
  }
  add(e) {
    return this.r += e.r, this.g += e.g, this.b += e.b, this;
  }
  addColors(e, t) {
    return this.r = e.r + t.r, this.g = e.g + t.g, this.b = e.b + t.b, this;
  }
  addScalar(e) {
    return this.r += e, this.g += e, this.b += e, this;
  }
  sub(e) {
    return this.r = Math.max(0, this.r - e.r), this.g = Math.max(0, this.g - e.g), this.b = Math.max(0, this.b - e.b), this;
  }
  multiply(e) {
    return this.r *= e.r, this.g *= e.g, this.b *= e.b, this;
  }
  multiplyScalar(e) {
    return this.r *= e, this.g *= e, this.b *= e, this;
  }
  lerp(e, t) {
    return this.r += (e.r - this.r) * t, this.g += (e.g - this.g) * t, this.b += (e.b - this.b) * t, this;
  }
  lerpColors(e, t, n) {
    return this.r = e.r + (t.r - e.r) * n, this.g = e.g + (t.g - e.g) * n, this.b = e.b + (t.b - e.b) * n, this;
  }
  lerpHSL(e, t) {
    this.getHSL(Ot), e.getHSL(Ji);
    const n = Bs(Ot.h, Ji.h, t), i = Bs(Ot.s, Ji.s, t), s = Bs(Ot.l, Ji.l, t);
    return this.setHSL(n, i, s), this;
  }
  setFromVector3(e) {
    return this.r = e.x, this.g = e.y, this.b = e.z, this;
  }
  applyMatrix3(e) {
    const t = this.r, n = this.g, i = this.b, s = e.elements;
    return this.r = s[0] * t + s[3] * n + s[6] * i, this.g = s[1] * t + s[4] * n + s[7] * i, this.b = s[2] * t + s[5] * n + s[8] * i, this;
  }
  equals(e) {
    return e.r === this.r && e.g === this.g && e.b === this.b;
  }
  fromArray(e, t = 0) {
    return this.r = e[t], this.g = e[t + 1], this.b = e[t + 2], this;
  }
  toArray(e = [], t = 0) {
    return e[t] = this.r, e[t + 1] = this.g, e[t + 2] = this.b, e;
  }
  fromBufferAttribute(e, t) {
    return this.r = e.getX(t), this.g = e.getY(t), this.b = e.getZ(t), this;
  }
  toJSON() {
    return this.getHex();
  }
  *[Symbol.iterator]() {
    yield this.r, yield this.g, yield this.b;
  }
}
const ft = /* @__PURE__ */ new He();
He.NAMES = Fa;
class Oa extends gi {
  constructor(e) {
    super(), this.isMeshBasicMaterial = !0, this.type = "MeshBasicMaterial", this.color = new He(16777215), this.map = null, this.lightMap = null, this.lightMapIntensity = 1, this.aoMap = null, this.aoMapIntensity = 1, this.specularMap = null, this.alphaMap = null, this.envMap = null, this.combine = Ca, this.reflectivity = 1, this.refractionRatio = 0.98, this.wireframe = !1, this.wireframeLinewidth = 1, this.wireframeLinecap = "round", this.wireframeLinejoin = "round", this.fog = !0, this.setValues(e);
  }
  copy(e) {
    return super.copy(e), this.color.copy(e.color), this.map = e.map, this.lightMap = e.lightMap, this.lightMapIntensity = e.lightMapIntensity, this.aoMap = e.aoMap, this.aoMapIntensity = e.aoMapIntensity, this.specularMap = e.specularMap, this.alphaMap = e.alphaMap, this.envMap = e.envMap, this.combine = e.combine, this.reflectivity = e.reflectivity, this.refractionRatio = e.refractionRatio, this.wireframe = e.wireframe, this.wireframeLinewidth = e.wireframeLinewidth, this.wireframeLinecap = e.wireframeLinecap, this.wireframeLinejoin = e.wireframeLinejoin, this.fog = e.fog, this;
  }
}
const Je = /* @__PURE__ */ new G(), Qi = /* @__PURE__ */ new Fe();
class Qt {
  constructor(e, t, n = !1) {
    if (Array.isArray(e))
      throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");
    this.isBufferAttribute = !0, this.name = "", this.array = e, this.itemSize = t, this.count = e !== void 0 ? e.length / t : 0, this.normalized = n, this.usage = To, this.updateRange = { offset: 0, count: -1 }, this.version = 0;
  }
  onUploadCallback() {
  }
  set needsUpdate(e) {
    e === !0 && this.version++;
  }
  setUsage(e) {
    return this.usage = e, this;
  }
  copy(e) {
    return this.name = e.name, this.array = new e.array.constructor(e.array), this.itemSize = e.itemSize, this.count = e.count, this.normalized = e.normalized, this.usage = e.usage, this;
  }
  copyAt(e, t, n) {
    e *= this.itemSize, n *= t.itemSize;
    for (let i = 0, s = this.itemSize; i < s; i++)
      this.array[e + i] = t.array[n + i];
    return this;
  }
  copyArray(e) {
    return this.array.set(e), this;
  }
  applyMatrix3(e) {
    if (this.itemSize === 2)
      for (let t = 0, n = this.count; t < n; t++)
        Qi.fromBufferAttribute(this, t), Qi.applyMatrix3(e), this.setXY(t, Qi.x, Qi.y);
    else if (this.itemSize === 3)
      for (let t = 0, n = this.count; t < n; t++)
        Je.fromBufferAttribute(this, t), Je.applyMatrix3(e), this.setXYZ(t, Je.x, Je.y, Je.z);
    return this;
  }
  applyMatrix4(e) {
    for (let t = 0, n = this.count; t < n; t++)
      Je.fromBufferAttribute(this, t), Je.applyMatrix4(e), this.setXYZ(t, Je.x, Je.y, Je.z);
    return this;
  }
  applyNormalMatrix(e) {
    for (let t = 0, n = this.count; t < n; t++)
      Je.fromBufferAttribute(this, t), Je.applyNormalMatrix(e), this.setXYZ(t, Je.x, Je.y, Je.z);
    return this;
  }
  transformDirection(e) {
    for (let t = 0, n = this.count; t < n; t++)
      Je.fromBufferAttribute(this, t), Je.transformDirection(e), this.setXYZ(t, Je.x, Je.y, Je.z);
    return this;
  }
  set(e, t = 0) {
    return this.array.set(e, t), this;
  }
  getX(e) {
    let t = this.array[e * this.itemSize];
    return this.normalized && (t = Wi(t, this.array)), t;
  }
  setX(e, t) {
    return this.normalized && (t = wt(t, this.array)), this.array[e * this.itemSize] = t, this;
  }
  getY(e) {
    let t = this.array[e * this.itemSize + 1];
    return this.normalized && (t = Wi(t, this.array)), t;
  }
  setY(e, t) {
    return this.normalized && (t = wt(t, this.array)), this.array[e * this.itemSize + 1] = t, this;
  }
  getZ(e) {
    let t = this.array[e * this.itemSize + 2];
    return this.normalized && (t = Wi(t, this.array)), t;
  }
  setZ(e, t) {
    return this.normalized && (t = wt(t, this.array)), this.array[e * this.itemSize + 2] = t, this;
  }
  getW(e) {
    let t = this.array[e * this.itemSize + 3];
    return this.normalized && (t = Wi(t, this.array)), t;
  }
  setW(e, t) {
    return this.normalized && (t = wt(t, this.array)), this.array[e * this.itemSize + 3] = t, this;
  }
  setXY(e, t, n) {
    return e *= this.itemSize, this.normalized && (t = wt(t, this.array), n = wt(n, this.array)), this.array[e + 0] = t, this.array[e + 1] = n, this;
  }
  setXYZ(e, t, n, i) {
    return e *= this.itemSize, this.normalized && (t = wt(t, this.array), n = wt(n, this.array), i = wt(i, this.array)), this.array[e + 0] = t, this.array[e + 1] = n, this.array[e + 2] = i, this;
  }
  setXYZW(e, t, n, i, s) {
    return e *= this.itemSize, this.normalized && (t = wt(t, this.array), n = wt(n, this.array), i = wt(i, this.array), s = wt(s, this.array)), this.array[e + 0] = t, this.array[e + 1] = n, this.array[e + 2] = i, this.array[e + 3] = s, this;
  }
  onUpload(e) {
    return this.onUploadCallback = e, this;
  }
  clone() {
    return new this.constructor(this.array, this.itemSize).copy(this);
  }
  toJSON() {
    const e = {
      itemSize: this.itemSize,
      type: this.array.constructor.name,
      array: Array.from(this.array),
      normalized: this.normalized
    };
    return this.name !== "" && (e.name = this.name), this.usage !== To && (e.usage = this.usage), (this.updateRange.offset !== 0 || this.updateRange.count !== -1) && (e.updateRange = this.updateRange), e;
  }
  copyColorsArray() {
    console.error("THREE.BufferAttribute: copyColorsArray() was removed in r144.");
  }
  copyVector2sArray() {
    console.error("THREE.BufferAttribute: copyVector2sArray() was removed in r144.");
  }
  copyVector3sArray() {
    console.error("THREE.BufferAttribute: copyVector3sArray() was removed in r144.");
  }
  copyVector4sArray() {
    console.error("THREE.BufferAttribute: copyVector4sArray() was removed in r144.");
  }
}
class Ba extends Qt {
  constructor(e, t, n) {
    super(new Uint16Array(e), t, n);
  }
}
class Ga extends Qt {
  constructor(e, t, n) {
    super(new Uint32Array(e), t, n);
  }
}
class mn extends Qt {
  constructor(e, t, n) {
    super(new Float32Array(e), t, n);
  }
}
let Zu = 0;
const Rt = /* @__PURE__ */ new nt(), er = /* @__PURE__ */ new ht(), Qn = /* @__PURE__ */ new G(), Tt = /* @__PURE__ */ new Fi(), Ai = /* @__PURE__ */ new Fi(), lt = /* @__PURE__ */ new G();
class bn extends mi {
  constructor() {
    super(), this.isBufferGeometry = !0, Object.defineProperty(this, "id", { value: Zu++ }), this.uuid = Ni(), this.name = "", this.type = "BufferGeometry", this.index = null, this.attributes = {}, this.morphAttributes = {}, this.morphTargetsRelative = !1, this.groups = [], this.boundingBox = null, this.boundingSphere = null, this.drawRange = { start: 0, count: 1 / 0 }, this.userData = {};
  }
  getIndex() {
    return this.index;
  }
  setIndex(e) {
    return Array.isArray(e) ? this.index = new (Da(e) ? Ga : Ba)(e, 1) : this.index = e, this;
  }
  getAttribute(e) {
    return this.attributes[e];
  }
  setAttribute(e, t) {
    return this.attributes[e] = t, this;
  }
  deleteAttribute(e) {
    return delete this.attributes[e], this;
  }
  hasAttribute(e) {
    return this.attributes[e] !== void 0;
  }
  addGroup(e, t, n = 0) {
    this.groups.push({
      start: e,
      count: t,
      materialIndex: n
    });
  }
  clearGroups() {
    this.groups = [];
  }
  setDrawRange(e, t) {
    this.drawRange.start = e, this.drawRange.count = t;
  }
  applyMatrix4(e) {
    const t = this.attributes.position;
    t !== void 0 && (t.applyMatrix4(e), t.needsUpdate = !0);
    const n = this.attributes.normal;
    if (n !== void 0) {
      const s = new Ie().getNormalMatrix(e);
      n.applyNormalMatrix(s), n.needsUpdate = !0;
    }
    const i = this.attributes.tangent;
    return i !== void 0 && (i.transformDirection(e), i.needsUpdate = !0), this.boundingBox !== null && this.computeBoundingBox(), this.boundingSphere !== null && this.computeBoundingSphere(), this;
  }
  applyQuaternion(e) {
    return Rt.makeRotationFromQuaternion(e), this.applyMatrix4(Rt), this;
  }
  rotateX(e) {
    return Rt.makeRotationX(e), this.applyMatrix4(Rt), this;
  }
  rotateY(e) {
    return Rt.makeRotationY(e), this.applyMatrix4(Rt), this;
  }
  rotateZ(e) {
    return Rt.makeRotationZ(e), this.applyMatrix4(Rt), this;
  }
  translate(e, t, n) {
    return Rt.makeTranslation(e, t, n), this.applyMatrix4(Rt), this;
  }
  scale(e, t, n) {
    return Rt.makeScale(e, t, n), this.applyMatrix4(Rt), this;
  }
  lookAt(e) {
    return er.lookAt(e), er.updateMatrix(), this.applyMatrix4(er.matrix), this;
  }
  center() {
    return this.computeBoundingBox(), this.boundingBox.getCenter(Qn).negate(), this.translate(Qn.x, Qn.y, Qn.z), this;
  }
  setFromPoints(e) {
    const t = [];
    for (let n = 0, i = e.length; n < i; n++) {
      const s = e[n];
      t.push(s.x, s.y, s.z || 0);
    }
    return this.setAttribute("position", new mn(t, 3)), this;
  }
  computeBoundingBox() {
    this.boundingBox === null && (this.boundingBox = new Fi());
    const e = this.attributes.position, t = this.morphAttributes.position;
    if (e && e.isGLBufferAttribute) {
      console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".', this), this.boundingBox.set(
        new G(-1 / 0, -1 / 0, -1 / 0),
        new G(1 / 0, 1 / 0, 1 / 0)
      );
      return;
    }
    if (e !== void 0) {
      if (this.boundingBox.setFromBufferAttribute(e), t)
        for (let n = 0, i = t.length; n < i; n++) {
          const s = t[n];
          Tt.setFromBufferAttribute(s), this.morphTargetsRelative ? (lt.addVectors(this.boundingBox.min, Tt.min), this.boundingBox.expandByPoint(lt), lt.addVectors(this.boundingBox.max, Tt.max), this.boundingBox.expandByPoint(lt)) : (this.boundingBox.expandByPoint(Tt.min), this.boundingBox.expandByPoint(Tt.max));
        }
    } else
      this.boundingBox.makeEmpty();
    (isNaN(this.boundingBox.min.x) || isNaN(this.boundingBox.min.y) || isNaN(this.boundingBox.min.z)) && console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.', this);
  }
  computeBoundingSphere() {
    this.boundingSphere === null && (this.boundingSphere = new yr());
    const e = this.attributes.position, t = this.morphAttributes.position;
    if (e && e.isGLBufferAttribute) {
      console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".', this), this.boundingSphere.set(new G(), 1 / 0);
      return;
    }
    if (e) {
      const n = this.boundingSphere.center;
      if (Tt.setFromBufferAttribute(e), t)
        for (let s = 0, r = t.length; s < r; s++) {
          const o = t[s];
          Ai.setFromBufferAttribute(o), this.morphTargetsRelative ? (lt.addVectors(Tt.min, Ai.min), Tt.expandByPoint(lt), lt.addVectors(Tt.max, Ai.max), Tt.expandByPoint(lt)) : (Tt.expandByPoint(Ai.min), Tt.expandByPoint(Ai.max));
        }
      Tt.getCenter(n);
      let i = 0;
      for (let s = 0, r = e.count; s < r; s++)
        lt.fromBufferAttribute(e, s), i = Math.max(i, n.distanceToSquared(lt));
      if (t)
        for (let s = 0, r = t.length; s < r; s++) {
          const o = t[s], c = this.morphTargetsRelative;
          for (let l = 0, h = o.count; l < h; l++)
            lt.fromBufferAttribute(o, l), c && (Qn.fromBufferAttribute(e, l), lt.add(Qn)), i = Math.max(i, n.distanceToSquared(lt));
        }
      this.boundingSphere.radius = Math.sqrt(i), isNaN(this.boundingSphere.radius) && console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.', this);
    }
  }
  computeTangents() {
    const e = this.index, t = this.attributes;
    if (e === null || t.position === void 0 || t.normal === void 0 || t.uv === void 0) {
      console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");
      return;
    }
    const n = e.array, i = t.position.array, s = t.normal.array, r = t.uv.array, o = i.length / 3;
    this.hasAttribute("tangent") === !1 && this.setAttribute("tangent", new Qt(new Float32Array(4 * o), 4));
    const c = this.getAttribute("tangent").array, l = [], h = [];
    for (let T = 0; T < o; T++)
      l[T] = new G(), h[T] = new G();
    const d = new G(), u = new G(), p = new G(), g = new Fe(), _ = new Fe(), m = new Fe(), f = new G(), v = new G();
    function M(T, O, k) {
      d.fromArray(i, T * 3), u.fromArray(i, O * 3), p.fromArray(i, k * 3), g.fromArray(r, T * 2), _.fromArray(r, O * 2), m.fromArray(r, k * 2), u.sub(d), p.sub(d), _.sub(g), m.sub(g);
      const L = 1 / (_.x * m.y - m.x * _.y);
      isFinite(L) && (f.copy(u).multiplyScalar(m.y).addScaledVector(p, -_.y).multiplyScalar(L), v.copy(p).multiplyScalar(_.x).addScaledVector(u, -m.x).multiplyScalar(L), l[T].add(f), l[O].add(f), l[k].add(f), h[T].add(v), h[O].add(v), h[k].add(v));
    }
    let y = this.groups;
    y.length === 0 && (y = [{
      start: 0,
      count: n.length
    }]);
    for (let T = 0, O = y.length; T < O; ++T) {
      const k = y[T], L = k.start, R = k.count;
      for (let D = L, N = L + R; D < N; D += 3)
        M(
          n[D + 0],
          n[D + 1],
          n[D + 2]
        );
    }
    const w = new G(), C = new G(), P = new G(), I = new G();
    function S(T) {
      P.fromArray(s, T * 3), I.copy(P);
      const O = l[T];
      w.copy(O), w.sub(P.multiplyScalar(P.dot(O))).normalize(), C.crossVectors(I, O);
      const L = C.dot(h[T]) < 0 ? -1 : 1;
      c[T * 4] = w.x, c[T * 4 + 1] = w.y, c[T * 4 + 2] = w.z, c[T * 4 + 3] = L;
    }
    for (let T = 0, O = y.length; T < O; ++T) {
      const k = y[T], L = k.start, R = k.count;
      for (let D = L, N = L + R; D < N; D += 3)
        S(n[D + 0]), S(n[D + 1]), S(n[D + 2]);
    }
  }
  computeVertexNormals() {
    const e = this.index, t = this.getAttribute("position");
    if (t !== void 0) {
      let n = this.getAttribute("normal");
      if (n === void 0)
        n = new Qt(new Float32Array(t.count * 3), 3), this.setAttribute("normal", n);
      else
        for (let u = 0, p = n.count; u < p; u++)
          n.setXYZ(u, 0, 0, 0);
      const i = new G(), s = new G(), r = new G(), o = new G(), c = new G(), l = new G(), h = new G(), d = new G();
      if (e)
        for (let u = 0, p = e.count; u < p; u += 3) {
          const g = e.getX(u + 0), _ = e.getX(u + 1), m = e.getX(u + 2);
          i.fromBufferAttribute(t, g), s.fromBufferAttribute(t, _), r.fromBufferAttribute(t, m), h.subVectors(r, s), d.subVectors(i, s), h.cross(d), o.fromBufferAttribute(n, g), c.fromBufferAttribute(n, _), l.fromBufferAttribute(n, m), o.add(h), c.add(h), l.add(h), n.setXYZ(g, o.x, o.y, o.z), n.setXYZ(_, c.x, c.y, c.z), n.setXYZ(m, l.x, l.y, l.z);
        }
      else
        for (let u = 0, p = t.count; u < p; u += 3)
          i.fromBufferAttribute(t, u + 0), s.fromBufferAttribute(t, u + 1), r.fromBufferAttribute(t, u + 2), h.subVectors(r, s), d.subVectors(i, s), h.cross(d), n.setXYZ(u + 0, h.x, h.y, h.z), n.setXYZ(u + 1, h.x, h.y, h.z), n.setXYZ(u + 2, h.x, h.y, h.z);
      this.normalizeNormals(), n.needsUpdate = !0;
    }
  }
  merge() {
    return console.error("THREE.BufferGeometry.merge() has been removed. Use THREE.BufferGeometryUtils.mergeGeometries() instead."), this;
  }
  normalizeNormals() {
    const e = this.attributes.normal;
    for (let t = 0, n = e.count; t < n; t++)
      lt.fromBufferAttribute(e, t), lt.normalize(), e.setXYZ(t, lt.x, lt.y, lt.z);
  }
  toNonIndexed() {
    function e(o, c) {
      const l = o.array, h = o.itemSize, d = o.normalized, u = new l.constructor(c.length * h);
      let p = 0, g = 0;
      for (let _ = 0, m = c.length; _ < m; _++) {
        o.isInterleavedBufferAttribute ? p = c[_] * o.data.stride + o.offset : p = c[_] * h;
        for (let f = 0; f < h; f++)
          u[g++] = l[p++];
      }
      return new Qt(u, h, d);
    }
    if (this.index === null)
      return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."), this;
    const t = new bn(), n = this.index.array, i = this.attributes;
    for (const o in i) {
      const c = i[o], l = e(c, n);
      t.setAttribute(o, l);
    }
    const s = this.morphAttributes;
    for (const o in s) {
      const c = [], l = s[o];
      for (let h = 0, d = l.length; h < d; h++) {
        const u = l[h], p = e(u, n);
        c.push(p);
      }
      t.morphAttributes[o] = c;
    }
    t.morphTargetsRelative = this.morphTargetsRelative;
    const r = this.groups;
    for (let o = 0, c = r.length; o < c; o++) {
      const l = r[o];
      t.addGroup(l.start, l.count, l.materialIndex);
    }
    return t;
  }
  toJSON() {
    const e = {
      metadata: {
        version: 4.5,
        type: "BufferGeometry",
        generator: "BufferGeometry.toJSON"
      }
    };
    if (e.uuid = this.uuid, e.type = this.type, this.name !== "" && (e.name = this.name), Object.keys(this.userData).length > 0 && (e.userData = this.userData), this.parameters !== void 0) {
      const c = this.parameters;
      for (const l in c)
        c[l] !== void 0 && (e[l] = c[l]);
      return e;
    }
    e.data = { attributes: {} };
    const t = this.index;
    t !== null && (e.data.index = {
      type: t.array.constructor.name,
      array: Array.prototype.slice.call(t.array)
    });
    const n = this.attributes;
    for (const c in n) {
      const l = n[c];
      e.data.attributes[c] = l.toJSON(e.data);
    }
    const i = {};
    let s = !1;
    for (const c in this.morphAttributes) {
      const l = this.morphAttributes[c], h = [];
      for (let d = 0, u = l.length; d < u; d++) {
        const p = l[d];
        h.push(p.toJSON(e.data));
      }
      h.length > 0 && (i[c] = h, s = !0);
    }
    s && (e.data.morphAttributes = i, e.data.morphTargetsRelative = this.morphTargetsRelative);
    const r = this.groups;
    r.length > 0 && (e.data.groups = JSON.parse(JSON.stringify(r)));
    const o = this.boundingSphere;
    return o !== null && (e.data.boundingSphere = {
      center: o.center.toArray(),
      radius: o.radius
    }), e;
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(e) {
    this.index = null, this.attributes = {}, this.morphAttributes = {}, this.groups = [], this.boundingBox = null, this.boundingSphere = null;
    const t = {};
    this.name = e.name;
    const n = e.index;
    n !== null && this.setIndex(n.clone(t));
    const i = e.attributes;
    for (const l in i) {
      const h = i[l];
      this.setAttribute(l, h.clone(t));
    }
    const s = e.morphAttributes;
    for (const l in s) {
      const h = [], d = s[l];
      for (let u = 0, p = d.length; u < p; u++)
        h.push(d[u].clone(t));
      this.morphAttributes[l] = h;
    }
    this.morphTargetsRelative = e.morphTargetsRelative;
    const r = e.groups;
    for (let l = 0, h = r.length; l < h; l++) {
      const d = r[l];
      this.addGroup(d.start, d.count, d.materialIndex);
    }
    const o = e.boundingBox;
    o !== null && (this.boundingBox = o.clone());
    const c = e.boundingSphere;
    return c !== null && (this.boundingSphere = c.clone()), this.drawRange.start = e.drawRange.start, this.drawRange.count = e.drawRange.count, this.userData = e.userData, this;
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
}
const Oo = /* @__PURE__ */ new nt(), jt = /* @__PURE__ */ new ku(), es = /* @__PURE__ */ new yr(), Bo = /* @__PURE__ */ new G(), ei = /* @__PURE__ */ new G(), ti = /* @__PURE__ */ new G(), ni = /* @__PURE__ */ new G(), tr = /* @__PURE__ */ new G(), ts = /* @__PURE__ */ new G(), ns = /* @__PURE__ */ new Fe(), is = /* @__PURE__ */ new Fe(), ss = /* @__PURE__ */ new Fe(), Go = /* @__PURE__ */ new G(), Vo = /* @__PURE__ */ new G(), ko = /* @__PURE__ */ new G(), rs = /* @__PURE__ */ new G(), os = /* @__PURE__ */ new G();
class Kt extends ht {
  constructor(e = new bn(), t = new Oa()) {
    super(), this.isMesh = !0, this.type = "Mesh", this.geometry = e, this.material = t, this.updateMorphTargets();
  }
  copy(e, t) {
    return super.copy(e, t), e.morphTargetInfluences !== void 0 && (this.morphTargetInfluences = e.morphTargetInfluences.slice()), e.morphTargetDictionary !== void 0 && (this.morphTargetDictionary = Object.assign({}, e.morphTargetDictionary)), this.material = e.material, this.geometry = e.geometry, this;
  }
  updateMorphTargets() {
    const t = this.geometry.morphAttributes, n = Object.keys(t);
    if (n.length > 0) {
      const i = t[n[0]];
      if (i !== void 0) {
        this.morphTargetInfluences = [], this.morphTargetDictionary = {};
        for (let s = 0, r = i.length; s < r; s++) {
          const o = i[s].name || String(s);
          this.morphTargetInfluences.push(0), this.morphTargetDictionary[o] = s;
        }
      }
    }
  }
  getVertexPosition(e, t) {
    const n = this.geometry, i = n.attributes.position, s = n.morphAttributes.position, r = n.morphTargetsRelative;
    t.fromBufferAttribute(i, e);
    const o = this.morphTargetInfluences;
    if (s && o) {
      ts.set(0, 0, 0);
      for (let c = 0, l = s.length; c < l; c++) {
        const h = o[c], d = s[c];
        h !== 0 && (tr.fromBufferAttribute(d, e), r ? ts.addScaledVector(tr, h) : ts.addScaledVector(tr.sub(t), h));
      }
      t.add(ts);
    }
    return this.isSkinnedMesh && this.applyBoneTransform(e, t), t;
  }
  raycast(e, t) {
    const n = this.geometry, i = this.material, s = this.matrixWorld;
    if (i === void 0 || (n.boundingSphere === null && n.computeBoundingSphere(), es.copy(n.boundingSphere), es.applyMatrix4(s), jt.copy(e.ray).recast(e.near), es.containsPoint(jt.origin) === !1 && (jt.intersectSphere(es, Bo) === null || jt.origin.distanceToSquared(Bo) > (e.far - e.near) ** 2)) || (Oo.copy(s).invert(), jt.copy(e.ray).applyMatrix4(Oo), n.boundingBox !== null && jt.intersectsBox(n.boundingBox) === !1))
      return;
    let r;
    const o = n.index, c = n.attributes.position, l = n.attributes.uv, h = n.attributes.uv2, d = n.attributes.normal, u = n.groups, p = n.drawRange;
    if (o !== null)
      if (Array.isArray(i))
        for (let g = 0, _ = u.length; g < _; g++) {
          const m = u[g], f = i[m.materialIndex], v = Math.max(m.start, p.start), M = Math.min(o.count, Math.min(m.start + m.count, p.start + p.count));
          for (let y = v, w = M; y < w; y += 3) {
            const C = o.getX(y), P = o.getX(y + 1), I = o.getX(y + 2);
            r = as(this, f, e, jt, l, h, d, C, P, I), r && (r.faceIndex = Math.floor(y / 3), r.face.materialIndex = m.materialIndex, t.push(r));
          }
        }
      else {
        const g = Math.max(0, p.start), _ = Math.min(o.count, p.start + p.count);
        for (let m = g, f = _; m < f; m += 3) {
          const v = o.getX(m), M = o.getX(m + 1), y = o.getX(m + 2);
          r = as(this, i, e, jt, l, h, d, v, M, y), r && (r.faceIndex = Math.floor(m / 3), t.push(r));
        }
      }
    else if (c !== void 0)
      if (Array.isArray(i))
        for (let g = 0, _ = u.length; g < _; g++) {
          const m = u[g], f = i[m.materialIndex], v = Math.max(m.start, p.start), M = Math.min(c.count, Math.min(m.start + m.count, p.start + p.count));
          for (let y = v, w = M; y < w; y += 3) {
            const C = y, P = y + 1, I = y + 2;
            r = as(this, f, e, jt, l, h, d, C, P, I), r && (r.faceIndex = Math.floor(y / 3), r.face.materialIndex = m.materialIndex, t.push(r));
          }
        }
      else {
        const g = Math.max(0, p.start), _ = Math.min(c.count, p.start + p.count);
        for (let m = g, f = _; m < f; m += 3) {
          const v = m, M = m + 1, y = m + 2;
          r = as(this, i, e, jt, l, h, d, v, M, y), r && (r.faceIndex = Math.floor(m / 3), t.push(r));
        }
      }
  }
}
function Ku(a, e, t, n, i, s, r, o) {
  let c;
  if (e.side === yt ? c = n.intersectTriangle(r, s, i, !0, o) : c = n.intersectTriangle(i, s, r, e.side === wn, o), c === null)
    return null;
  os.copy(o), os.applyMatrix4(a.matrixWorld);
  const l = t.ray.origin.distanceTo(os);
  return l < t.near || l > t.far ? null : {
    distance: l,
    point: os.clone(),
    object: a
  };
}
function as(a, e, t, n, i, s, r, o, c, l) {
  a.getVertexPosition(o, ei), a.getVertexPosition(c, ti), a.getVertexPosition(l, ni);
  const h = Ku(a, e, t, n, ei, ti, ni, rs);
  if (h) {
    i && (ns.fromBufferAttribute(i, o), is.fromBufferAttribute(i, c), ss.fromBufferAttribute(i, l), h.uv = Bt.getInterpolation(rs, ei, ti, ni, ns, is, ss, new Fe())), s && (ns.fromBufferAttribute(s, o), is.fromBufferAttribute(s, c), ss.fromBufferAttribute(s, l), h.uv2 = Bt.getInterpolation(rs, ei, ti, ni, ns, is, ss, new Fe())), r && (Go.fromBufferAttribute(r, o), Vo.fromBufferAttribute(r, c), ko.fromBufferAttribute(r, l), h.normal = Bt.getInterpolation(rs, ei, ti, ni, Go, Vo, ko, new G()), h.normal.dot(n.direction) > 0 && h.normal.multiplyScalar(-1));
    const d = {
      a: o,
      b: c,
      c: l,
      normal: new G(),
      materialIndex: 0
    };
    Bt.getNormal(ei, ti, ni, d.normal), h.face = d;
  }
  return h;
}
class _i extends bn {
  constructor(e = 1, t = 1, n = 1, i = 1, s = 1, r = 1) {
    super(), this.type = "BoxGeometry", this.parameters = {
      width: e,
      height: t,
      depth: n,
      widthSegments: i,
      heightSegments: s,
      depthSegments: r
    };
    const o = this;
    i = Math.floor(i), s = Math.floor(s), r = Math.floor(r);
    const c = [], l = [], h = [], d = [];
    let u = 0, p = 0;
    g("z", "y", "x", -1, -1, n, t, e, r, s, 0), g("z", "y", "x", 1, -1, n, t, -e, r, s, 1), g("x", "z", "y", 1, 1, e, n, t, i, r, 2), g("x", "z", "y", 1, -1, e, n, -t, i, r, 3), g("x", "y", "z", 1, -1, e, t, n, i, s, 4), g("x", "y", "z", -1, -1, e, t, -n, i, s, 5), this.setIndex(c), this.setAttribute("position", new mn(l, 3)), this.setAttribute("normal", new mn(h, 3)), this.setAttribute("uv", new mn(d, 2));
    function g(_, m, f, v, M, y, w, C, P, I, S) {
      const T = y / P, O = w / I, k = y / 2, L = w / 2, R = C / 2, D = P + 1, N = I + 1;
      let K = 0, B = 0;
      const H = new G();
      for (let Q = 0; Q < N; Q++) {
        const ce = Q * O - L;
        for (let Z = 0; Z < D; Z++) {
          const W = Z * T - k;
          H[_] = W * v, H[m] = ce * M, H[f] = R, l.push(H.x, H.y, H.z), H[_] = 0, H[m] = 0, H[f] = C > 0 ? 1 : -1, h.push(H.x, H.y, H.z), d.push(Z / P), d.push(1 - Q / I), K += 1;
        }
      }
      for (let Q = 0; Q < I; Q++)
        for (let ce = 0; ce < P; ce++) {
          const Z = u + ce + D * Q, W = u + ce + D * (Q + 1), J = u + (ce + 1) + D * (Q + 1), se = u + (ce + 1) + D * Q;
          c.push(Z, W, se), c.push(W, J, se), B += 6;
        }
      o.addGroup(p, B, S), p += B, u += K;
    }
  }
  copy(e) {
    return super.copy(e), this.parameters = Object.assign({}, e.parameters), this;
  }
  static fromJSON(e) {
    return new _i(e.width, e.height, e.depth, e.widthSegments, e.heightSegments, e.depthSegments);
  }
}
function pi(a) {
  const e = {};
  for (const t in a) {
    e[t] = {};
    for (const n in a[t]) {
      const i = a[t][n];
      i && (i.isColor || i.isMatrix3 || i.isMatrix4 || i.isVector2 || i.isVector3 || i.isVector4 || i.isTexture || i.isQuaternion) ? i.isRenderTargetTexture ? (console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."), e[t][n] = null) : e[t][n] = i.clone() : Array.isArray(i) ? e[t][n] = i.slice() : e[t][n] = i;
    }
  }
  return e;
}
function gt(a) {
  const e = {};
  for (let t = 0; t < a.length; t++) {
    const n = pi(a[t]);
    for (const i in n)
      e[i] = n[i];
  }
  return e;
}
function Ju(a) {
  const e = [];
  for (let t = 0; t < a.length; t++)
    e.push(a[t].clone());
  return e;
}
function Va(a) {
  return a.getRenderTarget() === null && a.outputEncoding === Xe ? $t : Ii;
}
const ka = { clone: pi, merge: gt };
var Qu = `void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`, ed = `void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;
class tn extends gi {
  constructor(e) {
    super(), this.isShaderMaterial = !0, this.type = "ShaderMaterial", this.defines = {}, this.uniforms = {}, this.uniformsGroups = [], this.vertexShader = Qu, this.fragmentShader = ed, this.linewidth = 1, this.wireframe = !1, this.wireframeLinewidth = 1, this.fog = !1, this.lights = !1, this.clipping = !1, this.forceSinglePass = !0, this.extensions = {
      derivatives: !1,
      // set to use derivatives
      fragDepth: !1,
      // set to use fragment depth values
      drawBuffers: !1,
      // set to use draw buffers
      shaderTextureLOD: !1
      // set to use shader texture LOD
    }, this.defaultAttributeValues = {
      color: [1, 1, 1],
      uv: [0, 0],
      uv2: [0, 0]
    }, this.index0AttributeName = void 0, this.uniformsNeedUpdate = !1, this.glslVersion = null, e !== void 0 && this.setValues(e);
  }
  copy(e) {
    return super.copy(e), this.fragmentShader = e.fragmentShader, this.vertexShader = e.vertexShader, this.uniforms = pi(e.uniforms), this.uniformsGroups = Ju(e.uniformsGroups), this.defines = Object.assign({}, e.defines), this.wireframe = e.wireframe, this.wireframeLinewidth = e.wireframeLinewidth, this.fog = e.fog, this.lights = e.lights, this.clipping = e.clipping, this.extensions = Object.assign({}, e.extensions), this.glslVersion = e.glslVersion, this;
  }
  toJSON(e) {
    const t = super.toJSON(e);
    t.glslVersion = this.glslVersion, t.uniforms = {};
    for (const i in this.uniforms) {
      const r = this.uniforms[i].value;
      r && r.isTexture ? t.uniforms[i] = {
        type: "t",
        value: r.toJSON(e).uuid
      } : r && r.isColor ? t.uniforms[i] = {
        type: "c",
        value: r.getHex()
      } : r && r.isVector2 ? t.uniforms[i] = {
        type: "v2",
        value: r.toArray()
      } : r && r.isVector3 ? t.uniforms[i] = {
        type: "v3",
        value: r.toArray()
      } : r && r.isVector4 ? t.uniforms[i] = {
        type: "v4",
        value: r.toArray()
      } : r && r.isMatrix3 ? t.uniforms[i] = {
        type: "m3",
        value: r.toArray()
      } : r && r.isMatrix4 ? t.uniforms[i] = {
        type: "m4",
        value: r.toArray()
      } : t.uniforms[i] = {
        value: r
      };
    }
    Object.keys(this.defines).length > 0 && (t.defines = this.defines), t.vertexShader = this.vertexShader, t.fragmentShader = this.fragmentShader;
    const n = {};
    for (const i in this.extensions)
      this.extensions[i] === !0 && (n[i] = !0);
    return Object.keys(n).length > 0 && (t.extensions = n), t;
  }
}
class Ha extends ht {
  constructor() {
    super(), this.isCamera = !0, this.type = "Camera", this.matrixWorldInverse = new nt(), this.projectionMatrix = new nt(), this.projectionMatrixInverse = new nt();
  }
  copy(e, t) {
    return super.copy(e, t), this.matrixWorldInverse.copy(e.matrixWorldInverse), this.projectionMatrix.copy(e.projectionMatrix), this.projectionMatrixInverse.copy(e.projectionMatrixInverse), this;
  }
  getWorldDirection(e) {
    this.updateWorldMatrix(!0, !1);
    const t = this.matrixWorld.elements;
    return e.set(-t[8], -t[9], -t[10]).normalize();
  }
  updateMatrixWorld(e) {
    super.updateMatrixWorld(e), this.matrixWorldInverse.copy(this.matrixWorld).invert();
  }
  updateWorldMatrix(e, t) {
    super.updateWorldMatrix(e, t), this.matrixWorldInverse.copy(this.matrixWorld).invert();
  }
  clone() {
    return new this.constructor().copy(this);
  }
}
class It extends Ha {
  constructor(e = 50, t = 1, n = 0.1, i = 2e3) {
    super(), this.isPerspectiveCamera = !0, this.type = "PerspectiveCamera", this.fov = e, this.zoom = 1, this.near = n, this.far = i, this.focus = 10, this.aspect = t, this.view = null, this.filmGauge = 35, this.filmOffset = 0, this.updateProjectionMatrix();
  }
  copy(e, t) {
    return super.copy(e, t), this.fov = e.fov, this.zoom = e.zoom, this.near = e.near, this.far = e.far, this.focus = e.focus, this.aspect = e.aspect, this.view = e.view === null ? null : Object.assign({}, e.view), this.filmGauge = e.filmGauge, this.filmOffset = e.filmOffset, this;
  }
  /**
   * Sets the FOV by focal length in respect to the current .filmGauge.
   *
   * The default film gauge is 35, so that the focal length can be specified for
   * a 35mm (full frame) camera.
   *
   * Values for focal length and film gauge must have the same unit.
   */
  setFocalLength(e) {
    const t = 0.5 * this.getFilmHeight() / e;
    this.fov = pr * 2 * Math.atan(t), this.updateProjectionMatrix();
  }
  /**
   * Calculates the focal length from the current .fov and .filmGauge.
   */
  getFocalLength() {
    const e = Math.tan(Os * 0.5 * this.fov);
    return 0.5 * this.getFilmHeight() / e;
  }
  getEffectiveFOV() {
    return pr * 2 * Math.atan(
      Math.tan(Os * 0.5 * this.fov) / this.zoom
    );
  }
  getFilmWidth() {
    return this.filmGauge * Math.min(this.aspect, 1);
  }
  getFilmHeight() {
    return this.filmGauge / Math.max(this.aspect, 1);
  }
  /**
   * Sets an offset in a larger frustum. This is useful for multi-window or
   * multi-monitor/multi-machine setups.
   *
   * For example, if you have 3x2 monitors and each monitor is 1920x1080 and
   * the monitors are in grid like this
   *
   *   +---+---+---+
   *   | A | B | C |
   *   +---+---+---+
   *   | D | E | F |
   *   +---+---+---+
   *
   * then for each monitor you would call it like this
   *
   *   const w = 1920;
   *   const h = 1080;
   *   const fullWidth = w * 3;
   *   const fullHeight = h * 2;
   *
   *   --A--
   *   camera.setViewOffset( fullWidth, fullHeight, w * 0, h * 0, w, h );
   *   --B--
   *   camera.setViewOffset( fullWidth, fullHeight, w * 1, h * 0, w, h );
   *   --C--
   *   camera.setViewOffset( fullWidth, fullHeight, w * 2, h * 0, w, h );
   *   --D--
   *   camera.setViewOffset( fullWidth, fullHeight, w * 0, h * 1, w, h );
   *   --E--
   *   camera.setViewOffset( fullWidth, fullHeight, w * 1, h * 1, w, h );
   *   --F--
   *   camera.setViewOffset( fullWidth, fullHeight, w * 2, h * 1, w, h );
   *
   *   Note there is no reason monitors have to be the same size or in a grid.
   */
  setViewOffset(e, t, n, i, s, r) {
    this.aspect = e / t, this.view === null && (this.view = {
      enabled: !0,
      fullWidth: 1,
      fullHeight: 1,
      offsetX: 0,
      offsetY: 0,
      width: 1,
      height: 1
    }), this.view.enabled = !0, this.view.fullWidth = e, this.view.fullHeight = t, this.view.offsetX = n, this.view.offsetY = i, this.view.width = s, this.view.height = r, this.updateProjectionMatrix();
  }
  clearViewOffset() {
    this.view !== null && (this.view.enabled = !1), this.updateProjectionMatrix();
  }
  updateProjectionMatrix() {
    const e = this.near;
    let t = e * Math.tan(Os * 0.5 * this.fov) / this.zoom, n = 2 * t, i = this.aspect * n, s = -0.5 * i;
    const r = this.view;
    if (this.view !== null && this.view.enabled) {
      const c = r.fullWidth, l = r.fullHeight;
      s += r.offsetX * i / c, t -= r.offsetY * n / l, i *= r.width / c, n *= r.height / l;
    }
    const o = this.filmOffset;
    o !== 0 && (s += e * o / this.getFilmWidth()), this.projectionMatrix.makePerspective(s, s + i, t, t - n, e, this.far), this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
  }
  toJSON(e) {
    const t = super.toJSON(e);
    return t.object.fov = this.fov, t.object.zoom = this.zoom, t.object.near = this.near, t.object.far = this.far, t.object.focus = this.focus, t.object.aspect = this.aspect, this.view !== null && (t.object.view = Object.assign({}, this.view)), t.object.filmGauge = this.filmGauge, t.object.filmOffset = this.filmOffset, t;
  }
}
const ii = -90, si = 1;
class td extends ht {
  constructor(e, t, n) {
    super(), this.type = "CubeCamera", this.renderTarget = n;
    const i = new It(ii, si, e, t);
    i.layers = this.layers, i.up.set(0, 1, 0), i.lookAt(1, 0, 0), this.add(i);
    const s = new It(ii, si, e, t);
    s.layers = this.layers, s.up.set(0, 1, 0), s.lookAt(-1, 0, 0), this.add(s);
    const r = new It(ii, si, e, t);
    r.layers = this.layers, r.up.set(0, 0, -1), r.lookAt(0, 1, 0), this.add(r);
    const o = new It(ii, si, e, t);
    o.layers = this.layers, o.up.set(0, 0, 1), o.lookAt(0, -1, 0), this.add(o);
    const c = new It(ii, si, e, t);
    c.layers = this.layers, c.up.set(0, 1, 0), c.lookAt(0, 0, 1), this.add(c);
    const l = new It(ii, si, e, t);
    l.layers = this.layers, l.up.set(0, 1, 0), l.lookAt(0, 0, -1), this.add(l);
  }
  update(e, t) {
    this.parent === null && this.updateMatrixWorld();
    const n = this.renderTarget, [i, s, r, o, c, l] = this.children, h = e.getRenderTarget(), d = e.toneMapping, u = e.xr.enabled;
    e.toneMapping = pn, e.xr.enabled = !1;
    const p = n.texture.generateMipmaps;
    n.texture.generateMipmaps = !1, e.setRenderTarget(n, 0), e.render(t, i), e.setRenderTarget(n, 1), e.render(t, s), e.setRenderTarget(n, 2), e.render(t, r), e.setRenderTarget(n, 3), e.render(t, o), e.setRenderTarget(n, 4), e.render(t, c), n.texture.generateMipmaps = p, e.setRenderTarget(n, 5), e.render(t, l), e.setRenderTarget(h), e.toneMapping = d, e.xr.enabled = u, n.texture.needsPMREMUpdate = !0;
  }
}
class Wa extends Ct {
  constructor(e, t, n, i, s, r, o, c, l, h) {
    e = e !== void 0 ? e : [], t = t !== void 0 ? t : ui, super(e, t, n, i, s, r, o, c, l, h), this.isCubeTexture = !0, this.flipY = !1;
  }
  get images() {
    return this.image;
  }
  set images(e) {
    this.image = e;
  }
}
class nd extends en {
  constructor(e = 1, t = {}) {
    super(e, e, t), this.isWebGLCubeRenderTarget = !0;
    const n = { width: e, height: e, depth: 1 }, i = [n, n, n, n, n, n];
    this.texture = new Wa(i, t.mapping, t.wrapS, t.wrapT, t.magFilter, t.minFilter, t.format, t.type, t.anisotropy, t.encoding), this.texture.isRenderTargetTexture = !0, this.texture.generateMipmaps = t.generateMipmaps !== void 0 ? t.generateMipmaps : !1, this.texture.minFilter = t.minFilter !== void 0 ? t.minFilter : Dt;
  }
  fromEquirectangularTexture(e, t) {
    this.texture.type = t.type, this.texture.encoding = t.encoding, this.texture.generateMipmaps = t.generateMipmaps, this.texture.minFilter = t.minFilter, this.texture.magFilter = t.magFilter;
    const n = {
      uniforms: {
        tEquirect: { value: null }
      },
      vertexShader: (
        /* glsl */
        `

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`
      ),
      fragmentShader: (
        /* glsl */
        `

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`
      )
    }, i = new _i(5, 5, 5), s = new tn({
      name: "CubemapFromEquirect",
      uniforms: pi(n.uniforms),
      vertexShader: n.vertexShader,
      fragmentShader: n.fragmentShader,
      side: yt,
      blending: Sn
    });
    s.uniforms.tEquirect.value = t;
    const r = new Kt(i, s), o = t.minFilter;
    return t.minFilter === Ri && (t.minFilter = Dt), new td(1, 10, this).update(e, r), t.minFilter = o, r.geometry.dispose(), r.material.dispose(), this;
  }
  clear(e, t, n, i) {
    const s = e.getRenderTarget();
    for (let r = 0; r < 6; r++)
      e.setRenderTarget(this, r), e.clear(t, n, i);
    e.setRenderTarget(s);
  }
}
const nr = /* @__PURE__ */ new G(), id = /* @__PURE__ */ new G(), sd = /* @__PURE__ */ new Ie();
class In {
  constructor(e = new G(1, 0, 0), t = 0) {
    this.isPlane = !0, this.normal = e, this.constant = t;
  }
  set(e, t) {
    return this.normal.copy(e), this.constant = t, this;
  }
  setComponents(e, t, n, i) {
    return this.normal.set(e, t, n), this.constant = i, this;
  }
  setFromNormalAndCoplanarPoint(e, t) {
    return this.normal.copy(e), this.constant = -t.dot(this.normal), this;
  }
  setFromCoplanarPoints(e, t, n) {
    const i = nr.subVectors(n, t).cross(id.subVectors(e, t)).normalize();
    return this.setFromNormalAndCoplanarPoint(i, e), this;
  }
  copy(e) {
    return this.normal.copy(e.normal), this.constant = e.constant, this;
  }
  normalize() {
    const e = 1 / this.normal.length();
    return this.normal.multiplyScalar(e), this.constant *= e, this;
  }
  negate() {
    return this.constant *= -1, this.normal.negate(), this;
  }
  distanceToPoint(e) {
    return this.normal.dot(e) + this.constant;
  }
  distanceToSphere(e) {
    return this.distanceToPoint(e.center) - e.radius;
  }
  projectPoint(e, t) {
    return t.copy(e).addScaledVector(this.normal, -this.distanceToPoint(e));
  }
  intersectLine(e, t) {
    const n = e.delta(nr), i = this.normal.dot(n);
    if (i === 0)
      return this.distanceToPoint(e.start) === 0 ? t.copy(e.start) : null;
    const s = -(e.start.dot(this.normal) + this.constant) / i;
    return s < 0 || s > 1 ? null : t.copy(e.start).addScaledVector(n, s);
  }
  intersectsLine(e) {
    const t = this.distanceToPoint(e.start), n = this.distanceToPoint(e.end);
    return t < 0 && n > 0 || n < 0 && t > 0;
  }
  intersectsBox(e) {
    return e.intersectsPlane(this);
  }
  intersectsSphere(e) {
    return e.intersectsPlane(this);
  }
  coplanarPoint(e) {
    return e.copy(this.normal).multiplyScalar(-this.constant);
  }
  applyMatrix4(e, t) {
    const n = t || sd.getNormalMatrix(e), i = this.coplanarPoint(nr).applyMatrix4(e), s = this.normal.applyMatrix3(n).normalize();
    return this.constant = -i.dot(s), this;
  }
  translate(e) {
    return this.constant -= e.dot(this.normal), this;
  }
  equals(e) {
    return e.normal.equals(this.normal) && e.constant === this.constant;
  }
  clone() {
    return new this.constructor().copy(this);
  }
}
const Rn = /* @__PURE__ */ new yr(), ls = /* @__PURE__ */ new G();
class Sr {
  constructor(e = new In(), t = new In(), n = new In(), i = new In(), s = new In(), r = new In()) {
    this.planes = [e, t, n, i, s, r];
  }
  set(e, t, n, i, s, r) {
    const o = this.planes;
    return o[0].copy(e), o[1].copy(t), o[2].copy(n), o[3].copy(i), o[4].copy(s), o[5].copy(r), this;
  }
  copy(e) {
    const t = this.planes;
    for (let n = 0; n < 6; n++)
      t[n].copy(e.planes[n]);
    return this;
  }
  setFromProjectionMatrix(e) {
    const t = this.planes, n = e.elements, i = n[0], s = n[1], r = n[2], o = n[3], c = n[4], l = n[5], h = n[6], d = n[7], u = n[8], p = n[9], g = n[10], _ = n[11], m = n[12], f = n[13], v = n[14], M = n[15];
    return t[0].setComponents(o - i, d - c, _ - u, M - m).normalize(), t[1].setComponents(o + i, d + c, _ + u, M + m).normalize(), t[2].setComponents(o + s, d + l, _ + p, M + f).normalize(), t[3].setComponents(o - s, d - l, _ - p, M - f).normalize(), t[4].setComponents(o - r, d - h, _ - g, M - v).normalize(), t[5].setComponents(o + r, d + h, _ + g, M + v).normalize(), this;
  }
  intersectsObject(e) {
    if (e.boundingSphere !== void 0)
      e.boundingSphere === null && e.computeBoundingSphere(), Rn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);
    else {
      const t = e.geometry;
      t.boundingSphere === null && t.computeBoundingSphere(), Rn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld);
    }
    return this.intersectsSphere(Rn);
  }
  intersectsSprite(e) {
    return Rn.center.set(0, 0, 0), Rn.radius = 0.7071067811865476, Rn.applyMatrix4(e.matrixWorld), this.intersectsSphere(Rn);
  }
  intersectsSphere(e) {
    const t = this.planes, n = e.center, i = -e.radius;
    for (let s = 0; s < 6; s++)
      if (t[s].distanceToPoint(n) < i)
        return !1;
    return !0;
  }
  intersectsBox(e) {
    const t = this.planes;
    for (let n = 0; n < 6; n++) {
      const i = t[n];
      if (ls.x = i.normal.x > 0 ? e.max.x : e.min.x, ls.y = i.normal.y > 0 ? e.max.y : e.min.y, ls.z = i.normal.z > 0 ? e.max.z : e.min.z, i.distanceToPoint(ls) < 0)
        return !1;
    }
    return !0;
  }
  containsPoint(e) {
    const t = this.planes;
    for (let n = 0; n < 6; n++)
      if (t[n].distanceToPoint(e) < 0)
        return !1;
    return !0;
  }
  clone() {
    return new this.constructor().copy(this);
  }
}
function qa() {
  let a = null, e = !1, t = null, n = null;
  function i(s, r) {
    t(s, r), n = a.requestAnimationFrame(i);
  }
  return {
    start: function() {
      e !== !0 && t !== null && (n = a.requestAnimationFrame(i), e = !0);
    },
    stop: function() {
      a.cancelAnimationFrame(n), e = !1;
    },
    setAnimationLoop: function(s) {
      t = s;
    },
    setContext: function(s) {
      a = s;
    }
  };
}
function rd(a, e) {
  const t = e.isWebGL2, n = /* @__PURE__ */ new WeakMap();
  function i(l, h) {
    const d = l.array, u = l.usage, p = a.createBuffer();
    a.bindBuffer(h, p), a.bufferData(h, d, u), l.onUploadCallback();
    let g;
    if (d instanceof Float32Array)
      g = 5126;
    else if (d instanceof Uint16Array)
      if (l.isFloat16BufferAttribute)
        if (t)
          g = 5131;
        else
          throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");
      else
        g = 5123;
    else if (d instanceof Int16Array)
      g = 5122;
    else if (d instanceof Uint32Array)
      g = 5125;
    else if (d instanceof Int32Array)
      g = 5124;
    else if (d instanceof Int8Array)
      g = 5120;
    else if (d instanceof Uint8Array)
      g = 5121;
    else if (d instanceof Uint8ClampedArray)
      g = 5121;
    else
      throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: " + d);
    return {
      buffer: p,
      type: g,
      bytesPerElement: d.BYTES_PER_ELEMENT,
      version: l.version
    };
  }
  function s(l, h, d) {
    const u = h.array, p = h.updateRange;
    a.bindBuffer(d, l), p.count === -1 ? a.bufferSubData(d, 0, u) : (t ? a.bufferSubData(
      d,
      p.offset * u.BYTES_PER_ELEMENT,
      u,
      p.offset,
      p.count
    ) : a.bufferSubData(
      d,
      p.offset * u.BYTES_PER_ELEMENT,
      u.subarray(p.offset, p.offset + p.count)
    ), p.count = -1), h.onUploadCallback();
  }
  function r(l) {
    return l.isInterleavedBufferAttribute && (l = l.data), n.get(l);
  }
  function o(l) {
    l.isInterleavedBufferAttribute && (l = l.data);
    const h = n.get(l);
    h && (a.deleteBuffer(h.buffer), n.delete(l));
  }
  function c(l, h) {
    if (l.isGLBufferAttribute) {
      const u = n.get(l);
      (!u || u.version < l.version) && n.set(l, {
        buffer: l.buffer,
        type: l.type,
        bytesPerElement: l.elementSize,
        version: l.version
      });
      return;
    }
    l.isInterleavedBufferAttribute && (l = l.data);
    const d = n.get(l);
    d === void 0 ? n.set(l, i(l, h)) : d.version < l.version && (s(d.buffer, l, h), d.version = l.version);
  }
  return {
    get: r,
    remove: o,
    update: c
  };
}
class wr extends bn {
  constructor(e = 1, t = 1, n = 1, i = 1) {
    super(), this.type = "PlaneGeometry", this.parameters = {
      width: e,
      height: t,
      widthSegments: n,
      heightSegments: i
    };
    const s = e / 2, r = t / 2, o = Math.floor(n), c = Math.floor(i), l = o + 1, h = c + 1, d = e / o, u = t / c, p = [], g = [], _ = [], m = [];
    for (let f = 0; f < h; f++) {
      const v = f * u - r;
      for (let M = 0; M < l; M++) {
        const y = M * d - s;
        g.push(y, -v, 0), _.push(0, 0, 1), m.push(M / o), m.push(1 - f / c);
      }
    }
    for (let f = 0; f < c; f++)
      for (let v = 0; v < o; v++) {
        const M = v + l * f, y = v + l * (f + 1), w = v + 1 + l * (f + 1), C = v + 1 + l * f;
        p.push(M, y, C), p.push(y, w, C);
      }
    this.setIndex(p), this.setAttribute("position", new mn(g, 3)), this.setAttribute("normal", new mn(_, 3)), this.setAttribute("uv", new mn(m, 2));
  }
  copy(e) {
    return super.copy(e), this.parameters = Object.assign({}, e.parameters), this;
  }
  static fromJSON(e) {
    return new wr(e.width, e.height, e.widthSegments, e.heightSegments);
  }
}
var od = `#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`, ad = `#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`, ld = `#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`, cd = `#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`, hd = `#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`, ud = `#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`, dd = "vec3 transformed = vec3( position );", fd = `vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`, pd = `float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`, md = `#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			 return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float R21 = R12;
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`, gd = `#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = dFdx( surf_pos.xyz );
		vec3 vSigmaY = dFdy( surf_pos.xyz );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`, _d = `#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`, vd = `#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`, xd = `#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`, Md = `#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`, yd = `#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`, Sd = `#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`, wd = `#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`, bd = `#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`, Ed = `#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
struct GeometricContext {
	vec3 position;
	vec3 normal;
	vec3 viewDir;
#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal;
#endif
};
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`, Td = `#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_v0 0.339
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_v1 0.276
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_v4 0.046
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_v5 0.016
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_v6 0.0038
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`, Ad = `vec3 transformedNormal = objectNormal;
#ifdef USE_INSTANCING
	mat3 m = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
	transformedNormal = m * transformedNormal;
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	vec3 transformedTangent = ( modelViewMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`, Cd = `#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`, Ld = `#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`, Pd = `#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`, Rd = `#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`, Dd = "gl_FragColor = linearToOutputTexel( gl_FragColor );", Id = `vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`, Ud = `#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`, Nd = `#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`, zd = `#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`, Fd = `#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`, Od = `#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`, Bd = `#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`, Gd = `#ifdef USE_FOG
	varying float vFogDepth;
#endif`, Vd = `#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`, kd = `#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`, Hd = `#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`, Wd = `#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`, qd = `#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`, Xd = `LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`, jd = `varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in GeometricContext geometry, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in GeometricContext geometry, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`, Yd = `uniform bool receiveShadow;
uniform vec3 ambientLightColor;
uniform vec3 lightProbe[ 9 ];
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in GeometricContext geometry, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometry.position;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in GeometricContext geometry, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometry.position;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`, $d = `#if defined( USE_ENVMAP )
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#if defined( ENVMAP_TYPE_CUBE_UV )
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#if defined( ENVMAP_TYPE_CUBE_UV )
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
#endif`, Zd = `ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`, Kd = `varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometry.normal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`, Jd = `BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`, Qd = `varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`, ef = `PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( geometryNormal ) ), abs( dFdy( geometryNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif`, tf = `struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
};
vec3 clearcoatSpecular = vec3( 0.0 );
vec3 sheenSpecular = vec3( 0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
	float D = D_GGX( alpha, dotNH );
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometry.normal;
		vec3 viewDir = geometry.viewDir;
		vec3 position = geometry.position;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometry.clearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecular += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometry.viewDir, geometry.clearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecular += irradiance * BRDF_Sheen( directLight.direction, geometry.viewDir, geometry.normal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometry.viewDir, geometry.normal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecular += clearcoatRadiance * EnvironmentBRDF( geometry.clearcoatNormal, geometry.viewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecular += irradiance * material.sheenColor * IBLSheenBRDF( geometry.normal, geometry.viewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometry.normal, geometry.viewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometry.normal, geometry.viewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`, nf = `
GeometricContext geometry;
geometry.position = - vViewPosition;
geometry.normal = normal;
geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
#ifdef USE_CLEARCOAT
	geometry.clearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometry.viewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometry, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometry, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, geometry, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	irradiance += getLightProbeIrradiance( lightProbe, geometry.normal );
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry.normal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`, sf = `#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometry.normal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	radiance += getIBLRadiance( geometry.viewDir, geometry.normal, material.roughness );
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometry.viewDir, geometry.clearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`, rf = `#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometry, material, reflectedLight );
#endif`, of = `#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`, af = `#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`, lf = `#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`, cf = `#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`, hf = `#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`, uf = `#ifdef USE_MAP
	uniform sampler2D map;
#endif`, df = `#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`, ff = `#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`, pf = `float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`, mf = `#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`, gf = `#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`, _f = `#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`, vf = `#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`, xf = `#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`, Mf = `float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#ifdef USE_NORMALMAP_TANGENTSPACE
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal, vNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 geometryNormal = normal;`, yf = `#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`, Sf = `#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`, wf = `#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`, bf = `#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`, Ef = `#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`, Tf = `#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = geometryNormal;
#endif`, Af = `#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`, Cf = `#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`, Lf = `#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`, Pf = `#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha + 0.1;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`, Rf = `vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`, Df = `#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`, If = `vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`, Uf = `#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`, Nf = `#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`, zf = `float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`, Ff = `#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`, Of = `#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`, Bf = `#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`, Gf = `#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`, Vf = `float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`, kf = `#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`, Hf = `#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	uniform int boneTextureSize;
	mat4 getBoneMatrix( const in float i ) {
		float j = i * 4.0;
		float x = mod( j, float( boneTextureSize ) );
		float y = floor( j / float( boneTextureSize ) );
		float dx = 1.0 / float( boneTextureSize );
		float dy = 1.0 / float( boneTextureSize );
		y = dy * ( y + 0.5 );
		vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
		vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
		vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
		vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );
		mat4 bone = mat4( v1, v2, v3, v4 );
		return bone;
	}
#endif`, Wf = `#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`, qf = `#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`, Xf = `float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`, jf = `#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`, Yf = `#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`, $f = `#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return toneMappingExposure * color;
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`, Zf = `#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmission = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmission.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmission.rgb, material.transmission );
#endif`, Kf = `#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, vec2 fullSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		
		vec2 lodFudge = pow( 1.95, lod ) / fullSize;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec2 fullSize = vec2( textureSize( sampler, 0 ) );
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), fullSize, floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), fullSize, ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 applyVolumeAttenuation( const in vec3 radiance, const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return radiance;
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance * radiance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 attenuatedColor = applyVolumeAttenuation( transmittedLight.rgb, length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		return vec4( ( 1.0 - F ) * attenuatedColor * diffuseColor, transmittedLight.a );
	}
#endif`, Jf = `#ifdef USE_UV
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`, Qf = `#ifdef USE_UV
	varying vec2 vUv;
#endif
#ifdef USE_UV2
	attribute vec2 uv2;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`, ep = `#ifdef USE_UV
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`, tp = `#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;
const np = `varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`, ip = `uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`, sp = `varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`, rp = `#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`, op = `varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`, ap = `uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`, lp = `#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`, cp = `#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`, hp = `#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`, up = `#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`, dp = `varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`, fp = `uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`, pp = `uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`, mp = `uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`, gp = `#include <common>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`, _p = `uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, vp = `#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`, xp = `#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, Mp = `#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`, yp = `#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, Sp = `#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`, wp = `#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`, bp = `#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`, Ep = `#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, Tp = `#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`, Ap = `#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecular;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometry.clearcoatNormal, geometry.viewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + clearcoatSpecular * material.clearcoat;
	#endif
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, Cp = `#define TOON
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`, Lp = `#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`, Pp = `uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`, Rp = `uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`, Dp = `#include <common>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`, Ip = `uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
}`, Up = `uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`, Np = `uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
}`, Ce = {
  alphamap_fragment: od,
  alphamap_pars_fragment: ad,
  alphatest_fragment: ld,
  alphatest_pars_fragment: cd,
  aomap_fragment: hd,
  aomap_pars_fragment: ud,
  begin_vertex: dd,
  beginnormal_vertex: fd,
  bsdfs: pd,
  iridescence_fragment: md,
  bumpmap_pars_fragment: gd,
  clipping_planes_fragment: _d,
  clipping_planes_pars_fragment: vd,
  clipping_planes_pars_vertex: xd,
  clipping_planes_vertex: Md,
  color_fragment: yd,
  color_pars_fragment: Sd,
  color_pars_vertex: wd,
  color_vertex: bd,
  common: Ed,
  cube_uv_reflection_fragment: Td,
  defaultnormal_vertex: Ad,
  displacementmap_pars_vertex: Cd,
  displacementmap_vertex: Ld,
  emissivemap_fragment: Pd,
  emissivemap_pars_fragment: Rd,
  encodings_fragment: Dd,
  encodings_pars_fragment: Id,
  envmap_fragment: Ud,
  envmap_common_pars_fragment: Nd,
  envmap_pars_fragment: zd,
  envmap_pars_vertex: Fd,
  envmap_physical_pars_fragment: $d,
  envmap_vertex: Od,
  fog_vertex: Bd,
  fog_pars_vertex: Gd,
  fog_fragment: Vd,
  fog_pars_fragment: kd,
  gradientmap_pars_fragment: Hd,
  lightmap_fragment: Wd,
  lightmap_pars_fragment: qd,
  lights_lambert_fragment: Xd,
  lights_lambert_pars_fragment: jd,
  lights_pars_begin: Yd,
  lights_toon_fragment: Zd,
  lights_toon_pars_fragment: Kd,
  lights_phong_fragment: Jd,
  lights_phong_pars_fragment: Qd,
  lights_physical_fragment: ef,
  lights_physical_pars_fragment: tf,
  lights_fragment_begin: nf,
  lights_fragment_maps: sf,
  lights_fragment_end: rf,
  logdepthbuf_fragment: of,
  logdepthbuf_pars_fragment: af,
  logdepthbuf_pars_vertex: lf,
  logdepthbuf_vertex: cf,
  map_fragment: hf,
  map_pars_fragment: uf,
  map_particle_fragment: df,
  map_particle_pars_fragment: ff,
  metalnessmap_fragment: pf,
  metalnessmap_pars_fragment: mf,
  morphcolor_vertex: gf,
  morphnormal_vertex: _f,
  morphtarget_pars_vertex: vf,
  morphtarget_vertex: xf,
  normal_fragment_begin: Mf,
  normal_fragment_maps: yf,
  normal_pars_fragment: Sf,
  normal_pars_vertex: wf,
  normal_vertex: bf,
  normalmap_pars_fragment: Ef,
  clearcoat_normal_fragment_begin: Tf,
  clearcoat_normal_fragment_maps: Af,
  clearcoat_pars_fragment: Cf,
  iridescence_pars_fragment: Lf,
  output_fragment: Pf,
  packing: Rf,
  premultiplied_alpha_fragment: Df,
  project_vertex: If,
  dithering_fragment: Uf,
  dithering_pars_fragment: Nf,
  roughnessmap_fragment: zf,
  roughnessmap_pars_fragment: Ff,
  shadowmap_pars_fragment: Of,
  shadowmap_pars_vertex: Bf,
  shadowmap_vertex: Gf,
  shadowmask_pars_fragment: Vf,
  skinbase_vertex: kf,
  skinning_pars_vertex: Hf,
  skinning_vertex: Wf,
  skinnormal_vertex: qf,
  specularmap_fragment: Xf,
  specularmap_pars_fragment: jf,
  tonemapping_fragment: Yf,
  tonemapping_pars_fragment: $f,
  transmission_fragment: Zf,
  transmission_pars_fragment: Kf,
  uv_pars_fragment: Jf,
  uv_pars_vertex: Qf,
  uv_vertex: ep,
  worldpos_vertex: tp,
  background_vert: np,
  background_frag: ip,
  backgroundCube_vert: sp,
  backgroundCube_frag: rp,
  cube_vert: op,
  cube_frag: ap,
  depth_vert: lp,
  depth_frag: cp,
  distanceRGBA_vert: hp,
  distanceRGBA_frag: up,
  equirect_vert: dp,
  equirect_frag: fp,
  linedashed_vert: pp,
  linedashed_frag: mp,
  meshbasic_vert: gp,
  meshbasic_frag: _p,
  meshlambert_vert: vp,
  meshlambert_frag: xp,
  meshmatcap_vert: Mp,
  meshmatcap_frag: yp,
  meshnormal_vert: Sp,
  meshnormal_frag: wp,
  meshphong_vert: bp,
  meshphong_frag: Ep,
  meshphysical_vert: Tp,
  meshphysical_frag: Ap,
  meshtoon_vert: Cp,
  meshtoon_frag: Lp,
  points_vert: Pp,
  points_frag: Rp,
  shadow_vert: Dp,
  shadow_frag: Ip,
  sprite_vert: Up,
  sprite_frag: Np
}, ie = {
  common: {
    diffuse: { value: /* @__PURE__ */ new He(16777215) },
    opacity: { value: 1 },
    map: { value: null },
    mapTransform: { value: /* @__PURE__ */ new Ie() },
    alphaMap: { value: null },
    alphaMapTransform: { value: /* @__PURE__ */ new Ie() },
    alphaTest: { value: 0 }
  },
  specularmap: {
    specularMap: { value: null },
    specularMapTransform: { value: /* @__PURE__ */ new Ie() }
  },
  envmap: {
    envMap: { value: null },
    flipEnvMap: { value: -1 },
    reflectivity: { value: 1 },
    // basic, lambert, phong
    ior: { value: 1.5 },
    // physical
    refractionRatio: { value: 0.98 }
    // basic, lambert, phong
  },
  aomap: {
    aoMap: { value: null },
    aoMapIntensity: { value: 1 },
    aoMapTransform: { value: /* @__PURE__ */ new Ie() }
  },
  lightmap: {
    lightMap: { value: null },
    lightMapIntensity: { value: 1 },
    lightMapTransform: { value: /* @__PURE__ */ new Ie() }
  },
  bumpmap: {
    bumpMap: { value: null },
    bumpMapTransform: { value: /* @__PURE__ */ new Ie() },
    bumpScale: { value: 1 }
  },
  normalmap: {
    normalMap: { value: null },
    normalMapTransform: { value: /* @__PURE__ */ new Ie() },
    normalScale: { value: /* @__PURE__ */ new Fe(1, 1) }
  },
  displacementmap: {
    displacementMap: { value: null },
    displacementMapTransform: { value: /* @__PURE__ */ new Ie() },
    displacementScale: { value: 1 },
    displacementBias: { value: 0 }
  },
  emissivemap: {
    emissiveMap: { value: null },
    emissiveMapTransform: { value: /* @__PURE__ */ new Ie() }
  },
  metalnessmap: {
    metalnessMap: { value: null },
    metalnessMapTransform: { value: /* @__PURE__ */ new Ie() }
  },
  roughnessmap: {
    roughnessMap: { value: null },
    roughnessMapTransform: { value: /* @__PURE__ */ new Ie() }
  },
  gradientmap: {
    gradientMap: { value: null }
  },
  fog: {
    fogDensity: { value: 25e-5 },
    fogNear: { value: 1 },
    fogFar: { value: 2e3 },
    fogColor: { value: /* @__PURE__ */ new He(16777215) }
  },
  lights: {
    ambientLightColor: { value: [] },
    lightProbe: { value: [] },
    directionalLights: { value: [], properties: {
      direction: {},
      color: {}
    } },
    directionalLightShadows: { value: [], properties: {
      shadowBias: {},
      shadowNormalBias: {},
      shadowRadius: {},
      shadowMapSize: {}
    } },
    directionalShadowMap: { value: [] },
    directionalShadowMatrix: { value: [] },
    spotLights: { value: [], properties: {
      color: {},
      position: {},
      direction: {},
      distance: {},
      coneCos: {},
      penumbraCos: {},
      decay: {}
    } },
    spotLightShadows: { value: [], properties: {
      shadowBias: {},
      shadowNormalBias: {},
      shadowRadius: {},
      shadowMapSize: {}
    } },
    spotLightMap: { value: [] },
    spotShadowMap: { value: [] },
    spotLightMatrix: { value: [] },
    pointLights: { value: [], properties: {
      color: {},
      position: {},
      decay: {},
      distance: {}
    } },
    pointLightShadows: { value: [], properties: {
      shadowBias: {},
      shadowNormalBias: {},
      shadowRadius: {},
      shadowMapSize: {},
      shadowCameraNear: {},
      shadowCameraFar: {}
    } },
    pointShadowMap: { value: [] },
    pointShadowMatrix: { value: [] },
    hemisphereLights: { value: [], properties: {
      direction: {},
      skyColor: {},
      groundColor: {}
    } },
    // TODO (abelnation): RectAreaLight BRDF data needs to be moved from example to main src
    rectAreaLights: { value: [], properties: {
      color: {},
      position: {},
      width: {},
      height: {}
    } },
    ltc_1: { value: null },
    ltc_2: { value: null }
  },
  points: {
    diffuse: { value: /* @__PURE__ */ new He(16777215) },
    opacity: { value: 1 },
    size: { value: 1 },
    scale: { value: 1 },
    map: { value: null },
    alphaMap: { value: null },
    alphaTest: { value: 0 },
    uvTransform: { value: /* @__PURE__ */ new Ie() }
  },
  sprite: {
    diffuse: { value: /* @__PURE__ */ new He(16777215) },
    opacity: { value: 1 },
    center: { value: /* @__PURE__ */ new Fe(0.5, 0.5) },
    rotation: { value: 0 },
    map: { value: null },
    mapTransform: { value: /* @__PURE__ */ new Ie() },
    alphaMap: { value: null },
    alphaTest: { value: 0 }
  }
}, Zt = {
  basic: {
    uniforms: /* @__PURE__ */ gt([
      ie.common,
      ie.specularmap,
      ie.envmap,
      ie.aomap,
      ie.lightmap,
      ie.fog
    ]),
    vertexShader: Ce.meshbasic_vert,
    fragmentShader: Ce.meshbasic_frag
  },
  lambert: {
    uniforms: /* @__PURE__ */ gt([
      ie.common,
      ie.specularmap,
      ie.envmap,
      ie.aomap,
      ie.lightmap,
      ie.emissivemap,
      ie.bumpmap,
      ie.normalmap,
      ie.displacementmap,
      ie.fog,
      ie.lights,
      {
        emissive: { value: /* @__PURE__ */ new He(0) }
      }
    ]),
    vertexShader: Ce.meshlambert_vert,
    fragmentShader: Ce.meshlambert_frag
  },
  phong: {
    uniforms: /* @__PURE__ */ gt([
      ie.common,
      ie.specularmap,
      ie.envmap,
      ie.aomap,
      ie.lightmap,
      ie.emissivemap,
      ie.bumpmap,
      ie.normalmap,
      ie.displacementmap,
      ie.fog,
      ie.lights,
      {
        emissive: { value: /* @__PURE__ */ new He(0) },
        specular: { value: /* @__PURE__ */ new He(1118481) },
        shininess: { value: 30 }
      }
    ]),
    vertexShader: Ce.meshphong_vert,
    fragmentShader: Ce.meshphong_frag
  },
  standard: {
    uniforms: /* @__PURE__ */ gt([
      ie.common,
      ie.envmap,
      ie.aomap,
      ie.lightmap,
      ie.emissivemap,
      ie.bumpmap,
      ie.normalmap,
      ie.displacementmap,
      ie.roughnessmap,
      ie.metalnessmap,
      ie.fog,
      ie.lights,
      {
        emissive: { value: /* @__PURE__ */ new He(0) },
        roughness: { value: 1 },
        metalness: { value: 0 },
        envMapIntensity: { value: 1 }
        // temporary
      }
    ]),
    vertexShader: Ce.meshphysical_vert,
    fragmentShader: Ce.meshphysical_frag
  },
  toon: {
    uniforms: /* @__PURE__ */ gt([
      ie.common,
      ie.aomap,
      ie.lightmap,
      ie.emissivemap,
      ie.bumpmap,
      ie.normalmap,
      ie.displacementmap,
      ie.gradientmap,
      ie.fog,
      ie.lights,
      {
        emissive: { value: /* @__PURE__ */ new He(0) }
      }
    ]),
    vertexShader: Ce.meshtoon_vert,
    fragmentShader: Ce.meshtoon_frag
  },
  matcap: {
    uniforms: /* @__PURE__ */ gt([
      ie.common,
      ie.bumpmap,
      ie.normalmap,
      ie.displacementmap,
      ie.fog,
      {
        matcap: { value: null }
      }
    ]),
    vertexShader: Ce.meshmatcap_vert,
    fragmentShader: Ce.meshmatcap_frag
  },
  points: {
    uniforms: /* @__PURE__ */ gt([
      ie.points,
      ie.fog
    ]),
    vertexShader: Ce.points_vert,
    fragmentShader: Ce.points_frag
  },
  dashed: {
    uniforms: /* @__PURE__ */ gt([
      ie.common,
      ie.fog,
      {
        scale: { value: 1 },
        dashSize: { value: 1 },
        totalSize: { value: 2 }
      }
    ]),
    vertexShader: Ce.linedashed_vert,
    fragmentShader: Ce.linedashed_frag
  },
  depth: {
    uniforms: /* @__PURE__ */ gt([
      ie.common,
      ie.displacementmap
    ]),
    vertexShader: Ce.depth_vert,
    fragmentShader: Ce.depth_frag
  },
  normal: {
    uniforms: /* @__PURE__ */ gt([
      ie.common,
      ie.bumpmap,
      ie.normalmap,
      ie.displacementmap,
      {
        opacity: { value: 1 }
      }
    ]),
    vertexShader: Ce.meshnormal_vert,
    fragmentShader: Ce.meshnormal_frag
  },
  sprite: {
    uniforms: /* @__PURE__ */ gt([
      ie.sprite,
      ie.fog
    ]),
    vertexShader: Ce.sprite_vert,
    fragmentShader: Ce.sprite_frag
  },
  background: {
    uniforms: {
      uvTransform: { value: /* @__PURE__ */ new Ie() },
      t2D: { value: null },
      backgroundIntensity: { value: 1 }
    },
    vertexShader: Ce.background_vert,
    fragmentShader: Ce.background_frag
  },
  backgroundCube: {
    uniforms: {
      envMap: { value: null },
      flipEnvMap: { value: -1 },
      backgroundBlurriness: { value: 0 },
      backgroundIntensity: { value: 1 }
    },
    vertexShader: Ce.backgroundCube_vert,
    fragmentShader: Ce.backgroundCube_frag
  },
  cube: {
    uniforms: {
      tCube: { value: null },
      tFlip: { value: -1 },
      opacity: { value: 1 }
    },
    vertexShader: Ce.cube_vert,
    fragmentShader: Ce.cube_frag
  },
  equirect: {
    uniforms: {
      tEquirect: { value: null }
    },
    vertexShader: Ce.equirect_vert,
    fragmentShader: Ce.equirect_frag
  },
  distanceRGBA: {
    uniforms: /* @__PURE__ */ gt([
      ie.common,
      ie.displacementmap,
      {
        referencePosition: { value: /* @__PURE__ */ new G() },
        nearDistance: { value: 1 },
        farDistance: { value: 1e3 }
      }
    ]),
    vertexShader: Ce.distanceRGBA_vert,
    fragmentShader: Ce.distanceRGBA_frag
  },
  shadow: {
    uniforms: /* @__PURE__ */ gt([
      ie.lights,
      ie.fog,
      {
        color: { value: /* @__PURE__ */ new He(0) },
        opacity: { value: 1 }
      }
    ]),
    vertexShader: Ce.shadow_vert,
    fragmentShader: Ce.shadow_frag
  }
};
Zt.physical = {
  uniforms: /* @__PURE__ */ gt([
    Zt.standard.uniforms,
    {
      clearcoat: { value: 0 },
      clearcoatMap: { value: null },
      clearcoatMapTransform: { value: /* @__PURE__ */ new Ie() },
      clearcoatNormalMap: { value: null },
      clearcoatNormalMapTransform: { value: /* @__PURE__ */ new Ie() },
      clearcoatNormalScale: { value: /* @__PURE__ */ new Fe(1, 1) },
      clearcoatRoughness: { value: 0 },
      clearcoatRoughnessMap: { value: null },
      clearcoatRoughnessMapTransform: { value: /* @__PURE__ */ new Ie() },
      iridescence: { value: 0 },
      iridescenceMap: { value: null },
      iridescenceMapTransform: { value: /* @__PURE__ */ new Ie() },
      iridescenceIOR: { value: 1.3 },
      iridescenceThicknessMinimum: { value: 100 },
      iridescenceThicknessMaximum: { value: 400 },
      iridescenceThicknessMap: { value: null },
      iridescenceThicknessMapTransform: { value: /* @__PURE__ */ new Ie() },
      sheen: { value: 0 },
      sheenColor: { value: /* @__PURE__ */ new He(0) },
      sheenColorMap: { value: null },
      sheenColorMapTransform: { value: /* @__PURE__ */ new Ie() },
      sheenRoughness: { value: 1 },
      sheenRoughnessMap: { value: null },
      sheenRoughnessMapTransform: { value: /* @__PURE__ */ new Ie() },
      transmission: { value: 0 },
      transmissionMap: { value: null },
      transmissionMapTransform: { value: /* @__PURE__ */ new Ie() },
      transmissionSamplerSize: { value: /* @__PURE__ */ new Fe() },
      transmissionSamplerMap: { value: null },
      thickness: { value: 0 },
      thicknessMap: { value: null },
      thicknessMapTransform: { value: /* @__PURE__ */ new Ie() },
      attenuationDistance: { value: 0 },
      attenuationColor: { value: /* @__PURE__ */ new He(0) },
      specularColor: { value: /* @__PURE__ */ new He(1, 1, 1) },
      specularColorMap: { value: null },
      specularColorMapTransform: { value: /* @__PURE__ */ new Ie() },
      specularIntensity: { value: 1 },
      specularIntensityMap: { value: null },
      specularIntensityMapTransform: { value: /* @__PURE__ */ new Ie() }
    }
  ]),
  vertexShader: Ce.meshphysical_vert,
  fragmentShader: Ce.meshphysical_frag
};
const cs = { r: 0, b: 0, g: 0 };
function zp(a, e, t, n, i, s, r) {
  const o = new He(0);
  let c = s === !0 ? 0 : 1, l, h, d = null, u = 0, p = null;
  function g(m, f) {
    let v = !1, M = f.isScene === !0 ? f.background : null;
    M && M.isTexture && (M = (f.backgroundBlurriness > 0 ? t : e).get(M));
    const y = a.xr, w = y.getSession && y.getSession();
    w && w.environmentBlendMode === "additive" && (M = null), M === null ? _(o, c) : M && M.isColor && (_(M, 1), v = !0), (a.autoClear || v) && a.clear(a.autoClearColor, a.autoClearDepth, a.autoClearStencil), M && (M.isCubeTexture || M.mapping === _s) ? (h === void 0 && (h = new Kt(
      new _i(1, 1, 1),
      new tn({
        name: "BackgroundCubeMaterial",
        uniforms: pi(Zt.backgroundCube.uniforms),
        vertexShader: Zt.backgroundCube.vertexShader,
        fragmentShader: Zt.backgroundCube.fragmentShader,
        side: yt,
        depthTest: !1,
        depthWrite: !1,
        fog: !1
      })
    ), h.geometry.deleteAttribute("normal"), h.geometry.deleteAttribute("uv"), h.onBeforeRender = function(C, P, I) {
      this.matrixWorld.copyPosition(I.matrixWorld);
    }, Object.defineProperty(h.material, "envMap", {
      get: function() {
        return this.uniforms.envMap.value;
      }
    }), i.update(h)), h.material.uniforms.envMap.value = M, h.material.uniforms.flipEnvMap.value = M.isCubeTexture && M.isRenderTargetTexture === !1 ? -1 : 1, h.material.uniforms.backgroundBlurriness.value = f.backgroundBlurriness, h.material.uniforms.backgroundIntensity.value = f.backgroundIntensity, h.material.toneMapped = M.encoding !== Xe, (d !== M || u !== M.version || p !== a.toneMapping) && (h.material.needsUpdate = !0, d = M, u = M.version, p = a.toneMapping), h.layers.enableAll(), m.unshift(h, h.geometry, h.material, 0, 0, null)) : M && M.isTexture && (l === void 0 && (l = new Kt(
      new wr(2, 2),
      new tn({
        name: "BackgroundMaterial",
        uniforms: pi(Zt.background.uniforms),
        vertexShader: Zt.background.vertexShader,
        fragmentShader: Zt.background.fragmentShader,
        side: wn,
        depthTest: !1,
        depthWrite: !1,
        fog: !1
      })
    ), l.geometry.deleteAttribute("normal"), Object.defineProperty(l.material, "map", {
      get: function() {
        return this.uniforms.t2D.value;
      }
    }), i.update(l)), l.material.uniforms.t2D.value = M, l.material.uniforms.backgroundIntensity.value = f.backgroundIntensity, l.material.toneMapped = M.encoding !== Xe, M.matrixAutoUpdate === !0 && M.updateMatrix(), l.material.uniforms.uvTransform.value.copy(M.matrix), (d !== M || u !== M.version || p !== a.toneMapping) && (l.material.needsUpdate = !0, d = M, u = M.version, p = a.toneMapping), l.layers.enableAll(), m.unshift(l, l.geometry, l.material, 0, 0, null));
  }
  function _(m, f) {
    m.getRGB(cs, Va(a)), n.buffers.color.setClear(cs.r, cs.g, cs.b, f, r);
  }
  return {
    getClearColor: function() {
      return o;
    },
    setClearColor: function(m, f = 1) {
      o.set(m), c = f, _(o, c);
    },
    getClearAlpha: function() {
      return c;
    },
    setClearAlpha: function(m) {
      c = m, _(o, c);
    },
    render: g
  };
}
function Fp(a, e, t, n) {
  const i = a.getParameter(34921), s = n.isWebGL2 ? null : e.get("OES_vertex_array_object"), r = n.isWebGL2 || s !== null, o = {}, c = m(null);
  let l = c, h = !1;
  function d(R, D, N, K, B) {
    let H = !1;
    if (r) {
      const Q = _(K, N, D);
      l !== Q && (l = Q, p(l.object)), H = f(R, K, N, B), H && v(R, K, N, B);
    } else {
      const Q = D.wireframe === !0;
      (l.geometry !== K.id || l.program !== N.id || l.wireframe !== Q) && (l.geometry = K.id, l.program = N.id, l.wireframe = Q, H = !0);
    }
    B !== null && t.update(B, 34963), (H || h) && (h = !1, I(R, D, N, K), B !== null && a.bindBuffer(34963, t.get(B).buffer));
  }
  function u() {
    return n.isWebGL2 ? a.createVertexArray() : s.createVertexArrayOES();
  }
  function p(R) {
    return n.isWebGL2 ? a.bindVertexArray(R) : s.bindVertexArrayOES(R);
  }
  function g(R) {
    return n.isWebGL2 ? a.deleteVertexArray(R) : s.deleteVertexArrayOES(R);
  }
  function _(R, D, N) {
    const K = N.wireframe === !0;
    let B = o[R.id];
    B === void 0 && (B = {}, o[R.id] = B);
    let H = B[D.id];
    H === void 0 && (H = {}, B[D.id] = H);
    let Q = H[K];
    return Q === void 0 && (Q = m(u()), H[K] = Q), Q;
  }
  function m(R) {
    const D = [], N = [], K = [];
    for (let B = 0; B < i; B++)
      D[B] = 0, N[B] = 0, K[B] = 0;
    return {
      // for backward compatibility on non-VAO support browser
      geometry: null,
      program: null,
      wireframe: !1,
      newAttributes: D,
      enabledAttributes: N,
      attributeDivisors: K,
      object: R,
      attributes: {},
      index: null
    };
  }
  function f(R, D, N, K) {
    const B = l.attributes, H = D.attributes;
    let Q = 0;
    const ce = N.getAttributes();
    for (const Z in ce)
      if (ce[Z].location >= 0) {
        const J = B[Z];
        let se = H[Z];
        if (se === void 0 && (Z === "instanceMatrix" && R.instanceMatrix && (se = R.instanceMatrix), Z === "instanceColor" && R.instanceColor && (se = R.instanceColor)), J === void 0 || J.attribute !== se || se && J.data !== se.data)
          return !0;
        Q++;
      }
    return l.attributesNum !== Q || l.index !== K;
  }
  function v(R, D, N, K) {
    const B = {}, H = D.attributes;
    let Q = 0;
    const ce = N.getAttributes();
    for (const Z in ce)
      if (ce[Z].location >= 0) {
        let J = H[Z];
        J === void 0 && (Z === "instanceMatrix" && R.instanceMatrix && (J = R.instanceMatrix), Z === "instanceColor" && R.instanceColor && (J = R.instanceColor));
        const se = {};
        se.attribute = J, J && J.data && (se.data = J.data), B[Z] = se, Q++;
      }
    l.attributes = B, l.attributesNum = Q, l.index = K;
  }
  function M() {
    const R = l.newAttributes;
    for (let D = 0, N = R.length; D < N; D++)
      R[D] = 0;
  }
  function y(R) {
    w(R, 0);
  }
  function w(R, D) {
    const N = l.newAttributes, K = l.enabledAttributes, B = l.attributeDivisors;
    N[R] = 1, K[R] === 0 && (a.enableVertexAttribArray(R), K[R] = 1), B[R] !== D && ((n.isWebGL2 ? a : e.get("ANGLE_instanced_arrays"))[n.isWebGL2 ? "vertexAttribDivisor" : "vertexAttribDivisorANGLE"](R, D), B[R] = D);
  }
  function C() {
    const R = l.newAttributes, D = l.enabledAttributes;
    for (let N = 0, K = D.length; N < K; N++)
      D[N] !== R[N] && (a.disableVertexAttribArray(N), D[N] = 0);
  }
  function P(R, D, N, K, B, H) {
    n.isWebGL2 === !0 && (N === 5124 || N === 5125) ? a.vertexAttribIPointer(R, D, N, B, H) : a.vertexAttribPointer(R, D, N, K, B, H);
  }
  function I(R, D, N, K) {
    if (n.isWebGL2 === !1 && (R.isInstancedMesh || K.isInstancedBufferGeometry) && e.get("ANGLE_instanced_arrays") === null)
      return;
    M();
    const B = K.attributes, H = N.getAttributes(), Q = D.defaultAttributeValues;
    for (const ce in H) {
      const Z = H[ce];
      if (Z.location >= 0) {
        let W = B[ce];
        if (W === void 0 && (ce === "instanceMatrix" && R.instanceMatrix && (W = R.instanceMatrix), ce === "instanceColor" && R.instanceColor && (W = R.instanceColor)), W !== void 0) {
          const J = W.normalized, se = W.itemSize, oe = t.get(W);
          if (oe === void 0)
            continue;
          const V = oe.buffer, Te = oe.type, be = oe.bytesPerElement;
          if (W.isInterleavedBufferAttribute) {
            const re = W.data, ye = re.stride, Be = W.offset;
            if (re.isInstancedInterleavedBuffer) {
              for (let _e = 0; _e < Z.locationSize; _e++)
                w(Z.location + _e, re.meshPerAttribute);
              R.isInstancedMesh !== !0 && K._maxInstanceCount === void 0 && (K._maxInstanceCount = re.meshPerAttribute * re.count);
            } else
              for (let _e = 0; _e < Z.locationSize; _e++)
                y(Z.location + _e);
            a.bindBuffer(34962, V);
            for (let _e = 0; _e < Z.locationSize; _e++)
              P(
                Z.location + _e,
                se / Z.locationSize,
                Te,
                J,
                ye * be,
                (Be + se / Z.locationSize * _e) * be
              );
          } else {
            if (W.isInstancedBufferAttribute) {
              for (let re = 0; re < Z.locationSize; re++)
                w(Z.location + re, W.meshPerAttribute);
              R.isInstancedMesh !== !0 && K._maxInstanceCount === void 0 && (K._maxInstanceCount = W.meshPerAttribute * W.count);
            } else
              for (let re = 0; re < Z.locationSize; re++)
                y(Z.location + re);
            a.bindBuffer(34962, V);
            for (let re = 0; re < Z.locationSize; re++)
              P(
                Z.location + re,
                se / Z.locationSize,
                Te,
                J,
                se * be,
                se / Z.locationSize * re * be
              );
          }
        } else if (Q !== void 0) {
          const J = Q[ce];
          if (J !== void 0)
            switch (J.length) {
              case 2:
                a.vertexAttrib2fv(Z.location, J);
                break;
              case 3:
                a.vertexAttrib3fv(Z.location, J);
                break;
              case 4:
                a.vertexAttrib4fv(Z.location, J);
                break;
              default:
                a.vertexAttrib1fv(Z.location, J);
            }
        }
      }
    }
    C();
  }
  function S() {
    k();
    for (const R in o) {
      const D = o[R];
      for (const N in D) {
        const K = D[N];
        for (const B in K)
          g(K[B].object), delete K[B];
        delete D[N];
      }
      delete o[R];
    }
  }
  function T(R) {
    if (o[R.id] === void 0)
      return;
    const D = o[R.id];
    for (const N in D) {
      const K = D[N];
      for (const B in K)
        g(K[B].object), delete K[B];
      delete D[N];
    }
    delete o[R.id];
  }
  function O(R) {
    for (const D in o) {
      const N = o[D];
      if (N[R.id] === void 0)
        continue;
      const K = N[R.id];
      for (const B in K)
        g(K[B].object), delete K[B];
      delete N[R.id];
    }
  }
  function k() {
    L(), h = !0, l !== c && (l = c, p(l.object));
  }
  function L() {
    c.geometry = null, c.program = null, c.wireframe = !1;
  }
  return {
    setup: d,
    reset: k,
    resetDefaultState: L,
    dispose: S,
    releaseStatesOfGeometry: T,
    releaseStatesOfProgram: O,
    initAttributes: M,
    enableAttribute: y,
    disableUnusedAttributes: C
  };
}
function Op(a, e, t, n) {
  const i = n.isWebGL2;
  let s;
  function r(l) {
    s = l;
  }
  function o(l, h) {
    a.drawArrays(s, l, h), t.update(h, s, 1);
  }
  function c(l, h, d) {
    if (d === 0)
      return;
    let u, p;
    if (i)
      u = a, p = "drawArraysInstanced";
    else if (u = e.get("ANGLE_instanced_arrays"), p = "drawArraysInstancedANGLE", u === null) {
      console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");
      return;
    }
    u[p](s, l, h, d), t.update(h, s, d);
  }
  this.setMode = r, this.render = o, this.renderInstances = c;
}
function Bp(a, e, t) {
  let n;
  function i() {
    if (n !== void 0)
      return n;
    if (e.has("EXT_texture_filter_anisotropic") === !0) {
      const P = e.get("EXT_texture_filter_anisotropic");
      n = a.getParameter(P.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    } else
      n = 0;
    return n;
  }
  function s(P) {
    if (P === "highp") {
      if (a.getShaderPrecisionFormat(35633, 36338).precision > 0 && a.getShaderPrecisionFormat(35632, 36338).precision > 0)
        return "highp";
      P = "mediump";
    }
    return P === "mediump" && a.getShaderPrecisionFormat(35633, 36337).precision > 0 && a.getShaderPrecisionFormat(35632, 36337).precision > 0 ? "mediump" : "lowp";
  }
  const r = typeof WebGL2RenderingContext < "u" && a.constructor.name === "WebGL2RenderingContext";
  let o = t.precision !== void 0 ? t.precision : "highp";
  const c = s(o);
  c !== o && (console.warn("THREE.WebGLRenderer:", o, "not supported, using", c, "instead."), o = c);
  const l = r || e.has("WEBGL_draw_buffers"), h = t.logarithmicDepthBuffer === !0, d = a.getParameter(34930), u = a.getParameter(35660), p = a.getParameter(3379), g = a.getParameter(34076), _ = a.getParameter(34921), m = a.getParameter(36347), f = a.getParameter(36348), v = a.getParameter(36349), M = u > 0, y = r || e.has("OES_texture_float"), w = M && y, C = r ? a.getParameter(36183) : 0;
  return {
    isWebGL2: r,
    drawBuffers: l,
    getMaxAnisotropy: i,
    getMaxPrecision: s,
    precision: o,
    logarithmicDepthBuffer: h,
    maxTextures: d,
    maxVertexTextures: u,
    maxTextureSize: p,
    maxCubemapSize: g,
    maxAttributes: _,
    maxVertexUniforms: m,
    maxVaryings: f,
    maxFragmentUniforms: v,
    vertexTextures: M,
    floatFragmentTextures: y,
    floatVertexTextures: w,
    maxSamples: C
  };
}
function Gp(a) {
  const e = this;
  let t = null, n = 0, i = !1, s = !1;
  const r = new In(), o = new Ie(), c = { value: null, needsUpdate: !1 };
  this.uniform = c, this.numPlanes = 0, this.numIntersection = 0, this.init = function(d, u) {
    const p = d.length !== 0 || u || // enable state of previous frame - the clipping code has to
    // run another frame in order to reset the state:
    n !== 0 || i;
    return i = u, n = d.length, p;
  }, this.beginShadows = function() {
    s = !0, h(null);
  }, this.endShadows = function() {
    s = !1;
  }, this.setGlobalState = function(d, u) {
    t = h(d, u, 0);
  }, this.setState = function(d, u, p) {
    const g = d.clippingPlanes, _ = d.clipIntersection, m = d.clipShadows, f = a.get(d);
    if (!i || g === null || g.length === 0 || s && !m)
      s ? h(null) : l();
    else {
      const v = s ? 0 : n, M = v * 4;
      let y = f.clippingState || null;
      c.value = y, y = h(g, u, M, p);
      for (let w = 0; w !== M; ++w)
        y[w] = t[w];
      f.clippingState = y, this.numIntersection = _ ? this.numPlanes : 0, this.numPlanes += v;
    }
  };
  function l() {
    c.value !== t && (c.value = t, c.needsUpdate = n > 0), e.numPlanes = n, e.numIntersection = 0;
  }
  function h(d, u, p, g) {
    const _ = d !== null ? d.length : 0;
    let m = null;
    if (_ !== 0) {
      if (m = c.value, g !== !0 || m === null) {
        const f = p + _ * 4, v = u.matrixWorldInverse;
        o.getNormalMatrix(v), (m === null || m.length < f) && (m = new Float32Array(f));
        for (let M = 0, y = p; M !== _; ++M, y += 4)
          r.copy(d[M]).applyMatrix4(v, o), r.normal.toArray(m, y), m[y + 3] = r.constant;
      }
      c.value = m, c.needsUpdate = !0;
    }
    return e.numPlanes = _, e.numIntersection = 0, m;
  }
}
function Vp(a) {
  let e = /* @__PURE__ */ new WeakMap();
  function t(r, o) {
    return o === cr ? r.mapping = ui : o === hr && (r.mapping = di), r;
  }
  function n(r) {
    if (r && r.isTexture && r.isRenderTargetTexture === !1) {
      const o = r.mapping;
      if (o === cr || o === hr)
        if (e.has(r)) {
          const c = e.get(r).texture;
          return t(c, r.mapping);
        } else {
          const c = r.image;
          if (c && c.height > 0) {
            const l = new nd(c.height / 2);
            return l.fromEquirectangularTexture(a, r), e.set(r, l), r.addEventListener("dispose", i), t(l.texture, r.mapping);
          } else
            return null;
        }
    }
    return r;
  }
  function i(r) {
    const o = r.target;
    o.removeEventListener("dispose", i);
    const c = e.get(o);
    c !== void 0 && (e.delete(o), c.dispose());
  }
  function s() {
    e = /* @__PURE__ */ new WeakMap();
  }
  return {
    get: n,
    dispose: s
  };
}
class br extends Ha {
  constructor(e = -1, t = 1, n = 1, i = -1, s = 0.1, r = 2e3) {
    super(), this.isOrthographicCamera = !0, this.type = "OrthographicCamera", this.zoom = 1, this.view = null, this.left = e, this.right = t, this.top = n, this.bottom = i, this.near = s, this.far = r, this.updateProjectionMatrix();
  }
  copy(e, t) {
    return super.copy(e, t), this.left = e.left, this.right = e.right, this.top = e.top, this.bottom = e.bottom, this.near = e.near, this.far = e.far, this.zoom = e.zoom, this.view = e.view === null ? null : Object.assign({}, e.view), this;
  }
  setViewOffset(e, t, n, i, s, r) {
    this.view === null && (this.view = {
      enabled: !0,
      fullWidth: 1,
      fullHeight: 1,
      offsetX: 0,
      offsetY: 0,
      width: 1,
      height: 1
    }), this.view.enabled = !0, this.view.fullWidth = e, this.view.fullHeight = t, this.view.offsetX = n, this.view.offsetY = i, this.view.width = s, this.view.height = r, this.updateProjectionMatrix();
  }
  clearViewOffset() {
    this.view !== null && (this.view.enabled = !1), this.updateProjectionMatrix();
  }
  updateProjectionMatrix() {
    const e = (this.right - this.left) / (2 * this.zoom), t = (this.top - this.bottom) / (2 * this.zoom), n = (this.right + this.left) / 2, i = (this.top + this.bottom) / 2;
    let s = n - e, r = n + e, o = i + t, c = i - t;
    if (this.view !== null && this.view.enabled) {
      const l = (this.right - this.left) / this.view.fullWidth / this.zoom, h = (this.top - this.bottom) / this.view.fullHeight / this.zoom;
      s += l * this.view.offsetX, r = s + l * this.view.width, o -= h * this.view.offsetY, c = o - h * this.view.height;
    }
    this.projectionMatrix.makeOrthographic(s, r, o, c, this.near, this.far), this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
  }
  toJSON(e) {
    const t = super.toJSON(e);
    return t.object.zoom = this.zoom, t.object.left = this.left, t.object.right = this.right, t.object.top = this.top, t.object.bottom = this.bottom, t.object.near = this.near, t.object.far = this.far, this.view !== null && (t.object.view = Object.assign({}, this.view)), t;
  }
}
const ai = 4, Ho = [0.125, 0.215, 0.35, 0.446, 0.526, 0.582], zn = 20, ir = /* @__PURE__ */ new br(), Wo = /* @__PURE__ */ new He();
let sr = null;
const Un = (1 + Math.sqrt(5)) / 2, ri = 1 / Un, qo = [
  /* @__PURE__ */ new G(1, 1, 1),
  /* @__PURE__ */ new G(-1, 1, 1),
  /* @__PURE__ */ new G(1, 1, -1),
  /* @__PURE__ */ new G(-1, 1, -1),
  /* @__PURE__ */ new G(0, Un, ri),
  /* @__PURE__ */ new G(0, Un, -ri),
  /* @__PURE__ */ new G(ri, 0, Un),
  /* @__PURE__ */ new G(-ri, 0, Un),
  /* @__PURE__ */ new G(Un, ri, 0),
  /* @__PURE__ */ new G(-Un, ri, 0)
];
class Xo {
  constructor(e) {
    this._renderer = e, this._pingPongRenderTarget = null, this._lodMax = 0, this._cubeSize = 0, this._lodPlanes = [], this._sizeLods = [], this._sigmas = [], this._blurMaterial = null, this._cubemapMaterial = null, this._equirectMaterial = null, this._compileMaterial(this._blurMaterial);
  }
  /**
   * Generates a PMREM from a supplied Scene, which can be faster than using an
   * image if networking bandwidth is low. Optional sigma specifies a blur radius
   * in radians to be applied to the scene before PMREM generation. Optional near
   * and far planes ensure the scene is rendered in its entirety (the cubeCamera
   * is placed at the origin).
   */
  fromScene(e, t = 0, n = 0.1, i = 100) {
    sr = this._renderer.getRenderTarget(), this._setSize(256);
    const s = this._allocateTargets();
    return s.depthBuffer = !0, this._sceneToCubeUV(e, n, i, s), t > 0 && this._blur(s, 0, 0, t), this._applyPMREM(s), this._cleanup(s), s;
  }
  /**
   * Generates a PMREM from an equirectangular texture, which can be either LDR
   * or HDR. The ideal input image size is 1k (1024 x 512),
   * as this matches best with the 256 x 256 cubemap output.
   */
  fromEquirectangular(e, t = null) {
    return this._fromTexture(e, t);
  }
  /**
   * Generates a PMREM from an cubemap texture, which can be either LDR
   * or HDR. The ideal input cube size is 256 x 256,
   * as this matches best with the 256 x 256 cubemap output.
   */
  fromCubemap(e, t = null) {
    return this._fromTexture(e, t);
  }
  /**
   * Pre-compiles the cubemap shader. You can get faster start-up by invoking this method during
   * your texture's network fetch for increased concurrency.
   */
  compileCubemapShader() {
    this._cubemapMaterial === null && (this._cubemapMaterial = $o(), this._compileMaterial(this._cubemapMaterial));
  }
  /**
   * Pre-compiles the equirectangular shader. You can get faster start-up by invoking this method during
   * your texture's network fetch for increased concurrency.
   */
  compileEquirectangularShader() {
    this._equirectMaterial === null && (this._equirectMaterial = Yo(), this._compileMaterial(this._equirectMaterial));
  }
  /**
   * Disposes of the PMREMGenerator's internal memory. Note that PMREMGenerator is a static class,
   * so you should not need more than one PMREMGenerator object. If you do, calling dispose() on
   * one of them will cause any others to also become unusable.
   */
  dispose() {
    this._dispose(), this._cubemapMaterial !== null && this._cubemapMaterial.dispose(), this._equirectMaterial !== null && this._equirectMaterial.dispose();
  }
  // private interface
  _setSize(e) {
    this._lodMax = Math.floor(Math.log2(e)), this._cubeSize = Math.pow(2, this._lodMax);
  }
  _dispose() {
    this._blurMaterial !== null && this._blurMaterial.dispose(), this._pingPongRenderTarget !== null && this._pingPongRenderTarget.dispose();
    for (let e = 0; e < this._lodPlanes.length; e++)
      this._lodPlanes[e].dispose();
  }
  _cleanup(e) {
    this._renderer.setRenderTarget(sr), e.scissorTest = !1, hs(e, 0, 0, e.width, e.height);
  }
  _fromTexture(e, t) {
    e.mapping === ui || e.mapping === di ? this._setSize(e.image.length === 0 ? 16 : e.image[0].width || e.image[0].image.width) : this._setSize(e.image.width / 4), sr = this._renderer.getRenderTarget();
    const n = t || this._allocateTargets();
    return this._textureToCubeUV(e, n), this._applyPMREM(n), this._cleanup(n), n;
  }
  _allocateTargets() {
    const e = 3 * Math.max(this._cubeSize, 112), t = 4 * this._cubeSize, n = {
      magFilter: Dt,
      minFilter: Dt,
      generateMipmaps: !1,
      type: Di,
      format: Vt,
      encoding: Vn,
      depthBuffer: !1
    }, i = jo(e, t, n);
    if (this._pingPongRenderTarget === null || this._pingPongRenderTarget.width !== e || this._pingPongRenderTarget.height !== t) {
      this._pingPongRenderTarget !== null && this._dispose(), this._pingPongRenderTarget = jo(e, t, n);
      const { _lodMax: s } = this;
      ({ sizeLods: this._sizeLods, lodPlanes: this._lodPlanes, sigmas: this._sigmas } = kp(s)), this._blurMaterial = Hp(s, e, t);
    }
    return i;
  }
  _compileMaterial(e) {
    const t = new Kt(this._lodPlanes[0], e);
    this._renderer.compile(t, ir);
  }
  _sceneToCubeUV(e, t, n, i) {
    const o = new It(90, 1, t, n), c = [1, -1, 1, 1, 1, 1], l = [1, 1, 1, -1, -1, -1], h = this._renderer, d = h.autoClear, u = h.toneMapping;
    h.getClearColor(Wo), h.toneMapping = pn, h.autoClear = !1;
    const p = new Oa({
      name: "PMREM.Background",
      side: yt,
      depthWrite: !1,
      depthTest: !1
    }), g = new Kt(new _i(), p);
    let _ = !1;
    const m = e.background;
    m ? m.isColor && (p.color.copy(m), e.background = null, _ = !0) : (p.color.copy(Wo), _ = !0);
    for (let f = 0; f < 6; f++) {
      const v = f % 3;
      v === 0 ? (o.up.set(0, c[f], 0), o.lookAt(l[f], 0, 0)) : v === 1 ? (o.up.set(0, 0, c[f]), o.lookAt(0, l[f], 0)) : (o.up.set(0, c[f], 0), o.lookAt(0, 0, l[f]));
      const M = this._cubeSize;
      hs(i, v * M, f > 2 ? M : 0, M, M), h.setRenderTarget(i), _ && h.render(g, o), h.render(e, o);
    }
    g.geometry.dispose(), g.material.dispose(), h.toneMapping = u, h.autoClear = d, e.background = m;
  }
  _textureToCubeUV(e, t) {
    const n = this._renderer, i = e.mapping === ui || e.mapping === di;
    i ? (this._cubemapMaterial === null && (this._cubemapMaterial = $o()), this._cubemapMaterial.uniforms.flipEnvMap.value = e.isRenderTargetTexture === !1 ? -1 : 1) : this._equirectMaterial === null && (this._equirectMaterial = Yo());
    const s = i ? this._cubemapMaterial : this._equirectMaterial, r = new Kt(this._lodPlanes[0], s), o = s.uniforms;
    o.envMap.value = e;
    const c = this._cubeSize;
    hs(t, 0, 0, 3 * c, 2 * c), n.setRenderTarget(t), n.render(r, ir);
  }
  _applyPMREM(e) {
    const t = this._renderer, n = t.autoClear;
    t.autoClear = !1;
    for (let i = 1; i < this._lodPlanes.length; i++) {
      const s = Math.sqrt(this._sigmas[i] * this._sigmas[i] - this._sigmas[i - 1] * this._sigmas[i - 1]), r = qo[(i - 1) % qo.length];
      this._blur(e, i - 1, i, s, r);
    }
    t.autoClear = n;
  }
  /**
   * This is a two-pass Gaussian blur for a cubemap. Normally this is done
   * vertically and horizontally, but this breaks down on a cube. Here we apply
   * the blur latitudinally (around the poles), and then longitudinally (towards
   * the poles) to approximate the orthogonally-separable blur. It is least
   * accurate at the poles, but still does a decent job.
   */
  _blur(e, t, n, i, s) {
    const r = this._pingPongRenderTarget;
    this._halfBlur(
      e,
      r,
      t,
      n,
      i,
      "latitudinal",
      s
    ), this._halfBlur(
      r,
      e,
      n,
      n,
      i,
      "longitudinal",
      s
    );
  }
  _halfBlur(e, t, n, i, s, r, o) {
    const c = this._renderer, l = this._blurMaterial;
    r !== "latitudinal" && r !== "longitudinal" && console.error(
      "blur direction must be either latitudinal or longitudinal!"
    );
    const h = 3, d = new Kt(this._lodPlanes[i], l), u = l.uniforms, p = this._sizeLods[n] - 1, g = isFinite(s) ? Math.PI / (2 * p) : 2 * Math.PI / (2 * zn - 1), _ = s / g, m = isFinite(s) ? 1 + Math.floor(h * _) : zn;
    m > zn && console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${zn}`);
    const f = [];
    let v = 0;
    for (let P = 0; P < zn; ++P) {
      const I = P / _, S = Math.exp(-I * I / 2);
      f.push(S), P === 0 ? v += S : P < m && (v += 2 * S);
    }
    for (let P = 0; P < f.length; P++)
      f[P] = f[P] / v;
    u.envMap.value = e.texture, u.samples.value = m, u.weights.value = f, u.latitudinal.value = r === "latitudinal", o && (u.poleAxis.value = o);
    const { _lodMax: M } = this;
    u.dTheta.value = g, u.mipInt.value = M - n;
    const y = this._sizeLods[i], w = 3 * y * (i > M - ai ? i - M + ai : 0), C = 4 * (this._cubeSize - y);
    hs(t, w, C, 3 * y, 2 * y), c.setRenderTarget(t), c.render(d, ir);
  }
}
function kp(a) {
  const e = [], t = [], n = [];
  let i = a;
  const s = a - ai + 1 + Ho.length;
  for (let r = 0; r < s; r++) {
    const o = Math.pow(2, i);
    t.push(o);
    let c = 1 / o;
    r > a - ai ? c = Ho[r - a + ai - 1] : r === 0 && (c = 0), n.push(c);
    const l = 1 / (o - 2), h = -l, d = 1 + l, u = [h, h, d, h, d, d, h, h, d, d, h, d], p = 6, g = 6, _ = 3, m = 2, f = 1, v = new Float32Array(_ * g * p), M = new Float32Array(m * g * p), y = new Float32Array(f * g * p);
    for (let C = 0; C < p; C++) {
      const P = C % 3 * 2 / 3 - 1, I = C > 2 ? 0 : -1, S = [
        P,
        I,
        0,
        P + 2 / 3,
        I,
        0,
        P + 2 / 3,
        I + 1,
        0,
        P,
        I,
        0,
        P + 2 / 3,
        I + 1,
        0,
        P,
        I + 1,
        0
      ];
      v.set(S, _ * g * C), M.set(u, m * g * C);
      const T = [C, C, C, C, C, C];
      y.set(T, f * g * C);
    }
    const w = new bn();
    w.setAttribute("position", new Qt(v, _)), w.setAttribute("uv", new Qt(M, m)), w.setAttribute("faceIndex", new Qt(y, f)), e.push(w), i > ai && i--;
  }
  return { lodPlanes: e, sizeLods: t, sigmas: n };
}
function jo(a, e, t) {
  const n = new en(a, e, t);
  return n.texture.mapping = _s, n.texture.name = "PMREM.cubeUv", n.scissorTest = !0, n;
}
function hs(a, e, t, n, i) {
  a.viewport.set(e, t, n, i), a.scissor.set(e, t, n, i);
}
function Hp(a, e, t) {
  const n = new Float32Array(zn), i = new G(0, 1, 0);
  return new tn({
    name: "SphericalGaussianBlur",
    defines: {
      n: zn,
      CUBEUV_TEXEL_WIDTH: 1 / e,
      CUBEUV_TEXEL_HEIGHT: 1 / t,
      CUBEUV_MAX_MIP: `${a}.0`
    },
    uniforms: {
      envMap: { value: null },
      samples: { value: 1 },
      weights: { value: n },
      latitudinal: { value: !1 },
      dTheta: { value: 0 },
      mipInt: { value: 0 },
      poleAxis: { value: i }
    },
    vertexShader: Er(),
    fragmentShader: (
      /* glsl */
      `

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`
    ),
    blending: Sn,
    depthTest: !1,
    depthWrite: !1
  });
}
function Yo() {
  return new tn({
    name: "EquirectangularToCubeUV",
    uniforms: {
      envMap: { value: null }
    },
    vertexShader: Er(),
    fragmentShader: (
      /* glsl */
      `

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`
    ),
    blending: Sn,
    depthTest: !1,
    depthWrite: !1
  });
}
function $o() {
  return new tn({
    name: "CubemapToCubeUV",
    uniforms: {
      envMap: { value: null },
      flipEnvMap: { value: -1 }
    },
    vertexShader: Er(),
    fragmentShader: (
      /* glsl */
      `

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`
    ),
    blending: Sn,
    depthTest: !1,
    depthWrite: !1
  });
}
function Er() {
  return (
    /* glsl */
    `

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`
  );
}
function Wp(a) {
  let e = /* @__PURE__ */ new WeakMap(), t = null;
  function n(o) {
    if (o && o.isTexture) {
      const c = o.mapping, l = c === cr || c === hr, h = c === ui || c === di;
      if (l || h)
        if (o.isRenderTargetTexture && o.needsPMREMUpdate === !0) {
          o.needsPMREMUpdate = !1;
          let d = e.get(o);
          return t === null && (t = new Xo(a)), d = l ? t.fromEquirectangular(o, d) : t.fromCubemap(o, d), e.set(o, d), d.texture;
        } else {
          if (e.has(o))
            return e.get(o).texture;
          {
            const d = o.image;
            if (l && d && d.height > 0 || h && d && i(d)) {
              t === null && (t = new Xo(a));
              const u = l ? t.fromEquirectangular(o) : t.fromCubemap(o);
              return e.set(o, u), o.addEventListener("dispose", s), u.texture;
            } else
              return null;
          }
        }
    }
    return o;
  }
  function i(o) {
    let c = 0;
    const l = 6;
    for (let h = 0; h < l; h++)
      o[h] !== void 0 && c++;
    return c === l;
  }
  function s(o) {
    const c = o.target;
    c.removeEventListener("dispose", s);
    const l = e.get(c);
    l !== void 0 && (e.delete(c), l.dispose());
  }
  function r() {
    e = /* @__PURE__ */ new WeakMap(), t !== null && (t.dispose(), t = null);
  }
  return {
    get: n,
    dispose: r
  };
}
function qp(a) {
  const e = {};
  function t(n) {
    if (e[n] !== void 0)
      return e[n];
    let i;
    switch (n) {
      case "WEBGL_depth_texture":
        i = a.getExtension("WEBGL_depth_texture") || a.getExtension("MOZ_WEBGL_depth_texture") || a.getExtension("WEBKIT_WEBGL_depth_texture");
        break;
      case "EXT_texture_filter_anisotropic":
        i = a.getExtension("EXT_texture_filter_anisotropic") || a.getExtension("MOZ_EXT_texture_filter_anisotropic") || a.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
        break;
      case "WEBGL_compressed_texture_s3tc":
        i = a.getExtension("WEBGL_compressed_texture_s3tc") || a.getExtension("MOZ_WEBGL_compressed_texture_s3tc") || a.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");
        break;
      case "WEBGL_compressed_texture_pvrtc":
        i = a.getExtension("WEBGL_compressed_texture_pvrtc") || a.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");
        break;
      default:
        i = a.getExtension(n);
    }
    return e[n] = i, i;
  }
  return {
    has: function(n) {
      return t(n) !== null;
    },
    init: function(n) {
      n.isWebGL2 ? t("EXT_color_buffer_float") : (t("WEBGL_depth_texture"), t("OES_texture_float"), t("OES_texture_half_float"), t("OES_texture_half_float_linear"), t("OES_standard_derivatives"), t("OES_element_index_uint"), t("OES_vertex_array_object"), t("ANGLE_instanced_arrays")), t("OES_texture_float_linear"), t("EXT_color_buffer_half_float"), t("WEBGL_multisampled_render_to_texture");
    },
    get: function(n) {
      const i = t(n);
      return i === null && console.warn("THREE.WebGLRenderer: " + n + " extension not supported."), i;
    }
  };
}
function Xp(a, e, t, n) {
  const i = {}, s = /* @__PURE__ */ new WeakMap();
  function r(d) {
    const u = d.target;
    u.index !== null && e.remove(u.index);
    for (const g in u.attributes)
      e.remove(u.attributes[g]);
    u.removeEventListener("dispose", r), delete i[u.id];
    const p = s.get(u);
    p && (e.remove(p), s.delete(u)), n.releaseStatesOfGeometry(u), u.isInstancedBufferGeometry === !0 && delete u._maxInstanceCount, t.memory.geometries--;
  }
  function o(d, u) {
    return i[u.id] === !0 || (u.addEventListener("dispose", r), i[u.id] = !0, t.memory.geometries++), u;
  }
  function c(d) {
    const u = d.attributes;
    for (const g in u)
      e.update(u[g], 34962);
    const p = d.morphAttributes;
    for (const g in p) {
      const _ = p[g];
      for (let m = 0, f = _.length; m < f; m++)
        e.update(_[m], 34962);
    }
  }
  function l(d) {
    const u = [], p = d.index, g = d.attributes.position;
    let _ = 0;
    if (p !== null) {
      const v = p.array;
      _ = p.version;
      for (let M = 0, y = v.length; M < y; M += 3) {
        const w = v[M + 0], C = v[M + 1], P = v[M + 2];
        u.push(w, C, C, P, P, w);
      }
    } else {
      const v = g.array;
      _ = g.version;
      for (let M = 0, y = v.length / 3 - 1; M < y; M += 3) {
        const w = M + 0, C = M + 1, P = M + 2;
        u.push(w, C, C, P, P, w);
      }
    }
    const m = new (Da(u) ? Ga : Ba)(u, 1);
    m.version = _;
    const f = s.get(d);
    f && e.remove(f), s.set(d, m);
  }
  function h(d) {
    const u = s.get(d);
    if (u) {
      const p = d.index;
      p !== null && u.version < p.version && l(d);
    } else
      l(d);
    return s.get(d);
  }
  return {
    get: o,
    update: c,
    getWireframeAttribute: h
  };
}
function jp(a, e, t, n) {
  const i = n.isWebGL2;
  let s;
  function r(u) {
    s = u;
  }
  let o, c;
  function l(u) {
    o = u.type, c = u.bytesPerElement;
  }
  function h(u, p) {
    a.drawElements(s, p, o, u * c), t.update(p, s, 1);
  }
  function d(u, p, g) {
    if (g === 0)
      return;
    let _, m;
    if (i)
      _ = a, m = "drawElementsInstanced";
    else if (_ = e.get("ANGLE_instanced_arrays"), m = "drawElementsInstancedANGLE", _ === null) {
      console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");
      return;
    }
    _[m](s, p, o, u * c, g), t.update(p, s, g);
  }
  this.setMode = r, this.setIndex = l, this.render = h, this.renderInstances = d;
}
function Yp(a) {
  const e = {
    geometries: 0,
    textures: 0
  }, t = {
    frame: 0,
    calls: 0,
    triangles: 0,
    points: 0,
    lines: 0
  };
  function n(s, r, o) {
    switch (t.calls++, r) {
      case 4:
        t.triangles += o * (s / 3);
        break;
      case 1:
        t.lines += o * (s / 2);
        break;
      case 3:
        t.lines += o * (s - 1);
        break;
      case 2:
        t.lines += o * s;
        break;
      case 0:
        t.points += o * s;
        break;
      default:
        console.error("THREE.WebGLInfo: Unknown draw mode:", r);
        break;
    }
  }
  function i() {
    t.frame++, t.calls = 0, t.triangles = 0, t.points = 0, t.lines = 0;
  }
  return {
    memory: e,
    render: t,
    programs: null,
    autoReset: !0,
    reset: i,
    update: n
  };
}
function $p(a, e) {
  return a[0] - e[0];
}
function Zp(a, e) {
  return Math.abs(e[1]) - Math.abs(a[1]);
}
function Kp(a, e, t) {
  const n = {}, i = new Float32Array(8), s = /* @__PURE__ */ new WeakMap(), r = new tt(), o = [];
  for (let l = 0; l < 8; l++)
    o[l] = [l, 0];
  function c(l, h, d) {
    const u = l.morphTargetInfluences;
    if (e.isWebGL2 === !0) {
      const p = h.morphAttributes.position || h.morphAttributes.normal || h.morphAttributes.color, g = p !== void 0 ? p.length : 0;
      let _ = s.get(h);
      if (_ === void 0 || _.count !== g) {
        let R = function() {
          k.dispose(), s.delete(h), h.removeEventListener("dispose", R);
        };
        _ !== void 0 && _.texture.dispose();
        const v = h.morphAttributes.position !== void 0, M = h.morphAttributes.normal !== void 0, y = h.morphAttributes.color !== void 0, w = h.morphAttributes.position || [], C = h.morphAttributes.normal || [], P = h.morphAttributes.color || [];
        let I = 0;
        v === !0 && (I = 1), M === !0 && (I = 2), y === !0 && (I = 3);
        let S = h.attributes.position.count * I, T = 1;
        S > e.maxTextureSize && (T = Math.ceil(S / e.maxTextureSize), S = e.maxTextureSize);
        const O = new Float32Array(S * T * 4 * g), k = new Na(O, S, T, g);
        k.type = On, k.needsUpdate = !0;
        const L = I * 4;
        for (let D = 0; D < g; D++) {
          const N = w[D], K = C[D], B = P[D], H = S * T * 4 * D;
          for (let Q = 0; Q < N.count; Q++) {
            const ce = Q * L;
            v === !0 && (r.fromBufferAttribute(N, Q), O[H + ce + 0] = r.x, O[H + ce + 1] = r.y, O[H + ce + 2] = r.z, O[H + ce + 3] = 0), M === !0 && (r.fromBufferAttribute(K, Q), O[H + ce + 4] = r.x, O[H + ce + 5] = r.y, O[H + ce + 6] = r.z, O[H + ce + 7] = 0), y === !0 && (r.fromBufferAttribute(B, Q), O[H + ce + 8] = r.x, O[H + ce + 9] = r.y, O[H + ce + 10] = r.z, O[H + ce + 11] = B.itemSize === 4 ? r.w : 1);
          }
        }
        _ = {
          count: g,
          texture: k,
          size: new Fe(S, T)
        }, s.set(h, _), h.addEventListener("dispose", R);
      }
      let m = 0;
      for (let v = 0; v < u.length; v++)
        m += u[v];
      const f = h.morphTargetsRelative ? 1 : 1 - m;
      d.getUniforms().setValue(a, "morphTargetBaseInfluence", f), d.getUniforms().setValue(a, "morphTargetInfluences", u), d.getUniforms().setValue(a, "morphTargetsTexture", _.texture, t), d.getUniforms().setValue(a, "morphTargetsTextureSize", _.size);
    } else {
      const p = u === void 0 ? 0 : u.length;
      let g = n[h.id];
      if (g === void 0 || g.length !== p) {
        g = [];
        for (let M = 0; M < p; M++)
          g[M] = [M, 0];
        n[h.id] = g;
      }
      for (let M = 0; M < p; M++) {
        const y = g[M];
        y[0] = M, y[1] = u[M];
      }
      g.sort(Zp);
      for (let M = 0; M < 8; M++)
        M < p && g[M][1] ? (o[M][0] = g[M][0], o[M][1] = g[M][1]) : (o[M][0] = Number.MAX_SAFE_INTEGER, o[M][1] = 0);
      o.sort($p);
      const _ = h.morphAttributes.position, m = h.morphAttributes.normal;
      let f = 0;
      for (let M = 0; M < 8; M++) {
        const y = o[M], w = y[0], C = y[1];
        w !== Number.MAX_SAFE_INTEGER && C ? (_ && h.getAttribute("morphTarget" + M) !== _[w] && h.setAttribute("morphTarget" + M, _[w]), m && h.getAttribute("morphNormal" + M) !== m[w] && h.setAttribute("morphNormal" + M, m[w]), i[M] = C, f += C) : (_ && h.hasAttribute("morphTarget" + M) === !0 && h.deleteAttribute("morphTarget" + M), m && h.hasAttribute("morphNormal" + M) === !0 && h.deleteAttribute("morphNormal" + M), i[M] = 0);
      }
      const v = h.morphTargetsRelative ? 1 : 1 - f;
      d.getUniforms().setValue(a, "morphTargetBaseInfluence", v), d.getUniforms().setValue(a, "morphTargetInfluences", i);
    }
  }
  return {
    update: c
  };
}
function Jp(a, e, t, n) {
  let i = /* @__PURE__ */ new WeakMap();
  function s(c) {
    const l = n.render.frame, h = c.geometry, d = e.get(c, h);
    return i.get(d) !== l && (e.update(d), i.set(d, l)), c.isInstancedMesh && (c.hasEventListener("dispose", o) === !1 && c.addEventListener("dispose", o), t.update(c.instanceMatrix, 34962), c.instanceColor !== null && t.update(c.instanceColor, 34962)), d;
  }
  function r() {
    i = /* @__PURE__ */ new WeakMap();
  }
  function o(c) {
    const l = c.target;
    l.removeEventListener("dispose", o), t.remove(l.instanceMatrix), l.instanceColor !== null && t.remove(l.instanceColor);
  }
  return {
    update: s,
    dispose: r
  };
}
const Xa = /* @__PURE__ */ new Ct(), ja = /* @__PURE__ */ new Na(), Ya = /* @__PURE__ */ new Gu(), $a = /* @__PURE__ */ new Wa(), Zo = [], Ko = [], Jo = new Float32Array(16), Qo = new Float32Array(9), ea = new Float32Array(4);
function vi(a, e, t) {
  const n = a[0];
  if (n <= 0 || n > 0)
    return a;
  const i = e * t;
  let s = Zo[i];
  if (s === void 0 && (s = new Float32Array(i), Zo[i] = s), e !== 0) {
    n.toArray(s, 0);
    for (let r = 1, o = 0; r !== e; ++r)
      o += t, a[r].toArray(s, o);
  }
  return s;
}
function it(a, e) {
  if (a.length !== e.length)
    return !1;
  for (let t = 0, n = a.length; t < n; t++)
    if (a[t] !== e[t])
      return !1;
  return !0;
}
function st(a, e) {
  for (let t = 0, n = e.length; t < n; t++)
    a[t] = e[t];
}
function xs(a, e) {
  let t = Ko[e];
  t === void 0 && (t = new Int32Array(e), Ko[e] = t);
  for (let n = 0; n !== e; ++n)
    t[n] = a.allocateTextureUnit();
  return t;
}
function Qp(a, e) {
  const t = this.cache;
  t[0] !== e && (a.uniform1f(this.addr, e), t[0] = e);
}
function em(a, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y) && (a.uniform2f(this.addr, e.x, e.y), t[0] = e.x, t[1] = e.y);
  else {
    if (it(t, e))
      return;
    a.uniform2fv(this.addr, e), st(t, e);
  }
}
function tm(a, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y || t[2] !== e.z) && (a.uniform3f(this.addr, e.x, e.y, e.z), t[0] = e.x, t[1] = e.y, t[2] = e.z);
  else if (e.r !== void 0)
    (t[0] !== e.r || t[1] !== e.g || t[2] !== e.b) && (a.uniform3f(this.addr, e.r, e.g, e.b), t[0] = e.r, t[1] = e.g, t[2] = e.b);
  else {
    if (it(t, e))
      return;
    a.uniform3fv(this.addr, e), st(t, e);
  }
}
function nm(a, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y || t[2] !== e.z || t[3] !== e.w) && (a.uniform4f(this.addr, e.x, e.y, e.z, e.w), t[0] = e.x, t[1] = e.y, t[2] = e.z, t[3] = e.w);
  else {
    if (it(t, e))
      return;
    a.uniform4fv(this.addr, e), st(t, e);
  }
}
function im(a, e) {
  const t = this.cache, n = e.elements;
  if (n === void 0) {
    if (it(t, e))
      return;
    a.uniformMatrix2fv(this.addr, !1, e), st(t, e);
  } else {
    if (it(t, n))
      return;
    ea.set(n), a.uniformMatrix2fv(this.addr, !1, ea), st(t, n);
  }
}
function sm(a, e) {
  const t = this.cache, n = e.elements;
  if (n === void 0) {
    if (it(t, e))
      return;
    a.uniformMatrix3fv(this.addr, !1, e), st(t, e);
  } else {
    if (it(t, n))
      return;
    Qo.set(n), a.uniformMatrix3fv(this.addr, !1, Qo), st(t, n);
  }
}
function rm(a, e) {
  const t = this.cache, n = e.elements;
  if (n === void 0) {
    if (it(t, e))
      return;
    a.uniformMatrix4fv(this.addr, !1, e), st(t, e);
  } else {
    if (it(t, n))
      return;
    Jo.set(n), a.uniformMatrix4fv(this.addr, !1, Jo), st(t, n);
  }
}
function om(a, e) {
  const t = this.cache;
  t[0] !== e && (a.uniform1i(this.addr, e), t[0] = e);
}
function am(a, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y) && (a.uniform2i(this.addr, e.x, e.y), t[0] = e.x, t[1] = e.y);
  else {
    if (it(t, e))
      return;
    a.uniform2iv(this.addr, e), st(t, e);
  }
}
function lm(a, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y || t[2] !== e.z) && (a.uniform3i(this.addr, e.x, e.y, e.z), t[0] = e.x, t[1] = e.y, t[2] = e.z);
  else {
    if (it(t, e))
      return;
    a.uniform3iv(this.addr, e), st(t, e);
  }
}
function cm(a, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y || t[2] !== e.z || t[3] !== e.w) && (a.uniform4i(this.addr, e.x, e.y, e.z, e.w), t[0] = e.x, t[1] = e.y, t[2] = e.z, t[3] = e.w);
  else {
    if (it(t, e))
      return;
    a.uniform4iv(this.addr, e), st(t, e);
  }
}
function hm(a, e) {
  const t = this.cache;
  t[0] !== e && (a.uniform1ui(this.addr, e), t[0] = e);
}
function um(a, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y) && (a.uniform2ui(this.addr, e.x, e.y), t[0] = e.x, t[1] = e.y);
  else {
    if (it(t, e))
      return;
    a.uniform2uiv(this.addr, e), st(t, e);
  }
}
function dm(a, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y || t[2] !== e.z) && (a.uniform3ui(this.addr, e.x, e.y, e.z), t[0] = e.x, t[1] = e.y, t[2] = e.z);
  else {
    if (it(t, e))
      return;
    a.uniform3uiv(this.addr, e), st(t, e);
  }
}
function fm(a, e) {
  const t = this.cache;
  if (e.x !== void 0)
    (t[0] !== e.x || t[1] !== e.y || t[2] !== e.z || t[3] !== e.w) && (a.uniform4ui(this.addr, e.x, e.y, e.z, e.w), t[0] = e.x, t[1] = e.y, t[2] = e.z, t[3] = e.w);
  else {
    if (it(t, e))
      return;
    a.uniform4uiv(this.addr, e), st(t, e);
  }
}
function pm(a, e, t) {
  const n = this.cache, i = t.allocateTextureUnit();
  n[0] !== i && (a.uniform1i(this.addr, i), n[0] = i), t.setTexture2D(e || Xa, i);
}
function mm(a, e, t) {
  const n = this.cache, i = t.allocateTextureUnit();
  n[0] !== i && (a.uniform1i(this.addr, i), n[0] = i), t.setTexture3D(e || Ya, i);
}
function gm(a, e, t) {
  const n = this.cache, i = t.allocateTextureUnit();
  n[0] !== i && (a.uniform1i(this.addr, i), n[0] = i), t.setTextureCube(e || $a, i);
}
function _m(a, e, t) {
  const n = this.cache, i = t.allocateTextureUnit();
  n[0] !== i && (a.uniform1i(this.addr, i), n[0] = i), t.setTexture2DArray(e || ja, i);
}
function vm(a) {
  switch (a) {
    case 5126:
      return Qp;
    case 35664:
      return em;
    case 35665:
      return tm;
    case 35666:
      return nm;
    case 35674:
      return im;
    case 35675:
      return sm;
    case 35676:
      return rm;
    case 5124:
    case 35670:
      return om;
    case 35667:
    case 35671:
      return am;
    case 35668:
    case 35672:
      return lm;
    case 35669:
    case 35673:
      return cm;
    case 5125:
      return hm;
    case 36294:
      return um;
    case 36295:
      return dm;
    case 36296:
      return fm;
    case 35678:
    case 36198:
    case 36298:
    case 36306:
    case 35682:
      return pm;
    case 35679:
    case 36299:
    case 36307:
      return mm;
    case 35680:
    case 36300:
    case 36308:
    case 36293:
      return gm;
    case 36289:
    case 36303:
    case 36311:
    case 36292:
      return _m;
  }
}
function xm(a, e) {
  a.uniform1fv(this.addr, e);
}
function Mm(a, e) {
  const t = vi(e, this.size, 2);
  a.uniform2fv(this.addr, t);
}
function ym(a, e) {
  const t = vi(e, this.size, 3);
  a.uniform3fv(this.addr, t);
}
function Sm(a, e) {
  const t = vi(e, this.size, 4);
  a.uniform4fv(this.addr, t);
}
function wm(a, e) {
  const t = vi(e, this.size, 4);
  a.uniformMatrix2fv(this.addr, !1, t);
}
function bm(a, e) {
  const t = vi(e, this.size, 9);
  a.uniformMatrix3fv(this.addr, !1, t);
}
function Em(a, e) {
  const t = vi(e, this.size, 16);
  a.uniformMatrix4fv(this.addr, !1, t);
}
function Tm(a, e) {
  a.uniform1iv(this.addr, e);
}
function Am(a, e) {
  a.uniform2iv(this.addr, e);
}
function Cm(a, e) {
  a.uniform3iv(this.addr, e);
}
function Lm(a, e) {
  a.uniform4iv(this.addr, e);
}
function Pm(a, e) {
  a.uniform1uiv(this.addr, e);
}
function Rm(a, e) {
  a.uniform2uiv(this.addr, e);
}
function Dm(a, e) {
  a.uniform3uiv(this.addr, e);
}
function Im(a, e) {
  a.uniform4uiv(this.addr, e);
}
function Um(a, e, t) {
  const n = this.cache, i = e.length, s = xs(t, i);
  it(n, s) || (a.uniform1iv(this.addr, s), st(n, s));
  for (let r = 0; r !== i; ++r)
    t.setTexture2D(e[r] || Xa, s[r]);
}
function Nm(a, e, t) {
  const n = this.cache, i = e.length, s = xs(t, i);
  it(n, s) || (a.uniform1iv(this.addr, s), st(n, s));
  for (let r = 0; r !== i; ++r)
    t.setTexture3D(e[r] || Ya, s[r]);
}
function zm(a, e, t) {
  const n = this.cache, i = e.length, s = xs(t, i);
  it(n, s) || (a.uniform1iv(this.addr, s), st(n, s));
  for (let r = 0; r !== i; ++r)
    t.setTextureCube(e[r] || $a, s[r]);
}
function Fm(a, e, t) {
  const n = this.cache, i = e.length, s = xs(t, i);
  it(n, s) || (a.uniform1iv(this.addr, s), st(n, s));
  for (let r = 0; r !== i; ++r)
    t.setTexture2DArray(e[r] || ja, s[r]);
}
function Om(a) {
  switch (a) {
    case 5126:
      return xm;
    case 35664:
      return Mm;
    case 35665:
      return ym;
    case 35666:
      return Sm;
    case 35674:
      return wm;
    case 35675:
      return bm;
    case 35676:
      return Em;
    case 5124:
    case 35670:
      return Tm;
    case 35667:
    case 35671:
      return Am;
    case 35668:
    case 35672:
      return Cm;
    case 35669:
    case 35673:
      return Lm;
    case 5125:
      return Pm;
    case 36294:
      return Rm;
    case 36295:
      return Dm;
    case 36296:
      return Im;
    case 35678:
    case 36198:
    case 36298:
    case 36306:
    case 35682:
      return Um;
    case 35679:
    case 36299:
    case 36307:
      return Nm;
    case 35680:
    case 36300:
    case 36308:
    case 36293:
      return zm;
    case 36289:
    case 36303:
    case 36311:
    case 36292:
      return Fm;
  }
}
class Bm {
  constructor(e, t, n) {
    this.id = e, this.addr = n, this.cache = [], this.setValue = vm(t.type);
  }
}
class Gm {
  constructor(e, t, n) {
    this.id = e, this.addr = n, this.cache = [], this.size = t.size, this.setValue = Om(t.type);
  }
}
class Vm {
  constructor(e) {
    this.id = e, this.seq = [], this.map = {};
  }
  setValue(e, t, n) {
    const i = this.seq;
    for (let s = 0, r = i.length; s !== r; ++s) {
      const o = i[s];
      o.setValue(e, t[o.id], n);
    }
  }
}
const rr = /(\w+)(\])?(\[|\.)?/g;
function ta(a, e) {
  a.seq.push(e), a.map[e.id] = e;
}
function km(a, e, t) {
  const n = a.name, i = n.length;
  for (rr.lastIndex = 0; ; ) {
    const s = rr.exec(n), r = rr.lastIndex;
    let o = s[1];
    const c = s[2] === "]", l = s[3];
    if (c && (o = o | 0), l === void 0 || l === "[" && r + 2 === i) {
      ta(t, l === void 0 ? new Bm(o, a, e) : new Gm(o, a, e));
      break;
    } else {
      let d = t.map[o];
      d === void 0 && (d = new Vm(o), ta(t, d)), t = d;
    }
  }
}
class ds {
  constructor(e, t) {
    this.seq = [], this.map = {};
    const n = e.getProgramParameter(t, 35718);
    for (let i = 0; i < n; ++i) {
      const s = e.getActiveUniform(t, i), r = e.getUniformLocation(t, s.name);
      km(s, r, this);
    }
  }
  setValue(e, t, n, i) {
    const s = this.map[t];
    s !== void 0 && s.setValue(e, n, i);
  }
  setOptional(e, t, n) {
    const i = t[n];
    i !== void 0 && this.setValue(e, n, i);
  }
  static upload(e, t, n, i) {
    for (let s = 0, r = t.length; s !== r; ++s) {
      const o = t[s], c = n[o.id];
      c.needsUpdate !== !1 && o.setValue(e, c.value, i);
    }
  }
  static seqWithValue(e, t) {
    const n = [];
    for (let i = 0, s = e.length; i !== s; ++i) {
      const r = e[i];
      r.id in t && n.push(r);
    }
    return n;
  }
}
function na(a, e, t) {
  const n = a.createShader(e);
  return a.shaderSource(n, t), a.compileShader(n), n;
}
let Hm = 0;
function Wm(a, e) {
  const t = a.split(`
`), n = [], i = Math.max(e - 6, 0), s = Math.min(e + 6, t.length);
  for (let r = i; r < s; r++) {
    const o = r + 1;
    n.push(`${o === e ? ">" : " "} ${o}: ${t[r]}`);
  }
  return n.join(`
`);
}
function qm(a) {
  switch (a) {
    case Vn:
      return ["Linear", "( value )"];
    case Xe:
      return ["sRGB", "( value )"];
    default:
      return console.warn("THREE.WebGLProgram: Unsupported encoding:", a), ["Linear", "( value )"];
  }
}
function ia(a, e, t) {
  const n = a.getShaderParameter(e, 35713), i = a.getShaderInfoLog(e).trim();
  if (n && i === "")
    return "";
  const s = /ERROR: 0:(\d+)/.exec(i);
  if (s) {
    const r = parseInt(s[1]);
    return t.toUpperCase() + `

` + i + `

` + Wm(a.getShaderSource(e), r);
  } else
    return i;
}
function Xm(a, e) {
  const t = qm(e);
  return "vec4 " + a + "( vec4 value ) { return LinearTo" + t[0] + t[1] + "; }";
}
function jm(a, e) {
  let t;
  switch (e) {
    case ou:
      t = "Linear";
      break;
    case au:
      t = "Reinhard";
      break;
    case lu:
      t = "OptimizedCineon";
      break;
    case cu:
      t = "ACESFilmic";
      break;
    case hu:
      t = "Custom";
      break;
    default:
      console.warn("THREE.WebGLProgram: Unsupported toneMapping:", e), t = "Linear";
  }
  return "vec3 " + a + "( vec3 color ) { return " + t + "ToneMapping( color ); }";
}
function Ym(a) {
  return [
    a.extensionDerivatives || a.envMapCubeUVHeight || a.bumpMap || a.normalMapTangentSpace || a.clearcoatNormalMap || a.flatShading || a.shaderID === "physical" ? "#extension GL_OES_standard_derivatives : enable" : "",
    (a.extensionFragDepth || a.logarithmicDepthBuffer) && a.rendererExtensionFragDepth ? "#extension GL_EXT_frag_depth : enable" : "",
    a.extensionDrawBuffers && a.rendererExtensionDrawBuffers ? "#extension GL_EXT_draw_buffers : require" : "",
    (a.extensionShaderTextureLOD || a.envMap || a.transmission) && a.rendererExtensionShaderTextureLod ? "#extension GL_EXT_shader_texture_lod : enable" : ""
  ].filter(Li).join(`
`);
}
function $m(a) {
  const e = [];
  for (const t in a) {
    const n = a[t];
    n !== !1 && e.push("#define " + t + " " + n);
  }
  return e.join(`
`);
}
function Zm(a, e) {
  const t = {}, n = a.getProgramParameter(e, 35721);
  for (let i = 0; i < n; i++) {
    const s = a.getActiveAttrib(e, i), r = s.name;
    let o = 1;
    s.type === 35674 && (o = 2), s.type === 35675 && (o = 3), s.type === 35676 && (o = 4), t[r] = {
      type: s.type,
      location: a.getAttribLocation(e, r),
      locationSize: o
    };
  }
  return t;
}
function Li(a) {
  return a !== "";
}
function sa(a, e) {
  const t = e.numSpotLightShadows + e.numSpotLightMaps - e.numSpotLightShadowsWithMaps;
  return a.replace(/NUM_DIR_LIGHTS/g, e.numDirLights).replace(/NUM_SPOT_LIGHTS/g, e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g, e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g, t).replace(/NUM_RECT_AREA_LIGHTS/g, e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g, e.numPointLights).replace(/NUM_HEMI_LIGHTS/g, e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g, e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g, e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g, e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g, e.numPointLightShadows);
}
function ra(a, e) {
  return a.replace(/NUM_CLIPPING_PLANES/g, e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g, e.numClippingPlanes - e.numClipIntersection);
}
const Km = /^[ \t]*#include +<([\w\d./]+)>/gm;
function mr(a) {
  return a.replace(Km, Jm);
}
function Jm(a, e) {
  const t = Ce[e];
  if (t === void 0)
    throw new Error("Can not resolve #include <" + e + ">");
  return mr(t);
}
const Qm = /#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;
function oa(a) {
  return a.replace(Qm, eg);
}
function eg(a, e, t, n) {
  let i = "";
  for (let s = parseInt(e); s < parseInt(t); s++)
    i += n.replace(/\[\s*i\s*\]/g, "[ " + s + " ]").replace(/UNROLLED_LOOP_INDEX/g, s);
  return i;
}
function aa(a) {
  let e = "precision " + a.precision + ` float;
precision ` + a.precision + " int;";
  return a.precision === "highp" ? e += `
#define HIGH_PRECISION` : a.precision === "mediump" ? e += `
#define MEDIUM_PRECISION` : a.precision === "lowp" && (e += `
#define LOW_PRECISION`), e;
}
function tg(a) {
  let e = "SHADOWMAP_TYPE_BASIC";
  return a.shadowMapType === Ea ? e = "SHADOWMAP_TYPE_PCF" : a.shadowMapType === Oh ? e = "SHADOWMAP_TYPE_PCF_SOFT" : a.shadowMapType === Ci && (e = "SHADOWMAP_TYPE_VSM"), e;
}
function ng(a) {
  let e = "ENVMAP_TYPE_CUBE";
  if (a.envMap)
    switch (a.envMapMode) {
      case ui:
      case di:
        e = "ENVMAP_TYPE_CUBE";
        break;
      case _s:
        e = "ENVMAP_TYPE_CUBE_UV";
        break;
    }
  return e;
}
function ig(a) {
  let e = "ENVMAP_MODE_REFLECTION";
  if (a.envMap)
    switch (a.envMapMode) {
      case di:
        e = "ENVMAP_MODE_REFRACTION";
        break;
    }
  return e;
}
function sg(a) {
  let e = "ENVMAP_BLENDING_NONE";
  if (a.envMap)
    switch (a.combine) {
      case Ca:
        e = "ENVMAP_BLENDING_MULTIPLY";
        break;
      case su:
        e = "ENVMAP_BLENDING_MIX";
        break;
      case ru:
        e = "ENVMAP_BLENDING_ADD";
        break;
    }
  return e;
}
function rg(a) {
  const e = a.envMapCubeUVHeight;
  if (e === null)
    return null;
  const t = Math.log2(e) - 2, n = 1 / e;
  return { texelWidth: 1 / (3 * Math.max(Math.pow(2, t), 7 * 16)), texelHeight: n, maxMip: t };
}
function og(a, e, t, n) {
  const i = a.getContext(), s = t.defines;
  let r = t.vertexShader, o = t.fragmentShader;
  const c = tg(t), l = ng(t), h = ig(t), d = sg(t), u = rg(t), p = t.isWebGL2 ? "" : Ym(t), g = $m(s), _ = i.createProgram();
  let m, f, v = t.glslVersion ? "#version " + t.glslVersion + `
` : "";
  t.isRawShaderMaterial ? (m = [
    g
  ].filter(Li).join(`
`), m.length > 0 && (m += `
`), f = [
    p,
    g
  ].filter(Li).join(`
`), f.length > 0 && (f += `
`)) : (m = [
    aa(t),
    "#define SHADER_NAME " + t.shaderName,
    g,
    t.instancing ? "#define USE_INSTANCING" : "",
    t.instancingColor ? "#define USE_INSTANCING_COLOR" : "",
    t.useFog && t.fog ? "#define USE_FOG" : "",
    t.useFog && t.fogExp2 ? "#define FOG_EXP2" : "",
    t.map ? "#define USE_MAP" : "",
    t.envMap ? "#define USE_ENVMAP" : "",
    t.envMap ? "#define " + h : "",
    t.lightMap ? "#define USE_LIGHTMAP" : "",
    t.aoMap ? "#define USE_AOMAP" : "",
    t.bumpMap ? "#define USE_BUMPMAP" : "",
    t.normalMap ? "#define USE_NORMALMAP" : "",
    t.normalMapObjectSpace ? "#define USE_NORMALMAP_OBJECTSPACE" : "",
    t.normalMapTangentSpace ? "#define USE_NORMALMAP_TANGENTSPACE" : "",
    t.displacementMap ? "#define USE_DISPLACEMENTMAP" : "",
    t.emissiveMap ? "#define USE_EMISSIVEMAP" : "",
    t.clearcoatMap ? "#define USE_CLEARCOATMAP" : "",
    t.clearcoatRoughnessMap ? "#define USE_CLEARCOAT_ROUGHNESSMAP" : "",
    t.clearcoatNormalMap ? "#define USE_CLEARCOAT_NORMALMAP" : "",
    t.iridescenceMap ? "#define USE_IRIDESCENCEMAP" : "",
    t.iridescenceThicknessMap ? "#define USE_IRIDESCENCE_THICKNESSMAP" : "",
    t.specularMap ? "#define USE_SPECULARMAP" : "",
    t.specularColorMap ? "#define USE_SPECULAR_COLORMAP" : "",
    t.specularIntensityMap ? "#define USE_SPECULAR_INTENSITYMAP" : "",
    t.roughnessMap ? "#define USE_ROUGHNESSMAP" : "",
    t.metalnessMap ? "#define USE_METALNESSMAP" : "",
    t.alphaMap ? "#define USE_ALPHAMAP" : "",
    t.transmission ? "#define USE_TRANSMISSION" : "",
    t.transmissionMap ? "#define USE_TRANSMISSIONMAP" : "",
    t.thicknessMap ? "#define USE_THICKNESSMAP" : "",
    t.sheenColorMap ? "#define USE_SHEEN_COLORMAP" : "",
    t.sheenRoughnessMap ? "#define USE_SHEEN_ROUGHNESSMAP" : "",
    //
    t.mapUv ? "#define MAP_UV " + t.mapUv : "",
    t.alphaMapUv ? "#define ALPHAMAP_UV " + t.alphaMapUv : "",
    t.lightMapUv ? "#define LIGHTMAP_UV " + t.lightMapUv : "",
    t.aoMapUv ? "#define AOMAP_UV " + t.aoMapUv : "",
    t.emissiveMapUv ? "#define EMISSIVEMAP_UV " + t.emissiveMapUv : "",
    t.bumpMapUv ? "#define BUMPMAP_UV " + t.bumpMapUv : "",
    t.normalMapUv ? "#define NORMALMAP_UV " + t.normalMapUv : "",
    t.displacementMapUv ? "#define DISPLACEMENTMAP_UV " + t.displacementMapUv : "",
    t.metalnessMapUv ? "#define METALNESSMAP_UV " + t.metalnessMapUv : "",
    t.roughnessMapUv ? "#define ROUGHNESSMAP_UV " + t.roughnessMapUv : "",
    t.clearcoatMapUv ? "#define CLEARCOATMAP_UV " + t.clearcoatMapUv : "",
    t.clearcoatNormalMapUv ? "#define CLEARCOAT_NORMALMAP_UV " + t.clearcoatNormalMapUv : "",
    t.clearcoatRoughnessMapUv ? "#define CLEARCOAT_ROUGHNESSMAP_UV " + t.clearcoatRoughnessMapUv : "",
    t.iridescenceMapUv ? "#define IRIDESCENCEMAP_UV " + t.iridescenceMapUv : "",
    t.iridescenceThicknessMapUv ? "#define IRIDESCENCE_THICKNESSMAP_UV " + t.iridescenceThicknessMapUv : "",
    t.sheenColorMapUv ? "#define SHEEN_COLORMAP_UV " + t.sheenColorMapUv : "",
    t.sheenRoughnessMapUv ? "#define SHEEN_ROUGHNESSMAP_UV " + t.sheenRoughnessMapUv : "",
    t.specularMapUv ? "#define SPECULARMAP_UV " + t.specularMapUv : "",
    t.specularColorMapUv ? "#define SPECULAR_COLORMAP_UV " + t.specularColorMapUv : "",
    t.specularIntensityMapUv ? "#define SPECULAR_INTENSITYMAP_UV " + t.specularIntensityMapUv : "",
    t.transmissionMapUv ? "#define TRANSMISSIONMAP_UV " + t.transmissionMapUv : "",
    t.thicknessMapUv ? "#define THICKNESSMAP_UV " + t.thicknessMapUv : "",
    //
    t.vertexTangents ? "#define USE_TANGENT" : "",
    t.vertexColors ? "#define USE_COLOR" : "",
    t.vertexAlphas ? "#define USE_COLOR_ALPHA" : "",
    t.vertexUvs2 ? "#define USE_UV2" : "",
    t.pointsUvs ? "#define USE_POINTS_UV" : "",
    t.flatShading ? "#define FLAT_SHADED" : "",
    t.skinning ? "#define USE_SKINNING" : "",
    t.morphTargets ? "#define USE_MORPHTARGETS" : "",
    t.morphNormals && t.flatShading === !1 ? "#define USE_MORPHNORMALS" : "",
    t.morphColors && t.isWebGL2 ? "#define USE_MORPHCOLORS" : "",
    t.morphTargetsCount > 0 && t.isWebGL2 ? "#define MORPHTARGETS_TEXTURE" : "",
    t.morphTargetsCount > 0 && t.isWebGL2 ? "#define MORPHTARGETS_TEXTURE_STRIDE " + t.morphTextureStride : "",
    t.morphTargetsCount > 0 && t.isWebGL2 ? "#define MORPHTARGETS_COUNT " + t.morphTargetsCount : "",
    t.doubleSided ? "#define DOUBLE_SIDED" : "",
    t.flipSided ? "#define FLIP_SIDED" : "",
    t.shadowMapEnabled ? "#define USE_SHADOWMAP" : "",
    t.shadowMapEnabled ? "#define " + c : "",
    t.sizeAttenuation ? "#define USE_SIZEATTENUATION" : "",
    t.logarithmicDepthBuffer ? "#define USE_LOGDEPTHBUF" : "",
    t.logarithmicDepthBuffer && t.rendererExtensionFragDepth ? "#define USE_LOGDEPTHBUF_EXT" : "",
    "uniform mat4 modelMatrix;",
    "uniform mat4 modelViewMatrix;",
    "uniform mat4 projectionMatrix;",
    "uniform mat4 viewMatrix;",
    "uniform mat3 normalMatrix;",
    "uniform vec3 cameraPosition;",
    "uniform bool isOrthographic;",
    "#ifdef USE_INSTANCING",
    "	attribute mat4 instanceMatrix;",
    "#endif",
    "#ifdef USE_INSTANCING_COLOR",
    "	attribute vec3 instanceColor;",
    "#endif",
    "attribute vec3 position;",
    "attribute vec3 normal;",
    "attribute vec2 uv;",
    "#ifdef USE_TANGENT",
    "	attribute vec4 tangent;",
    "#endif",
    "#if defined( USE_COLOR_ALPHA )",
    "	attribute vec4 color;",
    "#elif defined( USE_COLOR )",
    "	attribute vec3 color;",
    "#endif",
    "#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )",
    "	attribute vec3 morphTarget0;",
    "	attribute vec3 morphTarget1;",
    "	attribute vec3 morphTarget2;",
    "	attribute vec3 morphTarget3;",
    "	#ifdef USE_MORPHNORMALS",
    "		attribute vec3 morphNormal0;",
    "		attribute vec3 morphNormal1;",
    "		attribute vec3 morphNormal2;",
    "		attribute vec3 morphNormal3;",
    "	#else",
    "		attribute vec3 morphTarget4;",
    "		attribute vec3 morphTarget5;",
    "		attribute vec3 morphTarget6;",
    "		attribute vec3 morphTarget7;",
    "	#endif",
    "#endif",
    "#ifdef USE_SKINNING",
    "	attribute vec4 skinIndex;",
    "	attribute vec4 skinWeight;",
    "#endif",
    `
`
  ].filter(Li).join(`
`), f = [
    p,
    aa(t),
    "#define SHADER_NAME " + t.shaderName,
    g,
    t.useFog && t.fog ? "#define USE_FOG" : "",
    t.useFog && t.fogExp2 ? "#define FOG_EXP2" : "",
    t.map ? "#define USE_MAP" : "",
    t.matcap ? "#define USE_MATCAP" : "",
    t.envMap ? "#define USE_ENVMAP" : "",
    t.envMap ? "#define " + l : "",
    t.envMap ? "#define " + h : "",
    t.envMap ? "#define " + d : "",
    u ? "#define CUBEUV_TEXEL_WIDTH " + u.texelWidth : "",
    u ? "#define CUBEUV_TEXEL_HEIGHT " + u.texelHeight : "",
    u ? "#define CUBEUV_MAX_MIP " + u.maxMip + ".0" : "",
    t.lightMap ? "#define USE_LIGHTMAP" : "",
    t.aoMap ? "#define USE_AOMAP" : "",
    t.bumpMap ? "#define USE_BUMPMAP" : "",
    t.normalMap ? "#define USE_NORMALMAP" : "",
    t.normalMapObjectSpace ? "#define USE_NORMALMAP_OBJECTSPACE" : "",
    t.normalMapTangentSpace ? "#define USE_NORMALMAP_TANGENTSPACE" : "",
    t.emissiveMap ? "#define USE_EMISSIVEMAP" : "",
    t.clearcoat ? "#define USE_CLEARCOAT" : "",
    t.clearcoatMap ? "#define USE_CLEARCOATMAP" : "",
    t.clearcoatRoughnessMap ? "#define USE_CLEARCOAT_ROUGHNESSMAP" : "",
    t.clearcoatNormalMap ? "#define USE_CLEARCOAT_NORMALMAP" : "",
    t.iridescence ? "#define USE_IRIDESCENCE" : "",
    t.iridescenceMap ? "#define USE_IRIDESCENCEMAP" : "",
    t.iridescenceThicknessMap ? "#define USE_IRIDESCENCE_THICKNESSMAP" : "",
    t.specularMap ? "#define USE_SPECULARMAP" : "",
    t.specularColorMap ? "#define USE_SPECULAR_COLORMAP" : "",
    t.specularIntensityMap ? "#define USE_SPECULAR_INTENSITYMAP" : "",
    t.roughnessMap ? "#define USE_ROUGHNESSMAP" : "",
    t.metalnessMap ? "#define USE_METALNESSMAP" : "",
    t.alphaMap ? "#define USE_ALPHAMAP" : "",
    t.alphaTest ? "#define USE_ALPHATEST" : "",
    t.sheen ? "#define USE_SHEEN" : "",
    t.sheenColorMap ? "#define USE_SHEEN_COLORMAP" : "",
    t.sheenRoughnessMap ? "#define USE_SHEEN_ROUGHNESSMAP" : "",
    t.transmission ? "#define USE_TRANSMISSION" : "",
    t.transmissionMap ? "#define USE_TRANSMISSIONMAP" : "",
    t.thicknessMap ? "#define USE_THICKNESSMAP" : "",
    t.decodeVideoTexture ? "#define DECODE_VIDEO_TEXTURE" : "",
    t.vertexTangents ? "#define USE_TANGENT" : "",
    t.vertexColors || t.instancingColor ? "#define USE_COLOR" : "",
    t.vertexAlphas ? "#define USE_COLOR_ALPHA" : "",
    t.vertexUvs2 ? "#define USE_UV2" : "",
    t.pointsUvs ? "#define USE_POINTS_UV" : "",
    t.gradientMap ? "#define USE_GRADIENTMAP" : "",
    t.flatShading ? "#define FLAT_SHADED" : "",
    t.doubleSided ? "#define DOUBLE_SIDED" : "",
    t.flipSided ? "#define FLIP_SIDED" : "",
    t.shadowMapEnabled ? "#define USE_SHADOWMAP" : "",
    t.shadowMapEnabled ? "#define " + c : "",
    t.premultipliedAlpha ? "#define PREMULTIPLIED_ALPHA" : "",
    t.useLegacyLights ? "#define LEGACY_LIGHTS" : "",
    t.logarithmicDepthBuffer ? "#define USE_LOGDEPTHBUF" : "",
    t.logarithmicDepthBuffer && t.rendererExtensionFragDepth ? "#define USE_LOGDEPTHBUF_EXT" : "",
    "uniform mat4 viewMatrix;",
    "uniform vec3 cameraPosition;",
    "uniform bool isOrthographic;",
    t.toneMapping !== pn ? "#define TONE_MAPPING" : "",
    t.toneMapping !== pn ? Ce.tonemapping_pars_fragment : "",
    // this code is required here because it is used by the toneMapping() function defined below
    t.toneMapping !== pn ? jm("toneMapping", t.toneMapping) : "",
    t.dithering ? "#define DITHERING" : "",
    t.opaque ? "#define OPAQUE" : "",
    Ce.encodings_pars_fragment,
    // this code is required here because it is used by the various encoding/decoding function defined below
    Xm("linearToOutputTexel", t.outputEncoding),
    t.useDepthPacking ? "#define DEPTH_PACKING " + t.depthPacking : "",
    `
`
  ].filter(Li).join(`
`)), r = mr(r), r = sa(r, t), r = ra(r, t), o = mr(o), o = sa(o, t), o = ra(o, t), r = oa(r), o = oa(o), t.isWebGL2 && t.isRawShaderMaterial !== !0 && (v = `#version 300 es
`, m = [
    "precision mediump sampler2DArray;",
    "#define attribute in",
    "#define varying out",
    "#define texture2D texture"
  ].join(`
`) + `
` + m, f = [
    "#define varying in",
    t.glslVersion === Ao ? "" : "layout(location = 0) out highp vec4 pc_fragColor;",
    t.glslVersion === Ao ? "" : "#define gl_FragColor pc_fragColor",
    "#define gl_FragDepthEXT gl_FragDepth",
    "#define texture2D texture",
    "#define textureCube texture",
    "#define texture2DProj textureProj",
    "#define texture2DLodEXT textureLod",
    "#define texture2DProjLodEXT textureProjLod",
    "#define textureCubeLodEXT textureLod",
    "#define texture2DGradEXT textureGrad",
    "#define texture2DProjGradEXT textureProjGrad",
    "#define textureCubeGradEXT textureGrad"
  ].join(`
`) + `
` + f);
  const M = v + m + r, y = v + f + o, w = na(i, 35633, M), C = na(i, 35632, y);
  if (i.attachShader(_, w), i.attachShader(_, C), t.index0AttributeName !== void 0 ? i.bindAttribLocation(_, 0, t.index0AttributeName) : t.morphTargets === !0 && i.bindAttribLocation(_, 0, "position"), i.linkProgram(_), a.debug.checkShaderErrors) {
    const S = i.getProgramInfoLog(_).trim(), T = i.getShaderInfoLog(w).trim(), O = i.getShaderInfoLog(C).trim();
    let k = !0, L = !0;
    if (i.getProgramParameter(_, 35714) === !1)
      if (k = !1, typeof a.debug.onShaderError == "function")
        a.debug.onShaderError(i, _, w, C);
      else {
        const R = ia(i, w, "vertex"), D = ia(i, C, "fragment");
        console.error(
          "THREE.WebGLProgram: Shader Error " + i.getError() + " - VALIDATE_STATUS " + i.getProgramParameter(_, 35715) + `

Program Info Log: ` + S + `
` + R + `
` + D
        );
      }
    else
      S !== "" ? console.warn("THREE.WebGLProgram: Program Info Log:", S) : (T === "" || O === "") && (L = !1);
    L && (this.diagnostics = {
      runnable: k,
      programLog: S,
      vertexShader: {
        log: T,
        prefix: m
      },
      fragmentShader: {
        log: O,
        prefix: f
      }
    });
  }
  i.deleteShader(w), i.deleteShader(C);
  let P;
  this.getUniforms = function() {
    return P === void 0 && (P = new ds(i, _)), P;
  };
  let I;
  return this.getAttributes = function() {
    return I === void 0 && (I = Zm(i, _)), I;
  }, this.destroy = function() {
    n.releaseStatesOfProgram(this), i.deleteProgram(_), this.program = void 0;
  }, this.name = t.shaderName, this.id = Hm++, this.cacheKey = e, this.usedTimes = 1, this.program = _, this.vertexShader = w, this.fragmentShader = C, this;
}
let ag = 0;
class lg {
  constructor() {
    this.shaderCache = /* @__PURE__ */ new Map(), this.materialCache = /* @__PURE__ */ new Map();
  }
  update(e) {
    const t = e.vertexShader, n = e.fragmentShader, i = this._getShaderStage(t), s = this._getShaderStage(n), r = this._getShaderCacheForMaterial(e);
    return r.has(i) === !1 && (r.add(i), i.usedTimes++), r.has(s) === !1 && (r.add(s), s.usedTimes++), this;
  }
  remove(e) {
    const t = this.materialCache.get(e);
    for (const n of t)
      n.usedTimes--, n.usedTimes === 0 && this.shaderCache.delete(n.code);
    return this.materialCache.delete(e), this;
  }
  getVertexShaderID(e) {
    return this._getShaderStage(e.vertexShader).id;
  }
  getFragmentShaderID(e) {
    return this._getShaderStage(e.fragmentShader).id;
  }
  dispose() {
    this.shaderCache.clear(), this.materialCache.clear();
  }
  _getShaderCacheForMaterial(e) {
    const t = this.materialCache;
    let n = t.get(e);
    return n === void 0 && (n = /* @__PURE__ */ new Set(), t.set(e, n)), n;
  }
  _getShaderStage(e) {
    const t = this.shaderCache;
    let n = t.get(e);
    return n === void 0 && (n = new cg(e), t.set(e, n)), n;
  }
}
class cg {
  constructor(e) {
    this.id = ag++, this.code = e, this.usedTimes = 0;
  }
}
function hg(a, e, t, n, i, s, r) {
  const o = new za(), c = new lg(), l = [], h = i.isWebGL2, d = i.logarithmicDepthBuffer, u = i.vertexTextures;
  let p = i.precision;
  const g = {
    MeshDepthMaterial: "depth",
    MeshDistanceMaterial: "distanceRGBA",
    MeshNormalMaterial: "normal",
    MeshBasicMaterial: "basic",
    MeshLambertMaterial: "lambert",
    MeshPhongMaterial: "phong",
    MeshToonMaterial: "toon",
    MeshStandardMaterial: "physical",
    MeshPhysicalMaterial: "physical",
    MeshMatcapMaterial: "matcap",
    LineBasicMaterial: "basic",
    LineDashedMaterial: "dashed",
    PointsMaterial: "points",
    ShadowMaterial: "shadow",
    SpriteMaterial: "sprite"
  };
  function _(S) {
    return S === 1 ? "uv2" : "uv";
  }
  function m(S, T, O, k, L) {
    const R = k.fog, D = L.geometry, N = S.isMeshStandardMaterial ? k.environment : null, K = (S.isMeshStandardMaterial ? t : e).get(S.envMap || N), B = K && K.mapping === _s ? K.image.height : null, H = g[S.type];
    S.precision !== null && (p = i.getMaxPrecision(S.precision), p !== S.precision && console.warn("THREE.WebGLProgram.getParameters:", S.precision, "not supported, using", p, "instead."));
    const Q = D.morphAttributes.position || D.morphAttributes.normal || D.morphAttributes.color, ce = Q !== void 0 ? Q.length : 0;
    let Z = 0;
    D.morphAttributes.position !== void 0 && (Z = 1), D.morphAttributes.normal !== void 0 && (Z = 2), D.morphAttributes.color !== void 0 && (Z = 3);
    let W, J, se, oe;
    if (H) {
      const le = Zt[H];
      W = le.vertexShader, J = le.fragmentShader;
    } else
      W = S.vertexShader, J = S.fragmentShader, c.update(S), se = c.getVertexShaderID(S), oe = c.getFragmentShaderID(S);
    const V = a.getRenderTarget(), Te = L.isInstancedMesh === !0, be = !!S.map, re = !!S.matcap, ye = !!K, Be = !!S.aoMap, _e = !!S.lightMap, Re = !!S.bumpMap, rt = !!S.normalMap, ct = !!S.displacementMap, ot = !!S.emissiveMap, Qe = !!S.metalnessMap, Ge = !!S.roughnessMap, Ye = S.clearcoat > 0, vt = S.iridescence > 0, A = S.sheen > 0, b = S.transmission > 0, q = Ye && !!S.clearcoatMap, te = Ye && !!S.clearcoatNormalMap, ne = Ye && !!S.clearcoatRoughnessMap, ae = vt && !!S.iridescenceMap, Se = vt && !!S.iridescenceThicknessMap, de = A && !!S.sheenColorMap, Y = A && !!S.sheenRoughnessMap, pe = !!S.specularMap, ve = !!S.specularColorMap, Me = !!S.specularIntensityMap, ue = b && !!S.transmissionMap, me = b && !!S.thicknessMap, Ue = !!S.gradientMap, Ve = !!S.alphaMap, $e = S.alphaTest > 0, U = !!S.extensions, j = !!D.attributes.uv2;
    return {
      isWebGL2: h,
      shaderID: H,
      shaderName: S.type,
      vertexShader: W,
      fragmentShader: J,
      defines: S.defines,
      customVertexShaderID: se,
      customFragmentShaderID: oe,
      isRawShaderMaterial: S.isRawShaderMaterial === !0,
      glslVersion: S.glslVersion,
      precision: p,
      instancing: Te,
      instancingColor: Te && L.instanceColor !== null,
      supportsVertexTextures: u,
      outputEncoding: V === null ? a.outputEncoding : V.isXRRenderTarget === !0 ? V.texture.encoding : Vn,
      map: be,
      matcap: re,
      envMap: ye,
      envMapMode: ye && K.mapping,
      envMapCubeUVHeight: B,
      aoMap: Be,
      lightMap: _e,
      bumpMap: Re,
      normalMap: rt,
      displacementMap: u && ct,
      emissiveMap: ot,
      normalMapObjectSpace: rt && S.normalMapType === Lu,
      normalMapTangentSpace: rt && S.normalMapType === Mr,
      decodeVideoTexture: be && S.map.isVideoTexture === !0 && S.map.encoding === Xe,
      metalnessMap: Qe,
      roughnessMap: Ge,
      clearcoat: Ye,
      clearcoatMap: q,
      clearcoatNormalMap: te,
      clearcoatRoughnessMap: ne,
      iridescence: vt,
      iridescenceMap: ae,
      iridescenceThicknessMap: Se,
      sheen: A,
      sheenColorMap: de,
      sheenRoughnessMap: Y,
      specularMap: pe,
      specularColorMap: ve,
      specularIntensityMap: Me,
      transmission: b,
      transmissionMap: ue,
      thicknessMap: me,
      gradientMap: Ue,
      opaque: S.transparent === !1 && S.blending === li,
      alphaMap: Ve,
      alphaTest: $e,
      combine: S.combine,
      //
      mapUv: be && _(S.map.channel),
      aoMapUv: Be && _(S.aoMap.channel),
      lightMapUv: _e && _(S.lightMap.channel),
      bumpMapUv: Re && _(S.bumpMap.channel),
      normalMapUv: rt && _(S.normalMap.channel),
      displacementMapUv: ct && _(S.displacementMap.channel),
      emissiveMapUv: ot && _(S.emissiveMap.channel),
      metalnessMapUv: Qe && _(S.metalnessMap.channel),
      roughnessMapUv: Ge && _(S.roughnessMap.channel),
      clearcoatMapUv: q && _(S.clearcoatMap.channel),
      clearcoatNormalMapUv: te && _(S.clearcoatNormalMap.channel),
      clearcoatRoughnessMapUv: ne && _(S.clearcoatRoughnessMap.channel),
      iridescenceMapUv: ae && _(S.iridescenceMap.channel),
      iridescenceThicknessMapUv: Se && _(S.iridescenceThicknessMap.channel),
      sheenColorMapUv: de && _(S.sheenColorMap.channel),
      sheenRoughnessMapUv: Y && _(S.sheenRoughnessMap.channel),
      specularMapUv: pe && _(S.specularMap.channel),
      specularColorMapUv: ve && _(S.specularColorMap.channel),
      specularIntensityMapUv: Me && _(S.specularIntensityMap.channel),
      transmissionMapUv: ue && _(S.transmissionMap.channel),
      thicknessMapUv: me && _(S.thicknessMap.channel),
      alphaMapUv: Ve && _(S.alphaMap.channel),
      //
      vertexTangents: rt && !!D.attributes.tangent,
      vertexColors: S.vertexColors,
      vertexAlphas: S.vertexColors === !0 && !!D.attributes.color && D.attributes.color.itemSize === 4,
      vertexUvs2: j,
      pointsUvs: L.isPoints === !0 && !!D.attributes.uv && (be || Ve),
      fog: !!R,
      useFog: S.fog === !0,
      fogExp2: R && R.isFogExp2,
      flatShading: S.flatShading === !0,
      sizeAttenuation: S.sizeAttenuation === !0,
      logarithmicDepthBuffer: d,
      skinning: L.isSkinnedMesh === !0,
      morphTargets: D.morphAttributes.position !== void 0,
      morphNormals: D.morphAttributes.normal !== void 0,
      morphColors: D.morphAttributes.color !== void 0,
      morphTargetsCount: ce,
      morphTextureStride: Z,
      numDirLights: T.directional.length,
      numPointLights: T.point.length,
      numSpotLights: T.spot.length,
      numSpotLightMaps: T.spotLightMap.length,
      numRectAreaLights: T.rectArea.length,
      numHemiLights: T.hemi.length,
      numDirLightShadows: T.directionalShadowMap.length,
      numPointLightShadows: T.pointShadowMap.length,
      numSpotLightShadows: T.spotShadowMap.length,
      numSpotLightShadowsWithMaps: T.numSpotLightShadowsWithMaps,
      numClippingPlanes: r.numPlanes,
      numClipIntersection: r.numIntersection,
      dithering: S.dithering,
      shadowMapEnabled: a.shadowMap.enabled && O.length > 0,
      shadowMapType: a.shadowMap.type,
      toneMapping: S.toneMapped ? a.toneMapping : pn,
      useLegacyLights: a.useLegacyLights,
      premultipliedAlpha: S.premultipliedAlpha,
      doubleSided: S.side === fn,
      flipSided: S.side === yt,
      useDepthPacking: S.depthPacking >= 0,
      depthPacking: S.depthPacking || 0,
      index0AttributeName: S.index0AttributeName,
      extensionDerivatives: U && S.extensions.derivatives === !0,
      extensionFragDepth: U && S.extensions.fragDepth === !0,
      extensionDrawBuffers: U && S.extensions.drawBuffers === !0,
      extensionShaderTextureLOD: U && S.extensions.shaderTextureLOD === !0,
      rendererExtensionFragDepth: h || n.has("EXT_frag_depth"),
      rendererExtensionDrawBuffers: h || n.has("WEBGL_draw_buffers"),
      rendererExtensionShaderTextureLod: h || n.has("EXT_shader_texture_lod"),
      customProgramCacheKey: S.customProgramCacheKey()
    };
  }
  function f(S) {
    const T = [];
    if (S.shaderID ? T.push(S.shaderID) : (T.push(S.customVertexShaderID), T.push(S.customFragmentShaderID)), S.defines !== void 0)
      for (const O in S.defines)
        T.push(O), T.push(S.defines[O]);
    return S.isRawShaderMaterial === !1 && (v(T, S), M(T, S), T.push(a.outputEncoding)), T.push(S.customProgramCacheKey), T.join();
  }
  function v(S, T) {
    S.push(T.precision), S.push(T.outputEncoding), S.push(T.envMapMode), S.push(T.envMapCubeUVHeight), S.push(T.mapUv), S.push(T.alphaMapUv), S.push(T.lightMapUv), S.push(T.aoMapUv), S.push(T.bumpMapUv), S.push(T.normalMapUv), S.push(T.displacementMapUv), S.push(T.emissiveMapUv), S.push(T.metalnessMapUv), S.push(T.roughnessMapUv), S.push(T.clearcoatMapUv), S.push(T.clearcoatNormalMapUv), S.push(T.clearcoatRoughnessMapUv), S.push(T.iridescenceMapUv), S.push(T.iridescenceThicknessMapUv), S.push(T.sheenColorMapUv), S.push(T.sheenRoughnessMapUv), S.push(T.specularMapUv), S.push(T.specularColorMapUv), S.push(T.specularIntensityMapUv), S.push(T.transmissionMapUv), S.push(T.thicknessMapUv), S.push(T.combine), S.push(T.fogExp2), S.push(T.sizeAttenuation), S.push(T.morphTargetsCount), S.push(T.morphAttributeCount), S.push(T.numDirLights), S.push(T.numPointLights), S.push(T.numSpotLights), S.push(T.numSpotLightMaps), S.push(T.numHemiLights), S.push(T.numRectAreaLights), S.push(T.numDirLightShadows), S.push(T.numPointLightShadows), S.push(T.numSpotLightShadows), S.push(T.numSpotLightShadowsWithMaps), S.push(T.shadowMapType), S.push(T.toneMapping), S.push(T.numClippingPlanes), S.push(T.numClipIntersection), S.push(T.depthPacking);
  }
  function M(S, T) {
    o.disableAll(), T.isWebGL2 && o.enable(0), T.supportsVertexTextures && o.enable(1), T.instancing && o.enable(2), T.instancingColor && o.enable(3), T.matcap && o.enable(4), T.envMap && o.enable(5), T.normalMapObjectSpace && o.enable(6), T.normalMapTangentSpace && o.enable(7), T.clearcoat && o.enable(8), T.iridescence && o.enable(9), T.alphaTest && o.enable(10), T.vertexColors && o.enable(11), T.vertexAlphas && o.enable(12), T.vertexUvs2 && o.enable(13), T.vertexTangents && o.enable(14), S.push(o.mask), o.disableAll(), T.fog && o.enable(0), T.useFog && o.enable(1), T.flatShading && o.enable(2), T.logarithmicDepthBuffer && o.enable(3), T.skinning && o.enable(4), T.morphTargets && o.enable(5), T.morphNormals && o.enable(6), T.morphColors && o.enable(7), T.premultipliedAlpha && o.enable(8), T.shadowMapEnabled && o.enable(9), T.useLegacyLights && o.enable(10), T.doubleSided && o.enable(11), T.flipSided && o.enable(12), T.useDepthPacking && o.enable(13), T.dithering && o.enable(14), T.transmission && o.enable(15), T.sheen && o.enable(16), T.decodeVideoTexture && o.enable(17), T.opaque && o.enable(18), T.pointsUvs && o.enable(19), S.push(o.mask);
  }
  function y(S) {
    const T = g[S.type];
    let O;
    if (T) {
      const k = Zt[T];
      O = ka.clone(k.uniforms);
    } else
      O = S.uniforms;
    return O;
  }
  function w(S, T) {
    let O;
    for (let k = 0, L = l.length; k < L; k++) {
      const R = l[k];
      if (R.cacheKey === T) {
        O = R, ++O.usedTimes;
        break;
      }
    }
    return O === void 0 && (O = new og(a, T, S, s), l.push(O)), O;
  }
  function C(S) {
    if (--S.usedTimes === 0) {
      const T = l.indexOf(S);
      l[T] = l[l.length - 1], l.pop(), S.destroy();
    }
  }
  function P(S) {
    c.remove(S);
  }
  function I() {
    c.dispose();
  }
  return {
    getParameters: m,
    getProgramCacheKey: f,
    getUniforms: y,
    acquireProgram: w,
    releaseProgram: C,
    releaseShaderCache: P,
    // Exposed for resource monitoring & error feedback via renderer.info:
    programs: l,
    dispose: I
  };
}
function ug() {
  let a = /* @__PURE__ */ new WeakMap();
  function e(s) {
    let r = a.get(s);
    return r === void 0 && (r = {}, a.set(s, r)), r;
  }
  function t(s) {
    a.delete(s);
  }
  function n(s, r, o) {
    a.get(s)[r] = o;
  }
  function i() {
    a = /* @__PURE__ */ new WeakMap();
  }
  return {
    get: e,
    remove: t,
    update: n,
    dispose: i
  };
}
function dg(a, e) {
  return a.groupOrder !== e.groupOrder ? a.groupOrder - e.groupOrder : a.renderOrder !== e.renderOrder ? a.renderOrder - e.renderOrder : a.material.id !== e.material.id ? a.material.id - e.material.id : a.z !== e.z ? a.z - e.z : a.id - e.id;
}
function la(a, e) {
  return a.groupOrder !== e.groupOrder ? a.groupOrder - e.groupOrder : a.renderOrder !== e.renderOrder ? a.renderOrder - e.renderOrder : a.z !== e.z ? e.z - a.z : a.id - e.id;
}
function ca() {
  const a = [];
  let e = 0;
  const t = [], n = [], i = [];
  function s() {
    e = 0, t.length = 0, n.length = 0, i.length = 0;
  }
  function r(d, u, p, g, _, m) {
    let f = a[e];
    return f === void 0 ? (f = {
      id: d.id,
      object: d,
      geometry: u,
      material: p,
      groupOrder: g,
      renderOrder: d.renderOrder,
      z: _,
      group: m
    }, a[e] = f) : (f.id = d.id, f.object = d, f.geometry = u, f.material = p, f.groupOrder = g, f.renderOrder = d.renderOrder, f.z = _, f.group = m), e++, f;
  }
  function o(d, u, p, g, _, m) {
    const f = r(d, u, p, g, _, m);
    p.transmission > 0 ? n.push(f) : p.transparent === !0 ? i.push(f) : t.push(f);
  }
  function c(d, u, p, g, _, m) {
    const f = r(d, u, p, g, _, m);
    p.transmission > 0 ? n.unshift(f) : p.transparent === !0 ? i.unshift(f) : t.unshift(f);
  }
  function l(d, u) {
    t.length > 1 && t.sort(d || dg), n.length > 1 && n.sort(u || la), i.length > 1 && i.sort(u || la);
  }
  function h() {
    for (let d = e, u = a.length; d < u; d++) {
      const p = a[d];
      if (p.id === null)
        break;
      p.id = null, p.object = null, p.geometry = null, p.material = null, p.group = null;
    }
  }
  return {
    opaque: t,
    transmissive: n,
    transparent: i,
    init: s,
    push: o,
    unshift: c,
    finish: h,
    sort: l
  };
}
function fg() {
  let a = /* @__PURE__ */ new WeakMap();
  function e(n, i) {
    const s = a.get(n);
    let r;
    return s === void 0 ? (r = new ca(), a.set(n, [r])) : i >= s.length ? (r = new ca(), s.push(r)) : r = s[i], r;
  }
  function t() {
    a = /* @__PURE__ */ new WeakMap();
  }
  return {
    get: e,
    dispose: t
  };
}
function pg() {
  const a = {};
  return {
    get: function(e) {
      if (a[e.id] !== void 0)
        return a[e.id];
      let t;
      switch (e.type) {
        case "DirectionalLight":
          t = {
            direction: new G(),
            color: new He()
          };
          break;
        case "SpotLight":
          t = {
            position: new G(),
            direction: new G(),
            color: new He(),
            distance: 0,
            coneCos: 0,
            penumbraCos: 0,
            decay: 0
          };
          break;
        case "PointLight":
          t = {
            position: new G(),
            color: new He(),
            distance: 0,
            decay: 0
          };
          break;
        case "HemisphereLight":
          t = {
            direction: new G(),
            skyColor: new He(),
            groundColor: new He()
          };
          break;
        case "RectAreaLight":
          t = {
            color: new He(),
            position: new G(),
            halfWidth: new G(),
            halfHeight: new G()
          };
          break;
      }
      return a[e.id] = t, t;
    }
  };
}
function mg() {
  const a = {};
  return {
    get: function(e) {
      if (a[e.id] !== void 0)
        return a[e.id];
      let t;
      switch (e.type) {
        case "DirectionalLight":
          t = {
            shadowBias: 0,
            shadowNormalBias: 0,
            shadowRadius: 1,
            shadowMapSize: new Fe()
          };
          break;
        case "SpotLight":
          t = {
            shadowBias: 0,
            shadowNormalBias: 0,
            shadowRadius: 1,
            shadowMapSize: new Fe()
          };
          break;
        case "PointLight":
          t = {
            shadowBias: 0,
            shadowNormalBias: 0,
            shadowRadius: 1,
            shadowMapSize: new Fe(),
            shadowCameraNear: 1,
            shadowCameraFar: 1e3
          };
          break;
      }
      return a[e.id] = t, t;
    }
  };
}
let gg = 0;
function _g(a, e) {
  return (e.castShadow ? 2 : 0) - (a.castShadow ? 2 : 0) + (e.map ? 1 : 0) - (a.map ? 1 : 0);
}
function vg(a, e) {
  const t = new pg(), n = mg(), i = {
    version: 0,
    hash: {
      directionalLength: -1,
      pointLength: -1,
      spotLength: -1,
      rectAreaLength: -1,
      hemiLength: -1,
      numDirectionalShadows: -1,
      numPointShadows: -1,
      numSpotShadows: -1,
      numSpotMaps: -1
    },
    ambient: [0, 0, 0],
    probe: [],
    directional: [],
    directionalShadow: [],
    directionalShadowMap: [],
    directionalShadowMatrix: [],
    spot: [],
    spotLightMap: [],
    spotShadow: [],
    spotShadowMap: [],
    spotLightMatrix: [],
    rectArea: [],
    rectAreaLTC1: null,
    rectAreaLTC2: null,
    point: [],
    pointShadow: [],
    pointShadowMap: [],
    pointShadowMatrix: [],
    hemi: [],
    numSpotLightShadowsWithMaps: 0
  };
  for (let h = 0; h < 9; h++)
    i.probe.push(new G());
  const s = new G(), r = new nt(), o = new nt();
  function c(h, d) {
    let u = 0, p = 0, g = 0;
    for (let O = 0; O < 9; O++)
      i.probe[O].set(0, 0, 0);
    let _ = 0, m = 0, f = 0, v = 0, M = 0, y = 0, w = 0, C = 0, P = 0, I = 0;
    h.sort(_g);
    const S = d === !0 ? Math.PI : 1;
    for (let O = 0, k = h.length; O < k; O++) {
      const L = h[O], R = L.color, D = L.intensity, N = L.distance, K = L.shadow && L.shadow.map ? L.shadow.map.texture : null;
      if (L.isAmbientLight)
        u += R.r * D * S, p += R.g * D * S, g += R.b * D * S;
      else if (L.isLightProbe)
        for (let B = 0; B < 9; B++)
          i.probe[B].addScaledVector(L.sh.coefficients[B], D);
      else if (L.isDirectionalLight) {
        const B = t.get(L);
        if (B.color.copy(L.color).multiplyScalar(L.intensity * S), L.castShadow) {
          const H = L.shadow, Q = n.get(L);
          Q.shadowBias = H.bias, Q.shadowNormalBias = H.normalBias, Q.shadowRadius = H.radius, Q.shadowMapSize = H.mapSize, i.directionalShadow[_] = Q, i.directionalShadowMap[_] = K, i.directionalShadowMatrix[_] = L.shadow.matrix, y++;
        }
        i.directional[_] = B, _++;
      } else if (L.isSpotLight) {
        const B = t.get(L);
        B.position.setFromMatrixPosition(L.matrixWorld), B.color.copy(R).multiplyScalar(D * S), B.distance = N, B.coneCos = Math.cos(L.angle), B.penumbraCos = Math.cos(L.angle * (1 - L.penumbra)), B.decay = L.decay, i.spot[f] = B;
        const H = L.shadow;
        if (L.map && (i.spotLightMap[P] = L.map, P++, H.updateMatrices(L), L.castShadow && I++), i.spotLightMatrix[f] = H.matrix, L.castShadow) {
          const Q = n.get(L);
          Q.shadowBias = H.bias, Q.shadowNormalBias = H.normalBias, Q.shadowRadius = H.radius, Q.shadowMapSize = H.mapSize, i.spotShadow[f] = Q, i.spotShadowMap[f] = K, C++;
        }
        f++;
      } else if (L.isRectAreaLight) {
        const B = t.get(L);
        B.color.copy(R).multiplyScalar(D), B.halfWidth.set(L.width * 0.5, 0, 0), B.halfHeight.set(0, L.height * 0.5, 0), i.rectArea[v] = B, v++;
      } else if (L.isPointLight) {
        const B = t.get(L);
        if (B.color.copy(L.color).multiplyScalar(L.intensity * S), B.distance = L.distance, B.decay = L.decay, L.castShadow) {
          const H = L.shadow, Q = n.get(L);
          Q.shadowBias = H.bias, Q.shadowNormalBias = H.normalBias, Q.shadowRadius = H.radius, Q.shadowMapSize = H.mapSize, Q.shadowCameraNear = H.camera.near, Q.shadowCameraFar = H.camera.far, i.pointShadow[m] = Q, i.pointShadowMap[m] = K, i.pointShadowMatrix[m] = L.shadow.matrix, w++;
        }
        i.point[m] = B, m++;
      } else if (L.isHemisphereLight) {
        const B = t.get(L);
        B.skyColor.copy(L.color).multiplyScalar(D * S), B.groundColor.copy(L.groundColor).multiplyScalar(D * S), i.hemi[M] = B, M++;
      }
    }
    v > 0 && (e.isWebGL2 || a.has("OES_texture_float_linear") === !0 ? (i.rectAreaLTC1 = ie.LTC_FLOAT_1, i.rectAreaLTC2 = ie.LTC_FLOAT_2) : a.has("OES_texture_half_float_linear") === !0 ? (i.rectAreaLTC1 = ie.LTC_HALF_1, i.rectAreaLTC2 = ie.LTC_HALF_2) : console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")), i.ambient[0] = u, i.ambient[1] = p, i.ambient[2] = g;
    const T = i.hash;
    (T.directionalLength !== _ || T.pointLength !== m || T.spotLength !== f || T.rectAreaLength !== v || T.hemiLength !== M || T.numDirectionalShadows !== y || T.numPointShadows !== w || T.numSpotShadows !== C || T.numSpotMaps !== P) && (i.directional.length = _, i.spot.length = f, i.rectArea.length = v, i.point.length = m, i.hemi.length = M, i.directionalShadow.length = y, i.directionalShadowMap.length = y, i.pointShadow.length = w, i.pointShadowMap.length = w, i.spotShadow.length = C, i.spotShadowMap.length = C, i.directionalShadowMatrix.length = y, i.pointShadowMatrix.length = w, i.spotLightMatrix.length = C + P - I, i.spotLightMap.length = P, i.numSpotLightShadowsWithMaps = I, T.directionalLength = _, T.pointLength = m, T.spotLength = f, T.rectAreaLength = v, T.hemiLength = M, T.numDirectionalShadows = y, T.numPointShadows = w, T.numSpotShadows = C, T.numSpotMaps = P, i.version = gg++);
  }
  function l(h, d) {
    let u = 0, p = 0, g = 0, _ = 0, m = 0;
    const f = d.matrixWorldInverse;
    for (let v = 0, M = h.length; v < M; v++) {
      const y = h[v];
      if (y.isDirectionalLight) {
        const w = i.directional[u];
        w.direction.setFromMatrixPosition(y.matrixWorld), s.setFromMatrixPosition(y.target.matrixWorld), w.direction.sub(s), w.direction.transformDirection(f), u++;
      } else if (y.isSpotLight) {
        const w = i.spot[g];
        w.position.setFromMatrixPosition(y.matrixWorld), w.position.applyMatrix4(f), w.direction.setFromMatrixPosition(y.matrixWorld), s.setFromMatrixPosition(y.target.matrixWorld), w.direction.sub(s), w.direction.transformDirection(f), g++;
      } else if (y.isRectAreaLight) {
        const w = i.rectArea[_];
        w.position.setFromMatrixPosition(y.matrixWorld), w.position.applyMatrix4(f), o.identity(), r.copy(y.matrixWorld), r.premultiply(f), o.extractRotation(r), w.halfWidth.set(y.width * 0.5, 0, 0), w.halfHeight.set(0, y.height * 0.5, 0), w.halfWidth.applyMatrix4(o), w.halfHeight.applyMatrix4(o), _++;
      } else if (y.isPointLight) {
        const w = i.point[p];
        w.position.setFromMatrixPosition(y.matrixWorld), w.position.applyMatrix4(f), p++;
      } else if (y.isHemisphereLight) {
        const w = i.hemi[m];
        w.direction.setFromMatrixPosition(y.matrixWorld), w.direction.transformDirection(f), m++;
      }
    }
  }
  return {
    setup: c,
    setupView: l,
    state: i
  };
}
function ha(a, e) {
  const t = new vg(a, e), n = [], i = [];
  function s() {
    n.length = 0, i.length = 0;
  }
  function r(d) {
    n.push(d);
  }
  function o(d) {
    i.push(d);
  }
  function c(d) {
    t.setup(n, d);
  }
  function l(d) {
    t.setupView(n, d);
  }
  return {
    init: s,
    state: {
      lightsArray: n,
      shadowsArray: i,
      lights: t
    },
    setupLights: c,
    setupLightsView: l,
    pushLight: r,
    pushShadow: o
  };
}
function xg(a, e) {
  let t = /* @__PURE__ */ new WeakMap();
  function n(s, r = 0) {
    const o = t.get(s);
    let c;
    return o === void 0 ? (c = new ha(a, e), t.set(s, [c])) : r >= o.length ? (c = new ha(a, e), o.push(c)) : c = o[r], c;
  }
  function i() {
    t = /* @__PURE__ */ new WeakMap();
  }
  return {
    get: n,
    dispose: i
  };
}
class Mg extends gi {
  constructor(e) {
    super(), this.isMeshDepthMaterial = !0, this.type = "MeshDepthMaterial", this.depthPacking = Au, this.map = null, this.alphaMap = null, this.displacementMap = null, this.displacementScale = 1, this.displacementBias = 0, this.wireframe = !1, this.wireframeLinewidth = 1, this.setValues(e);
  }
  copy(e) {
    return super.copy(e), this.depthPacking = e.depthPacking, this.map = e.map, this.alphaMap = e.alphaMap, this.displacementMap = e.displacementMap, this.displacementScale = e.displacementScale, this.displacementBias = e.displacementBias, this.wireframe = e.wireframe, this.wireframeLinewidth = e.wireframeLinewidth, this;
  }
}
class yg extends gi {
  constructor(e) {
    super(), this.isMeshDistanceMaterial = !0, this.type = "MeshDistanceMaterial", this.map = null, this.alphaMap = null, this.displacementMap = null, this.displacementScale = 1, this.displacementBias = 0, this.setValues(e);
  }
  copy(e) {
    return super.copy(e), this.map = e.map, this.alphaMap = e.alphaMap, this.displacementMap = e.displacementMap, this.displacementScale = e.displacementScale, this.displacementBias = e.displacementBias, this;
  }
}
const Sg = `void main() {
	gl_Position = vec4( position, 1.0 );
}`, wg = `uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;
function bg(a, e, t) {
  let n = new Sr();
  const i = new Fe(), s = new Fe(), r = new tt(), o = new Mg({ depthPacking: Cu }), c = new yg(), l = {}, h = t.maxTextureSize, d = { [wn]: yt, [yt]: wn, [fn]: fn }, u = new tn({
    defines: {
      VSM_SAMPLES: 8
    },
    uniforms: {
      shadow_pass: { value: null },
      resolution: { value: new Fe() },
      radius: { value: 4 }
    },
    vertexShader: Sg,
    fragmentShader: wg
  }), p = u.clone();
  p.defines.HORIZONTAL_PASS = 1;
  const g = new bn();
  g.setAttribute(
    "position",
    new Qt(
      new Float32Array([-1, -1, 0.5, 3, -1, 0.5, -1, 3, 0.5]),
      3
    )
  );
  const _ = new Kt(g, u), m = this;
  this.enabled = !1, this.autoUpdate = !0, this.needsUpdate = !1, this.type = Ea, this.render = function(y, w, C) {
    if (m.enabled === !1 || m.autoUpdate === !1 && m.needsUpdate === !1 || y.length === 0)
      return;
    const P = a.getRenderTarget(), I = a.getActiveCubeFace(), S = a.getActiveMipmapLevel(), T = a.state;
    T.setBlending(Sn), T.buffers.color.setClear(1, 1, 1, 1), T.buffers.depth.setTest(!0), T.setScissorTest(!1);
    for (let O = 0, k = y.length; O < k; O++) {
      const L = y[O], R = L.shadow;
      if (R === void 0) {
        console.warn("THREE.WebGLShadowMap:", L, "has no shadow.");
        continue;
      }
      if (R.autoUpdate === !1 && R.needsUpdate === !1)
        continue;
      i.copy(R.mapSize);
      const D = R.getFrameExtents();
      if (i.multiply(D), s.copy(R.mapSize), (i.x > h || i.y > h) && (i.x > h && (s.x = Math.floor(h / D.x), i.x = s.x * D.x, R.mapSize.x = s.x), i.y > h && (s.y = Math.floor(h / D.y), i.y = s.y * D.y, R.mapSize.y = s.y)), R.map === null) {
        const K = this.type !== Ci ? { minFilter: _t, magFilter: _t } : {};
        R.map = new en(i.x, i.y, K), R.map.texture.name = L.name + ".shadowMap", R.camera.updateProjectionMatrix();
      }
      a.setRenderTarget(R.map), a.clear();
      const N = R.getViewportCount();
      for (let K = 0; K < N; K++) {
        const B = R.getViewport(K);
        r.set(
          s.x * B.x,
          s.y * B.y,
          s.x * B.z,
          s.y * B.w
        ), T.viewport(r), R.updateMatrices(L, K), n = R.getFrustum(), M(w, C, R.camera, L, this.type);
      }
      R.isPointLightShadow !== !0 && this.type === Ci && f(R, C), R.needsUpdate = !1;
    }
    m.needsUpdate = !1, a.setRenderTarget(P, I, S);
  };
  function f(y, w) {
    const C = e.update(_);
    u.defines.VSM_SAMPLES !== y.blurSamples && (u.defines.VSM_SAMPLES = y.blurSamples, p.defines.VSM_SAMPLES = y.blurSamples, u.needsUpdate = !0, p.needsUpdate = !0), y.mapPass === null && (y.mapPass = new en(i.x, i.y)), u.uniforms.shadow_pass.value = y.map.texture, u.uniforms.resolution.value = y.mapSize, u.uniforms.radius.value = y.radius, a.setRenderTarget(y.mapPass), a.clear(), a.renderBufferDirect(w, null, C, u, _, null), p.uniforms.shadow_pass.value = y.mapPass.texture, p.uniforms.resolution.value = y.mapSize, p.uniforms.radius.value = y.radius, a.setRenderTarget(y.map), a.clear(), a.renderBufferDirect(w, null, C, p, _, null);
  }
  function v(y, w, C, P) {
    let I = null;
    const S = C.isPointLight === !0 ? y.customDistanceMaterial : y.customDepthMaterial;
    if (S !== void 0)
      I = S;
    else if (I = C.isPointLight === !0 ? c : o, a.localClippingEnabled && w.clipShadows === !0 && Array.isArray(w.clippingPlanes) && w.clippingPlanes.length !== 0 || w.displacementMap && w.displacementScale !== 0 || w.alphaMap && w.alphaTest > 0 || w.map && w.alphaTest > 0) {
      const T = I.uuid, O = w.uuid;
      let k = l[T];
      k === void 0 && (k = {}, l[T] = k);
      let L = k[O];
      L === void 0 && (L = I.clone(), k[O] = L), I = L;
    }
    if (I.visible = w.visible, I.wireframe = w.wireframe, P === Ci ? I.side = w.shadowSide !== null ? w.shadowSide : w.side : I.side = w.shadowSide !== null ? w.shadowSide : d[w.side], I.alphaMap = w.alphaMap, I.alphaTest = w.alphaTest, I.map = w.map, I.clipShadows = w.clipShadows, I.clippingPlanes = w.clippingPlanes, I.clipIntersection = w.clipIntersection, I.displacementMap = w.displacementMap, I.displacementScale = w.displacementScale, I.displacementBias = w.displacementBias, I.wireframeLinewidth = w.wireframeLinewidth, I.linewidth = w.linewidth, C.isPointLight === !0 && I.isMeshDistanceMaterial === !0) {
      const T = a.properties.get(I);
      T.light = C;
    }
    return I;
  }
  function M(y, w, C, P, I) {
    if (y.visible === !1)
      return;
    if (y.layers.test(w.layers) && (y.isMesh || y.isLine || y.isPoints) && (y.castShadow || y.receiveShadow && I === Ci) && (!y.frustumCulled || n.intersectsObject(y))) {
      y.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse, y.matrixWorld);
      const O = e.update(y), k = y.material;
      if (Array.isArray(k)) {
        const L = O.groups;
        for (let R = 0, D = L.length; R < D; R++) {
          const N = L[R], K = k[N.materialIndex];
          if (K && K.visible) {
            const B = v(y, K, P, I);
            a.renderBufferDirect(C, null, O, B, y, N);
          }
        }
      } else if (k.visible) {
        const L = v(y, k, P, I);
        a.renderBufferDirect(C, null, O, L, y, null);
      }
    }
    const T = y.children;
    for (let O = 0, k = T.length; O < k; O++)
      M(T[O], w, C, P, I);
  }
}
function Eg(a, e, t) {
  const n = t.isWebGL2;
  function i() {
    let U = !1;
    const j = new tt();
    let ee = null;
    const le = new tt(0, 0, 0, 0);
    return {
      setMask: function(ge) {
        ee !== ge && !U && (a.colorMask(ge, ge, ge, ge), ee = ge);
      },
      setLocked: function(ge) {
        U = ge;
      },
      setClear: function(ge, We, je, ut, gn) {
        gn === !0 && (ge *= ut, We *= ut, je *= ut), j.set(ge, We, je, ut), le.equals(j) === !1 && (a.clearColor(ge, We, je, ut), le.copy(j));
      },
      reset: function() {
        U = !1, ee = null, le.set(-1, 0, 0, 0);
      }
    };
  }
  function s() {
    let U = !1, j = null, ee = null, le = null;
    return {
      setTest: function(ge) {
        ge ? V(2929) : Te(2929);
      },
      setMask: function(ge) {
        j !== ge && !U && (a.depthMask(ge), j = ge);
      },
      setFunc: function(ge) {
        if (ee !== ge) {
          switch (ge) {
            case Kh:
              a.depthFunc(512);
              break;
            case Jh:
              a.depthFunc(519);
              break;
            case Qh:
              a.depthFunc(513);
              break;
            case lr:
              a.depthFunc(515);
              break;
            case eu:
              a.depthFunc(514);
              break;
            case tu:
              a.depthFunc(518);
              break;
            case nu:
              a.depthFunc(516);
              break;
            case iu:
              a.depthFunc(517);
              break;
            default:
              a.depthFunc(515);
          }
          ee = ge;
        }
      },
      setLocked: function(ge) {
        U = ge;
      },
      setClear: function(ge) {
        le !== ge && (a.clearDepth(ge), le = ge);
      },
      reset: function() {
        U = !1, j = null, ee = null, le = null;
      }
    };
  }
  function r() {
    let U = !1, j = null, ee = null, le = null, ge = null, We = null, je = null, ut = null, gn = null;
    return {
      setTest: function(Ze) {
        U || (Ze ? V(2960) : Te(2960));
      },
      setMask: function(Ze) {
        j !== Ze && !U && (a.stencilMask(Ze), j = Ze);
      },
      setFunc: function(Ze, Pt, Ht) {
        (ee !== Ze || le !== Pt || ge !== Ht) && (a.stencilFunc(Ze, Pt, Ht), ee = Ze, le = Pt, ge = Ht);
      },
      setOp: function(Ze, Pt, Ht) {
        (We !== Ze || je !== Pt || ut !== Ht) && (a.stencilOp(Ze, Pt, Ht), We = Ze, je = Pt, ut = Ht);
      },
      setLocked: function(Ze) {
        U = Ze;
      },
      setClear: function(Ze) {
        gn !== Ze && (a.clearStencil(Ze), gn = Ze);
      },
      reset: function() {
        U = !1, j = null, ee = null, le = null, ge = null, We = null, je = null, ut = null, gn = null;
      }
    };
  }
  const o = new i(), c = new s(), l = new r(), h = /* @__PURE__ */ new WeakMap(), d = /* @__PURE__ */ new WeakMap();
  let u = {}, p = {}, g = /* @__PURE__ */ new WeakMap(), _ = [], m = null, f = !1, v = null, M = null, y = null, w = null, C = null, P = null, I = null, S = !1, T = null, O = null, k = null, L = null, R = null;
  const D = a.getParameter(35661);
  let N = !1, K = 0;
  const B = a.getParameter(7938);
  B.indexOf("WebGL") !== -1 ? (K = parseFloat(/^WebGL (\d)/.exec(B)[1]), N = K >= 1) : B.indexOf("OpenGL ES") !== -1 && (K = parseFloat(/^OpenGL ES (\d)/.exec(B)[1]), N = K >= 2);
  let H = null, Q = {};
  const ce = a.getParameter(3088), Z = a.getParameter(2978), W = new tt().fromArray(ce), J = new tt().fromArray(Z);
  function se(U, j, ee) {
    const le = new Uint8Array(4), ge = a.createTexture();
    a.bindTexture(U, ge), a.texParameteri(U, 10241, 9728), a.texParameteri(U, 10240, 9728);
    for (let We = 0; We < ee; We++)
      a.texImage2D(j + We, 0, 6408, 1, 1, 0, 6408, 5121, le);
    return ge;
  }
  const oe = {};
  oe[3553] = se(3553, 3553, 1), oe[34067] = se(34067, 34069, 6), o.setClear(0, 0, 0, 1), c.setClear(1), l.setClear(0), V(2929), c.setFunc(lr), ct(!1), ot($r), V(2884), Re(Sn);
  function V(U) {
    u[U] !== !0 && (a.enable(U), u[U] = !0);
  }
  function Te(U) {
    u[U] !== !1 && (a.disable(U), u[U] = !1);
  }
  function be(U, j) {
    return p[U] !== j ? (a.bindFramebuffer(U, j), p[U] = j, n && (U === 36009 && (p[36160] = j), U === 36160 && (p[36009] = j)), !0) : !1;
  }
  function re(U, j) {
    let ee = _, le = !1;
    if (U)
      if (ee = g.get(j), ee === void 0 && (ee = [], g.set(j, ee)), U.isWebGLMultipleRenderTargets) {
        const ge = U.texture;
        if (ee.length !== ge.length || ee[0] !== 36064) {
          for (let We = 0, je = ge.length; We < je; We++)
            ee[We] = 36064 + We;
          ee.length = ge.length, le = !0;
        }
      } else
        ee[0] !== 36064 && (ee[0] = 36064, le = !0);
    else
      ee[0] !== 1029 && (ee[0] = 1029, le = !0);
    le && (t.isWebGL2 ? a.drawBuffers(ee) : e.get("WEBGL_draw_buffers").drawBuffersWEBGL(ee));
  }
  function ye(U) {
    return m !== U ? (a.useProgram(U), m = U, !0) : !1;
  }
  const Be = {
    [oi]: 32774,
    [Gh]: 32778,
    [Vh]: 32779
  };
  if (n)
    Be[Qr] = 32775, Be[eo] = 32776;
  else {
    const U = e.get("EXT_blend_minmax");
    U !== null && (Be[Qr] = U.MIN_EXT, Be[eo] = U.MAX_EXT);
  }
  const _e = {
    [kh]: 0,
    [Hh]: 1,
    [Wh]: 768,
    [Ta]: 770,
    [Zh]: 776,
    [Yh]: 774,
    [Xh]: 772,
    [qh]: 769,
    [Aa]: 771,
    [$h]: 775,
    [jh]: 773
  };
  function Re(U, j, ee, le, ge, We, je, ut) {
    if (U === Sn) {
      f === !0 && (Te(3042), f = !1);
      return;
    }
    if (f === !1 && (V(3042), f = !0), U !== Bh) {
      if (U !== v || ut !== S) {
        if ((M !== oi || C !== oi) && (a.blendEquation(32774), M = oi, C = oi), ut)
          switch (U) {
            case li:
              a.blendFuncSeparate(1, 771, 1, 771);
              break;
            case Zr:
              a.blendFunc(1, 1);
              break;
            case Kr:
              a.blendFuncSeparate(0, 769, 0, 1);
              break;
            case Jr:
              a.blendFuncSeparate(0, 768, 0, 770);
              break;
            default:
              console.error("THREE.WebGLState: Invalid blending: ", U);
              break;
          }
        else
          switch (U) {
            case li:
              a.blendFuncSeparate(770, 771, 1, 771);
              break;
            case Zr:
              a.blendFunc(770, 1);
              break;
            case Kr:
              a.blendFuncSeparate(0, 769, 0, 1);
              break;
            case Jr:
              a.blendFunc(0, 768);
              break;
            default:
              console.error("THREE.WebGLState: Invalid blending: ", U);
              break;
          }
        y = null, w = null, P = null, I = null, v = U, S = ut;
      }
      return;
    }
    ge = ge || j, We = We || ee, je = je || le, (j !== M || ge !== C) && (a.blendEquationSeparate(Be[j], Be[ge]), M = j, C = ge), (ee !== y || le !== w || We !== P || je !== I) && (a.blendFuncSeparate(_e[ee], _e[le], _e[We], _e[je]), y = ee, w = le, P = We, I = je), v = U, S = !1;
  }
  function rt(U, j) {
    U.side === fn ? Te(2884) : V(2884);
    let ee = U.side === yt;
    j && (ee = !ee), ct(ee), U.blending === li && U.transparent === !1 ? Re(Sn) : Re(U.blending, U.blendEquation, U.blendSrc, U.blendDst, U.blendEquationAlpha, U.blendSrcAlpha, U.blendDstAlpha, U.premultipliedAlpha), c.setFunc(U.depthFunc), c.setTest(U.depthTest), c.setMask(U.depthWrite), o.setMask(U.colorWrite);
    const le = U.stencilWrite;
    l.setTest(le), le && (l.setMask(U.stencilWriteMask), l.setFunc(U.stencilFunc, U.stencilRef, U.stencilFuncMask), l.setOp(U.stencilFail, U.stencilZFail, U.stencilZPass)), Ge(U.polygonOffset, U.polygonOffsetFactor, U.polygonOffsetUnits), U.alphaToCoverage === !0 ? V(32926) : Te(32926);
  }
  function ct(U) {
    T !== U && (U ? a.frontFace(2304) : a.frontFace(2305), T = U);
  }
  function ot(U) {
    U !== zh ? (V(2884), U !== O && (U === $r ? a.cullFace(1029) : U === Fh ? a.cullFace(1028) : a.cullFace(1032))) : Te(2884), O = U;
  }
  function Qe(U) {
    U !== k && (N && a.lineWidth(U), k = U);
  }
  function Ge(U, j, ee) {
    U ? (V(32823), (L !== j || R !== ee) && (a.polygonOffset(j, ee), L = j, R = ee)) : Te(32823);
  }
  function Ye(U) {
    U ? V(3089) : Te(3089);
  }
  function vt(U) {
    U === void 0 && (U = 33984 + D - 1), H !== U && (a.activeTexture(U), H = U);
  }
  function A(U, j, ee) {
    ee === void 0 && (H === null ? ee = 33984 + D - 1 : ee = H);
    let le = Q[ee];
    le === void 0 && (le = { type: void 0, texture: void 0 }, Q[ee] = le), (le.type !== U || le.texture !== j) && (H !== ee && (a.activeTexture(ee), H = ee), a.bindTexture(U, j || oe[U]), le.type = U, le.texture = j);
  }
  function b() {
    const U = Q[H];
    U !== void 0 && U.type !== void 0 && (a.bindTexture(U.type, null), U.type = void 0, U.texture = void 0);
  }
  function q() {
    try {
      a.compressedTexImage2D.apply(a, arguments);
    } catch (U) {
      console.error("THREE.WebGLState:", U);
    }
  }
  function te() {
    try {
      a.compressedTexImage3D.apply(a, arguments);
    } catch (U) {
      console.error("THREE.WebGLState:", U);
    }
  }
  function ne() {
    try {
      a.texSubImage2D.apply(a, arguments);
    } catch (U) {
      console.error("THREE.WebGLState:", U);
    }
  }
  function ae() {
    try {
      a.texSubImage3D.apply(a, arguments);
    } catch (U) {
      console.error("THREE.WebGLState:", U);
    }
  }
  function Se() {
    try {
      a.compressedTexSubImage2D.apply(a, arguments);
    } catch (U) {
      console.error("THREE.WebGLState:", U);
    }
  }
  function de() {
    try {
      a.compressedTexSubImage3D.apply(a, arguments);
    } catch (U) {
      console.error("THREE.WebGLState:", U);
    }
  }
  function Y() {
    try {
      a.texStorage2D.apply(a, arguments);
    } catch (U) {
      console.error("THREE.WebGLState:", U);
    }
  }
  function pe() {
    try {
      a.texStorage3D.apply(a, arguments);
    } catch (U) {
      console.error("THREE.WebGLState:", U);
    }
  }
  function ve() {
    try {
      a.texImage2D.apply(a, arguments);
    } catch (U) {
      console.error("THREE.WebGLState:", U);
    }
  }
  function Me() {
    try {
      a.texImage3D.apply(a, arguments);
    } catch (U) {
      console.error("THREE.WebGLState:", U);
    }
  }
  function ue(U) {
    W.equals(U) === !1 && (a.scissor(U.x, U.y, U.z, U.w), W.copy(U));
  }
  function me(U) {
    J.equals(U) === !1 && (a.viewport(U.x, U.y, U.z, U.w), J.copy(U));
  }
  function Ue(U, j) {
    let ee = d.get(j);
    ee === void 0 && (ee = /* @__PURE__ */ new WeakMap(), d.set(j, ee));
    let le = ee.get(U);
    le === void 0 && (le = a.getUniformBlockIndex(j, U.name), ee.set(U, le));
  }
  function Ve(U, j) {
    const le = d.get(j).get(U);
    h.get(j) !== le && (a.uniformBlockBinding(j, le, U.__bindingPointIndex), h.set(j, le));
  }
  function $e() {
    a.disable(3042), a.disable(2884), a.disable(2929), a.disable(32823), a.disable(3089), a.disable(2960), a.disable(32926), a.blendEquation(32774), a.blendFunc(1, 0), a.blendFuncSeparate(1, 0, 1, 0), a.colorMask(!0, !0, !0, !0), a.clearColor(0, 0, 0, 0), a.depthMask(!0), a.depthFunc(513), a.clearDepth(1), a.stencilMask(4294967295), a.stencilFunc(519, 0, 4294967295), a.stencilOp(7680, 7680, 7680), a.clearStencil(0), a.cullFace(1029), a.frontFace(2305), a.polygonOffset(0, 0), a.activeTexture(33984), a.bindFramebuffer(36160, null), n === !0 && (a.bindFramebuffer(36009, null), a.bindFramebuffer(36008, null)), a.useProgram(null), a.lineWidth(1), a.scissor(0, 0, a.canvas.width, a.canvas.height), a.viewport(0, 0, a.canvas.width, a.canvas.height), u = {}, H = null, Q = {}, p = {}, g = /* @__PURE__ */ new WeakMap(), _ = [], m = null, f = !1, v = null, M = null, y = null, w = null, C = null, P = null, I = null, S = !1, T = null, O = null, k = null, L = null, R = null, W.set(0, 0, a.canvas.width, a.canvas.height), J.set(0, 0, a.canvas.width, a.canvas.height), o.reset(), c.reset(), l.reset();
  }
  return {
    buffers: {
      color: o,
      depth: c,
      stencil: l
    },
    enable: V,
    disable: Te,
    bindFramebuffer: be,
    drawBuffers: re,
    useProgram: ye,
    setBlending: Re,
    setMaterial: rt,
    setFlipSided: ct,
    setCullFace: ot,
    setLineWidth: Qe,
    setPolygonOffset: Ge,
    setScissorTest: Ye,
    activeTexture: vt,
    bindTexture: A,
    unbindTexture: b,
    compressedTexImage2D: q,
    compressedTexImage3D: te,
    texImage2D: ve,
    texImage3D: Me,
    updateUBOMapping: Ue,
    uniformBlockBinding: Ve,
    texStorage2D: Y,
    texStorage3D: pe,
    texSubImage2D: ne,
    texSubImage3D: ae,
    compressedTexSubImage2D: Se,
    compressedTexSubImage3D: de,
    scissor: ue,
    viewport: me,
    reset: $e
  };
}
function Tg(a, e, t, n, i, s, r) {
  const o = i.isWebGL2, c = i.maxTextures, l = i.maxCubemapSize, h = i.maxTextureSize, d = i.maxSamples, u = e.has("WEBGL_multisampled_render_to_texture") ? e.get("WEBGL_multisampled_render_to_texture") : null, p = typeof navigator > "u" ? !1 : /OculusBrowser/g.test(navigator.userAgent), g = /* @__PURE__ */ new WeakMap();
  let _;
  const m = /* @__PURE__ */ new WeakMap();
  let f = !1;
  try {
    f = typeof OffscreenCanvas < "u" && new OffscreenCanvas(1, 1).getContext("2d") !== null;
  } catch {
  }
  function v(A, b) {
    return f ? (
      // eslint-disable-next-line compat/compat
      new OffscreenCanvas(A, b)
    ) : ps("canvas");
  }
  function M(A, b, q, te) {
    let ne = 1;
    if ((A.width > te || A.height > te) && (ne = te / Math.max(A.width, A.height)), ne < 1 || b === !0)
      if (typeof HTMLImageElement < "u" && A instanceof HTMLImageElement || typeof HTMLCanvasElement < "u" && A instanceof HTMLCanvasElement || typeof ImageBitmap < "u" && A instanceof ImageBitmap) {
        const ae = b ? Du : Math.floor, Se = ae(ne * A.width), de = ae(ne * A.height);
        _ === void 0 && (_ = v(Se, de));
        const Y = q ? v(Se, de) : _;
        return Y.width = Se, Y.height = de, Y.getContext("2d").drawImage(A, 0, 0, Se, de), console.warn("THREE.WebGLRenderer: Texture has been resized from (" + A.width + "x" + A.height + ") to (" + Se + "x" + de + ")."), Y;
      } else
        return "data" in A && console.warn("THREE.WebGLRenderer: Image in DataTexture is too big (" + A.width + "x" + A.height + ")."), A;
    return A;
  }
  function y(A) {
    return Co(A.width) && Co(A.height);
  }
  function w(A) {
    return o ? !1 : A.wrapS !== Gt || A.wrapT !== Gt || A.minFilter !== _t && A.minFilter !== Dt;
  }
  function C(A, b) {
    return A.generateMipmaps && b && A.minFilter !== _t && A.minFilter !== Dt;
  }
  function P(A) {
    a.generateMipmap(A);
  }
  function I(A, b, q, te, ne = !1) {
    if (o === !1)
      return b;
    if (A !== null) {
      if (a[A] !== void 0)
        return a[A];
      console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '" + A + "'");
    }
    let ae = b;
    return b === 6403 && (q === 5126 && (ae = 33326), q === 5131 && (ae = 33325), q === 5121 && (ae = 33321)), b === 33319 && (q === 5126 && (ae = 33328), q === 5131 && (ae = 33327), q === 5121 && (ae = 33323)), b === 6408 && (q === 5126 && (ae = 34836), q === 5131 && (ae = 34842), q === 5121 && (ae = te === Xe && ne === !1 ? 35907 : 32856), q === 32819 && (ae = 32854), q === 32820 && (ae = 32855)), (ae === 33325 || ae === 33326 || ae === 33327 || ae === 33328 || ae === 34842 || ae === 34836) && e.get("EXT_color_buffer_float"), ae;
  }
  function S(A, b, q) {
    return C(A, q) === !0 || A.isFramebufferTexture && A.minFilter !== _t && A.minFilter !== Dt ? Math.log2(Math.max(b.width, b.height)) + 1 : A.mipmaps !== void 0 && A.mipmaps.length > 0 ? A.mipmaps.length : A.isCompressedTexture && Array.isArray(A.image) ? b.mipmaps.length : 1;
  }
  function T(A) {
    return A === _t || A === to || A === Rs ? 9728 : 9729;
  }
  function O(A) {
    const b = A.target;
    b.removeEventListener("dispose", O), L(b), b.isVideoTexture && g.delete(b);
  }
  function k(A) {
    const b = A.target;
    b.removeEventListener("dispose", k), D(b);
  }
  function L(A) {
    const b = n.get(A);
    if (b.__webglInit === void 0)
      return;
    const q = A.source, te = m.get(q);
    if (te) {
      const ne = te[b.__cacheKey];
      ne.usedTimes--, ne.usedTimes === 0 && R(A), Object.keys(te).length === 0 && m.delete(q);
    }
    n.remove(A);
  }
  function R(A) {
    const b = n.get(A);
    a.deleteTexture(b.__webglTexture);
    const q = A.source, te = m.get(q);
    delete te[b.__cacheKey], r.memory.textures--;
  }
  function D(A) {
    const b = A.texture, q = n.get(A), te = n.get(b);
    if (te.__webglTexture !== void 0 && (a.deleteTexture(te.__webglTexture), r.memory.textures--), A.depthTexture && A.depthTexture.dispose(), A.isWebGLCubeRenderTarget)
      for (let ne = 0; ne < 6; ne++)
        a.deleteFramebuffer(q.__webglFramebuffer[ne]), q.__webglDepthbuffer && a.deleteRenderbuffer(q.__webglDepthbuffer[ne]);
    else {
      if (a.deleteFramebuffer(q.__webglFramebuffer), q.__webglDepthbuffer && a.deleteRenderbuffer(q.__webglDepthbuffer), q.__webglMultisampledFramebuffer && a.deleteFramebuffer(q.__webglMultisampledFramebuffer), q.__webglColorRenderbuffer)
        for (let ne = 0; ne < q.__webglColorRenderbuffer.length; ne++)
          q.__webglColorRenderbuffer[ne] && a.deleteRenderbuffer(q.__webglColorRenderbuffer[ne]);
      q.__webglDepthRenderbuffer && a.deleteRenderbuffer(q.__webglDepthRenderbuffer);
    }
    if (A.isWebGLMultipleRenderTargets)
      for (let ne = 0, ae = b.length; ne < ae; ne++) {
        const Se = n.get(b[ne]);
        Se.__webglTexture && (a.deleteTexture(Se.__webglTexture), r.memory.textures--), n.remove(b[ne]);
      }
    n.remove(b), n.remove(A);
  }
  let N = 0;
  function K() {
    N = 0;
  }
  function B() {
    const A = N;
    return A >= c && console.warn("THREE.WebGLTextures: Trying to use " + A + " texture units while this GPU supports only " + c), N += 1, A;
  }
  function H(A) {
    const b = [];
    return b.push(A.wrapS), b.push(A.wrapT), b.push(A.wrapR || 0), b.push(A.magFilter), b.push(A.minFilter), b.push(A.anisotropy), b.push(A.internalFormat), b.push(A.format), b.push(A.type), b.push(A.generateMipmaps), b.push(A.premultiplyAlpha), b.push(A.flipY), b.push(A.unpackAlignment), b.push(A.encoding), b.join();
  }
  function Q(A, b) {
    const q = n.get(A);
    if (A.isVideoTexture && Ye(A), A.isRenderTargetTexture === !1 && A.version > 0 && q.__version !== A.version) {
      const te = A.image;
      if (te === null)
        console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");
      else if (te.complete === !1)
        console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");
      else {
        Te(q, A, b);
        return;
      }
    }
    t.bindTexture(3553, q.__webglTexture, 33984 + b);
  }
  function ce(A, b) {
    const q = n.get(A);
    if (A.version > 0 && q.__version !== A.version) {
      Te(q, A, b);
      return;
    }
    t.bindTexture(35866, q.__webglTexture, 33984 + b);
  }
  function Z(A, b) {
    const q = n.get(A);
    if (A.version > 0 && q.__version !== A.version) {
      Te(q, A, b);
      return;
    }
    t.bindTexture(32879, q.__webglTexture, 33984 + b);
  }
  function W(A, b) {
    const q = n.get(A);
    if (A.version > 0 && q.__version !== A.version) {
      be(q, A, b);
      return;
    }
    t.bindTexture(34067, q.__webglTexture, 33984 + b);
  }
  const J = {
    [ur]: 10497,
    [Gt]: 33071,
    [dr]: 33648
  }, se = {
    [_t]: 9728,
    [to]: 9984,
    [Rs]: 9986,
    [Dt]: 9729,
    [uu]: 9985,
    [Ri]: 9987
  };
  function oe(A, b, q) {
    if (q ? (a.texParameteri(A, 10242, J[b.wrapS]), a.texParameteri(A, 10243, J[b.wrapT]), (A === 32879 || A === 35866) && a.texParameteri(A, 32882, J[b.wrapR]), a.texParameteri(A, 10240, se[b.magFilter]), a.texParameteri(A, 10241, se[b.minFilter])) : (a.texParameteri(A, 10242, 33071), a.texParameteri(A, 10243, 33071), (A === 32879 || A === 35866) && a.texParameteri(A, 32882, 33071), (b.wrapS !== Gt || b.wrapT !== Gt) && console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."), a.texParameteri(A, 10240, T(b.magFilter)), a.texParameteri(A, 10241, T(b.minFilter)), b.minFilter !== _t && b.minFilter !== Dt && console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")), e.has("EXT_texture_filter_anisotropic") === !0) {
      const te = e.get("EXT_texture_filter_anisotropic");
      if (b.magFilter === _t || b.minFilter !== Rs && b.minFilter !== Ri || b.type === On && e.has("OES_texture_float_linear") === !1 || o === !1 && b.type === Di && e.has("OES_texture_half_float_linear") === !1)
        return;
      (b.anisotropy > 1 || n.get(b).__currentAnisotropy) && (a.texParameterf(A, te.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(b.anisotropy, i.getMaxAnisotropy())), n.get(b).__currentAnisotropy = b.anisotropy);
    }
  }
  function V(A, b) {
    let q = !1;
    A.__webglInit === void 0 && (A.__webglInit = !0, b.addEventListener("dispose", O));
    const te = b.source;
    let ne = m.get(te);
    ne === void 0 && (ne = {}, m.set(te, ne));
    const ae = H(b);
    if (ae !== A.__cacheKey) {
      ne[ae] === void 0 && (ne[ae] = {
        texture: a.createTexture(),
        usedTimes: 0
      }, r.memory.textures++, q = !0), ne[ae].usedTimes++;
      const Se = ne[A.__cacheKey];
      Se !== void 0 && (ne[A.__cacheKey].usedTimes--, Se.usedTimes === 0 && R(b)), A.__cacheKey = ae, A.__webglTexture = ne[ae].texture;
    }
    return q;
  }
  function Te(A, b, q) {
    let te = 3553;
    (b.isDataArrayTexture || b.isCompressedArrayTexture) && (te = 35866), b.isData3DTexture && (te = 32879);
    const ne = V(A, b), ae = b.source;
    t.bindTexture(te, A.__webglTexture, 33984 + q);
    const Se = n.get(ae);
    if (ae.version !== Se.__version || ne === !0) {
      t.activeTexture(33984 + q), a.pixelStorei(37440, b.flipY), a.pixelStorei(37441, b.premultiplyAlpha), a.pixelStorei(3317, b.unpackAlignment), a.pixelStorei(37443, 0);
      const de = w(b) && y(b.image) === !1;
      let Y = M(b.image, de, !1, h);
      Y = vt(b, Y);
      const pe = y(Y) || o, ve = s.convert(b.format, b.encoding);
      let Me = s.convert(b.type), ue = I(b.internalFormat, ve, Me, b.encoding, b.isVideoTexture);
      oe(te, b, pe);
      let me;
      const Ue = b.mipmaps, Ve = o && b.isVideoTexture !== !0, $e = Se.__version === void 0 || ne === !0, U = S(b, Y, pe);
      if (b.isDepthTexture)
        ue = 6402, o ? b.type === On ? ue = 36012 : b.type === Fn ? ue = 33190 : b.type === ci ? ue = 35056 : ue = 33189 : b.type === On && console.error("WebGLRenderer: Floating point depth texture requires WebGL2."), b.format === Bn && ue === 6402 && b.type !== Pa && b.type !== Fn && (console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."), b.type = Fn, Me = s.convert(b.type)), b.format === fi && ue === 6402 && (ue = 34041, b.type !== ci && (console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."), b.type = ci, Me = s.convert(b.type))), $e && (Ve ? t.texStorage2D(3553, 1, ue, Y.width, Y.height) : t.texImage2D(3553, 0, ue, Y.width, Y.height, 0, ve, Me, null));
      else if (b.isDataTexture)
        if (Ue.length > 0 && pe) {
          Ve && $e && t.texStorage2D(3553, U, ue, Ue[0].width, Ue[0].height);
          for (let j = 0, ee = Ue.length; j < ee; j++)
            me = Ue[j], Ve ? t.texSubImage2D(3553, j, 0, 0, me.width, me.height, ve, Me, me.data) : t.texImage2D(3553, j, ue, me.width, me.height, 0, ve, Me, me.data);
          b.generateMipmaps = !1;
        } else
          Ve ? ($e && t.texStorage2D(3553, U, ue, Y.width, Y.height), t.texSubImage2D(3553, 0, 0, 0, Y.width, Y.height, ve, Me, Y.data)) : t.texImage2D(3553, 0, ue, Y.width, Y.height, 0, ve, Me, Y.data);
      else if (b.isCompressedTexture)
        if (b.isCompressedArrayTexture) {
          Ve && $e && t.texStorage3D(35866, U, ue, Ue[0].width, Ue[0].height, Y.depth);
          for (let j = 0, ee = Ue.length; j < ee; j++)
            me = Ue[j], b.format !== Vt ? ve !== null ? Ve ? t.compressedTexSubImage3D(35866, j, 0, 0, 0, me.width, me.height, Y.depth, ve, me.data, 0, 0) : t.compressedTexImage3D(35866, j, ue, me.width, me.height, Y.depth, 0, me.data, 0, 0) : console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()") : Ve ? t.texSubImage3D(35866, j, 0, 0, 0, me.width, me.height, Y.depth, ve, Me, me.data) : t.texImage3D(35866, j, ue, me.width, me.height, Y.depth, 0, ve, Me, me.data);
        } else {
          Ve && $e && t.texStorage2D(3553, U, ue, Ue[0].width, Ue[0].height);
          for (let j = 0, ee = Ue.length; j < ee; j++)
            me = Ue[j], b.format !== Vt ? ve !== null ? Ve ? t.compressedTexSubImage2D(3553, j, 0, 0, me.width, me.height, ve, me.data) : t.compressedTexImage2D(3553, j, ue, me.width, me.height, 0, me.data) : console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()") : Ve ? t.texSubImage2D(3553, j, 0, 0, me.width, me.height, ve, Me, me.data) : t.texImage2D(3553, j, ue, me.width, me.height, 0, ve, Me, me.data);
        }
      else if (b.isDataArrayTexture)
        Ve ? ($e && t.texStorage3D(35866, U, ue, Y.width, Y.height, Y.depth), t.texSubImage3D(35866, 0, 0, 0, 0, Y.width, Y.height, Y.depth, ve, Me, Y.data)) : t.texImage3D(35866, 0, ue, Y.width, Y.height, Y.depth, 0, ve, Me, Y.data);
      else if (b.isData3DTexture)
        Ve ? ($e && t.texStorage3D(32879, U, ue, Y.width, Y.height, Y.depth), t.texSubImage3D(32879, 0, 0, 0, 0, Y.width, Y.height, Y.depth, ve, Me, Y.data)) : t.texImage3D(32879, 0, ue, Y.width, Y.height, Y.depth, 0, ve, Me, Y.data);
      else if (b.isFramebufferTexture) {
        if ($e)
          if (Ve)
            t.texStorage2D(3553, U, ue, Y.width, Y.height);
          else {
            let j = Y.width, ee = Y.height;
            for (let le = 0; le < U; le++)
              t.texImage2D(3553, le, ue, j, ee, 0, ve, Me, null), j >>= 1, ee >>= 1;
          }
      } else if (Ue.length > 0 && pe) {
        Ve && $e && t.texStorage2D(3553, U, ue, Ue[0].width, Ue[0].height);
        for (let j = 0, ee = Ue.length; j < ee; j++)
          me = Ue[j], Ve ? t.texSubImage2D(3553, j, 0, 0, ve, Me, me) : t.texImage2D(3553, j, ue, ve, Me, me);
        b.generateMipmaps = !1;
      } else
        Ve ? ($e && t.texStorage2D(3553, U, ue, Y.width, Y.height), t.texSubImage2D(3553, 0, 0, 0, ve, Me, Y)) : t.texImage2D(3553, 0, ue, ve, Me, Y);
      C(b, pe) && P(te), Se.__version = ae.version, b.onUpdate && b.onUpdate(b);
    }
    A.__version = b.version;
  }
  function be(A, b, q) {
    if (b.image.length !== 6)
      return;
    const te = V(A, b), ne = b.source;
    t.bindTexture(34067, A.__webglTexture, 33984 + q);
    const ae = n.get(ne);
    if (ne.version !== ae.__version || te === !0) {
      t.activeTexture(33984 + q), a.pixelStorei(37440, b.flipY), a.pixelStorei(37441, b.premultiplyAlpha), a.pixelStorei(3317, b.unpackAlignment), a.pixelStorei(37443, 0);
      const Se = b.isCompressedTexture || b.image[0].isCompressedTexture, de = b.image[0] && b.image[0].isDataTexture, Y = [];
      for (let j = 0; j < 6; j++)
        !Se && !de ? Y[j] = M(b.image[j], !1, !0, l) : Y[j] = de ? b.image[j].image : b.image[j], Y[j] = vt(b, Y[j]);
      const pe = Y[0], ve = y(pe) || o, Me = s.convert(b.format, b.encoding), ue = s.convert(b.type), me = I(b.internalFormat, Me, ue, b.encoding), Ue = o && b.isVideoTexture !== !0, Ve = ae.__version === void 0 || te === !0;
      let $e = S(b, pe, ve);
      oe(34067, b, ve);
      let U;
      if (Se) {
        Ue && Ve && t.texStorage2D(34067, $e, me, pe.width, pe.height);
        for (let j = 0; j < 6; j++) {
          U = Y[j].mipmaps;
          for (let ee = 0; ee < U.length; ee++) {
            const le = U[ee];
            b.format !== Vt ? Me !== null ? Ue ? t.compressedTexSubImage2D(34069 + j, ee, 0, 0, le.width, le.height, Me, le.data) : t.compressedTexImage2D(34069 + j, ee, me, le.width, le.height, 0, le.data) : console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()") : Ue ? t.texSubImage2D(34069 + j, ee, 0, 0, le.width, le.height, Me, ue, le.data) : t.texImage2D(34069 + j, ee, me, le.width, le.height, 0, Me, ue, le.data);
          }
        }
      } else {
        U = b.mipmaps, Ue && Ve && (U.length > 0 && $e++, t.texStorage2D(34067, $e, me, Y[0].width, Y[0].height));
        for (let j = 0; j < 6; j++)
          if (de) {
            Ue ? t.texSubImage2D(34069 + j, 0, 0, 0, Y[j].width, Y[j].height, Me, ue, Y[j].data) : t.texImage2D(34069 + j, 0, me, Y[j].width, Y[j].height, 0, Me, ue, Y[j].data);
            for (let ee = 0; ee < U.length; ee++) {
              const ge = U[ee].image[j].image;
              Ue ? t.texSubImage2D(34069 + j, ee + 1, 0, 0, ge.width, ge.height, Me, ue, ge.data) : t.texImage2D(34069 + j, ee + 1, me, ge.width, ge.height, 0, Me, ue, ge.data);
            }
          } else {
            Ue ? t.texSubImage2D(34069 + j, 0, 0, 0, Me, ue, Y[j]) : t.texImage2D(34069 + j, 0, me, Me, ue, Y[j]);
            for (let ee = 0; ee < U.length; ee++) {
              const le = U[ee];
              Ue ? t.texSubImage2D(34069 + j, ee + 1, 0, 0, Me, ue, le.image[j]) : t.texImage2D(34069 + j, ee + 1, me, Me, ue, le.image[j]);
            }
          }
      }
      C(b, ve) && P(34067), ae.__version = ne.version, b.onUpdate && b.onUpdate(b);
    }
    A.__version = b.version;
  }
  function re(A, b, q, te, ne) {
    const ae = s.convert(q.format, q.encoding), Se = s.convert(q.type), de = I(q.internalFormat, ae, Se, q.encoding);
    n.get(b).__hasExternalTextures || (ne === 32879 || ne === 35866 ? t.texImage3D(ne, 0, de, b.width, b.height, b.depth, 0, ae, Se, null) : t.texImage2D(ne, 0, de, b.width, b.height, 0, ae, Se, null)), t.bindFramebuffer(36160, A), Ge(b) ? u.framebufferTexture2DMultisampleEXT(36160, te, ne, n.get(q).__webglTexture, 0, Qe(b)) : (ne === 3553 || ne >= 34069 && ne <= 34074) && a.framebufferTexture2D(36160, te, ne, n.get(q).__webglTexture, 0), t.bindFramebuffer(36160, null);
  }
  function ye(A, b, q) {
    if (a.bindRenderbuffer(36161, A), b.depthBuffer && !b.stencilBuffer) {
      let te = 33189;
      if (q || Ge(b)) {
        const ne = b.depthTexture;
        ne && ne.isDepthTexture && (ne.type === On ? te = 36012 : ne.type === Fn && (te = 33190));
        const ae = Qe(b);
        Ge(b) ? u.renderbufferStorageMultisampleEXT(36161, ae, te, b.width, b.height) : a.renderbufferStorageMultisample(36161, ae, te, b.width, b.height);
      } else
        a.renderbufferStorage(36161, te, b.width, b.height);
      a.framebufferRenderbuffer(36160, 36096, 36161, A);
    } else if (b.depthBuffer && b.stencilBuffer) {
      const te = Qe(b);
      q && Ge(b) === !1 ? a.renderbufferStorageMultisample(36161, te, 35056, b.width, b.height) : Ge(b) ? u.renderbufferStorageMultisampleEXT(36161, te, 35056, b.width, b.height) : a.renderbufferStorage(36161, 34041, b.width, b.height), a.framebufferRenderbuffer(36160, 33306, 36161, A);
    } else {
      const te = b.isWebGLMultipleRenderTargets === !0 ? b.texture : [b.texture];
      for (let ne = 0; ne < te.length; ne++) {
        const ae = te[ne], Se = s.convert(ae.format, ae.encoding), de = s.convert(ae.type), Y = I(ae.internalFormat, Se, de, ae.encoding), pe = Qe(b);
        q && Ge(b) === !1 ? a.renderbufferStorageMultisample(36161, pe, Y, b.width, b.height) : Ge(b) ? u.renderbufferStorageMultisampleEXT(36161, pe, Y, b.width, b.height) : a.renderbufferStorage(36161, Y, b.width, b.height);
      }
    }
    a.bindRenderbuffer(36161, null);
  }
  function Be(A, b) {
    if (b && b.isWebGLCubeRenderTarget)
      throw new Error("Depth Texture with cube render targets is not supported");
    if (t.bindFramebuffer(36160, A), !(b.depthTexture && b.depthTexture.isDepthTexture))
      throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");
    (!n.get(b.depthTexture).__webglTexture || b.depthTexture.image.width !== b.width || b.depthTexture.image.height !== b.height) && (b.depthTexture.image.width = b.width, b.depthTexture.image.height = b.height, b.depthTexture.needsUpdate = !0), Q(b.depthTexture, 0);
    const te = n.get(b.depthTexture).__webglTexture, ne = Qe(b);
    if (b.depthTexture.format === Bn)
      Ge(b) ? u.framebufferTexture2DMultisampleEXT(36160, 36096, 3553, te, 0, ne) : a.framebufferTexture2D(36160, 36096, 3553, te, 0);
    else if (b.depthTexture.format === fi)
      Ge(b) ? u.framebufferTexture2DMultisampleEXT(36160, 33306, 3553, te, 0, ne) : a.framebufferTexture2D(36160, 33306, 3553, te, 0);
    else
      throw new Error("Unknown depthTexture format");
  }
  function _e(A) {
    const b = n.get(A), q = A.isWebGLCubeRenderTarget === !0;
    if (A.depthTexture && !b.__autoAllocateDepthBuffer) {
      if (q)
        throw new Error("target.depthTexture not supported in Cube render targets");
      Be(b.__webglFramebuffer, A);
    } else if (q) {
      b.__webglDepthbuffer = [];
      for (let te = 0; te < 6; te++)
        t.bindFramebuffer(36160, b.__webglFramebuffer[te]), b.__webglDepthbuffer[te] = a.createRenderbuffer(), ye(b.__webglDepthbuffer[te], A, !1);
    } else
      t.bindFramebuffer(36160, b.__webglFramebuffer), b.__webglDepthbuffer = a.createRenderbuffer(), ye(b.__webglDepthbuffer, A, !1);
    t.bindFramebuffer(36160, null);
  }
  function Re(A, b, q) {
    const te = n.get(A);
    b !== void 0 && re(te.__webglFramebuffer, A, A.texture, 36064, 3553), q !== void 0 && _e(A);
  }
  function rt(A) {
    const b = A.texture, q = n.get(A), te = n.get(b);
    A.addEventListener("dispose", k), A.isWebGLMultipleRenderTargets !== !0 && (te.__webglTexture === void 0 && (te.__webglTexture = a.createTexture()), te.__version = b.version, r.memory.textures++);
    const ne = A.isWebGLCubeRenderTarget === !0, ae = A.isWebGLMultipleRenderTargets === !0, Se = y(A) || o;
    if (ne) {
      q.__webglFramebuffer = [];
      for (let de = 0; de < 6; de++)
        q.__webglFramebuffer[de] = a.createFramebuffer();
    } else {
      if (q.__webglFramebuffer = a.createFramebuffer(), ae)
        if (i.drawBuffers) {
          const de = A.texture;
          for (let Y = 0, pe = de.length; Y < pe; Y++) {
            const ve = n.get(de[Y]);
            ve.__webglTexture === void 0 && (ve.__webglTexture = a.createTexture(), r.memory.textures++);
          }
        } else
          console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");
      if (o && A.samples > 0 && Ge(A) === !1) {
        const de = ae ? b : [b];
        q.__webglMultisampledFramebuffer = a.createFramebuffer(), q.__webglColorRenderbuffer = [], t.bindFramebuffer(36160, q.__webglMultisampledFramebuffer);
        for (let Y = 0; Y < de.length; Y++) {
          const pe = de[Y];
          q.__webglColorRenderbuffer[Y] = a.createRenderbuffer(), a.bindRenderbuffer(36161, q.__webglColorRenderbuffer[Y]);
          const ve = s.convert(pe.format, pe.encoding), Me = s.convert(pe.type), ue = I(pe.internalFormat, ve, Me, pe.encoding, A.isXRRenderTarget === !0), me = Qe(A);
          a.renderbufferStorageMultisample(36161, me, ue, A.width, A.height), a.framebufferRenderbuffer(36160, 36064 + Y, 36161, q.__webglColorRenderbuffer[Y]);
        }
        a.bindRenderbuffer(36161, null), A.depthBuffer && (q.__webglDepthRenderbuffer = a.createRenderbuffer(), ye(q.__webglDepthRenderbuffer, A, !0)), t.bindFramebuffer(36160, null);
      }
    }
    if (ne) {
      t.bindTexture(34067, te.__webglTexture), oe(34067, b, Se);
      for (let de = 0; de < 6; de++)
        re(q.__webglFramebuffer[de], A, b, 36064, 34069 + de);
      C(b, Se) && P(34067), t.unbindTexture();
    } else if (ae) {
      const de = A.texture;
      for (let Y = 0, pe = de.length; Y < pe; Y++) {
        const ve = de[Y], Me = n.get(ve);
        t.bindTexture(3553, Me.__webglTexture), oe(3553, ve, Se), re(q.__webglFramebuffer, A, ve, 36064 + Y, 3553), C(ve, Se) && P(3553);
      }
      t.unbindTexture();
    } else {
      let de = 3553;
      (A.isWebGL3DRenderTarget || A.isWebGLArrayRenderTarget) && (o ? de = A.isWebGL3DRenderTarget ? 32879 : 35866 : console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")), t.bindTexture(de, te.__webglTexture), oe(de, b, Se), re(q.__webglFramebuffer, A, b, 36064, de), C(b, Se) && P(de), t.unbindTexture();
    }
    A.depthBuffer && _e(A);
  }
  function ct(A) {
    const b = y(A) || o, q = A.isWebGLMultipleRenderTargets === !0 ? A.texture : [A.texture];
    for (let te = 0, ne = q.length; te < ne; te++) {
      const ae = q[te];
      if (C(ae, b)) {
        const Se = A.isWebGLCubeRenderTarget ? 34067 : 3553, de = n.get(ae).__webglTexture;
        t.bindTexture(Se, de), P(Se), t.unbindTexture();
      }
    }
  }
  function ot(A) {
    if (o && A.samples > 0 && Ge(A) === !1) {
      const b = A.isWebGLMultipleRenderTargets ? A.texture : [A.texture], q = A.width, te = A.height;
      let ne = 16384;
      const ae = [], Se = A.stencilBuffer ? 33306 : 36096, de = n.get(A), Y = A.isWebGLMultipleRenderTargets === !0;
      if (Y)
        for (let pe = 0; pe < b.length; pe++)
          t.bindFramebuffer(36160, de.__webglMultisampledFramebuffer), a.framebufferRenderbuffer(36160, 36064 + pe, 36161, null), t.bindFramebuffer(36160, de.__webglFramebuffer), a.framebufferTexture2D(36009, 36064 + pe, 3553, null, 0);
      t.bindFramebuffer(36008, de.__webglMultisampledFramebuffer), t.bindFramebuffer(36009, de.__webglFramebuffer);
      for (let pe = 0; pe < b.length; pe++) {
        ae.push(36064 + pe), A.depthBuffer && ae.push(Se);
        const ve = de.__ignoreDepthValues !== void 0 ? de.__ignoreDepthValues : !1;
        if (ve === !1 && (A.depthBuffer && (ne |= 256), A.stencilBuffer && (ne |= 1024)), Y && a.framebufferRenderbuffer(36008, 36064, 36161, de.__webglColorRenderbuffer[pe]), ve === !0 && (a.invalidateFramebuffer(36008, [Se]), a.invalidateFramebuffer(36009, [Se])), Y) {
          const Me = n.get(b[pe]).__webglTexture;
          a.framebufferTexture2D(36009, 36064, 3553, Me, 0);
        }
        a.blitFramebuffer(0, 0, q, te, 0, 0, q, te, ne, 9728), p && a.invalidateFramebuffer(36008, ae);
      }
      if (t.bindFramebuffer(36008, null), t.bindFramebuffer(36009, null), Y)
        for (let pe = 0; pe < b.length; pe++) {
          t.bindFramebuffer(36160, de.__webglMultisampledFramebuffer), a.framebufferRenderbuffer(36160, 36064 + pe, 36161, de.__webglColorRenderbuffer[pe]);
          const ve = n.get(b[pe]).__webglTexture;
          t.bindFramebuffer(36160, de.__webglFramebuffer), a.framebufferTexture2D(36009, 36064 + pe, 3553, ve, 0);
        }
      t.bindFramebuffer(36009, de.__webglMultisampledFramebuffer);
    }
  }
  function Qe(A) {
    return Math.min(d, A.samples);
  }
  function Ge(A) {
    const b = n.get(A);
    return o && A.samples > 0 && e.has("WEBGL_multisampled_render_to_texture") === !0 && b.__useRenderToTexture !== !1;
  }
  function Ye(A) {
    const b = r.render.frame;
    g.get(A) !== b && (g.set(A, b), A.update());
  }
  function vt(A, b) {
    const q = A.encoding, te = A.format, ne = A.type;
    return A.isCompressedTexture === !0 || A.isVideoTexture === !0 || A.format === fr || q !== Vn && (q === Xe ? o === !1 ? e.has("EXT_sRGB") === !0 && te === Vt ? (A.format = fr, A.minFilter = Dt, A.generateMipmaps = !1) : b = Ia.sRGBToLinear(b) : (te !== Vt || ne !== Gn) && console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.") : console.error("THREE.WebGLTextures: Unsupported texture encoding:", q)), b;
  }
  this.allocateTextureUnit = B, this.resetTextureUnits = K, this.setTexture2D = Q, this.setTexture2DArray = ce, this.setTexture3D = Z, this.setTextureCube = W, this.rebindTextures = Re, this.setupRenderTarget = rt, this.updateRenderTargetMipmap = ct, this.updateMultisampleRenderTarget = ot, this.setupDepthRenderbuffer = _e, this.setupFrameBufferTexture = re, this.useMultisampledRTT = Ge;
}
function Ag(a, e, t) {
  const n = t.isWebGL2;
  function i(s, r = null) {
    let o;
    if (s === Gn)
      return 5121;
    if (s === mu)
      return 32819;
    if (s === gu)
      return 32820;
    if (s === du)
      return 5120;
    if (s === fu)
      return 5122;
    if (s === Pa)
      return 5123;
    if (s === pu)
      return 5124;
    if (s === Fn)
      return 5125;
    if (s === On)
      return 5126;
    if (s === Di)
      return n ? 5131 : (o = e.get("OES_texture_half_float"), o !== null ? o.HALF_FLOAT_OES : null);
    if (s === _u)
      return 6406;
    if (s === Vt)
      return 6408;
    if (s === vu)
      return 6409;
    if (s === xu)
      return 6410;
    if (s === Bn)
      return 6402;
    if (s === fi)
      return 34041;
    if (s === fr)
      return o = e.get("EXT_sRGB"), o !== null ? o.SRGB_ALPHA_EXT : null;
    if (s === Mu)
      return 6403;
    if (s === yu)
      return 36244;
    if (s === Su)
      return 33319;
    if (s === wu)
      return 33320;
    if (s === bu)
      return 36249;
    if (s === Ds || s === Is || s === Us || s === Ns)
      if (r === Xe)
        if (o = e.get("WEBGL_compressed_texture_s3tc_srgb"), o !== null) {
          if (s === Ds)
            return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;
          if (s === Is)
            return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;
          if (s === Us)
            return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;
          if (s === Ns)
            return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT;
        } else
          return null;
      else if (o = e.get("WEBGL_compressed_texture_s3tc"), o !== null) {
        if (s === Ds)
          return o.COMPRESSED_RGB_S3TC_DXT1_EXT;
        if (s === Is)
          return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;
        if (s === Us)
          return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;
        if (s === Ns)
          return o.COMPRESSED_RGBA_S3TC_DXT5_EXT;
      } else
        return null;
    if (s === no || s === io || s === so || s === ro)
      if (o = e.get("WEBGL_compressed_texture_pvrtc"), o !== null) {
        if (s === no)
          return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
        if (s === io)
          return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;
        if (s === so)
          return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
        if (s === ro)
          return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG;
      } else
        return null;
    if (s === Eu)
      return o = e.get("WEBGL_compressed_texture_etc1"), o !== null ? o.COMPRESSED_RGB_ETC1_WEBGL : null;
    if (s === oo || s === ao)
      if (o = e.get("WEBGL_compressed_texture_etc"), o !== null) {
        if (s === oo)
          return r === Xe ? o.COMPRESSED_SRGB8_ETC2 : o.COMPRESSED_RGB8_ETC2;
        if (s === ao)
          return r === Xe ? o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC : o.COMPRESSED_RGBA8_ETC2_EAC;
      } else
        return null;
    if (s === lo || s === co || s === ho || s === uo || s === fo || s === po || s === mo || s === go || s === _o || s === vo || s === xo || s === Mo || s === yo || s === So)
      if (o = e.get("WEBGL_compressed_texture_astc"), o !== null) {
        if (s === lo)
          return r === Xe ? o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR : o.COMPRESSED_RGBA_ASTC_4x4_KHR;
        if (s === co)
          return r === Xe ? o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR : o.COMPRESSED_RGBA_ASTC_5x4_KHR;
        if (s === ho)
          return r === Xe ? o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR : o.COMPRESSED_RGBA_ASTC_5x5_KHR;
        if (s === uo)
          return r === Xe ? o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR : o.COMPRESSED_RGBA_ASTC_6x5_KHR;
        if (s === fo)
          return r === Xe ? o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR : o.COMPRESSED_RGBA_ASTC_6x6_KHR;
        if (s === po)
          return r === Xe ? o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR : o.COMPRESSED_RGBA_ASTC_8x5_KHR;
        if (s === mo)
          return r === Xe ? o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR : o.COMPRESSED_RGBA_ASTC_8x6_KHR;
        if (s === go)
          return r === Xe ? o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR : o.COMPRESSED_RGBA_ASTC_8x8_KHR;
        if (s === _o)
          return r === Xe ? o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR : o.COMPRESSED_RGBA_ASTC_10x5_KHR;
        if (s === vo)
          return r === Xe ? o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR : o.COMPRESSED_RGBA_ASTC_10x6_KHR;
        if (s === xo)
          return r === Xe ? o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR : o.COMPRESSED_RGBA_ASTC_10x8_KHR;
        if (s === Mo)
          return r === Xe ? o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR : o.COMPRESSED_RGBA_ASTC_10x10_KHR;
        if (s === yo)
          return r === Xe ? o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR : o.COMPRESSED_RGBA_ASTC_12x10_KHR;
        if (s === So)
          return r === Xe ? o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR : o.COMPRESSED_RGBA_ASTC_12x12_KHR;
      } else
        return null;
    if (s === zs)
      if (o = e.get("EXT_texture_compression_bptc"), o !== null) {
        if (s === zs)
          return r === Xe ? o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT : o.COMPRESSED_RGBA_BPTC_UNORM_EXT;
      } else
        return null;
    if (s === Tu || s === wo || s === bo || s === Eo)
      if (o = e.get("EXT_texture_compression_rgtc"), o !== null) {
        if (s === zs)
          return o.COMPRESSED_RED_RGTC1_EXT;
        if (s === wo)
          return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;
        if (s === bo)
          return o.COMPRESSED_RED_GREEN_RGTC2_EXT;
        if (s === Eo)
          return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT;
      } else
        return null;
    return s === ci ? n ? 34042 : (o = e.get("WEBGL_depth_texture"), o !== null ? o.UNSIGNED_INT_24_8_WEBGL : null) : a[s] !== void 0 ? a[s] : null;
  }
  return { convert: i };
}
class Cg extends It {
  constructor(e = []) {
    super(), this.isArrayCamera = !0, this.cameras = e;
  }
}
class us extends ht {
  constructor() {
    super(), this.isGroup = !0, this.type = "Group";
  }
}
const Lg = { type: "move" };
class or {
  constructor() {
    this._targetRay = null, this._grip = null, this._hand = null;
  }
  getHandSpace() {
    return this._hand === null && (this._hand = new us(), this._hand.matrixAutoUpdate = !1, this._hand.visible = !1, this._hand.joints = {}, this._hand.inputState = { pinching: !1 }), this._hand;
  }
  getTargetRaySpace() {
    return this._targetRay === null && (this._targetRay = new us(), this._targetRay.matrixAutoUpdate = !1, this._targetRay.visible = !1, this._targetRay.hasLinearVelocity = !1, this._targetRay.linearVelocity = new G(), this._targetRay.hasAngularVelocity = !1, this._targetRay.angularVelocity = new G()), this._targetRay;
  }
  getGripSpace() {
    return this._grip === null && (this._grip = new us(), this._grip.matrixAutoUpdate = !1, this._grip.visible = !1, this._grip.hasLinearVelocity = !1, this._grip.linearVelocity = new G(), this._grip.hasAngularVelocity = !1, this._grip.angularVelocity = new G()), this._grip;
  }
  dispatchEvent(e) {
    return this._targetRay !== null && this._targetRay.dispatchEvent(e), this._grip !== null && this._grip.dispatchEvent(e), this._hand !== null && this._hand.dispatchEvent(e), this;
  }
  connect(e) {
    if (e && e.hand) {
      const t = this._hand;
      if (t)
        for (const n of e.hand.values())
          this._getHandJoint(t, n);
    }
    return this.dispatchEvent({ type: "connected", data: e }), this;
  }
  disconnect(e) {
    return this.dispatchEvent({ type: "disconnected", data: e }), this._targetRay !== null && (this._targetRay.visible = !1), this._grip !== null && (this._grip.visible = !1), this._hand !== null && (this._hand.visible = !1), this;
  }
  update(e, t, n) {
    let i = null, s = null, r = null;
    const o = this._targetRay, c = this._grip, l = this._hand;
    if (e && t.session.visibilityState !== "visible-blurred") {
      if (l && e.hand) {
        r = !0;
        for (const _ of e.hand.values()) {
          const m = t.getJointPose(_, n), f = this._getHandJoint(l, _);
          m !== null && (f.matrix.fromArray(m.transform.matrix), f.matrix.decompose(f.position, f.rotation, f.scale), f.jointRadius = m.radius), f.visible = m !== null;
        }
        const h = l.joints["index-finger-tip"], d = l.joints["thumb-tip"], u = h.position.distanceTo(d.position), p = 0.02, g = 5e-3;
        l.inputState.pinching && u > p + g ? (l.inputState.pinching = !1, this.dispatchEvent({
          type: "pinchend",
          handedness: e.handedness,
          target: this
        })) : !l.inputState.pinching && u <= p - g && (l.inputState.pinching = !0, this.dispatchEvent({
          type: "pinchstart",
          handedness: e.handedness,
          target: this
        }));
      } else
        c !== null && e.gripSpace && (s = t.getPose(e.gripSpace, n), s !== null && (c.matrix.fromArray(s.transform.matrix), c.matrix.decompose(c.position, c.rotation, c.scale), s.linearVelocity ? (c.hasLinearVelocity = !0, c.linearVelocity.copy(s.linearVelocity)) : c.hasLinearVelocity = !1, s.angularVelocity ? (c.hasAngularVelocity = !0, c.angularVelocity.copy(s.angularVelocity)) : c.hasAngularVelocity = !1));
      o !== null && (i = t.getPose(e.targetRaySpace, n), i === null && s !== null && (i = s), i !== null && (o.matrix.fromArray(i.transform.matrix), o.matrix.decompose(o.position, o.rotation, o.scale), i.linearVelocity ? (o.hasLinearVelocity = !0, o.linearVelocity.copy(i.linearVelocity)) : o.hasLinearVelocity = !1, i.angularVelocity ? (o.hasAngularVelocity = !0, o.angularVelocity.copy(i.angularVelocity)) : o.hasAngularVelocity = !1, this.dispatchEvent(Lg)));
    }
    return o !== null && (o.visible = i !== null), c !== null && (c.visible = s !== null), l !== null && (l.visible = r !== null), this;
  }
  // private method
  _getHandJoint(e, t) {
    if (e.joints[t.jointName] === void 0) {
      const n = new us();
      n.matrixAutoUpdate = !1, n.visible = !1, e.joints[t.jointName] = n, e.add(n);
    }
    return e.joints[t.jointName];
  }
}
class Pg extends Ct {
  constructor(e, t, n, i, s, r, o, c, l, h) {
    if (h = h !== void 0 ? h : Bn, h !== Bn && h !== fi)
      throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");
    n === void 0 && h === Bn && (n = Fn), n === void 0 && h === fi && (n = ci), super(null, i, s, r, o, c, h, n, l), this.isDepthTexture = !0, this.image = { width: e, height: t }, this.magFilter = o !== void 0 ? o : _t, this.minFilter = c !== void 0 ? c : _t, this.flipY = !1, this.generateMipmaps = !1;
  }
}
class Rg extends mi {
  constructor(e, t) {
    super();
    const n = this;
    let i = null, s = 1, r = null, o = "local-floor", c = 1, l = null, h = null, d = null, u = null, p = null, g = null;
    const _ = t.getContextAttributes();
    let m = null, f = null;
    const v = [], M = [], y = /* @__PURE__ */ new Set(), w = /* @__PURE__ */ new Map(), C = new It();
    C.layers.enable(1), C.viewport = new tt();
    const P = new It();
    P.layers.enable(2), P.viewport = new tt();
    const I = [C, P], S = new Cg();
    S.layers.enable(1), S.layers.enable(2);
    let T = null, O = null;
    this.cameraAutoUpdate = !0, this.enabled = !1, this.isPresenting = !1, this.getController = function(W) {
      let J = v[W];
      return J === void 0 && (J = new or(), v[W] = J), J.getTargetRaySpace();
    }, this.getControllerGrip = function(W) {
      let J = v[W];
      return J === void 0 && (J = new or(), v[W] = J), J.getGripSpace();
    }, this.getHand = function(W) {
      let J = v[W];
      return J === void 0 && (J = new or(), v[W] = J), J.getHandSpace();
    };
    function k(W) {
      const J = M.indexOf(W.inputSource);
      if (J === -1)
        return;
      const se = v[J];
      se !== void 0 && se.dispatchEvent({ type: W.type, data: W.inputSource });
    }
    function L() {
      i.removeEventListener("select", k), i.removeEventListener("selectstart", k), i.removeEventListener("selectend", k), i.removeEventListener("squeeze", k), i.removeEventListener("squeezestart", k), i.removeEventListener("squeezeend", k), i.removeEventListener("end", L), i.removeEventListener("inputsourceschange", R);
      for (let W = 0; W < v.length; W++) {
        const J = M[W];
        J !== null && (M[W] = null, v[W].disconnect(J));
      }
      T = null, O = null, e.setRenderTarget(m), p = null, u = null, d = null, i = null, f = null, Z.stop(), n.isPresenting = !1, n.dispatchEvent({ type: "sessionend" });
    }
    this.setFramebufferScaleFactor = function(W) {
      s = W, n.isPresenting === !0 && console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.");
    }, this.setReferenceSpaceType = function(W) {
      o = W, n.isPresenting === !0 && console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.");
    }, this.getReferenceSpace = function() {
      return l || r;
    }, this.setReferenceSpace = function(W) {
      l = W;
    }, this.getBaseLayer = function() {
      return u !== null ? u : p;
    }, this.getBinding = function() {
      return d;
    }, this.getFrame = function() {
      return g;
    }, this.getSession = function() {
      return i;
    }, this.setSession = async function(W) {
      if (i = W, i !== null) {
        if (m = e.getRenderTarget(), i.addEventListener("select", k), i.addEventListener("selectstart", k), i.addEventListener("selectend", k), i.addEventListener("squeeze", k), i.addEventListener("squeezestart", k), i.addEventListener("squeezeend", k), i.addEventListener("end", L), i.addEventListener("inputsourceschange", R), _.xrCompatible !== !0 && await t.makeXRCompatible(), i.renderState.layers === void 0 || e.capabilities.isWebGL2 === !1) {
          const J = {
            antialias: i.renderState.layers === void 0 ? _.antialias : !0,
            alpha: _.alpha,
            depth: _.depth,
            stencil: _.stencil,
            framebufferScaleFactor: s
          };
          p = new XRWebGLLayer(i, t, J), i.updateRenderState({ baseLayer: p }), f = new en(
            p.framebufferWidth,
            p.framebufferHeight,
            {
              format: Vt,
              type: Gn,
              encoding: e.outputEncoding,
              stencilBuffer: _.stencil
            }
          );
        } else {
          let J = null, se = null, oe = null;
          _.depth && (oe = _.stencil ? 35056 : 33190, J = _.stencil ? fi : Bn, se = _.stencil ? ci : Fn);
          const V = {
            colorFormat: 32856,
            depthFormat: oe,
            scaleFactor: s
          };
          d = new XRWebGLBinding(i, t), u = d.createProjectionLayer(V), i.updateRenderState({ layers: [u] }), f = new en(
            u.textureWidth,
            u.textureHeight,
            {
              format: Vt,
              type: Gn,
              depthTexture: new Pg(u.textureWidth, u.textureHeight, se, void 0, void 0, void 0, void 0, void 0, void 0, J),
              stencilBuffer: _.stencil,
              encoding: e.outputEncoding,
              samples: _.antialias ? 4 : 0
            }
          );
          const Te = e.properties.get(f);
          Te.__ignoreDepthValues = u.ignoreDepthValues;
        }
        f.isXRRenderTarget = !0, this.setFoveation(c), l = null, r = await i.requestReferenceSpace(o), Z.setContext(i), Z.start(), n.isPresenting = !0, n.dispatchEvent({ type: "sessionstart" });
      }
    };
    function R(W) {
      for (let J = 0; J < W.removed.length; J++) {
        const se = W.removed[J], oe = M.indexOf(se);
        oe >= 0 && (M[oe] = null, v[oe].disconnect(se));
      }
      for (let J = 0; J < W.added.length; J++) {
        const se = W.added[J];
        let oe = M.indexOf(se);
        if (oe === -1) {
          for (let Te = 0; Te < v.length; Te++)
            if (Te >= M.length) {
              M.push(se), oe = Te;
              break;
            } else if (M[Te] === null) {
              M[Te] = se, oe = Te;
              break;
            }
          if (oe === -1)
            break;
        }
        const V = v[oe];
        V && V.connect(se);
      }
    }
    const D = new G(), N = new G();
    function K(W, J, se) {
      D.setFromMatrixPosition(J.matrixWorld), N.setFromMatrixPosition(se.matrixWorld);
      const oe = D.distanceTo(N), V = J.projectionMatrix.elements, Te = se.projectionMatrix.elements, be = V[14] / (V[10] - 1), re = V[14] / (V[10] + 1), ye = (V[9] + 1) / V[5], Be = (V[9] - 1) / V[5], _e = (V[8] - 1) / V[0], Re = (Te[8] + 1) / Te[0], rt = be * _e, ct = be * Re, ot = oe / (-_e + Re), Qe = ot * -_e;
      J.matrixWorld.decompose(W.position, W.quaternion, W.scale), W.translateX(Qe), W.translateZ(ot), W.matrixWorld.compose(W.position, W.quaternion, W.scale), W.matrixWorldInverse.copy(W.matrixWorld).invert();
      const Ge = be + ot, Ye = re + ot, vt = rt - Qe, A = ct + (oe - Qe), b = ye * re / Ye * Ge, q = Be * re / Ye * Ge;
      W.projectionMatrix.makePerspective(vt, A, b, q, Ge, Ye), W.projectionMatrixInverse.copy(W.projectionMatrix).invert();
    }
    function B(W, J) {
      J === null ? W.matrixWorld.copy(W.matrix) : W.matrixWorld.multiplyMatrices(J.matrixWorld, W.matrix), W.matrixWorldInverse.copy(W.matrixWorld).invert();
    }
    this.updateCamera = function(W) {
      if (i === null)
        return;
      S.near = P.near = C.near = W.near, S.far = P.far = C.far = W.far, (T !== S.near || O !== S.far) && (i.updateRenderState({
        depthNear: S.near,
        depthFar: S.far
      }), T = S.near, O = S.far);
      const J = W.parent, se = S.cameras;
      B(S, J);
      for (let oe = 0; oe < se.length; oe++)
        B(se[oe], J);
      se.length === 2 ? K(S, C, P) : S.projectionMatrix.copy(C.projectionMatrix), H(W, S, J);
    };
    function H(W, J, se) {
      se === null ? W.matrix.copy(J.matrixWorld) : (W.matrix.copy(se.matrixWorld), W.matrix.invert(), W.matrix.multiply(J.matrixWorld)), W.matrix.decompose(W.position, W.quaternion, W.scale), W.updateMatrixWorld(!0);
      const oe = W.children;
      for (let V = 0, Te = oe.length; V < Te; V++)
        oe[V].updateMatrixWorld(!0);
      W.projectionMatrix.copy(J.projectionMatrix), W.projectionMatrixInverse.copy(J.projectionMatrixInverse), W.isPerspectiveCamera && (W.fov = pr * 2 * Math.atan(1 / W.projectionMatrix.elements[5]), W.zoom = 1);
    }
    this.getCamera = function() {
      return S;
    }, this.getFoveation = function() {
      if (!(u === null && p === null))
        return c;
    }, this.setFoveation = function(W) {
      c = W, u !== null && (u.fixedFoveation = W), p !== null && p.fixedFoveation !== void 0 && (p.fixedFoveation = W);
    }, this.getPlanes = function() {
      return y;
    };
    let Q = null;
    function ce(W, J) {
      if (h = J.getViewerPose(l || r), g = J, h !== null) {
        const se = h.views;
        p !== null && (e.setRenderTargetFramebuffer(f, p.framebuffer), e.setRenderTarget(f));
        let oe = !1;
        se.length !== S.cameras.length && (S.cameras.length = 0, oe = !0);
        for (let V = 0; V < se.length; V++) {
          const Te = se[V];
          let be = null;
          if (p !== null)
            be = p.getViewport(Te);
          else {
            const ye = d.getViewSubImage(u, Te);
            be = ye.viewport, V === 0 && (e.setRenderTargetTextures(
              f,
              ye.colorTexture,
              u.ignoreDepthValues ? void 0 : ye.depthStencilTexture
            ), e.setRenderTarget(f));
          }
          let re = I[V];
          re === void 0 && (re = new It(), re.layers.enable(V), re.viewport = new tt(), I[V] = re), re.matrix.fromArray(Te.transform.matrix), re.matrix.decompose(re.position, re.quaternion, re.scale), re.projectionMatrix.fromArray(Te.projectionMatrix), re.projectionMatrixInverse.copy(re.projectionMatrix).invert(), re.viewport.set(be.x, be.y, be.width, be.height), V === 0 && (S.matrix.copy(re.matrix), S.matrix.decompose(S.position, S.quaternion, S.scale)), oe === !0 && S.cameras.push(re);
        }
      }
      for (let se = 0; se < v.length; se++) {
        const oe = M[se], V = v[se];
        oe !== null && V !== void 0 && V.update(oe, J, l || r);
      }
      if (Q && Q(W, J), J.detectedPlanes) {
        n.dispatchEvent({ type: "planesdetected", data: J.detectedPlanes });
        let se = null;
        for (const oe of y)
          J.detectedPlanes.has(oe) || (se === null && (se = []), se.push(oe));
        if (se !== null)
          for (const oe of se)
            y.delete(oe), w.delete(oe), n.dispatchEvent({ type: "planeremoved", data: oe });
        for (const oe of J.detectedPlanes)
          if (!y.has(oe))
            y.add(oe), w.set(oe, J.lastChangedTime), n.dispatchEvent({ type: "planeadded", data: oe });
          else {
            const V = w.get(oe);
            oe.lastChangedTime > V && (w.set(oe, oe.lastChangedTime), n.dispatchEvent({ type: "planechanged", data: oe }));
          }
      }
      g = null;
    }
    const Z = new qa();
    Z.setAnimationLoop(ce), this.setAnimationLoop = function(W) {
      Q = W;
    }, this.dispose = function() {
    };
  }
}
function Dg(a, e) {
  function t(m, f) {
    m.matrixAutoUpdate === !0 && m.updateMatrix(), f.value.copy(m.matrix);
  }
  function n(m, f) {
    f.color.getRGB(m.fogColor.value, Va(a)), f.isFog ? (m.fogNear.value = f.near, m.fogFar.value = f.far) : f.isFogExp2 && (m.fogDensity.value = f.density);
  }
  function i(m, f, v, M, y) {
    f.isMeshBasicMaterial || f.isMeshLambertMaterial ? s(m, f) : f.isMeshToonMaterial ? (s(m, f), d(m, f)) : f.isMeshPhongMaterial ? (s(m, f), h(m, f)) : f.isMeshStandardMaterial ? (s(m, f), u(m, f), f.isMeshPhysicalMaterial && p(m, f, y)) : f.isMeshMatcapMaterial ? (s(m, f), g(m, f)) : f.isMeshDepthMaterial ? s(m, f) : f.isMeshDistanceMaterial ? (s(m, f), _(m, f)) : f.isMeshNormalMaterial ? s(m, f) : f.isLineBasicMaterial ? (r(m, f), f.isLineDashedMaterial && o(m, f)) : f.isPointsMaterial ? c(m, f, v, M) : f.isSpriteMaterial ? l(m, f) : f.isShadowMaterial ? (m.color.value.copy(f.color), m.opacity.value = f.opacity) : f.isShaderMaterial && (f.uniformsNeedUpdate = !1);
  }
  function s(m, f) {
    m.opacity.value = f.opacity, f.color && m.diffuse.value.copy(f.color), f.emissive && m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity), f.map && (m.map.value = f.map, t(f.map, m.mapTransform)), f.alphaMap && (m.alphaMap.value = f.alphaMap, t(f.alphaMap, m.alphaMapTransform)), f.bumpMap && (m.bumpMap.value = f.bumpMap, t(f.bumpMap, m.bumpMapTransform), m.bumpScale.value = f.bumpScale, f.side === yt && (m.bumpScale.value *= -1)), f.normalMap && (m.normalMap.value = f.normalMap, t(f.normalMap, m.normalMapTransform), m.normalScale.value.copy(f.normalScale), f.side === yt && m.normalScale.value.negate()), f.displacementMap && (m.displacementMap.value = f.displacementMap, t(f.displacementMap, m.displacementMapTransform), m.displacementScale.value = f.displacementScale, m.displacementBias.value = f.displacementBias), f.emissiveMap && (m.emissiveMap.value = f.emissiveMap, t(f.emissiveMap, m.emissiveMapTransform)), f.specularMap && (m.specularMap.value = f.specularMap, t(f.specularMap, m.specularMapTransform)), f.alphaTest > 0 && (m.alphaTest.value = f.alphaTest);
    const v = e.get(f).envMap;
    if (v && (m.envMap.value = v, m.flipEnvMap.value = v.isCubeTexture && v.isRenderTargetTexture === !1 ? -1 : 1, m.reflectivity.value = f.reflectivity, m.ior.value = f.ior, m.refractionRatio.value = f.refractionRatio), f.lightMap) {
      m.lightMap.value = f.lightMap;
      const M = a.useLegacyLights === !0 ? Math.PI : 1;
      m.lightMapIntensity.value = f.lightMapIntensity * M, t(f.lightMap, m.lightMapTransform);
    }
    f.aoMap && (m.aoMap.value = f.aoMap, m.aoMapIntensity.value = f.aoMapIntensity, t(f.aoMap, m.aoMapTransform));
  }
  function r(m, f) {
    m.diffuse.value.copy(f.color), m.opacity.value = f.opacity, f.map && (m.map.value = f.map, t(f.map, m.mapTransform));
  }
  function o(m, f) {
    m.dashSize.value = f.dashSize, m.totalSize.value = f.dashSize + f.gapSize, m.scale.value = f.scale;
  }
  function c(m, f, v, M) {
    m.diffuse.value.copy(f.color), m.opacity.value = f.opacity, m.size.value = f.size * v, m.scale.value = M * 0.5, f.map && (m.map.value = f.map, t(f.map, m.uvTransform)), f.alphaMap && (m.alphaMap.value = f.alphaMap), f.alphaTest > 0 && (m.alphaTest.value = f.alphaTest);
  }
  function l(m, f) {
    m.diffuse.value.copy(f.color), m.opacity.value = f.opacity, m.rotation.value = f.rotation, f.map && (m.map.value = f.map, t(f.map, m.mapTransform)), f.alphaMap && (m.alphaMap.value = f.alphaMap), f.alphaTest > 0 && (m.alphaTest.value = f.alphaTest);
  }
  function h(m, f) {
    m.specular.value.copy(f.specular), m.shininess.value = Math.max(f.shininess, 1e-4);
  }
  function d(m, f) {
    f.gradientMap && (m.gradientMap.value = f.gradientMap);
  }
  function u(m, f) {
    m.metalness.value = f.metalness, f.metalnessMap && (m.metalnessMap.value = f.metalnessMap, t(f.metalnessMap, m.metalnessMapTransform)), m.roughness.value = f.roughness, f.roughnessMap && (m.roughnessMap.value = f.roughnessMap, t(f.roughnessMap, m.roughnessMapTransform)), e.get(f).envMap && (m.envMapIntensity.value = f.envMapIntensity);
  }
  function p(m, f, v) {
    m.ior.value = f.ior, f.sheen > 0 && (m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen), m.sheenRoughness.value = f.sheenRoughness, f.sheenColorMap && (m.sheenColorMap.value = f.sheenColorMap, t(f.sheenColorMap, m.sheenColorMapTransform)), f.sheenRoughnessMap && (m.sheenRoughnessMap.value = f.sheenRoughnessMap, t(f.sheenRoughnessMap, m.sheenRoughnessMapTransform))), f.clearcoat > 0 && (m.clearcoat.value = f.clearcoat, m.clearcoatRoughness.value = f.clearcoatRoughness, f.clearcoatMap && (m.clearcoatMap.value = f.clearcoatMap, t(f.clearcoatMap, m.clearcoatMapTransform)), f.clearcoatRoughnessMap && (m.clearcoatRoughnessMap.value = f.clearcoatRoughnessMap, t(f.clearcoatRoughnessMap, m.clearcoatRoughnessMapTransform)), f.clearcoatNormalMap && (m.clearcoatNormalMap.value = f.clearcoatNormalMap, t(f.clearcoatNormalMap, m.clearcoatNormalMapTransform), m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale), f.side === yt && m.clearcoatNormalScale.value.negate())), f.iridescence > 0 && (m.iridescence.value = f.iridescence, m.iridescenceIOR.value = f.iridescenceIOR, m.iridescenceThicknessMinimum.value = f.iridescenceThicknessRange[0], m.iridescenceThicknessMaximum.value = f.iridescenceThicknessRange[1], f.iridescenceMap && (m.iridescenceMap.value = f.iridescenceMap, t(f.iridescenceMap, m.iridescenceMapTransform)), f.iridescenceThicknessMap && (m.iridescenceThicknessMap.value = f.iridescenceThicknessMap, t(f.iridescenceThicknessMap, m.iridescenceThicknessMapTransform))), f.transmission > 0 && (m.transmission.value = f.transmission, m.transmissionSamplerMap.value = v.texture, m.transmissionSamplerSize.value.set(v.width, v.height), f.transmissionMap && (m.transmissionMap.value = f.transmissionMap, t(f.transmissionMap, m.transmissionMapTransform)), m.thickness.value = f.thickness, f.thicknessMap && (m.thicknessMap.value = f.thicknessMap, t(f.thicknessMap, m.thicknessMapTransform)), m.attenuationDistance.value = f.attenuationDistance, m.attenuationColor.value.copy(f.attenuationColor)), m.specularIntensity.value = f.specularIntensity, m.specularColor.value.copy(f.specularColor), f.specularColorMap && (m.specularColorMap.value = f.specularColorMap, t(f.specularColorMap, m.specularColorMapTransform)), f.specularIntensityMap && (m.specularIntensityMap.value = f.specularIntensityMap, t(f.specularIntensityMap, m.specularIntensityMapTransform));
  }
  function g(m, f) {
    f.matcap && (m.matcap.value = f.matcap);
  }
  function _(m, f) {
    const v = e.get(f).light;
    m.referencePosition.value.setFromMatrixPosition(v.matrixWorld), m.nearDistance.value = v.shadow.camera.near, m.farDistance.value = v.shadow.camera.far;
  }
  return {
    refreshFogUniforms: n,
    refreshMaterialUniforms: i
  };
}
function Ig(a, e, t, n) {
  let i = {}, s = {}, r = [];
  const o = t.isWebGL2 ? a.getParameter(35375) : 0;
  function c(v, M) {
    const y = M.program;
    n.uniformBlockBinding(v, y);
  }
  function l(v, M) {
    let y = i[v.id];
    y === void 0 && (g(v), y = h(v), i[v.id] = y, v.addEventListener("dispose", m));
    const w = M.program;
    n.updateUBOMapping(v, w);
    const C = e.render.frame;
    s[v.id] !== C && (u(v), s[v.id] = C);
  }
  function h(v) {
    const M = d();
    v.__bindingPointIndex = M;
    const y = a.createBuffer(), w = v.__size, C = v.usage;
    return a.bindBuffer(35345, y), a.bufferData(35345, w, C), a.bindBuffer(35345, null), a.bindBufferBase(35345, M, y), y;
  }
  function d() {
    for (let v = 0; v < o; v++)
      if (r.indexOf(v) === -1)
        return r.push(v), v;
    return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."), 0;
  }
  function u(v) {
    const M = i[v.id], y = v.uniforms, w = v.__cache;
    a.bindBuffer(35345, M);
    for (let C = 0, P = y.length; C < P; C++) {
      const I = y[C];
      if (p(I, C, w) === !0) {
        const S = I.__offset, T = Array.isArray(I.value) ? I.value : [I.value];
        let O = 0;
        for (let k = 0; k < T.length; k++) {
          const L = T[k], R = _(L);
          typeof L == "number" ? (I.__data[0] = L, a.bufferSubData(35345, S + O, I.__data)) : L.isMatrix3 ? (I.__data[0] = L.elements[0], I.__data[1] = L.elements[1], I.__data[2] = L.elements[2], I.__data[3] = L.elements[0], I.__data[4] = L.elements[3], I.__data[5] = L.elements[4], I.__data[6] = L.elements[5], I.__data[7] = L.elements[0], I.__data[8] = L.elements[6], I.__data[9] = L.elements[7], I.__data[10] = L.elements[8], I.__data[11] = L.elements[0]) : (L.toArray(I.__data, O), O += R.storage / Float32Array.BYTES_PER_ELEMENT);
        }
        a.bufferSubData(35345, S, I.__data);
      }
    }
    a.bindBuffer(35345, null);
  }
  function p(v, M, y) {
    const w = v.value;
    if (y[M] === void 0) {
      if (typeof w == "number")
        y[M] = w;
      else {
        const C = Array.isArray(w) ? w : [w], P = [];
        for (let I = 0; I < C.length; I++)
          P.push(C[I].clone());
        y[M] = P;
      }
      return !0;
    } else if (typeof w == "number") {
      if (y[M] !== w)
        return y[M] = w, !0;
    } else {
      const C = Array.isArray(y[M]) ? y[M] : [y[M]], P = Array.isArray(w) ? w : [w];
      for (let I = 0; I < C.length; I++) {
        const S = C[I];
        if (S.equals(P[I]) === !1)
          return S.copy(P[I]), !0;
      }
    }
    return !1;
  }
  function g(v) {
    const M = v.uniforms;
    let y = 0;
    const w = 16;
    let C = 0;
    for (let P = 0, I = M.length; P < I; P++) {
      const S = M[P], T = {
        boundary: 0,
        // bytes
        storage: 0
        // bytes
      }, O = Array.isArray(S.value) ? S.value : [S.value];
      for (let k = 0, L = O.length; k < L; k++) {
        const R = O[k], D = _(R);
        T.boundary += D.boundary, T.storage += D.storage;
      }
      if (S.__data = new Float32Array(T.storage / Float32Array.BYTES_PER_ELEMENT), S.__offset = y, P > 0) {
        C = y % w;
        const k = w - C;
        C !== 0 && k - T.boundary < 0 && (y += w - C, S.__offset = y);
      }
      y += T.storage;
    }
    return C = y % w, C > 0 && (y += w - C), v.__size = y, v.__cache = {}, this;
  }
  function _(v) {
    const M = {
      boundary: 0,
      // bytes
      storage: 0
      // bytes
    };
    return typeof v == "number" ? (M.boundary = 4, M.storage = 4) : v.isVector2 ? (M.boundary = 8, M.storage = 8) : v.isVector3 || v.isColor ? (M.boundary = 16, M.storage = 12) : v.isVector4 ? (M.boundary = 16, M.storage = 16) : v.isMatrix3 ? (M.boundary = 48, M.storage = 48) : v.isMatrix4 ? (M.boundary = 64, M.storage = 64) : v.isTexture ? console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group.") : console.warn("THREE.WebGLRenderer: Unsupported uniform value type.", v), M;
  }
  function m(v) {
    const M = v.target;
    M.removeEventListener("dispose", m);
    const y = r.indexOf(M.__bindingPointIndex);
    r.splice(y, 1), a.deleteBuffer(i[M.id]), delete i[M.id], delete s[M.id];
  }
  function f() {
    for (const v in i)
      a.deleteBuffer(i[v]);
    r = [], i = {}, s = {};
  }
  return {
    bind: c,
    update: l,
    dispose: f
  };
}
function Ug() {
  const a = ps("canvas");
  return a.style.display = "block", a;
}
class Za {
  constructor(e = {}) {
    const {
      canvas: t = Ug(),
      context: n = null,
      depth: i = !0,
      stencil: s = !0,
      alpha: r = !1,
      antialias: o = !1,
      premultipliedAlpha: c = !0,
      preserveDrawingBuffer: l = !1,
      powerPreference: h = "default",
      failIfMajorPerformanceCaveat: d = !1
    } = e;
    this.isWebGLRenderer = !0;
    let u;
    n !== null ? u = n.getContextAttributes().alpha : u = r;
    let p = null, g = null;
    const _ = [], m = [];
    this.domElement = t, this.debug = {
      /**
       * Enables error checking and reporting when shader programs are being compiled
       * @type {boolean}
       */
      checkShaderErrors: !0,
      /**
       * Callback for custom error reporting.
       * @type {?Function}
       */
      onShaderError: null
    }, this.autoClear = !0, this.autoClearColor = !0, this.autoClearDepth = !0, this.autoClearStencil = !0, this.sortObjects = !0, this.clippingPlanes = [], this.localClippingEnabled = !1, this.outputEncoding = Vn, this.useLegacyLights = !0, this.toneMapping = pn, this.toneMappingExposure = 1;
    const f = this;
    let v = !1, M = 0, y = 0, w = null, C = -1, P = null;
    const I = new tt(), S = new tt();
    let T = null, O = t.width, k = t.height, L = 1, R = null, D = null;
    const N = new tt(0, 0, O, k), K = new tt(0, 0, O, k);
    let B = !1;
    const H = new Sr();
    let Q = !1, ce = !1, Z = null;
    const W = new nt(), J = new G(), se = { background: null, fog: null, environment: null, overrideMaterial: null, isScene: !0 };
    function oe() {
      return w === null ? L : 1;
    }
    let V = n;
    function Te(E, F) {
      for (let X = 0; X < E.length; X++) {
        const z = E[X], $ = t.getContext(z, F);
        if ($ !== null)
          return $;
      }
      return null;
    }
    try {
      const E = {
        alpha: !0,
        depth: i,
        stencil: s,
        antialias: o,
        premultipliedAlpha: c,
        preserveDrawingBuffer: l,
        powerPreference: h,
        failIfMajorPerformanceCaveat: d
      };
      if ("setAttribute" in t && t.setAttribute("data-engine", `three.js r${xr}`), t.addEventListener("webglcontextlost", me, !1), t.addEventListener("webglcontextrestored", Ue, !1), t.addEventListener("webglcontextcreationerror", Ve, !1), V === null) {
        const F = ["webgl2", "webgl", "experimental-webgl"];
        if (f.isWebGL1Renderer === !0 && F.shift(), V = Te(F, E), V === null)
          throw Te(F) ? new Error("Error creating WebGL context with your selected attributes.") : new Error("Error creating WebGL context.");
      }
      V.getShaderPrecisionFormat === void 0 && (V.getShaderPrecisionFormat = function() {
        return { rangeMin: 1, rangeMax: 1, precision: 1 };
      });
    } catch (E) {
      throw console.error("THREE.WebGLRenderer: " + E.message), E;
    }
    let be, re, ye, Be, _e, Re, rt, ct, ot, Qe, Ge, Ye, vt, A, b, q, te, ne, ae, Se, de, Y, pe, ve;
    function Me() {
      be = new qp(V), re = new Bp(V, be, e), be.init(re), Y = new Ag(V, be, re), ye = new Eg(V, be, re), Be = new Yp(), _e = new ug(), Re = new Tg(V, be, ye, _e, re, Y, Be), rt = new Vp(f), ct = new Wp(f), ot = new rd(V, re), pe = new Fp(V, be, ot, re), Qe = new Xp(V, ot, Be, pe), Ge = new Jp(V, Qe, ot, Be), ae = new Kp(V, re, Re), q = new Gp(_e), Ye = new hg(f, rt, ct, be, re, pe, q), vt = new Dg(f, _e), A = new fg(), b = new xg(be, re), ne = new zp(f, rt, ct, ye, Ge, u, c), te = new bg(f, Ge, re), ve = new Ig(V, Be, re, ye), Se = new Op(V, be, Be, re), de = new jp(V, be, Be, re), Be.programs = Ye.programs, f.capabilities = re, f.extensions = be, f.properties = _e, f.renderLists = A, f.shadowMap = te, f.state = ye, f.info = Be;
    }
    Me();
    const ue = new Rg(f, V);
    this.xr = ue, this.getContext = function() {
      return V;
    }, this.getContextAttributes = function() {
      return V.getContextAttributes();
    }, this.forceContextLoss = function() {
      const E = be.get("WEBGL_lose_context");
      E && E.loseContext();
    }, this.forceContextRestore = function() {
      const E = be.get("WEBGL_lose_context");
      E && E.restoreContext();
    }, this.getPixelRatio = function() {
      return L;
    }, this.setPixelRatio = function(E) {
      E !== void 0 && (L = E, this.setSize(O, k, !1));
    }, this.getSize = function(E) {
      return E.set(O, k);
    }, this.setSize = function(E, F, X = !0) {
      if (ue.isPresenting) {
        console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");
        return;
      }
      O = E, k = F, t.width = Math.floor(E * L), t.height = Math.floor(F * L), X === !0 && (t.style.width = E + "px", t.style.height = F + "px"), this.setViewport(0, 0, E, F);
    }, this.getDrawingBufferSize = function(E) {
      return E.set(O * L, k * L).floor();
    }, this.setDrawingBufferSize = function(E, F, X) {
      O = E, k = F, L = X, t.width = Math.floor(E * X), t.height = Math.floor(F * X), this.setViewport(0, 0, E, F);
    }, this.getCurrentViewport = function(E) {
      return E.copy(I);
    }, this.getViewport = function(E) {
      return E.copy(N);
    }, this.setViewport = function(E, F, X, z) {
      E.isVector4 ? N.set(E.x, E.y, E.z, E.w) : N.set(E, F, X, z), ye.viewport(I.copy(N).multiplyScalar(L).floor());
    }, this.getScissor = function(E) {
      return E.copy(K);
    }, this.setScissor = function(E, F, X, z) {
      E.isVector4 ? K.set(E.x, E.y, E.z, E.w) : K.set(E, F, X, z), ye.scissor(S.copy(K).multiplyScalar(L).floor());
    }, this.getScissorTest = function() {
      return B;
    }, this.setScissorTest = function(E) {
      ye.setScissorTest(B = E);
    }, this.setOpaqueSort = function(E) {
      R = E;
    }, this.setTransparentSort = function(E) {
      D = E;
    }, this.getClearColor = function(E) {
      return E.copy(ne.getClearColor());
    }, this.setClearColor = function() {
      ne.setClearColor.apply(ne, arguments);
    }, this.getClearAlpha = function() {
      return ne.getClearAlpha();
    }, this.setClearAlpha = function() {
      ne.setClearAlpha.apply(ne, arguments);
    }, this.clear = function(E = !0, F = !0, X = !0) {
      let z = 0;
      E && (z |= 16384), F && (z |= 256), X && (z |= 1024), V.clear(z);
    }, this.clearColor = function() {
      this.clear(!0, !1, !1);
    }, this.clearDepth = function() {
      this.clear(!1, !0, !1);
    }, this.clearStencil = function() {
      this.clear(!1, !1, !0);
    }, this.dispose = function() {
      t.removeEventListener("webglcontextlost", me, !1), t.removeEventListener("webglcontextrestored", Ue, !1), t.removeEventListener("webglcontextcreationerror", Ve, !1), A.dispose(), b.dispose(), _e.dispose(), rt.dispose(), ct.dispose(), Ge.dispose(), pe.dispose(), ve.dispose(), Ye.dispose(), ue.dispose(), ue.removeEventListener("sessionstart", ge), ue.removeEventListener("sessionend", We), Z && (Z.dispose(), Z = null), je.stop();
    };
    function me(E) {
      E.preventDefault(), console.log("THREE.WebGLRenderer: Context Lost."), v = !0;
    }
    function Ue() {
      console.log("THREE.WebGLRenderer: Context Restored."), v = !1;
      const E = Be.autoReset, F = te.enabled, X = te.autoUpdate, z = te.needsUpdate, $ = te.type;
      Me(), Be.autoReset = E, te.enabled = F, te.autoUpdate = X, te.needsUpdate = z, te.type = $;
    }
    function Ve(E) {
      console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ", E.statusMessage);
    }
    function $e(E) {
      const F = E.target;
      F.removeEventListener("dispose", $e), U(F);
    }
    function U(E) {
      j(E), _e.remove(E);
    }
    function j(E) {
      const F = _e.get(E).programs;
      F !== void 0 && (F.forEach(function(X) {
        Ye.releaseProgram(X);
      }), E.isShaderMaterial && Ye.releaseShaderCache(E));
    }
    this.renderBufferDirect = function(E, F, X, z, $, xe) {
      F === null && (F = se);
      const we = $.isMesh && $.matrixWorld.determinant() < 0, Ee = nl(E, F, X, z, $);
      ye.setMaterial(z, we);
      let Ae = X.index, Le = 1;
      z.wireframe === !0 && (Ae = Qe.getWireframeAttribute(X), Le = 2);
      const Pe = X.drawRange, De = X.attributes.position;
      let ke = Pe.start * Le, pt = (Pe.start + Pe.count) * Le;
      xe !== null && (ke = Math.max(ke, xe.start * Le), pt = Math.min(pt, (xe.start + xe.count) * Le)), Ae !== null ? (ke = Math.max(ke, 0), pt = Math.min(pt, Ae.count)) : De != null && (ke = Math.max(ke, 0), pt = Math.min(pt, De.count));
      const Ut = pt - ke;
      if (Ut < 0 || Ut === 1 / 0)
        return;
      pe.setup($, z, Ee, X, Ae);
      let En, Ke = Se;
      if (Ae !== null && (En = ot.get(Ae), Ke = de, Ke.setIndex(En)), $.isMesh)
        z.wireframe === !0 ? (ye.setLineWidth(z.wireframeLinewidth * oe()), Ke.setMode(1)) : Ke.setMode(4);
      else if ($.isLine) {
        let Ne = z.linewidth;
        Ne === void 0 && (Ne = 1), ye.setLineWidth(Ne * oe()), $.isLineSegments ? Ke.setMode(1) : $.isLineLoop ? Ke.setMode(2) : Ke.setMode(3);
      } else
        $.isPoints ? Ke.setMode(0) : $.isSprite && Ke.setMode(4);
      if ($.isInstancedMesh)
        Ke.renderInstances(ke, Ut, $.count);
      else if (X.isInstancedBufferGeometry) {
        const Ne = X._maxInstanceCount !== void 0 ? X._maxInstanceCount : 1 / 0, ys = Math.min(X.instanceCount, Ne);
        Ke.renderInstances(ke, Ut, ys);
      } else
        Ke.render(ke, Ut);
    }, this.compile = function(E, F) {
      function X(z, $, xe) {
        z.transparent === !0 && z.side === fn && z.forceSinglePass === !1 ? (z.side = yt, z.needsUpdate = !0, Oi(z, $, xe), z.side = wn, z.needsUpdate = !0, Oi(z, $, xe), z.side = fn) : Oi(z, $, xe);
      }
      g = b.get(E), g.init(), m.push(g), E.traverseVisible(function(z) {
        z.isLight && z.layers.test(F.layers) && (g.pushLight(z), z.castShadow && g.pushShadow(z));
      }), g.setupLights(f.useLegacyLights), E.traverse(function(z) {
        const $ = z.material;
        if ($)
          if (Array.isArray($))
            for (let xe = 0; xe < $.length; xe++) {
              const we = $[xe];
              X(we, E, z);
            }
          else
            X($, E, z);
      }), m.pop(), g = null;
    };
    let ee = null;
    function le(E) {
      ee && ee(E);
    }
    function ge() {
      je.stop();
    }
    function We() {
      je.start();
    }
    const je = new qa();
    je.setAnimationLoop(le), typeof self < "u" && je.setContext(self), this.setAnimationLoop = function(E) {
      ee = E, ue.setAnimationLoop(E), E === null ? je.stop() : je.start();
    }, ue.addEventListener("sessionstart", ge), ue.addEventListener("sessionend", We), this.render = function(E, F) {
      if (F !== void 0 && F.isCamera !== !0) {
        console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");
        return;
      }
      if (v === !0)
        return;
      E.matrixWorldAutoUpdate === !0 && E.updateMatrixWorld(), F.parent === null && F.matrixWorldAutoUpdate === !0 && F.updateMatrixWorld(), ue.enabled === !0 && ue.isPresenting === !0 && (ue.cameraAutoUpdate === !0 && ue.updateCamera(F), F = ue.getCamera()), E.isScene === !0 && E.onBeforeRender(f, E, F, w), g = b.get(E, m.length), g.init(), m.push(g), W.multiplyMatrices(F.projectionMatrix, F.matrixWorldInverse), H.setFromProjectionMatrix(W), ce = this.localClippingEnabled, Q = q.init(this.clippingPlanes, ce), p = A.get(E, _.length), p.init(), _.push(p), ut(E, F, 0, f.sortObjects), p.finish(), f.sortObjects === !0 && p.sort(R, D), Q === !0 && q.beginShadows();
      const X = g.state.shadowsArray;
      if (te.render(X, E, F), Q === !0 && q.endShadows(), this.info.autoReset === !0 && this.info.reset(), ne.render(p, E), g.setupLights(f.useLegacyLights), F.isArrayCamera) {
        const z = F.cameras;
        for (let $ = 0, xe = z.length; $ < xe; $++) {
          const we = z[$];
          gn(p, E, we, we.viewport);
        }
      } else
        gn(p, E, F);
      w !== null && (Re.updateMultisampleRenderTarget(w), Re.updateRenderTargetMipmap(w)), E.isScene === !0 && E.onAfterRender(f, E, F), pe.resetDefaultState(), C = -1, P = null, m.pop(), m.length > 0 ? g = m[m.length - 1] : g = null, _.pop(), _.length > 0 ? p = _[_.length - 1] : p = null;
    };
    function ut(E, F, X, z) {
      if (E.visible === !1)
        return;
      if (E.layers.test(F.layers)) {
        if (E.isGroup)
          X = E.renderOrder;
        else if (E.isLOD)
          E.autoUpdate === !0 && E.update(F);
        else if (E.isLight)
          g.pushLight(E), E.castShadow && g.pushShadow(E);
        else if (E.isSprite) {
          if (!E.frustumCulled || H.intersectsSprite(E)) {
            z && J.setFromMatrixPosition(E.matrixWorld).applyMatrix4(W);
            const we = Ge.update(E), Ee = E.material;
            Ee.visible && p.push(E, we, Ee, X, J.z, null);
          }
        } else if ((E.isMesh || E.isLine || E.isPoints) && (E.isSkinnedMesh && E.skeleton.frame !== Be.render.frame && (E.skeleton.update(), E.skeleton.frame = Be.render.frame), !E.frustumCulled || H.intersectsObject(E))) {
          z && J.setFromMatrixPosition(E.matrixWorld).applyMatrix4(W);
          const we = Ge.update(E), Ee = E.material;
          if (Array.isArray(Ee)) {
            const Ae = we.groups;
            for (let Le = 0, Pe = Ae.length; Le < Pe; Le++) {
              const De = Ae[Le], ke = Ee[De.materialIndex];
              ke && ke.visible && p.push(E, we, ke, X, J.z, De);
            }
          } else
            Ee.visible && p.push(E, we, Ee, X, J.z, null);
        }
      }
      const xe = E.children;
      for (let we = 0, Ee = xe.length; we < Ee; we++)
        ut(xe[we], F, X, z);
    }
    function gn(E, F, X, z) {
      const $ = E.opaque, xe = E.transmissive, we = E.transparent;
      g.setupLightsView(X), Q === !0 && q.setGlobalState(f.clippingPlanes, X), xe.length > 0 && Ze($, xe, F, X), z && ye.viewport(I.copy(z)), $.length > 0 && Pt($, F, X), xe.length > 0 && Pt(xe, F, X), we.length > 0 && Pt(we, F, X), ye.buffers.depth.setTest(!0), ye.buffers.depth.setMask(!0), ye.buffers.color.setMask(!0), ye.setPolygonOffset(!1);
    }
    function Ze(E, F, X, z) {
      if (Z === null) {
        const Ee = re.isWebGL2;
        Z = new en(1024, 1024, {
          generateMipmaps: !0,
          type: be.has("EXT_color_buffer_half_float") ? Di : Gn,
          minFilter: Ri,
          samples: Ee && o === !0 ? 4 : 0
        });
      }
      const $ = f.getRenderTarget();
      f.setRenderTarget(Z), f.clear();
      const xe = f.toneMapping;
      f.toneMapping = pn, Pt(E, X, z), Re.updateMultisampleRenderTarget(Z), Re.updateRenderTargetMipmap(Z);
      let we = !1;
      for (let Ee = 0, Ae = F.length; Ee < Ae; Ee++) {
        const Le = F[Ee], Pe = Le.object, De = Le.geometry, ke = Le.material, pt = Le.group;
        if (ke.side === fn && Pe.layers.test(z.layers)) {
          const Ut = ke.side;
          ke.side = yt, ke.needsUpdate = !0, Ht(Pe, X, z, De, ke, pt), ke.side = Ut, ke.needsUpdate = !0, we = !0;
        }
      }
      we === !0 && (Re.updateMultisampleRenderTarget(Z), Re.updateRenderTargetMipmap(Z)), f.setRenderTarget($), f.toneMapping = xe;
    }
    function Pt(E, F, X) {
      const z = F.isScene === !0 ? F.overrideMaterial : null;
      for (let $ = 0, xe = E.length; $ < xe; $++) {
        const we = E[$], Ee = we.object, Ae = we.geometry, Le = z === null ? we.material : z, Pe = we.group;
        Ee.layers.test(X.layers) && Ht(Ee, F, X, Ae, Le, Pe);
      }
    }
    function Ht(E, F, X, z, $, xe) {
      E.onBeforeRender(f, F, X, z, $, xe), E.modelViewMatrix.multiplyMatrices(X.matrixWorldInverse, E.matrixWorld), E.normalMatrix.getNormalMatrix(E.modelViewMatrix), $.onBeforeRender(f, F, X, z, E, xe), $.transparent === !0 && $.side === fn && $.forceSinglePass === !1 ? ($.side = yt, $.needsUpdate = !0, f.renderBufferDirect(X, F, z, $, E, xe), $.side = wn, $.needsUpdate = !0, f.renderBufferDirect(X, F, z, $, E, xe), $.side = fn) : f.renderBufferDirect(X, F, z, $, E, xe), E.onAfterRender(f, F, X, z, $, xe);
    }
    function Oi(E, F, X) {
      F.isScene !== !0 && (F = se);
      const z = _e.get(E), $ = g.state.lights, xe = g.state.shadowsArray, we = $.state.version, Ee = Ye.getParameters(E, $.state, xe, F, X), Ae = Ye.getProgramCacheKey(Ee);
      let Le = z.programs;
      z.environment = E.isMeshStandardMaterial ? F.environment : null, z.fog = F.fog, z.envMap = (E.isMeshStandardMaterial ? ct : rt).get(E.envMap || z.environment), Le === void 0 && (E.addEventListener("dispose", $e), Le = /* @__PURE__ */ new Map(), z.programs = Le);
      let Pe = Le.get(Ae);
      if (Pe !== void 0) {
        if (z.currentProgram === Pe && z.lightsStateVersion === we)
          return Ar(E, Ee), Pe;
      } else
        Ee.uniforms = Ye.getUniforms(E), E.onBuild(X, Ee, f), E.onBeforeCompile(Ee, f), Pe = Ye.acquireProgram(Ee, Ae), Le.set(Ae, Pe), z.uniforms = Ee.uniforms;
      const De = z.uniforms;
      (!E.isShaderMaterial && !E.isRawShaderMaterial || E.clipping === !0) && (De.clippingPlanes = q.uniform), Ar(E, Ee), z.needsLights = sl(E), z.lightsStateVersion = we, z.needsLights && (De.ambientLightColor.value = $.state.ambient, De.lightProbe.value = $.state.probe, De.directionalLights.value = $.state.directional, De.directionalLightShadows.value = $.state.directionalShadow, De.spotLights.value = $.state.spot, De.spotLightShadows.value = $.state.spotShadow, De.rectAreaLights.value = $.state.rectArea, De.ltc_1.value = $.state.rectAreaLTC1, De.ltc_2.value = $.state.rectAreaLTC2, De.pointLights.value = $.state.point, De.pointLightShadows.value = $.state.pointShadow, De.hemisphereLights.value = $.state.hemi, De.directionalShadowMap.value = $.state.directionalShadowMap, De.directionalShadowMatrix.value = $.state.directionalShadowMatrix, De.spotShadowMap.value = $.state.spotShadowMap, De.spotLightMatrix.value = $.state.spotLightMatrix, De.spotLightMap.value = $.state.spotLightMap, De.pointShadowMap.value = $.state.pointShadowMap, De.pointShadowMatrix.value = $.state.pointShadowMatrix);
      const ke = Pe.getUniforms(), pt = ds.seqWithValue(ke.seq, De);
      return z.currentProgram = Pe, z.uniformsList = pt, Pe;
    }
    function Ar(E, F) {
      const X = _e.get(E);
      X.outputEncoding = F.outputEncoding, X.instancing = F.instancing, X.skinning = F.skinning, X.morphTargets = F.morphTargets, X.morphNormals = F.morphNormals, X.morphColors = F.morphColors, X.morphTargetsCount = F.morphTargetsCount, X.numClippingPlanes = F.numClippingPlanes, X.numIntersection = F.numClipIntersection, X.vertexAlphas = F.vertexAlphas, X.vertexTangents = F.vertexTangents, X.toneMapping = F.toneMapping;
    }
    function nl(E, F, X, z, $) {
      F.isScene !== !0 && (F = se), Re.resetTextureUnits();
      const xe = F.fog, we = z.isMeshStandardMaterial ? F.environment : null, Ee = w === null ? f.outputEncoding : w.isXRRenderTarget === !0 ? w.texture.encoding : Vn, Ae = (z.isMeshStandardMaterial ? ct : rt).get(z.envMap || we), Le = z.vertexColors === !0 && !!X.attributes.color && X.attributes.color.itemSize === 4, Pe = !!z.normalMap && !!X.attributes.tangent, De = !!X.morphAttributes.position, ke = !!X.morphAttributes.normal, pt = !!X.morphAttributes.color, Ut = z.toneMapped ? f.toneMapping : pn, En = X.morphAttributes.position || X.morphAttributes.normal || X.morphAttributes.color, Ke = En !== void 0 ? En.length : 0, Ne = _e.get(z), ys = g.state.lights;
      if (Q === !0 && (ce === !0 || E !== P)) {
        const St = E === P && z.id === C;
        q.setState(z, E, St);
      }
      let at = !1;
      z.version === Ne.__version ? (Ne.needsLights && Ne.lightsStateVersion !== ys.state.version || Ne.outputEncoding !== Ee || $.isInstancedMesh && Ne.instancing === !1 || !$.isInstancedMesh && Ne.instancing === !0 || $.isSkinnedMesh && Ne.skinning === !1 || !$.isSkinnedMesh && Ne.skinning === !0 || Ne.envMap !== Ae || z.fog === !0 && Ne.fog !== xe || Ne.numClippingPlanes !== void 0 && (Ne.numClippingPlanes !== q.numPlanes || Ne.numIntersection !== q.numIntersection) || Ne.vertexAlphas !== Le || Ne.vertexTangents !== Pe || Ne.morphTargets !== De || Ne.morphNormals !== ke || Ne.morphColors !== pt || Ne.toneMapping !== Ut || re.isWebGL2 === !0 && Ne.morphTargetsCount !== Ke) && (at = !0) : (at = !0, Ne.__version = z.version);
      let Tn = Ne.currentProgram;
      at === !0 && (Tn = Oi(z, F, $));
      let Cr = !1, xi = !1, Ss = !1;
      const mt = Tn.getUniforms(), An = Ne.uniforms;
      if (ye.useProgram(Tn.program) && (Cr = !0, xi = !0, Ss = !0), z.id !== C && (C = z.id, xi = !0), Cr || P !== E) {
        if (mt.setValue(V, "projectionMatrix", E.projectionMatrix), re.logarithmicDepthBuffer && mt.setValue(
          V,
          "logDepthBufFC",
          2 / (Math.log(E.far + 1) / Math.LN2)
        ), P !== E && (P = E, xi = !0, Ss = !0), z.isShaderMaterial || z.isMeshPhongMaterial || z.isMeshToonMaterial || z.isMeshStandardMaterial || z.envMap) {
          const St = mt.map.cameraPosition;
          St !== void 0 && St.setValue(
            V,
            J.setFromMatrixPosition(E.matrixWorld)
          );
        }
        (z.isMeshPhongMaterial || z.isMeshToonMaterial || z.isMeshLambertMaterial || z.isMeshBasicMaterial || z.isMeshStandardMaterial || z.isShaderMaterial) && mt.setValue(V, "isOrthographic", E.isOrthographicCamera === !0), (z.isMeshPhongMaterial || z.isMeshToonMaterial || z.isMeshLambertMaterial || z.isMeshBasicMaterial || z.isMeshStandardMaterial || z.isShaderMaterial || z.isShadowMaterial || $.isSkinnedMesh) && mt.setValue(V, "viewMatrix", E.matrixWorldInverse);
      }
      if ($.isSkinnedMesh) {
        mt.setOptional(V, $, "bindMatrix"), mt.setOptional(V, $, "bindMatrixInverse");
        const St = $.skeleton;
        St && (re.floatVertexTextures ? (St.boneTexture === null && St.computeBoneTexture(), mt.setValue(V, "boneTexture", St.boneTexture, Re), mt.setValue(V, "boneTextureSize", St.boneTextureSize)) : console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."));
      }
      const ws = X.morphAttributes;
      if ((ws.position !== void 0 || ws.normal !== void 0 || ws.color !== void 0 && re.isWebGL2 === !0) && ae.update($, X, Tn), (xi || Ne.receiveShadow !== $.receiveShadow) && (Ne.receiveShadow = $.receiveShadow, mt.setValue(V, "receiveShadow", $.receiveShadow)), z.isMeshGouraudMaterial && z.envMap !== null && (An.envMap.value = Ae, An.flipEnvMap.value = Ae.isCubeTexture && Ae.isRenderTargetTexture === !1 ? -1 : 1), xi && (mt.setValue(V, "toneMappingExposure", f.toneMappingExposure), Ne.needsLights && il(An, Ss), xe && z.fog === !0 && vt.refreshFogUniforms(An, xe), vt.refreshMaterialUniforms(An, z, L, k, Z), ds.upload(V, Ne.uniformsList, An, Re)), z.isShaderMaterial && z.uniformsNeedUpdate === !0 && (ds.upload(V, Ne.uniformsList, An, Re), z.uniformsNeedUpdate = !1), z.isSpriteMaterial && mt.setValue(V, "center", $.center), mt.setValue(V, "modelViewMatrix", $.modelViewMatrix), mt.setValue(V, "normalMatrix", $.normalMatrix), mt.setValue(V, "modelMatrix", $.matrixWorld), z.isShaderMaterial || z.isRawShaderMaterial) {
        const St = z.uniformsGroups;
        for (let bs = 0, rl = St.length; bs < rl; bs++)
          if (re.isWebGL2) {
            const Lr = St[bs];
            ve.update(Lr, Tn), ve.bind(Lr, Tn);
          } else
            console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.");
      }
      return Tn;
    }
    function il(E, F) {
      E.ambientLightColor.needsUpdate = F, E.lightProbe.needsUpdate = F, E.directionalLights.needsUpdate = F, E.directionalLightShadows.needsUpdate = F, E.pointLights.needsUpdate = F, E.pointLightShadows.needsUpdate = F, E.spotLights.needsUpdate = F, E.spotLightShadows.needsUpdate = F, E.rectAreaLights.needsUpdate = F, E.hemisphereLights.needsUpdate = F;
    }
    function sl(E) {
      return E.isMeshLambertMaterial || E.isMeshToonMaterial || E.isMeshPhongMaterial || E.isMeshStandardMaterial || E.isShadowMaterial || E.isShaderMaterial && E.lights === !0;
    }
    this.getActiveCubeFace = function() {
      return M;
    }, this.getActiveMipmapLevel = function() {
      return y;
    }, this.getRenderTarget = function() {
      return w;
    }, this.setRenderTargetTextures = function(E, F, X) {
      _e.get(E.texture).__webglTexture = F, _e.get(E.depthTexture).__webglTexture = X;
      const z = _e.get(E);
      z.__hasExternalTextures = !0, z.__hasExternalTextures && (z.__autoAllocateDepthBuffer = X === void 0, z.__autoAllocateDepthBuffer || be.has("WEBGL_multisampled_render_to_texture") === !0 && (console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"), z.__useRenderToTexture = !1));
    }, this.setRenderTargetFramebuffer = function(E, F) {
      const X = _e.get(E);
      X.__webglFramebuffer = F, X.__useDefaultFramebuffer = F === void 0;
    }, this.setRenderTarget = function(E, F = 0, X = 0) {
      w = E, M = F, y = X;
      let z = !0, $ = null, xe = !1, we = !1;
      if (E) {
        const Ae = _e.get(E);
        Ae.__useDefaultFramebuffer !== void 0 ? (ye.bindFramebuffer(36160, null), z = !1) : Ae.__webglFramebuffer === void 0 ? Re.setupRenderTarget(E) : Ae.__hasExternalTextures && Re.rebindTextures(E, _e.get(E.texture).__webglTexture, _e.get(E.depthTexture).__webglTexture);
        const Le = E.texture;
        (Le.isData3DTexture || Le.isDataArrayTexture || Le.isCompressedArrayTexture) && (we = !0);
        const Pe = _e.get(E).__webglFramebuffer;
        E.isWebGLCubeRenderTarget ? ($ = Pe[F], xe = !0) : re.isWebGL2 && E.samples > 0 && Re.useMultisampledRTT(E) === !1 ? $ = _e.get(E).__webglMultisampledFramebuffer : $ = Pe, I.copy(E.viewport), S.copy(E.scissor), T = E.scissorTest;
      } else
        I.copy(N).multiplyScalar(L).floor(), S.copy(K).multiplyScalar(L).floor(), T = B;
      if (ye.bindFramebuffer(36160, $) && re.drawBuffers && z && ye.drawBuffers(E, $), ye.viewport(I), ye.scissor(S), ye.setScissorTest(T), xe) {
        const Ae = _e.get(E.texture);
        V.framebufferTexture2D(36160, 36064, 34069 + F, Ae.__webglTexture, X);
      } else if (we) {
        const Ae = _e.get(E.texture), Le = F || 0;
        V.framebufferTextureLayer(36160, 36064, Ae.__webglTexture, X || 0, Le);
      }
      C = -1;
    }, this.readRenderTargetPixels = function(E, F, X, z, $, xe, we) {
      if (!(E && E.isWebGLRenderTarget)) {
        console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");
        return;
      }
      let Ee = _e.get(E).__webglFramebuffer;
      if (E.isWebGLCubeRenderTarget && we !== void 0 && (Ee = Ee[we]), Ee) {
        ye.bindFramebuffer(36160, Ee);
        try {
          const Ae = E.texture, Le = Ae.format, Pe = Ae.type;
          if (Le !== Vt && Y.convert(Le) !== V.getParameter(35739)) {
            console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");
            return;
          }
          const De = Pe === Di && (be.has("EXT_color_buffer_half_float") || re.isWebGL2 && be.has("EXT_color_buffer_float"));
          if (Pe !== Gn && Y.convert(Pe) !== V.getParameter(35738) && // Edge and Chrome Mac < 52 (#9513)
          !(Pe === On && (re.isWebGL2 || be.has("OES_texture_float") || be.has("WEBGL_color_buffer_float"))) && // Chrome Mac >= 52 and Firefox
          !De) {
            console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");
            return;
          }
          F >= 0 && F <= E.width - z && X >= 0 && X <= E.height - $ && V.readPixels(F, X, z, $, Y.convert(Le), Y.convert(Pe), xe);
        } finally {
          const Ae = w !== null ? _e.get(w).__webglFramebuffer : null;
          ye.bindFramebuffer(36160, Ae);
        }
      }
    }, this.copyFramebufferToTexture = function(E, F, X = 0) {
      const z = Math.pow(2, -X), $ = Math.floor(F.image.width * z), xe = Math.floor(F.image.height * z);
      Re.setTexture2D(F, 0), V.copyTexSubImage2D(3553, X, 0, 0, E.x, E.y, $, xe), ye.unbindTexture();
    }, this.copyTextureToTexture = function(E, F, X, z = 0) {
      const $ = F.image.width, xe = F.image.height, we = Y.convert(X.format), Ee = Y.convert(X.type);
      Re.setTexture2D(X, 0), V.pixelStorei(37440, X.flipY), V.pixelStorei(37441, X.premultiplyAlpha), V.pixelStorei(3317, X.unpackAlignment), F.isDataTexture ? V.texSubImage2D(3553, z, E.x, E.y, $, xe, we, Ee, F.image.data) : F.isCompressedTexture ? V.compressedTexSubImage2D(3553, z, E.x, E.y, F.mipmaps[0].width, F.mipmaps[0].height, we, F.mipmaps[0].data) : V.texSubImage2D(3553, z, E.x, E.y, we, Ee, F.image), z === 0 && X.generateMipmaps && V.generateMipmap(3553), ye.unbindTexture();
    }, this.copyTextureToTexture3D = function(E, F, X, z, $ = 0) {
      if (f.isWebGL1Renderer) {
        console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");
        return;
      }
      const xe = E.max.x - E.min.x + 1, we = E.max.y - E.min.y + 1, Ee = E.max.z - E.min.z + 1, Ae = Y.convert(z.format), Le = Y.convert(z.type);
      let Pe;
      if (z.isData3DTexture)
        Re.setTexture3D(z, 0), Pe = 32879;
      else if (z.isDataArrayTexture)
        Re.setTexture2DArray(z, 0), Pe = 35866;
      else {
        console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");
        return;
      }
      V.pixelStorei(37440, z.flipY), V.pixelStorei(37441, z.premultiplyAlpha), V.pixelStorei(3317, z.unpackAlignment);
      const De = V.getParameter(3314), ke = V.getParameter(32878), pt = V.getParameter(3316), Ut = V.getParameter(3315), En = V.getParameter(32877), Ke = X.isCompressedTexture ? X.mipmaps[0] : X.image;
      V.pixelStorei(3314, Ke.width), V.pixelStorei(32878, Ke.height), V.pixelStorei(3316, E.min.x), V.pixelStorei(3315, E.min.y), V.pixelStorei(32877, E.min.z), X.isDataTexture || X.isData3DTexture ? V.texSubImage3D(Pe, $, F.x, F.y, F.z, xe, we, Ee, Ae, Le, Ke.data) : X.isCompressedArrayTexture ? (console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."), V.compressedTexSubImage3D(Pe, $, F.x, F.y, F.z, xe, we, Ee, Ae, Ke.data)) : V.texSubImage3D(Pe, $, F.x, F.y, F.z, xe, we, Ee, Ae, Le, Ke), V.pixelStorei(3314, De), V.pixelStorei(32878, ke), V.pixelStorei(3316, pt), V.pixelStorei(3315, Ut), V.pixelStorei(32877, En), $ === 0 && z.generateMipmaps && V.generateMipmap(Pe), ye.unbindTexture();
    }, this.initTexture = function(E) {
      E.isCubeTexture ? Re.setTextureCube(E, 0) : E.isData3DTexture ? Re.setTexture3D(E, 0) : E.isDataArrayTexture || E.isCompressedArrayTexture ? Re.setTexture2DArray(E, 0) : Re.setTexture2D(E, 0), ye.unbindTexture();
    }, this.resetState = function() {
      M = 0, y = 0, w = null, ye.reset(), pe.reset();
    }, typeof __THREE_DEVTOOLS__ < "u" && __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe", { detail: this }));
  }
  get physicallyCorrectLights() {
    return console.warn("THREE.WebGLRenderer: the property .physicallyCorrectLights has been removed. Set renderer.useLegacyLights instead."), !this.useLegacyLights;
  }
  set physicallyCorrectLights(e) {
    console.warn("THREE.WebGLRenderer: the property .physicallyCorrectLights has been removed. Set renderer.useLegacyLights instead."), this.useLegacyLights = !e;
  }
}
class Ng extends Za {
}
Ng.prototype.isWebGL1Renderer = !0;
class zg extends ht {
  constructor() {
    super(), this.isScene = !0, this.type = "Scene", this.background = null, this.environment = null, this.fog = null, this.backgroundBlurriness = 0, this.backgroundIntensity = 1, this.overrideMaterial = null, typeof __THREE_DEVTOOLS__ < "u" && __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe", { detail: this }));
  }
  copy(e, t) {
    return super.copy(e, t), e.background !== null && (this.background = e.background.clone()), e.environment !== null && (this.environment = e.environment.clone()), e.fog !== null && (this.fog = e.fog.clone()), this.backgroundBlurriness = e.backgroundBlurriness, this.backgroundIntensity = e.backgroundIntensity, e.overrideMaterial !== null && (this.overrideMaterial = e.overrideMaterial.clone()), this.matrixAutoUpdate = e.matrixAutoUpdate, this;
  }
  toJSON(e) {
    const t = super.toJSON(e);
    return this.fog !== null && (t.object.fog = this.fog.toJSON()), this.backgroundBlurriness > 0 && (t.object.backgroundBlurriness = this.backgroundBlurriness), this.backgroundIntensity !== 1 && (t.object.backgroundIntensity = this.backgroundIntensity), t;
  }
  get autoUpdate() {
    return console.warn("THREE.Scene: autoUpdate was renamed to matrixWorldAutoUpdate in r144."), this.matrixWorldAutoUpdate;
  }
  set autoUpdate(e) {
    console.warn("THREE.Scene: autoUpdate was renamed to matrixWorldAutoUpdate in r144."), this.matrixWorldAutoUpdate = e;
  }
}
class Fg extends gi {
  constructor(e) {
    super(), this.isMeshStandardMaterial = !0, this.defines = { STANDARD: "" }, this.type = "MeshStandardMaterial", this.color = new He(16777215), this.roughness = 1, this.metalness = 0, this.map = null, this.lightMap = null, this.lightMapIntensity = 1, this.aoMap = null, this.aoMapIntensity = 1, this.emissive = new He(0), this.emissiveIntensity = 1, this.emissiveMap = null, this.bumpMap = null, this.bumpScale = 1, this.normalMap = null, this.normalMapType = Mr, this.normalScale = new Fe(1, 1), this.displacementMap = null, this.displacementScale = 1, this.displacementBias = 0, this.roughnessMap = null, this.metalnessMap = null, this.alphaMap = null, this.envMap = null, this.envMapIntensity = 1, this.wireframe = !1, this.wireframeLinewidth = 1, this.wireframeLinecap = "round", this.wireframeLinejoin = "round", this.flatShading = !1, this.fog = !0, this.setValues(e);
  }
  copy(e) {
    return super.copy(e), this.defines = { STANDARD: "" }, this.color.copy(e.color), this.roughness = e.roughness, this.metalness = e.metalness, this.map = e.map, this.lightMap = e.lightMap, this.lightMapIntensity = e.lightMapIntensity, this.aoMap = e.aoMap, this.aoMapIntensity = e.aoMapIntensity, this.emissive.copy(e.emissive), this.emissiveMap = e.emissiveMap, this.emissiveIntensity = e.emissiveIntensity, this.bumpMap = e.bumpMap, this.bumpScale = e.bumpScale, this.normalMap = e.normalMap, this.normalMapType = e.normalMapType, this.normalScale.copy(e.normalScale), this.displacementMap = e.displacementMap, this.displacementScale = e.displacementScale, this.displacementBias = e.displacementBias, this.roughnessMap = e.roughnessMap, this.metalnessMap = e.metalnessMap, this.alphaMap = e.alphaMap, this.envMap = e.envMap, this.envMapIntensity = e.envMapIntensity, this.wireframe = e.wireframe, this.wireframeLinewidth = e.wireframeLinewidth, this.wireframeLinecap = e.wireframeLinecap, this.wireframeLinejoin = e.wireframeLinejoin, this.flatShading = e.flatShading, this.fog = e.fog, this;
  }
}
class Og extends gi {
  constructor(e) {
    super(), this.isMeshNormalMaterial = !0, this.type = "MeshNormalMaterial", this.bumpMap = null, this.bumpScale = 1, this.normalMap = null, this.normalMapType = Mr, this.normalScale = new Fe(1, 1), this.displacementMap = null, this.displacementScale = 1, this.displacementBias = 0, this.wireframe = !1, this.wireframeLinewidth = 1, this.flatShading = !1, this.setValues(e);
  }
  copy(e) {
    return super.copy(e), this.bumpMap = e.bumpMap, this.bumpScale = e.bumpScale, this.normalMap = e.normalMap, this.normalMapType = e.normalMapType, this.normalScale.copy(e.normalScale), this.displacementMap = e.displacementMap, this.displacementScale = e.displacementScale, this.displacementBias = e.displacementBias, this.wireframe = e.wireframe, this.wireframeLinewidth = e.wireframeLinewidth, this.flatShading = e.flatShading, this;
  }
}
class Ka extends ht {
  constructor(e, t = 1) {
    super(), this.isLight = !0, this.type = "Light", this.color = new He(e), this.intensity = t;
  }
  dispose() {
  }
  copy(e, t) {
    return super.copy(e, t), this.color.copy(e.color), this.intensity = e.intensity, this;
  }
  toJSON(e) {
    const t = super.toJSON(e);
    return t.object.color = this.color.getHex(), t.object.intensity = this.intensity, this.groundColor !== void 0 && (t.object.groundColor = this.groundColor.getHex()), this.distance !== void 0 && (t.object.distance = this.distance), this.angle !== void 0 && (t.object.angle = this.angle), this.decay !== void 0 && (t.object.decay = this.decay), this.penumbra !== void 0 && (t.object.penumbra = this.penumbra), this.shadow !== void 0 && (t.object.shadow = this.shadow.toJSON()), t;
  }
}
const ar = /* @__PURE__ */ new nt(), ua = /* @__PURE__ */ new G(), da = /* @__PURE__ */ new G();
class Bg {
  constructor(e) {
    this.camera = e, this.bias = 0, this.normalBias = 0, this.radius = 1, this.blurSamples = 8, this.mapSize = new Fe(512, 512), this.map = null, this.mapPass = null, this.matrix = new nt(), this.autoUpdate = !0, this.needsUpdate = !1, this._frustum = new Sr(), this._frameExtents = new Fe(1, 1), this._viewportCount = 1, this._viewports = [
      new tt(0, 0, 1, 1)
    ];
  }
  getViewportCount() {
    return this._viewportCount;
  }
  getFrustum() {
    return this._frustum;
  }
  updateMatrices(e) {
    const t = this.camera, n = this.matrix;
    ua.setFromMatrixPosition(e.matrixWorld), t.position.copy(ua), da.setFromMatrixPosition(e.target.matrixWorld), t.lookAt(da), t.updateMatrixWorld(), ar.multiplyMatrices(t.projectionMatrix, t.matrixWorldInverse), this._frustum.setFromProjectionMatrix(ar), n.set(
      0.5,
      0,
      0,
      0.5,
      0,
      0.5,
      0,
      0.5,
      0,
      0,
      0.5,
      0.5,
      0,
      0,
      0,
      1
    ), n.multiply(ar);
  }
  getViewport(e) {
    return this._viewports[e];
  }
  getFrameExtents() {
    return this._frameExtents;
  }
  dispose() {
    this.map && this.map.dispose(), this.mapPass && this.mapPass.dispose();
  }
  copy(e) {
    return this.camera = e.camera.clone(), this.bias = e.bias, this.radius = e.radius, this.mapSize.copy(e.mapSize), this;
  }
  clone() {
    return new this.constructor().copy(this);
  }
  toJSON() {
    const e = {};
    return this.bias !== 0 && (e.bias = this.bias), this.normalBias !== 0 && (e.normalBias = this.normalBias), this.radius !== 1 && (e.radius = this.radius), (this.mapSize.x !== 512 || this.mapSize.y !== 512) && (e.mapSize = this.mapSize.toArray()), e.camera = this.camera.toJSON(!1).object, delete e.camera.matrix, e;
  }
}
class Gg extends Bg {
  constructor() {
    super(new br(-5, 5, 5, -5, 0.5, 500)), this.isDirectionalLightShadow = !0;
  }
}
class Vg extends Ka {
  constructor(e, t) {
    super(e, t), this.isDirectionalLight = !0, this.type = "DirectionalLight", this.position.copy(ht.DEFAULT_UP), this.updateMatrix(), this.target = new ht(), this.shadow = new Gg();
  }
  dispose() {
    this.shadow.dispose();
  }
  copy(e) {
    return super.copy(e), this.target = e.target.clone(), this.shadow = e.shadow.clone(), this;
  }
}
class kg extends Ka {
  constructor(e, t) {
    super(e, t), this.isAmbientLight = !0, this.type = "AmbientLight";
  }
}
class Ja {
  constructor(e = !0) {
    this.autoStart = e, this.startTime = 0, this.oldTime = 0, this.elapsedTime = 0, this.running = !1;
  }
  start() {
    this.startTime = fa(), this.oldTime = this.startTime, this.elapsedTime = 0, this.running = !0;
  }
  stop() {
    this.getElapsedTime(), this.running = !1, this.autoStart = !1;
  }
  getElapsedTime() {
    return this.getDelta(), this.elapsedTime;
  }
  getDelta() {
    let e = 0;
    if (this.autoStart && !this.running)
      return this.start(), 0;
    if (this.running) {
      const t = fa();
      e = (t - this.oldTime) / 1e3, this.oldTime = t, this.elapsedTime += e;
    }
    return e;
  }
}
function fa() {
  return (typeof performance > "u" ? Date : performance).now();
}
typeof __THREE_DEVTOOLS__ < "u" && __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register", { detail: {
  revision: xr
} }));
typeof window < "u" && (window.__THREE__ ? console.warn("WARNING: Multiple instances of Three.js being imported.") : window.__THREE__ = xr);
const Hg = {
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

			gl_FragColor = texture2D( tDiffuse, vUv );
			gl_FragColor.a *= opacity;


		}`
  )
};
class Ms {
  constructor() {
    this.isPass = !0, this.enabled = !0, this.needsSwap = !0, this.clear = !1, this.renderToScreen = !1;
  }
  setSize() {
  }
  render() {
    console.error("THREE.Pass: .render() must be implemented in derived pass.");
  }
  dispose() {
  }
}
const Wg = new br(-1, 1, 1, -1, 0, 1), Tr = new bn();
Tr.setAttribute("position", new mn([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
Tr.setAttribute("uv", new mn([0, 2, 0, 0, 2, 0], 2));
class Qa {
  constructor(e) {
    this._mesh = new Kt(Tr, e);
  }
  dispose() {
    this._mesh.geometry.dispose();
  }
  render(e) {
    e.render(this._mesh, Wg);
  }
  get material() {
    return this._mesh.material;
  }
  set material(e) {
    this._mesh.material = e;
  }
}
class qg extends Ms {
  constructor(e, t) {
    super(), this.textureID = t !== void 0 ? t : "tDiffuse", e instanceof tn ? (this.uniforms = e.uniforms, this.material = e) : e && (this.uniforms = ka.clone(e.uniforms), this.material = new tn({
      defines: Object.assign({}, e.defines),
      uniforms: this.uniforms,
      vertexShader: e.vertexShader,
      fragmentShader: e.fragmentShader
    })), this.fsQuad = new Qa(this.material);
  }
  render(e, t, n) {
    this.uniforms[this.textureID] && (this.uniforms[this.textureID].value = n.texture), this.fsQuad.material = this.material, this.renderToScreen ? (e.setRenderTarget(null), this.fsQuad.render(e)) : (e.setRenderTarget(t), this.clear && e.clear(e.autoClearColor, e.autoClearDepth, e.autoClearStencil), this.fsQuad.render(e));
  }
  dispose() {
    this.material.dispose(), this.fsQuad.dispose();
  }
}
class pa extends Ms {
  constructor(e, t) {
    super(), this.scene = e, this.camera = t, this.clear = !0, this.needsSwap = !1, this.inverse = !1;
  }
  render(e, t, n) {
    const i = e.getContext(), s = e.state;
    s.buffers.color.setMask(!1), s.buffers.depth.setMask(!1), s.buffers.color.setLocked(!0), s.buffers.depth.setLocked(!0);
    let r, o;
    this.inverse ? (r = 0, o = 1) : (r = 1, o = 0), s.buffers.stencil.setTest(!0), s.buffers.stencil.setOp(i.REPLACE, i.REPLACE, i.REPLACE), s.buffers.stencil.setFunc(i.ALWAYS, r, 4294967295), s.buffers.stencil.setClear(o), s.buffers.stencil.setLocked(!0), e.setRenderTarget(n), this.clear && e.clear(), e.render(this.scene, this.camera), e.setRenderTarget(t), this.clear && e.clear(), e.render(this.scene, this.camera), s.buffers.color.setLocked(!1), s.buffers.depth.setLocked(!1), s.buffers.stencil.setLocked(!1), s.buffers.stencil.setFunc(i.EQUAL, 1, 4294967295), s.buffers.stencil.setOp(i.KEEP, i.KEEP, i.KEEP), s.buffers.stencil.setLocked(!0);
  }
}
class Xg extends Ms {
  constructor() {
    super(), this.needsSwap = !1;
  }
  render(e) {
    e.state.buffers.stencil.setLocked(!1), e.state.buffers.stencil.setTest(!1);
  }
}
class jg {
  constructor(e, t) {
    if (this.renderer = e, t === void 0) {
      const n = e.getSize(new Fe());
      this._pixelRatio = e.getPixelRatio(), this._width = n.width, this._height = n.height, t = new en(this._width * this._pixelRatio, this._height * this._pixelRatio), t.texture.name = "EffectComposer.rt1";
    } else
      this._pixelRatio = 1, this._width = t.width, this._height = t.height;
    this.renderTarget1 = t, this.renderTarget2 = t.clone(), this.renderTarget2.texture.name = "EffectComposer.rt2", this.writeBuffer = this.renderTarget1, this.readBuffer = this.renderTarget2, this.renderToScreen = !0, this.passes = [], this.copyPass = new qg(Hg), this.clock = new Ja();
  }
  swapBuffers() {
    const e = this.readBuffer;
    this.readBuffer = this.writeBuffer, this.writeBuffer = e;
  }
  addPass(e) {
    this.passes.push(e), e.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  }
  insertPass(e, t) {
    this.passes.splice(t, 0, e), e.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  }
  removePass(e) {
    const t = this.passes.indexOf(e);
    t !== -1 && this.passes.splice(t, 1);
  }
  isLastEnabledPass(e) {
    for (let t = e + 1; t < this.passes.length; t++)
      if (this.passes[t].enabled)
        return !1;
    return !0;
  }
  render(e) {
    e === void 0 && (e = this.clock.getDelta());
    const t = this.renderer.getRenderTarget();
    let n = !1;
    for (let i = 0, s = this.passes.length; i < s; i++) {
      const r = this.passes[i];
      if (r.enabled !== !1) {
        if (r.renderToScreen = this.renderToScreen && this.isLastEnabledPass(i), r.render(this.renderer, this.writeBuffer, this.readBuffer, e, n), r.needsSwap) {
          if (n) {
            const o = this.renderer.getContext(), c = this.renderer.state.buffers.stencil;
            c.setFunc(o.NOTEQUAL, 1, 4294967295), this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, e), c.setFunc(o.EQUAL, 1, 4294967295);
          }
          this.swapBuffers();
        }
        pa !== void 0 && (r instanceof pa ? n = !0 : r instanceof Xg && (n = !1));
      }
    }
    this.renderer.setRenderTarget(t);
  }
  reset(e) {
    if (e === void 0) {
      const t = this.renderer.getSize(new Fe());
      this._pixelRatio = this.renderer.getPixelRatio(), this._width = t.width, this._height = t.height, e = this.renderTarget1.clone(), e.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
    }
    this.renderTarget1.dispose(), this.renderTarget2.dispose(), this.renderTarget1 = e, this.renderTarget2 = e.clone(), this.writeBuffer = this.renderTarget1, this.readBuffer = this.renderTarget2;
  }
  setSize(e, t) {
    this._width = e, this._height = t;
    const n = this._width * this._pixelRatio, i = this._height * this._pixelRatio;
    this.renderTarget1.setSize(n, i), this.renderTarget2.setSize(n, i);
    for (let s = 0; s < this.passes.length; s++)
      this.passes[s].setSize(n, i);
  }
  setPixelRatio(e) {
    this._pixelRatio = e, this.setSize(this._width, this._height);
  }
  dispose() {
    this.renderTarget1.dispose(), this.renderTarget2.dispose(), this.copyPass.dispose();
  }
}
class Yg {
  // follow: Entity | null;
  constructor(e) {
    ze(this, "cameraRig");
    ze(this, "camera");
    let t = e.x / e.y;
    this.camera = new It(45, t, 0.1, 1e3), this.camera.position.z = 20, this.camera.position.y = 6 * Math.tan(Math.PI / 3), this.cameraRig = new ht(), this.cameraRig.position.set(0, 0, -50), this.cameraRig.add(this.camera), this.camera.lookAt(new G(0, 0, 0));
  }
  update() {
  }
  moveFollowCamera() {
  }
  // followEntity(entity: Entity) {
  // 	this.follow = entity;
  // }
}
class $g extends Ms {
  constructor(t, n, i) {
    super();
    ze(this, "fsQuad");
    ze(this, "resolution");
    ze(this, "scene");
    ze(this, "camera");
    ze(this, "rgbRenderTarget");
    ze(this, "normalRenderTarget");
    ze(this, "normalMaterial");
    this.resolution = t, this.fsQuad = new Qa(this.material()), this.scene = n, this.camera = i, this.rgbRenderTarget = new en(t.x * 4, t.y * 4), this.normalRenderTarget = new en(t.x * 4, t.y * 4), this.normalMaterial = new Og();
  }
  render(t, n) {
    t.setRenderTarget(this.rgbRenderTarget), t.render(this.scene, this.camera);
    const i = this.scene.overrideMaterial;
    t.setRenderTarget(this.normalRenderTarget), this.scene.overrideMaterial = this.normalMaterial, t.render(this.scene, this.camera), this.scene.overrideMaterial = i;
    const s = this.fsQuad.material.uniforms;
    s.tDiffuse.value = this.rgbRenderTarget.texture, s.tDepth.value = this.rgbRenderTarget.depthTexture, s.tNormal.value = this.normalRenderTarget.texture, this.renderToScreen ? t.setRenderTarget(null) : t.setRenderTarget(n), this.fsQuad.render(t);
  }
  material() {
    return new tn({
      uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        tNormal: { value: null },
        resolution: {
          value: new tt(
            this.resolution.x,
            this.resolution.y,
            1 / this.resolution.x,
            1 / this.resolution.y
          )
        }
      },
      // vertexShader: vertexShader,
      vertexShader: `varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,
      // fragmentShader: fragmentShader
      fragmentShader: `uniform sampler2D tDiffuse;
			varying vec2 vUv;
			
			void main() {
				vec4 texel = texture2D( tDiffuse, vUv );
			
				gl_FragColor = texel;
			}`
    });
  }
}
class Zg {
  constructor(e) {
    ze(this, "type", "Scene");
    ze(this, "scene");
    ze(this, "screenResolution");
    ze(this, "renderer");
    ze(this, "composer");
    ze(this, "zylemCamera");
    const t = new zg();
    t.background = new He(5784513), this.setupRenderer(), this.setupLighting(t), this.setupCamera(t), this.scene = t;
    const n = document.getElementById(e);
    if (!n)
      throw new Error(`Could not find element with id: ${e}`);
    n.firstChild && n.removeChild(n.firstChild), n.appendChild(this.renderer.domElement);
  }
  setup() {
  }
  destroy() {
  }
  update(e) {
    this.composer.render(e);
  }
  setupCamera(e) {
    this.zylemCamera = new Yg(this.screenResolution);
    let t = this.screenResolution.clone().divideScalar(2);
    t.x |= 0, t.y |= 0, e.add(this.zylemCamera.cameraRig), this.composer.addPass(new $g(t, e, this.zylemCamera.camera));
  }
  setupLighting(e) {
    const t = new kg(16777215, 0.8);
    e.add(t);
    const n = new Vg(16777215, 1);
    n.name = "Light", n.position.set(0, 100, 0), n.castShadow = !0, n.shadow.camera.near = 0.1, n.shadow.camera.far = 2e3, n.shadow.mapSize.width = 1024, n.shadow.mapSize.height = 1024, e.add(n);
  }
  setupRenderer() {
    const e = new Fe(window.innerWidth, window.innerHeight);
    this.screenResolution = e, this.renderer = new Za({ antialias: !1 }), this.renderer.setSize(e.x, e.y), this.composer = new jg(this.renderer);
  }
  addEntity(e) {
    this.scene.add(e.mesh);
  }
}
class el {
  constructor(e) {
    ze(this, "type");
    ze(this, "mesh");
    ze(this, "body");
    this.type = "Box", this.mesh = this.createMesh(), this.body = this.createBody();
  }
  setup() {
  }
  destroy() {
  }
  update(e) {
    if (!this.body)
      return;
    const { x: t, y: n, z: i } = this.body.position;
    this.mesh.position.set(t, n, i);
  }
  createMesh() {
    const e = new _i(10, 10, 10), t = new Fg({
      color: 16777215,
      emissiveIntensity: 0.5,
      lightMapIntensity: 0.5,
      fog: !0
    });
    return this.mesh = new Kt(e, t), this.mesh.position.set(0, 0, 0), this.mesh.castShadow = !0, this.mesh.receiveShadow = !0, this.mesh;
  }
  createBody() {
    const e = new ms(new x(1, 1, 1));
    return this.body = new he({
      mass: 1,
      shape: e
    }), this.body.position.set(0, 0, 0), this.body;
  }
}
class Kg {
  constructor(e, t) {
    ze(this, "type", "Stage");
    ze(this, "world");
    ze(this, "scene");
    ze(this, "children", []);
    ze(this, "blueprints", []);
    this.world = new Nh(), this.scene = new Zg(e), this.blueprints = t.children() || [], this.setup();
  }
  setup() {
    this.world.setup(), this.scene.setup();
    for (let e of this.blueprints) {
      const t = new el({});
      t.mesh && this.scene.scene.add(t.mesh), t.body && this.world.world.addBody(t.body), this.children.push(t);
    }
  }
  destroy() {
    this.world.destroy(), this.scene.destroy();
  }
  update(e) {
    this.world.update(e);
    for (let t of this.children)
      t.update(e);
    this.scene.update(e);
  }
}
var tl = /* @__PURE__ */ ((a) => (a.FirstPerson = "first-person", a.ThirdPerson = "third-person", a.Isometric = "isometric", a.Flat2D = "flat-2d", a.Fixed2D = "fixed-2d", a))(tl || {});
class Jg {
  constructor(e) {
    ze(this, "id");
    ze(this, "perspective", tl.ThirdPerson);
    ze(this, "stage");
    ze(this, "stages", {});
    ze(this, "currentStage", "");
    ze(this, "clock");
    this.id = e.id, this.clock = new Ja(), this.createCanvas(), this.stage = new Kg(this.id, e.stage), this.stages[this.id] = this.stage, this.currentStage = this.id;
  }
  async loadPhysics() {
  }
  /**
   * Main game loop
   * process user input
   * update physics
   * render scene
   */
  async gameLoop() {
    const e = this.clock.getDelta();
    this.stages[this.currentStage].update(e);
    const t = this;
    requestAnimationFrame(() => {
      t.gameLoop();
    });
  }
  start() {
    this.gameLoop();
  }
  async gameSetup() {
  }
  createStage(e) {
    if (!this.id) {
      console.error("No id provided for canvas");
      return;
    }
  }
  createCanvas() {
    if (!this.id) {
      console.error("No id provided for canvas");
      return;
    }
    const e = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
    e.style.margin = "0", e.style.padding = "0", e.style.backgroundColor = "#0c2461";
    let t = document.querySelector(`#${this.id}`);
    return t || (t = document.createElement("main"), t.setAttribute("id", this.id), document.body.appendChild(t)), t.appendChild(e), e;
  }
}
function Qg() {
  return "Hello World!";
}
function e_(a) {
  return new Jg(a);
}
const n_ = {
  helloWorld: Qg,
  create: e_,
  ZylemBox: el
};
export {
  n_ as default
};
