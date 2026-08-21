/**
 * Solid-reactive mirrors of valtio proxies.
 *
 * The editor keeps its state in valtio so non-Solid hosts can read and write it,
 * but a valtio proxy read inside a Solid component tracks nothing — the
 * component renders once with the value it happened to see. Anything a component
 * reads therefore needs a Solid store fed by a valtio subscription, which is the
 * same shape as the hand-written sync in `editor-store.ts`, generalized.
 */

import { createStore, reconcile, type Store } from 'solid-js/store';
import { subscribe } from 'valtio/vanilla';

/**
 * Plain deep copy of the proxy's current contents.
 *
 * Deliberately not `valtio`'s `snapshot()`: that returns a deeply frozen object,
 * and Solid's store writes into the objects it is given, so reconciling a frozen
 * snapshot throws on the next update. `structuredClone` is out too — it rejects
 * proxy objects outright.
 */
function copy<T>(value: T): T {
	if (Array.isArray(value)) {
		return value.map((entry) => copy(entry)) as unknown as T;
	}
	if (value instanceof Set) {
		return new Set([...value].map((entry) => copy(entry))) as unknown as T;
	}
	if (value instanceof Map) {
		return new Map(
			[...value].map(([entryKey, entryValue]) => [entryKey, copy(entryValue)]),
		) as unknown as T;
	}
	// Class instances are passed through by reference: the editor's state holds
	// only plain data, and a blind copy would strip the prototype off anything
	// else that turns up.
	if (value === null || typeof value !== 'object') return value;
	if (Object.getPrototypeOf(value) !== Object.prototype) return value;

	const result: Record<string, unknown> = {};
	for (const [entryKey, entryValue] of Object.entries(value)) {
		result[entryKey] = copy(entryValue);
	}
	return result as T;
}

export interface ProxyMirrorOptions {
	/**
	 * Property used to match array entries across updates, so reordering a list
	 * moves rows instead of rewriting every one of them.
	 */
	key?: string;
}

/**
 * Mirror a valtio proxy into a Solid store.
 *
 * The subscription is never released, which is intended: proxies passed here are
 * module-level singletons that outlive every component, and dropping the
 * subscription when the last reader unmounts would leave a stale store behind
 * for the next one.
 */
export function mirrorProxy<T extends object>(
	source: T,
	options: ProxyMirrorOptions = {},
): Store<T> {
	const key = options.key ?? 'id';
	const [store, setStore] = createStore<T>(copy(source));
	subscribe(source, () => {
		setStore(reconcile(copy(source), { key, merge: false }));
	});
	return store;
}
