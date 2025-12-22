/**
 * State-Based Debug Module Loader
 *
 * Loads the debug module when debug state becomes enabled.
 */

import { subscribe } from 'valtio/vanilla';
import { debugState } from './debug-state';

let debugModuleLoaded = false;

/**
 * Loads the debug module when debug state becomes true
 */
async function loadDebugModule(): Promise<void> {
	if (!debugModuleLoaded) {
		try {
			await import('../ui/Debug');
			debugModuleLoaded = true;
			console.log('🐛 Zylem Debug module loaded via state change');
		} catch (error) {
			console.error('Failed to load debug module:', error);
		}
	}
}

subscribe(debugState, async () => {
	if (debugState.enabled && !debugModuleLoaded) {
		await loadDebugModule();
	}
});

if (debugState.enabled && !debugModuleLoaded) {
	loadDebugModule();
}
