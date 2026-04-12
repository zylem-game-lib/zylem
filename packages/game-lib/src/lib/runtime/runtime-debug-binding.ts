import { debugState } from '../debug/debug-state';

import type { RuntimeDebugBinding } from './zylem-stage-runtime';

/**
 * Binds wasm runtime diagnostics to global {@link debugState.enabled} (from `createGame({ debug })`).
 * Pass via stage `runtimeDebugBinding` or rely on {@link ZylemGame} default after load.
 */
export function createRuntimeDebugBindingFromDebugState(): RuntimeDebugBinding {
	return {
		runtimeDiagnostics(): boolean {
			return debugState.enabled;
		},
	};
}
