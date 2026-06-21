import { setConsoleFunction, getConsoleFunction } from 'three';

/**
 * The exact message Three.js logs from the abstract base implementations of
 * `Node.update()` / `Node.updateBefore()` / `Node.updateAfter()`
 * (`three/src/nodes/core/Node.js`). It is prefixed with `THREE.` by Three's
 * internal `warn()` helper before reaching the console hook.
 */
const ABSTRACT_NODE_WARNING = 'THREE.Abstract function.';

let installed = false;
let abstractWarningSurfaced = false;

/**
 * Console method names Three.js routes through {@link setConsoleFunction}.
 */
type ThreeConsoleType = 'log' | 'warn' | 'error';

/**
 * Install a Three.js console filter that suppresses the per-frame
 * `THREE.Abstract function.` warning while forwarding every other Three.js
 * log/warn/error untouched.
 *
 * ## Why this exists
 *
 * Under the WebGPU/WGSL backend, a node in the render graph is scheduled for
 * per-object/per-render updates (its `getUpdateType()` is non-`NONE`) but the
 * resolved `update()` ends up at the abstract base method, which only calls
 * `warn('Abstract function.')`. Because `NodeFrame.updateNode()` runs that path
 * for every affected render object — and again inside the shadow-map pass —
 * the warning is emitted dozens of times per frame, flooding the console once
 * animated actors are on screen. The call is otherwise a no-op (the abstract
 * method returns `undefined`), so rendering is unaffected; the only symptom is
 * the console spam.
 *
 * The flood does not reproduce on the WebGL2 fallback backend, which makes it
 * an upstream Three.js (r184) WebGPU quirk rather than a Zylem scheduling bug.
 * Filtering the single offending message via Three's official logging hook
 * keeps the console usable without monkey-patching `Node.prototype` or altering
 * the render pipeline. The first occurrence is still surfaced once (downgraded
 * to a single informational note) so the underlying behavior stays
 * discoverable.
 *
 * Idempotent: safe to call on every renderer init; only the first call wires
 * the hook. Any previously-registered Three console function is preserved and
 * delegated to.
 */
export function installThreeConsoleFilter(): void {
	if (installed) return;
	installed = true;

	const previous = getConsoleFunction();

	setConsoleFunction((type: ThreeConsoleType, message: string, ...params: unknown[]) => {
		if (type === 'warn' && message === ABSTRACT_NODE_WARNING) {
			if (!abstractWarningSurfaced) {
				abstractWarningSurfaced = true;
				console.warn(
					`${ABSTRACT_NODE_WARNING} (suppressing further per-frame repeats; ` +
						'a WebGPU node is scheduled for updates without an update() implementation)',
				);
			}
			return;
		}

		if (previous) {
			previous(type, message, ...params);
			return;
		}

		// Replicate Three's default console routing for everything we don't
		// suppress, including its stack-trace error formatting.
		const stackTrace = params[0] as { isStackTrace?: boolean; getError?: (m: unknown) => unknown } | undefined;
		const sink = type === 'log' ? console.log : type === 'error' ? console.error : console.warn;
		if (stackTrace && stackTrace.isStackTrace && typeof stackTrace.getError === 'function') {
			sink(stackTrace.getError(message));
		} else {
			sink(message, ...params);
		}
	});
}
