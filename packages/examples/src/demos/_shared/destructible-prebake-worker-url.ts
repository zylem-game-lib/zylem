/**
 * Vite resolves this module worker entry for {@link Destructible3DBehavior} prebake.
 *
 * The worker source lives in `@zylem/utilities/workers/destructible-prebake/`
 * (sibling to the offline prebake CLI). The `?worker&url` Vite import
 * suffix makes Vite emit the worker as a separate, browser-loadable module
 * in both `vite dev` and `vite build` (no manual data-URL inlining of `.ts`).
 *
 * Published-build consumers can substitute:
 *   `new URL('@zylem/utilities/workers/destructible-prebake/worker.js', import.meta.url)`
 */
import workerUrl from '../../../../zylem-utilities/workers/destructible-prebake/src/worker.ts?worker&url';

export const destructiblePrebakeWorkerUrl = workerUrl;
