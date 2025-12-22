import { render } from 'solid-js/web';
import App from '../App';
import { EditorProvider } from '../store/EditorContext';
import stylesCSS from '@zylem/styles/styles.css?inline';
import editorCSS from '@zylem/styles/editor.css?inline';

export class ZylemEditorElement extends HTMLElement {
  private dispose: (() => void) | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // Inject styles into shadow DOM
    const styleElement = document.createElement('style');
    styleElement.textContent = stylesCSS + editorCSS;
    this.shadowRoot!.appendChild(styleElement);

    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    this.shadowRoot!.appendChild(div);
    
    this.dispose = render(() => (
      <EditorProvider>
        <App />
      </EditorProvider>
    ), div);
  }

  disconnectedCallback() {
    if (this.dispose) this.dispose();
  }
}

customElements.define('zylem-editor', ZylemEditorElement);
