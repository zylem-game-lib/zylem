// Actions API (Cocos2d-inspired)
export { type Action } from '../lib/actions/action';
export { moveBy, moveTo, rotateBy, delay, callFunc } from '../lib/actions/interval-actions';
export { throttle, onPress, onRelease } from '../lib/actions/persistent-actions';
export { sequence, parallel, repeat, repeatForever } from '../lib/actions/composition';

// Transform store utilities
export {
	createTransformStore,
	resetTransformStore,
	type TransformState
} from '../lib/actions/capabilities/transform-store';
export {
	applyTransformChanges
} from '../lib/actions/capabilities/apply-transform';

// Movement actions
export { move, moveX, moveY, moveZ, moveXY, moveXZ, resetVelocity, moveForwardXY, getPosition, getVelocity, setPosition, setPositionX, setPositionY, setPositionZ, wrapAroundXY, wrapAround3D } from '../lib/actions/capabilities/moveable';

// Rotation actions
export { rotateInDirection, rotateYEuler, rotateEuler, rotateX, rotateY, rotateZ, setRotationY, setRotationX, setRotationZ, setRotationDegrees, setRotationDegreesY, setRotationDegreesX, setRotationDegreesZ, setRotation, getRotation } from '../lib/actions/capabilities/rotatable';

// State change actions
export { globalChange, globalChanges, variableChange, variableChanges } from '../lib/actions/global-change';
