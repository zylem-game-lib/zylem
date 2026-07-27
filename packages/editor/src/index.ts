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
    sendStageVariable,
} from './bridge/editor-bridge';
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
