/**
 * Store exports for the editor package.
 */

// Event bus for external state sync
export { editorEvents, type EditorEvent, type EditorEventType } from './events';

// State modules - re-exported from UI section directories
export {
	debugState,
	type DebugState,
	type DebugTools,
	resetHoveredEntity,
	getHoveredEntityId,
	setHoveredEntityId,
	getSelectedEntityId,
	setSelectedEntityId,
	getDebugTool,
	setDebugTool,
	isPaused,
	setPaused,
} from './entities/entities-state';
export { gameState, state, getGlobalState, getGlobal, setGlobal } from './game/game-state';
export { stageState, stageStateToString } from './stages/stage-state';

// Types
export type { BaseEntityInterface, StageStateInterface, Vector3Like } from '../types';

// SolidJS integration
export {
	debugStore,
	setDebugStore,
	setPanelPosition,
	setToggleButtonPosition,
	detachPanel,
	reattachPanel,
	updateDetachedPanelPosition,
	reorderPanels,
	setOpenSections,
	isPanelDetached,
	type DetachedPanelState,
} from './editor-store';
export { EditorProvider, useEditor, type EditorContextValue } from './EditorContext';

// Console
export { consoleState, printToConsole, clearConsole, getConsoleContent } from './console/console-state';
