/**
 * Host observation of committed scene edits.
 *
 * Every edit the editor records is also announced here, so an embedding app can
 * react to it — persisting a layout, marking a document dirty, or eventually
 * writing changes back to source. Kept in its own module so `editor-bridge` does
 * not have to import the host surface (which imports the bridge), which would be
 * circular.
 */

import type { SceneOperationPayload } from '@zylem/bridge';

export type SceneOperationListener = (op: SceneOperationPayload) => void;

const listeners = new Set<SceneOperationListener>();

/**
 * Observe committed scene operations.
 *
 * @returns An unsubscribe function.
 */
export function onSceneOperation(listener: SceneOperationListener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

/** @internal Announce an operation to host listeners. */
export function notifySceneOperation(op: SceneOperationPayload): void {
	for (const listener of listeners) {
		try {
			listener(op);
		} catch (error) {
			console.error('[zylem/editor] scene operation listener failed', error);
		}
	}
}
