import { Game } from '../lib/game/game';
import { LoadingEvent } from '../lib/stage/zylem-stage';

export class ZylemGameElement extends HTMLElement {
  private _game: Game<any> | null = null;
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
    // Inject our container into the game options
    game.options.push({ container: this.container });
  }

  get game(): Game<any> | null {
    return this._game;
  }
}

customElements.define('zylem-game', ZylemGameElement);
