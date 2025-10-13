function o(r) {
  const e = Object.keys(r).sort().reduce((t, n) => (t[n] = r[n], t), {});
  return JSON.stringify(e);
}
function s(r) {
  let e = 0;
  for (let t = 0; t < r.length; t++)
    e = Math.imul(31, e) + r.charCodeAt(t) | 0;
  return e.toString(36);
}
export {
  s as shortHash,
  o as sortedStringify
};
