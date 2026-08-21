import '@zylem/ui/styles.css';
import './web-components/zylem-editor';
import { bootstrapHarnessGame, createHarnessGameElement } from './dev/harness-game';

const root = document.getElementById('root');

if (!root) {
	throw new Error('Root element not found');
}

root.style.position = 'relative';
root.style.width = '100%';
root.style.height = '100vh';
root.style.overflow = 'hidden';

const game = createHarnessGameElement();
root.appendChild(game);

const editor = document.createElement('zylem-editor');
editor.setAttribute('launcher-mode', 'floating');
editor.style.display = 'block';
editor.style.position = 'absolute';
editor.style.inset = '0';
// The overlay covers the canvas, so it must not swallow the clicks the gizmo and
// placement tools need. Panels re-enable pointer events on themselves.
editor.style.pointerEvents = 'none';
editor.style.width = '100%';
editor.style.height = '100%';
root.appendChild(editor);

// Started after both elements are mounted: the game element sizes the renderer
// from its own bounds when `game` is assigned.
bootstrapHarnessGame(game);
