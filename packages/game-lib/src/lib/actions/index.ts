// Action core types
export { type Action, BaseAction } from './action';

// Interval actions (fire-and-forget)
export { moveBy, moveTo, rotateBy, delay, callFunc } from './interval-actions';
export type { MoveByOptions, MoveToOptions, RotateByOptions } from './interval-actions';

// Persistent actions (entity-scoped state)
export { throttle, onPress, onRelease } from './persistent-actions';
export type { ThrottleOptions } from './persistent-actions';

// Composition
export { sequence, parallel, repeat, repeatForever } from './composition';

// Global-change helpers (existing)
export { globalChange, globalChanges, variableChange, variableChanges } from './global-change';
