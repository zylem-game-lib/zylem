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
	setHoveredEntityId,
	getHoveredEntityId,
	getHoveredEntity,
	registerDebugEntityResolver,
	resolveDebugEntity,
	type DebugTools,
	type DebugEntityResolver,
} from '../lib/debug/debug-state';

export {
	focusEntity,
	registerEntityFocusContext,
	type EntityFocusContext,
} from '../lib/debug/entity-focus';

export {
	entityThumbnailCache,
	EntityThumbnailCache,
	type EntityThumbnailResult,
	type EntityThumbnailCacheEntry,
} from '../lib/debug/entity-thumbnail';
