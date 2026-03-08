import { Game } from '../lib/game/game';
import {
  debugState,
  setDebugTool,
  setPaused,
  type DebugTools,
} from '../lib/debug/debug-state';
import type { DeviceProfile } from '../lib/game/game-config';

/**
 * State interface for editor-to-game communication
 */
export interface ZylemGameState {
  gameState?: {
    debugFlag?: boolean;
    [key: string]: unknown;
  };
  toolbarState?: {
    tool?: DebugTools;
    paused?: boolean;
  };
  [key: string]: unknown;
}

export class ZylemGameElement extends HTMLElement {
  private _game: Game<any> | null = null;
  private _state: ZylemGameState = {};
  private container: HTMLElement;
  private resizeObserver: ResizeObserver | null = null;
  private _viewportProfile: DeviceProfile = 'auto';
  private static readonly HOST_CONFIG_MARKER = Symbol('zylem:host-config');

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
      }
    `;
    this.container = document.createElement('div');
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.position = 'relative';
    this.container.style.outline = 'none'; // Remove focus outline
    this.container.tabIndex = 0; // Make focusable for keyboard input
    this.shadowRoot!.append(style, this.container);
  }

  /**
   * Focus the game container for keyboard input
   */
  public focus(): void {
    this.container.focus();
  }

  connectedCallback(): void {
    if (typeof ResizeObserver !== 'undefined' && !this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.syncDisplayRuntime();
      });
      this.resizeObserver.observe(this);
    }
    this.syncDisplayRuntime();
  }

  set game(game: Game<any>) {
    // Dispose previous game if one exists
    if (this._game) {
      this._game.dispose();
    }

    this._game = game;
    this.attachHostContainer(game);
    this.syncDisplayRuntime();
    game.start();
  }

  get game(): Game<any> | null {
    return this._game;
  }

  set state(value: ZylemGameState) {
    this._state = value;
    this.syncDebugState();
    this.syncToolbarState();
  }

  get state(): ZylemGameState {
    return this._state;
  }

  set viewportProfile(value: DeviceProfile) {
    const normalized: DeviceProfile =
      value === 'mobile' || value === 'desktop' ? value : 'auto';
    if (this._viewportProfile === normalized) {
      return;
    }
    this._viewportProfile = normalized;
    this.syncDisplayRuntime();
  }

  get viewportProfile(): DeviceProfile {
    return this._viewportProfile;
  }

  static get observedAttributes(): string[] {
    return ['viewport-profile'];
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    newValue: string | null,
  ): void {
    if (name === 'viewport-profile') {
      this.viewportProfile = (newValue ?? 'auto') as DeviceProfile;
    }
  }

  /**
   * Sync the web component's state with the game-lib's internal debug state
   */
  private syncDebugState(): void {
    const debugFlag = this._state.gameState?.debugFlag;
    if (debugFlag !== undefined) {
      debugState.enabled = debugFlag;
    }
  }

  /**
   * Sync toolbar state with game-lib's debug state
   */
  private syncToolbarState(): void {
    const { tool, paused } = this._state.toolbarState ?? {};
    if (tool !== undefined) {
      setDebugTool(tool);
    }
    if (paused !== undefined) {
      setPaused(paused);
    }
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this._game) {
      this._game.dispose();
      this._game = null;
    }
  }

  private attachHostContainer(game: Game<any>): void {
    const marker = ZylemGameElement.HOST_CONFIG_MARKER;
    const existing = game.options.find((option) =>
      Boolean((option as Record<symbol, unknown>)?.[marker]),
    ) as ({ container: HTMLElement } & Record<symbol, boolean>) | undefined;

    if (existing) {
      existing.container = this.container;
      return;
    }

    game.options.push({
      container: this.container,
      [marker]: true,
    } as any);
  }

  private syncDisplayRuntime(): void {
    if (!this._game) {
      return;
    }

    const rect = this.getBoundingClientRect();
    const width = Math.round(rect.width || this.clientWidth || 0);
    const height = Math.round(rect.height || this.clientHeight || 0);

    this._game.setDisplayRuntime({
      deviceProfile: this._viewportProfile,
      viewportSize: width > 0 && height > 0 ? { width, height } : undefined,
    });
  }
}

customElements.define('zylem-game', ZylemGameElement);
