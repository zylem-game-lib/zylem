var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/actions/behaviors/actions.ts
var actions_exports = {};
__export(actions_exports, {
  actionOnPress: () => actionOnPress,
  actionOnRelease: () => actionOnRelease,
  actionWithCooldown: () => actionWithCooldown,
  actionWithThrottle: () => actionWithThrottle,
  wait: () => wait
});
function wait(delay, callback) {
  setTimeout(callback, delay);
}
var actionOnPress = /* @__PURE__ */ (() => {
  let buttonPressed = false;
  return (isPressed, callback) => {
    if (isPressed && !buttonPressed) {
      buttonPressed = true;
      callback();
    } else if (!isPressed) {
      buttonPressed = false;
    }
  };
})();
var actionOnRelease = /* @__PURE__ */ (() => {
  let buttonPressed = false;
  return (isPressed, callback) => {
    if (!isPressed && buttonPressed) {
      buttonPressed = false;
      callback();
    } else if (isPressed) {
      buttonPressed = true;
    }
  };
})();
var actionWithCooldown = /* @__PURE__ */ (() => {
  let lastExecutionTime = -Infinity;
  let flagImmediate = false;
  return ({ timer, immediate = true }, callback, update) => {
    let currentTime = Date.now();
    if (!flagImmediate && !immediate) {
      flagImmediate = true;
      lastExecutionTime = currentTime;
    }
    const delta = currentTime - lastExecutionTime;
    if (delta >= timer) {
      lastExecutionTime = currentTime;
      callback();
    }
    update({ delta });
  };
})();
var actionWithThrottle = /* @__PURE__ */ (() => {
  let lastExecutionTime = 0;
  return (timer, callback) => {
    const currentTime = Date.now();
    const delta = currentTime - lastExecutionTime;
    if (delta >= timer) {
      lastExecutionTime = currentTime;
      callback();
    }
  };
})();

