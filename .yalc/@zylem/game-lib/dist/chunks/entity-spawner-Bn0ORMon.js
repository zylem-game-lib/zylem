import { Vector2 as l, Quaternion as m, Euler as p } from "three";
function b(s) {
  return {
    spawn: async (n, a, t) => {
      const e = await Promise.resolve(s(a, t));
      return n.add(e), e;
    },
    spawnRelative: async (n, a, t = new l(0, 1)) => {
      if (!n.body) {
        console.warn("body missing for entity during spawnRelative");
        return;
      }
      const { x: e, y: c, z: u } = n.body.translation();
      let r = n._rotation2DAngle ?? 0;
      try {
        const o = n.body.rotation(), d = new m(o.x, o.y, o.z, o.w);
        r = new p().setFromQuaternion(d, "XYZ").z;
      } catch {
      }
      const w = Math.sin(-r) * (t.x ?? 0), y = Math.cos(-r) * (t.y ?? 0), i = await Promise.resolve(s(e + w, c + y));
      return a.add(i), i;
    }
  };
}
export {
  b as e
};
