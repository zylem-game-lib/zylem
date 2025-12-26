import { Game } from '../lib/game/game';
import { debugState } from '../lib/debug/debug-state';

/**
 * State interface for editor-to-game communication
 */
export interface ZylemGameState {
  gameState?: {
    debugFlag?: boolean;
    [key: string]: unknown;
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
    this.shadowRoot!.appendChild(this.container);
  }

  set game(game: Game<any>) {
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

  disconnectedCallback() {
    if (this._game) {
      this._game.dispose();
      this._game = null;
    }
  }
}

customElements.define('zylem-game', ZylemGameElement);
