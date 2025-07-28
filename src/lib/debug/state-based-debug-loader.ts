/**
 * State-Based Debug Module Loader
 *
 * This approach integrates with the existing debug state system
 * and loads the debug module when debug state changes to true.
 */

import { subscribe } from 'valtio';
import { debugState } from './debug-state';

let debugModuleLoaded = false;

/**
 * Loads the debug module when debug state becomes true
 */
async function loadDebugModule(): Promise<void> {
	if (!debugModuleLoaded) {
		try {
			await import('./Debug');
			debugModuleLoaded = true;
			console.log('🐛 Zylem Debug module loaded via state change');
		} catch (error) {
			console.error('Failed to load debug module:', error);
		}
	}
}

subscribe(debugState, async () => {
	if (debugState.on && !debugModuleLoaded) {
		await loadDebugModule();
	}
});

if (debugState.on && !debugModuleLoaded) {
	loadDebugModule();
} 