import { render } from 'solid-js/web';
import App, {
  type EditorController,
  type EditorLauncherMode,
} from '../App';
import { EditorProvider } from '../components/EditorContext';
import { DOCK_SIDES, type DockPanelId, type DockSide } from '../components/common/dock-layout';
import type { EditorDockDefaults } from '../components/editor-store';

// Import bundled CSS (single file with all tokens and component styles).
// Resolves via the `./styles.css` export in `@zylem/ui/package.json`.
import zylemCSS from '@zylem/ui/styles.css?raw';
import { entityPreviewCSS } from '../components/entities/entity-preview.css';
import { bridgePanelCSS } from '../components/bridge/bridge-panel.css';
import { connectEditorBridge } from '../bridge/editor-bridge';

/**
 * Configuration options for the ZylemEditorElement
 */
export interface ZylemEditorConfig {
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
  /**
   * Controls whether the internal floating launcher is rendered.
   * @default 'floating'
   */
  launcherMode?: EditorLauncherMode;
  /**
   * Dock layout to seed the first time the editor runs in this browser, keyed
   * by viewport edge. Use `'main'` for the editor panel itself; any other id is
   * a section (for example `'console'`), which gets detached from the accordion
   * so it can hold a dock slot.
   *
   * Ignored once the user has a saved layout, so it sets a starting point
   * rather than forcing one.
   */
  defaultDocks?: EditorDockDefaults;
}

const normalizeLauncherMode = (value: unknown): EditorLauncherMode =>
  value === 'hidden' ? 'hidden' : 'floating';

/** Tolerant parse so a malformed attribute degrades to "no defaults". */
const normalizeDockDefaults = (value: unknown): EditorDockDefaults | undefined => {
  let source = value;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      return undefined;
    }
  }
  if (!source || typeof source !== 'object') return undefined;

  const defaults: EditorDockDefaults = {};
  for (const side of DOCK_SIDES) {
    const panels = (source as Record<string, unknown>)[side];
    if (!Array.isArray(panels)) continue;
    const ids = panels.filter(
      (id): id is DockPanelId => typeof id === 'string' && id.length > 0,
    );
    if (ids.length > 0) defaults[side] = ids;
  }

  return Object.keys(defaults).length > 0 ? defaults : undefined;
};

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
export class ZylemEditorElement extends HTMLElement {
  private dispose: (() => void) | null = null;
  private _config: ZylemEditorConfig = {};
  private _initialized = false;
  private controller: EditorController | null = null;
  /** Releases this element's bridge subscription (reference-counted). */
  private releaseBridge: (() => void) | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /**
   * Set configuration for the editor.
   * Must be set before the element is connected to the DOM, or call `reinitialize()` after.
   */
  set config(value: ZylemEditorConfig) {
    this._config = value;
    if (this._initialized) {
      this.reinitialize();
    }
  }

  get config(): ZylemEditorConfig {
    return this._config;
  }

  set launcherMode(value: EditorLauncherMode) {
    const normalized = normalizeLauncherMode(value);
    if (this._config.launcherMode === normalized) {
      return;
    }

    this._config.launcherMode = normalized;
    if (this._initialized) {
      this.reinitialize();
    }
  }

  get launcherMode(): EditorLauncherMode {
    return normalizeLauncherMode(this._config.launcherMode);
  }

  /**
   * Observed attributes for the web component
   */
  static get observedAttributes() {
    return ['include-styles', 'launcher-mode', 'default-docks'];
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'include-styles') {
      this._config.includeStyles = newValue !== 'false';
      return;
    }

    if (name === 'launcher-mode') {
      this.launcherMode = normalizeLauncherMode(newValue);
      return;
    }

    if (name === 'default-docks') {
      // Only consulted on first run, so a late change needs no reinitialize.
      const defaults = normalizeDockDefaults(newValue);
      if (defaults) {
        this._config.defaultDocks = defaults;
      } else {
        delete this._config.defaultDocks;
      }
    }
  }

  connectedCallback() {
    this.initialize();
  }

  private initialize() {
    if (this._initialized) return;
    this._initialized = true;

    // Subscribing here rather than at module load means a game with no editor
    // mounted publishes nothing, and the game can skip editor-only work.
    this.releaseBridge = connectEditorBridge();

    // Add bundled styles unless explicitly disabled
    if (this._config.includeStyles !== false) {
      const styleElement = document.createElement('style');

      styleElement.textContent = `${zylemCSS}\n${entityPreviewCSS}\n${bridgePanelCSS}`;
      this.shadowRoot!.appendChild(styleElement);
    }

    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    this.shadowRoot!.appendChild(div);

    this.dispose = render(() => (
      <EditorProvider>
        <App
          launcherMode={this.launcherMode}
          defaultDocks={normalizeDockDefaults(this._config.defaultDocks)}
          onControllerReady={(controller) => {
            this.controller = controller;
          }}
        />
      </EditorProvider>
    ), div);
  }

  openPanel() {
    this.controller?.openPanel();
  }

  closePanel() {
    this.controller?.closePanel();
  }

  togglePanel() {
    this.controller?.togglePanel();
  }

  /**
   * Dock a panel to a viewport edge, or pass `null` to float it again.
   * Defaults to the main editor panel.
   */
  dockPanel(side: DockSide | null, panelId?: DockPanelId) {
    this.controller?.dockPanel(side, panelId);
  }

  /**
   * Reinitialize the editor with new configuration.
   * Call this after changing the `config` property if the element is already connected.
   */
  reinitialize() {
    this.teardown();
    // Clear shadow root
    while (this.shadowRoot!.firstChild) {
      this.shadowRoot!.removeChild(this.shadowRoot!.firstChild);
    }
    this.initialize();
  }

  disconnectedCallback() {
    this.teardown();
  }

  private teardown() {
    if (this.dispose) {
      this.dispose();
      this.dispose = null;
    }
    this.releaseBridge?.();
    this.releaseBridge = null;
    this.controller = null;
    this._initialized = false;
  }
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
export function registerZylemEditor(tagName = 'zylem-editor') {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, ZylemEditorElement);
  }
}

// Auto-register with default tag name for convenience
if (typeof window !== 'undefined' && !customElements.get('zylem-editor')) {
  customElements.define('zylem-editor', ZylemEditorElement);
}
