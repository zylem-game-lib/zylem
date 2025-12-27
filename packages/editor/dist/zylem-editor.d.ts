import { Component } from 'solid-js';
import { LucideProps } from 'lucide-solid';

/**
 * Configuration options for the ZylemEditorElement
 */
interface ZylemEditorConfig {
    /**
     * External debug state to sync with.
     * If provided, the editor will use this state instead of its internal state.
     */
    debugState?: any;
    /**
     * External game state to sync with.
     */
    gameState?: any;
    /**
     * External stage state to sync with.
     */
    stageState?: any;
    /**
     * Whether to include default styles.
     * @default true
     */
    includeStyles?: boolean;
}
/**
 * ZylemEditorElement - A web component that wraps the Zylem Editor.
 *
 * This component is fully self-contained with bundled styles.
 * It can be imported and used in any project without additional CSS configuration.
 *
 * @example
 * ```html
 * <!-- Standalone usage -->
 * <zylem-editor></zylem-editor>
 * ```
 *
 * @example
 * ```js
 * // Configured usage
 * const editor = document.querySelector('zylem-editor');
 * editor.config = {
 *   debugState: myGame.debugState,
 *   gameState: myGame.gameState,
 *   stageState: myGame.stageState,
 * };
 * ```
 *
 * @example
 * ```js
 * // Manual registration in another project
 * import { ZylemEditorElement } from '@zylem/editor';
 *
 * // Optionally customize before registering
 * customElements.define('my-editor', ZylemEditorElement);
 * ```
 */
declare class ZylemEditorElement extends HTMLElement {
    private dispose;
    private _config;
    private _initialized;
    constructor();
    /**
     * Set configuration for the editor.
     * Must be set before the element is connected to the DOM, or call `reinitialize()` after.
     */
    set config(value: ZylemEditorConfig);
    get config(): ZylemEditorConfig;
    /**
     * Observed attributes for the web component
     */
    static get observedAttributes(): string[];
    attributeChangedCallback(name: string, _oldValue: string, newValue: string): void;
    connectedCallback(): void;
    private initialize;
    /**
     * Reinitialize the editor with new configuration.
     * Call this after changing the `config` property if the element is already connected.
     */
    reinitialize(): void;
    disconnectedCallback(): void;
}
/**
 * Register the ZylemEditorElement as a custom element.
 * Call this function to use the default 'zylem-editor' tag name.
 *
 * @example
 * ```js
 * import { registerZylemEditor } from '@zylem/editor';
 * registerZylemEditor();
 * // Now you can use <zylem-editor> in your HTML
 * ```
 */
declare function registerZylemEditor(tagName?: string): void;

interface IconProps extends LucideProps {
    icon: Component<LucideProps>;
}
declare const Icon: Component<IconProps>;

/**
 * Editor Event Bus
 *
 * Allows external code (e.g., game-lib) to dispatch state updates to the editor.
 * The editor subscribes to these events and updates its local state accordingly.
 */
type EditorEventType = 'debug' | 'game' | 'stage' | 'entities';
interface EditorEvent<T = unknown> {
    type: EditorEventType;
    payload: T;
}
type EventHandler<T = unknown> = (event: EditorEvent<T>) => void;
declare class EditorEventBus {
    private listeners;
    /**
     * Emit an event to all registered listeners of that type.
     */
    emit<T>(event: EditorEvent<T>): void;
    /**
     * Subscribe to events of a specific type.
     * Returns an unsubscribe function.
     */
    on<T>(type: EditorEventType, handler: EventHandler<T>): () => void;
    /**
     * Remove all listeners (useful for cleanup).
     */
    clear(): void;
}
/**
 * Global editor event bus instance.
 *
 * Usage from game-lib:
 * ```ts
 * import { editorEvents } from '@zylem/editor';
 * editorEvents.emit({ type: 'debug', payload: { enabled: true } });
 * ```
 *
 * Usage from editor components:
 * ```ts
 * editorEvents.on('debug', (e) => setDebugState(e.payload));
 * ```
 */
