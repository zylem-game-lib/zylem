import { Game } from '../lib/game/game';

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
    game.options.push({ container: this.container });
    game.start();
  }

  get game(): Game<any> | null {
    return this._game;
  }

  disconnectedCallback() {
    if (this._game) {
      this._game.dispose();
      this._game = null;
    }
  }
}

customElements.define('zylem-game', ZylemGameElement);
