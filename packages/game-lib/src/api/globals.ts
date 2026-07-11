/**
 * `@zylem/game-lib/globals` public API.
 * @public
 */
// Game-state (global) helpers
export {
	setGlobal,
	getGlobal,
	createGlobal,
	onGlobalChange,
	onGlobalChanges,
	getGlobals,
	clearGlobalSubscriptions,
} from '../lib/game/game-state';

// Stage-state (variable) helpers
export {
	setVariable,
	getVariable,
	createVariable,
	onVariableChange,
	onVariableChanges,
} from '../lib/stage/stage-state';

// Reactive change helpers (for entity onUpdate-style subscriptions)
export {
	globalChange,
	globalChanges,
	variableChange,
	variableChanges,
} from '../lib/actions/global-change';
