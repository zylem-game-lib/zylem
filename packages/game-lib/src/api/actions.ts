export * as actions from '../lib/actions/behaviors/actions';
export { makeMoveable } from '../lib/actions/capabilities/moveable';
export { makeRotatable } from '../lib/actions/capabilities/rotatable';
export { makeTransformable } from '../lib/actions/capabilities/transformable';
export { 
	createTransformStore, 
	resetTransformStore,
	type TransformState 
} from '../lib/actions/capabilities/transform-store';
export { 
	applyTransformChanges 
} from '../lib/actions/capabilities/apply-transform';
