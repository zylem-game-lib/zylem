/**
 * Showcase entry point. Importing `src/styles` (the same side-effect barrel
 * tsup bundles into `dist/styles.css`) lets the vanilla-extract Vite plugin
 * compile tokens and global styles live — editing any `*.css.ts` file
 * hot-reloads the preview without a tsup build.
 */
import '../../src/styles';
import './showcase.css';

import { render } from 'solid-js/web';
import { App } from './App';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Showcase root element not found');
}

render(() => <App />, root);