declare const editorEvents: EditorEventBus;

/**
 * Editor Events Module
 *
 * Bidirectional window CustomEvents for communication between @zylem/editor and consuming apps.
 *
 * EDITOR_STATE_DISPATCH: Editor sends state changes → external apps listen
 * EDITOR_STATE_RECEIVE: External apps send updates → editor listens
 */
/**
 * Payload structure for editor state events.
 * Matches the nested state structure for both directions.
 */
interface EditorUpdatePayload {
    gameState?: {
        debugFlag?: boolean;
        [key: string]: unknown;
    };
    toolbarState?: {
        tool?: 'select' | 'translate' | 'rotate' | 'scale' | 'delete' | 'none';
        paused?: boolean;
    };
    [key: string]: unknown;
}
/**
 * Event name constants
 */
declare const EDITOR_STATE_DISPATCH = "editor-state-dispatch";
declare const EDITOR_STATE_RECEIVE = "editor-state-receive";
declare const EDITOR_UPDATE_EVENT = "editor-state-dispatch";
/**
 * Dispatch state changes from the editor to external consumers.
 *
 * @param payload - The state update payload
 *
 * @example
 * ```ts
 * // From GameSection when debug checkbox changes
 * dispatchEditorUpdate({ gameState: { debugFlag: true } });
 * ```
 */
declare function dispatchEditorUpdate(payload: EditorUpdatePayload): void;

/**
 * Entities state for the entities section.
 * Manages debug state and entity selection/hover.
 */
type DebugTools = 'select' | 'translate' | 'rotate' | 'scale' | 'delete' | 'none';
interface DebugState {
    paused: boolean;
    tool: DebugTools;
    selectedEntityId: string | null;
    hoveredEntityId: string | null;
    flags: Set<string>;
}
declare const debugState: DebugState;

/**
 * Game state for the game section.
 * Manages global game variables and state.
 */
interface GameState {
    id: string;
    globals: Record<string, unknown>;
    time: number;
}
declare const gameState: GameState;

/**
 * Shared types for the editor store.
 * These mirror types from game-lib to avoid direct dependencies.
 */
interface Vector3Like {
    x: number;
    y: number;
    z: number;
}
interface BaseEntityInterface {
    uuid: string;
    name: string;
    type?: string;
    position?: Vector3Like;
    rotation?: Vector3Like;
    scale?: Vector3Like;
}
interface StageStateInterface {
    backgroundColor: any;
    backgroundImage: string | null;
    inputs: Record<string, string[]>;
    variables: Record<string, any>;
    gravity: Vector3Like;
    entities: Partial<BaseEntityInterface>[];
}

/**
 * Stage state for the stages section.
 * Manages stage configuration and entity list.
 */

declare const stageState: StageStateInterface;

interface DetachedPanelState {
    position: {
        x: number;
        y: number;
    };
    size: {
        width: number;
        height: number;
    };
}
declare const debugStore: {
    debug: boolean;
    tool: DebugTools;
    paused: boolean;
    hovered: string | null;
    selected: string[];
    panelPosition: {
        x: number;
        y: number;
    } | null;
    toggleButtonPosition: {
        x: number;
        y: number;
    };
    panelOrder: string[];
    detachedPanels: Record<string, DetachedPanelState>;
    openSections: string[];
    panelZOrder: string[];
    draggingPanelId: string | null;
    dropTargetIndex: number | null;
};

export { EDITOR_STATE_DISPATCH, EDITOR_STATE_RECEIVE, EDITOR_UPDATE_EVENT, type EditorEvent, type EditorEventType, type EditorUpdatePayload, Icon, type ZylemEditorConfig, ZylemEditorElement, debugState, debugStore, dispatchEditorUpdate, editorEvents, gameState, registerZylemEditor, stageState };
