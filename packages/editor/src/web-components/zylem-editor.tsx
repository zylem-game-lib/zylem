import { render } from 'solid-js/web';
import App from '../App';

export class ZylemEditorElement extends HTMLElement {
  private dispose: (() => void) | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    this.shadowRoot!.appendChild(div);
    
    this.dispose = render(() => <App />, div);
  }

  disconnectedCallback() {
    if (this.dispose) this.dispose();
  }
}

customElements.define('zylem-editor', ZylemEditorElement);
