function e(n) {
  return typeof n?.handlePostCollision == "function" && typeof n?.handleIntersectionEvent == "function";
}
export {
  e as isCollisionHandlerDelegate
};
