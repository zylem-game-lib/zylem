/**
 * `@zylem/game-lib/debug` public API.
 * @public
 */
export {
	debugState,
	setDebugTool,
	setPaused,
	setSelectedEntity,
	type DebugTools,
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
