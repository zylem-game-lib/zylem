import { Game } from '../lib/game/game';
import { debugState, setDebugTool, setPaused, type DebugTools } from '../lib/debug/debug-state';

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

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.container = document.createElement('div');
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.position = 'relative';
    this.container.style.outline = 'none'; // Remove focus outline
    this.container.tabIndex = 0; // Make focusable for keyboard input
    this.shadowRoot!.appendChild(this.container);
  }

  /**
   * Focus the game container for keyboard input
   */
  public focus(): void {
    this.container.focus();
  }

  set game(game: Game<any>) {
    // Dispose previous game if one exists
    if (this._game) {
      this._game.dispose();
    }
    
    this._game = game;
    game.options.push({ container: this.container });
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
    if (this._game) {
      this._game.dispose();
      this._game = null;
    }
  }
}

customElements.define('zylem-game', ZylemGameElement);
