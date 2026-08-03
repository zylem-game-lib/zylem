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
	setPanelSize,
	setToggleButtonPosition,
	detachPanel,
	reattachPanel,
	updateDetachedPanelPosition,
	updateDetachedPanelSize,
	reorderPanels,
	setOpenSections,
	isPanelDetached,
	setDraggingPanel,
	setDropTargetIndex,
	clearDragState,
	bringPanelToFront,
	dockPanelToSide,
	undockPanelFromSides,
	setDockThickness,
	getDockedSide,
	applyDefaultDocks,
	MAIN_PANEL_ID,
	type DetachedPanelState,
	type EditorDockDefaults,
} from './editor-store';

// Dock layout geometry
export {
	computeDockLayout,
	findDockedSide,
	innerEdgeFor,
	isHorizontalSide,
	previewDockRect,
	dockSlotIndex,
	clampThickness,
	resolveThickness,
	DOCK_SIDES,
	type DockPanelId,
	type DockRect,
	type DockRegistry,
	type DockSide,
	type DockZoneState,
	type Viewport,
} from './common/dock-layout';
export { EditorProvider, useEditor, type EditorContextValue } from './EditorContext';

// Console
export { consoleState, printToConsole, clearConsole, getConsoleContent, MAX_CONSOLE_MESSAGES } from './console/console-state';

// Bridge debug panel
export {
	bridgePanelState,
	startBridgeCapture,
	stopBridgeCapture,
	setBridgeCapturePaused,
	clearBridgeLog,
	MAX_BRIDGE_LOG_ENTRIES,
	type BridgeLogEntry,
	type BridgePanelState,
	type BridgeStatsRow,
} from './bridge/bridge-panel-state';
