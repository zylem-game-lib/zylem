import { makeMoveable as e } from "./moveable.js";
import { makeRotatable as a } from "./rotatable.js";
function i(t) {
  const o = e(t);
  return a(o);
}
export {
  i as makeTransformable
};
