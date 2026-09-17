/**
 * `@zylem/game-lib/debug` public API.
 * @public
 */
export {
	debugState,
	setDebugTool,
	setPaused,
	setSelectedEntity,
	setSelectedEntityId,
	getSelectedEntityId,
	getSelectedEntity,
	setSelectedEntityIds,
	getSelectedEntityIds,
	setHoveredEntityId,
	getHoveredEntityId,
	getHoveredEntity,
	registerDebugEntityResolver,
	resolveDebugEntity,
	getSnapSettings,
	setSnapSettings,
	setGridVisible,
	setAddType,
	setPickMode,
	isPickMode,
	isTransformTool,
	DEFAULT_SNAP_SETTINGS,
	TRANSFORM_TOOLS,
	type DebugTools,
	type DebugEntityResolver,
	type SnapSettings,
	type TransformTool,
} from '../lib/debug/debug-state';

export {
	TransformGizmo,
	closestAxisValue,
	intersectPlane,
	type GizmoAxis,
	type GizmoDelta,
	type GizmoMode,
	type GizmoRay,
} from '../lib/debug/transform-gizmo';

export { ConstructionGrid } from '../lib/debug/construction-grid';

export {
	snapToIncrement,
	snapVec3,
	snapScale,
	eulerToQuaternion,
	quaternionToEuler,
	degreesToRadians,
	radiansToDegrees,
	type Quat,
} from '../lib/core/transform-math';

export {
	focusEntity,
	registerEntityFocusContext,
	type EntityFocusContext,
} from '../lib/debug/entity-focus';

export {
	padSelectionBounds,
	measureObjectSelectionBounds,
	resolveSelectionBounds,
	SELECTION_BOUNDS_MARGIN,
	SELECTION_THIN_AXIS_FRACTION,
	SELECTION_THIN_AXIS_MIN,
	SELECTION_THIN_AXIS_MAX,
	type SelectionBoundsProvider,
} from '../lib/debug/selection-bounds';

export {
	entityThumbnailCache,
	EntityThumbnailCache,
	type EntityThumbnailResult,
	type EntityThumbnailCacheEntry,
} from '../lib/debug/entity-thumbnail';
