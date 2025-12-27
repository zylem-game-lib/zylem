/**
 * State-Based Editor Module Loader
 *
 * Loads the editor module when debug state becomes enabled.
 */

import { debugStore } from './components/editor-store';

let editorModuleLoaded = false;

/**
 * Loads the editor module when debug state becomes true
 */
async function loadEditorModule(): Promise<void> {
	if (!editorModuleLoaded) {
		try {
			await import('./components/Editor');
			editorModuleLoaded = true;
			console.log('🎨 Zylem Editor module loaded via state change');
		} catch (error) {
			console.error('Failed to load editor module:', error);
		}
	}
}

// Check on initial load
if (debugStore.debug && !editorModuleLoaded) {
	loadEditorModule();
}

