export { ZylemEditorElement, registerZylemEditor } from './web-components/zylem-editor';
export type { ZylemEditorConfig } from './web-components/zylem-editor';
export * from './components/common/Icon';
export { editorEvents } from './components/events';
export type { EditorEvent, EditorEventType } from './components/events';
export {
    debugStore,
    debugState,
    gameState,
    stageState,
    MAIN_PANEL_ID,
    DOCK_SIDES,
    computeDockLayout,
    findDockedSide,
    dockPanelToSide,
    undockPanelFromSides,
    getDockedSide,
} from './components';
export type {
    DockPanelId,
    DockRect,
    DockRegistry,
    DockSide,
    DockZoneState,
    EditorDockDefaults,
} from './components';
export {
    connectEditorBridge,
    disconnectEditorBridge,
    bridgeChannel,
    sendDebugEnabled,
    sendTool,
    sendPlayback,
    sendEntitySelect,
    sendEntityFocus,
    sendEntityTransform,
    sendEntityCreate,
    sendAddType,
    sendSnapSettings,
    sendGridVisible,
    sendStageVariable,
} from './bridge/editor-bridge';

// Undo/redo. Exported so a host that turns off `enableUndoShortcut` can route
// cmd+z by focus and still drive the editor's stack.
export {
    undo,
    redo,
    canUndo,
    canRedo,
    undoLabel,
    redoLabel,
    clearHistory,
    historyState,
    MAX_HISTORY_DEPTH,
    type HistoryState,
} from './components/history/history-store';
export {
    catalogState,
    setEntityCatalog,
    setArmedType,
    type CatalogState,
} from './components/toolbar/catalog-state';
export { disarmTools } from './components/toolbar/tool-shortcuts';
export {
    installTransformToolGuard,
    releaseOrphanedTransformTool,
    type TransformToolGuardOptions,
} from './components/toolbar/transform-tool-guard';
export {
    transformState,
    setSnapEnabled,
    setSnapIncrements,
    setGridVisible,
    DEFAULT_ROTATE_SNAP,
    type TransformState,
} from './components/transform/transform-state';
export {
    onSceneOperation,
    type SceneOperationListener,
} from './host/scene-operation-hook';
export {
    buildStageExport,
    stageExportToString,
    copyStageExport,
    type StageExport,
    type StageExportEntity,
} from './components/stages/stage-export';
export {
    attachEditorStateBridge,
    dispatchToEditor,
    dispatchEditorUpdate,
    mountZylemEditor,
    type EditorUpdatePayload,
    type EditorStateBridge,
    type EditorStateBridgeOptions,
    type MountedZylemEditor,
    type MountZylemEditorOptions,
} from './host/editor-host';
