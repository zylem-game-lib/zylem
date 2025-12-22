import '@zylem/styles/styles.css';
import '@zylem/styles/editor.css';
import './web-components/zylem-editor';

const root = document.getElementById('root');

if (!root) {
	throw new Error('Root element not found');
}

// Create and append the zylem-editor web component
const editor = document.createElement('zylem-editor');
editor.style.display = 'block';
editor.style.width = '100%';
editor.style.height = '100vh';
editor.style.backgroundColor = 'var(--zylem-color-background)';
root.appendChild(editor);
