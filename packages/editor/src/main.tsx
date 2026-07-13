import '@zylem/ui/styles.css';
import './web-components/zylem-editor';
import { bootstrapStubGame, createStubGameElement } from './dev/stub-game';

const root = document.getElementById('root');

if (!root) {
	throw new Error('Root element not found');
}

root.style.position = 'relative';
root.style.width = '100%';
root.style.height = '100vh';
root.style.overflow = 'hidden';

// Empty zylem-game shell (no Game instance / WebGL) behind the editor overlay.
const game = createStubGameElement();
root.appendChild(game);

const editor = document.createElement('zylem-editor');
editor.setAttribute('launcher-mode', 'floating');
editor.style.display = 'block';
editor.style.position = 'absolute';
editor.style.inset = '0';
editor.style.width = '100%';
editor.style.height = '100%';
root.appendChild(editor);

bootstrapStubGame();
