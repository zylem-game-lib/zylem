/**
 * State-Based Debug Module Loader
 *
 * This approach integrates with the existing debug state system
 * and loads the debug module when debug state changes to true.
 */

import { subscribe } from 'valtio/vanilla';
import { debugState } from '../../../game-lib/src/lib/debug/debug-state';

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