import { BufferGeometry as _, Float32BufferAttribute as f } from "three";
class b extends _ {
  constructor(t = 1, h = 1, l = 1, a = 1) {
    super(), this.type = "XZPlaneGeometry", this.parameters = {
      width: t,
      height: h,
      widthSegments: l,
      heightSegments: a
    };
    const d = t / 2, x = h / 2, n = Math.floor(l), i = Math.floor(a), r = n + 1, w = i + 1, A = t / n, v = h / i, u = [], m = [], g = [], p = [];
    for (let s = 0; s < w; s++) {
      const e = s * v - x;
      for (let o = 0; o < r; o++) {
        const c = o * A - d;
        m.push(c, 0, e), g.push(0, 1, 0), p.push(o / n), p.push(1 - s / i);
      }
    }
    for (let s = 0; s < i; s++)
      for (let e = 0; e < n; e++) {
        const o = e + r * s, c = e + r * (s + 1), X = e + 1 + r * (s + 1), y = e + 1 + r * s;
        u.push(o, c, y), u.push(c, X, y);
      }
    this.setIndex(u), this.setAttribute("position", new f(m, 3)), this.setAttribute("normal", new f(g, 3)), this.setAttribute("uv", new f(p, 2));
  }
  copy(t) {
    return super.copy(t), this.parameters = Object.assign({}, t.parameters), this;
  }
  static fromJSON(t) {
    return new b(t.width, t.height, t.widthSegments, t.heightSegments);
  }
}
export {
  b as XZPlaneGeometry
};
