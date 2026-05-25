/**
 * Side-effect entry that aggregates every vanilla-extract `globalStyle()`
 * registration plus the plain-CSS font sidecar. tsup uses this as one of
 * its entries so the resulting bundle ends up at `dist/styles.css` — the
 * single self-contained file the editor's web component injects into its
 * shadow DOM via `?raw` and that any consumer can import as plain CSS.
 */
import './fonts.css';
import './theme.css';
import './global/logo.css';
import './global/common.css';
import './global/sidebar.css';
import './global/editor-base.css';
import './global/toolbar.css';
import './global/console.css';
import './global/accordion.css';
import './global/menu.css';
import './global/entities.css';
import './global/detached-panel.css';
import './global/checkbox.css';