// src/lib/actions/capabilities/moveable.ts
import { Vector3 } from "three";
function moveX(entity, delta) {
  if (!entity.body) return;
  const currentVelocity = entity.body.linvel();
  const newVelocity = new Vector3(delta, currentVelocity.y, currentVelocity.z);
  entity.body.setLinvel(newVelocity, true);
}
function moveY(entity, delta) {
  if (!entity.body) return;
  const currentVelocity = entity.body.linvel();
  const newVelocity = new Vector3(currentVelocity.x, delta, currentVelocity.z);
  entity.body.setLinvel(newVelocity, true);
}
function moveZ(entity, delta) {
  if (!entity.body) return;
  const currentVelocity = entity.body.linvel();
  const newVelocity = new Vector3(currentVelocity.x, currentVelocity.y, delta);
  entity.body.setLinvel(newVelocity, true);
}
function moveXY(entity, deltaX, deltaY) {
  if (!entity.body) return;
  const currentVelocity = entity.body.linvel();
  const newVelocity = new Vector3(deltaX, deltaY, currentVelocity.z);
  entity.body.setLinvel(newVelocity, true);
}
function moveXZ(entity, deltaX, deltaZ) {
  if (!entity.body) return;
  const currentVelocity = entity.body.linvel();
  const newVelocity = new Vector3(deltaX, currentVelocity.y, deltaZ);
  entity.body.setLinvel(newVelocity, true);
}
function move(entity, vector) {
  if (!entity.body) return;
  const currentVelocity = entity.body.linvel();
  const newVelocity = new Vector3(
    currentVelocity.x + vector.x,
    currentVelocity.y + vector.y,
    currentVelocity.z + vector.z
  );
  entity.body.setLinvel(newVelocity, true);
}
function resetVelocity(entity) {
  if (!entity.body) return;
  entity.body.setLinvel(new Vector3(0, 0, 0), true);
  entity.body.setLinearDamping(5);
}
function moveForwardXY(entity, delta, rotation2DAngle) {
  const deltaX = Math.sin(-rotation2DAngle) * delta;
  const deltaY = Math.cos(-rotation2DAngle) * delta;
  moveXY(entity, deltaX, deltaY);
}
function getPosition(entity) {
  if (!entity.body) return null;
  return entity.body.translation();
}
function getVelocity(entity) {
  if (!entity.body) return null;
  return entity.body.linvel();
}
function setPosition(entity, x, y, z) {
  if (!entity.body) return;
  entity.body.setTranslation({ x, y, z }, true);
}
function setPositionX(entity, x) {
  if (!entity.body) return;
  const { y, z } = entity.body.translation();
  entity.body.setTranslation({ x, y, z }, true);
}
function setPositionY(entity, y) {
  if (!entity.body) return;
  const { x, z } = entity.body.translation();
  entity.body.setTranslation({ x, y, z }, true);
}
function setPositionZ(entity, z) {
  if (!entity.body) return;
  const { x, y } = entity.body.translation();
  entity.body.setTranslation({ x, y, z }, true);
}
function wrapAroundXY(entity, boundsX, boundsY) {
  const position = getPosition(entity);
  if (!position) return;
  const { x, y } = position;
  const newX = x > boundsX ? -boundsX : x < -boundsX ? boundsX : x;
  const newY = y > boundsY ? -boundsY : y < -boundsY ? boundsY : y;
  if (newX !== x || newY !== y) {
    setPosition(entity, newX, newY, 0);
  }
}
function wrapAround3D(entity, boundsX, boundsY, boundsZ) {
  const position = getPosition(entity);
  if (!position) return;
  const { x, y, z } = position;
  const newX = x > boundsX ? -boundsX : x < -boundsX ? boundsX : x;
  const newY = y > boundsY ? -boundsY : y < -boundsY ? boundsY : y;
  const newZ = z > boundsZ ? -boundsZ : z < -boundsZ ? boundsZ : z;
  if (newX !== x || newY !== y || newZ !== z) {
    setPosition(entity, newX, newY, newZ);
  }
}
function makeMoveable(entity) {
  const moveable = entity;
  moveable.moveX = (delta) => moveX(entity, delta);
  moveable.moveY = (delta) => moveY(entity, delta);
  moveable.moveZ = (delta) => moveZ(entity, delta);
  moveable.moveXY = (deltaX, deltaY) => moveXY(entity, deltaX, deltaY);
  moveable.moveXZ = (deltaX, deltaZ) => moveXZ(entity, deltaX, deltaZ);
  moveable.move = (vector) => move(entity, vector);
  moveable.resetVelocity = () => resetVelocity(entity);
  moveable.moveForwardXY = (delta, rotation2DAngle) => moveForwardXY(entity, delta, rotation2DAngle);
  moveable.getPosition = () => getPosition(entity);
  moveable.getVelocity = () => getVelocity(entity);
  moveable.setPosition = (x, y, z) => setPosition(entity, x, y, z);
  moveable.setPositionX = (x) => setPositionX(entity, x);
  moveable.setPositionY = (y) => setPositionY(entity, y);
  moveable.setPositionZ = (z) => setPositionZ(entity, z);
  moveable.wrapAroundXY = (boundsX, boundsY) => wrapAroundXY(entity, boundsX, boundsY);
  moveable.wrapAround3D = (boundsX, boundsY, boundsZ) => wrapAround3D(entity, boundsX, boundsY, boundsZ);
  return moveable;
}

