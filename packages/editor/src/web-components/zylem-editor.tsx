import { render } from 'solid-js/web';
import App, {
  type EditorController,
  type EditorLauncherMode,
} from '../App';
import { EditorProvider } from '../components/EditorContext';

// Import bundled CSS (single file with all tokens and component styles)
import zylemCSS from '../../../zylem-styles/dist/styles.css?raw';

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
}

const normalizeLauncherMode = (value: unknown): EditorLauncherMode =>
  value === 'hidden' ? 'hidden' : 'floating';

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
    return ['include-styles', 'launcher-mode'];
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === 'include-styles') {
      this._config.includeStyles = newValue !== 'false';
      return;
    }

    if (name === 'launcher-mode') {
      this.launcherMode = normalizeLauncherMode(newValue);
    }
  }

  connectedCallback() {
    this.initialize();
  }

  private initialize() {
    if (this._initialized) return;
    this._initialized = true;

    // Add bundled styles unless explicitly disabled
    if (this._config.includeStyles !== false) {
      const styleElement = document.createElement('style');

      styleElement.textContent = zylemCSS;
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
   * Reinitialize the editor with new configuration.
   * Call this after changing the `config` property if the element is already connected.
   */
  reinitialize() {
    if (this.dispose) {
      this.dispose();
      this.dispose = null;
    }
    this.controller = null;
    // Clear shadow root
    while (this.shadowRoot!.firstChild) {
      this.shadowRoot!.removeChild(this.shadowRoot!.firstChild);
    }
    this._initialized = false;
    this.initialize();
  }

  disconnectedCallback() {
    if (this.dispose) {
      this.dispose();
      this.dispose = null;
    }
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