// src/lib/actions/capabilities/rotatable.ts
import { Euler, Vector3 as Vector32, MathUtils, Quaternion } from "three";
function rotateInDirection(entity, moveVector) {
  if (!entity.body) return;
  const rotate = Math.atan2(-moveVector.x, moveVector.z);
  rotateYEuler(entity, rotate);
}
function rotateYEuler(entity, amount) {
  rotateEuler(entity, new Vector32(0, -amount, 0));
}
function rotateEuler(entity, rotation) {
  if (!entity.group) return;
  const euler = new Euler(rotation.x, rotation.y, rotation.z);
  entity.group.setRotationFromEuler(euler);
}
function rotateY(entity, delta) {
  setRotationY(entity, delta);
}
function rotateZ(entity, delta) {
  setRotationZ(entity, delta);
}
function setRotationY(entity, y) {
  if (!entity.body) return;
  const halfAngle = y / 2;
  const w = Math.cos(halfAngle);
  const yComponent = Math.sin(halfAngle);
  entity.body.setRotation({ w, x: 0, y: yComponent, z: 0 }, true);
}
function setRotationDegreesY(entity, y) {
  if (!entity.body) return;
  setRotationY(entity, MathUtils.degToRad(y));
}
function setRotationX(entity, x) {
  if (!entity.body) return;
  const halfAngle = x / 2;
  const w = Math.cos(halfAngle);
  const xComponent = Math.sin(halfAngle);
  entity.body.setRotation({ w, x: xComponent, y: 0, z: 0 }, true);
}
function setRotationDegreesX(entity, x) {
  if (!entity.body) return;
  setRotationX(entity, MathUtils.degToRad(x));
}
function setRotationZ(entity, z) {
  if (!entity.body) return;
  const halfAngle = z / 2;
  const w = Math.cos(halfAngle);
  const zComponent = Math.sin(halfAngle);
  entity.body.setRotation({ w, x: 0, y: 0, z: zComponent }, true);
}
function setRotationDegreesZ(entity, z) {
  if (!entity.body) return;
  setRotationZ(entity, MathUtils.degToRad(z));
}
function setRotation(entity, x, y, z) {
  if (!entity.body) return;
  const quat = new Quaternion().setFromEuler(new Euler(x, y, z));
  entity.body.setRotation({ w: quat.w, x: quat.x, y: quat.y, z: quat.z }, true);
}
function setRotationDegrees(entity, x, y, z) {
  if (!entity.body) return;
  setRotation(entity, MathUtils.degToRad(x), MathUtils.degToRad(y), MathUtils.degToRad(z));
}
function getRotation(entity) {
  if (!entity.body) return null;
  return entity.body.rotation();
}
function makeRotatable(entity) {
  const rotatableEntity = entity;
  rotatableEntity.rotateInDirection = (moveVector) => rotateInDirection(entity, moveVector);
  rotatableEntity.rotateYEuler = (amount) => rotateYEuler(entity, amount);
  rotatableEntity.rotateEuler = (rotation) => rotateEuler(entity, rotation);
  rotatableEntity.rotateY = (delta) => rotateY(entity, delta);
  rotatableEntity.rotateZ = (delta) => rotateZ(entity, delta);
  rotatableEntity.setRotationY = (y) => setRotationY(entity, y);
  rotatableEntity.setRotationX = (x) => setRotationX(entity, x);
  rotatableEntity.setRotationZ = (z) => setRotationZ(entity, z);
  rotatableEntity.setRotationDegreesY = (y) => setRotationDegreesY(entity, y);
  rotatableEntity.setRotationDegreesX = (x) => setRotationDegreesX(entity, x);
  rotatableEntity.setRotationDegreesZ = (z) => setRotationDegreesZ(entity, z);
  rotatableEntity.setRotationDegrees = (x, y, z) => setRotationDegrees(entity, x, y, z);
  rotatableEntity.setRotation = (x, y, z) => setRotation(entity, x, y, z);
  rotatableEntity.getRotation = () => getRotation(entity);
  return rotatableEntity;
}

// src/lib/actions/capabilities/transformable.ts
function makeTransformable(entity) {
  const withMovement = makeMoveable(entity);
  const withRotation = makeRotatable(withMovement);
  return withRotation;
}
export {
  actions_exports as actions,
  makeMoveable,
  makeRotatable,
  makeTransformable
};
//# sourceMappingURL=actions.js.map