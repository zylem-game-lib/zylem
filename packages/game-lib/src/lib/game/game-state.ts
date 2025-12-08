import { proxy, subscribe } from 'valtio/vanilla';
import { getByPath, setByPath } from '../core/utility/path-utils';

/**
 * Internal game state store using valtio proxy for reactivity.
 */
const state = proxy({
	id: '',
	globals: {} as Record<string, unknown>,
	time: 0,
});

/**
 * Set a global value by path.
 * @example setGlobal('score', 100)
 * @example setGlobal('player.health', 50)
 */
export function setGlobal(path: string, value: unknown): void {
	setByPath(state.globals, path, value);
}

/**
 * Create/initialize a global with a default value.
 * Only sets the value if it doesn't already exist.
 * Use this to ensure globals have initial values before game starts.
 * @example createGlobal('score', 0)
 * @example createGlobal('player.health', 100)
 */
export function createGlobal<T>(path: string, defaultValue: T): T {
	const existing = getByPath<T>(state.globals, path);
	if (existing === undefined) {
		setByPath(state.globals, path, defaultValue);
		return defaultValue;
	}
	return existing;
}

/**
 * Get a global value by path.
 * @example getGlobal('score') // 100
 * @example getGlobal<number>('player.health') // 50
 */
export function getGlobal<T = unknown>(path: string): T | undefined {
	return getByPath<T>(state.globals, path);
}

/**
 * Subscribe to changes on a global value at a specific path.
 * Returns an unsubscribe function.
 * @example const unsub = onGlobalChange('score', (val) => console.log(val));
 */
export function onGlobalChange<T = unknown>(
	path: string,
	callback: (value: T) => void
): () => void {
	let previous = getByPath<T>(state.globals, path);
	return subscribe(state.globals, () => {
		const current = getByPath<T>(state.globals, path);
		if (current !== previous) {
			previous = current;
			callback(current as T);
		}
	});
}

/**
 * Subscribe to changes on multiple global paths.
 * Callback fires when any of the paths change, receiving all current values.
 * Returns an unsubscribe function.
 * @example const unsub = onGlobalChanges(['score', 'lives'], ([score, lives]) => console.log(score, lives));
 */
export function onGlobalChanges<T extends unknown[] = unknown[]>(
	paths: string[],
	callback: (values: T) => void
): () => void {
	let previousValues = paths.map(p => getByPath(state.globals, p));
	return subscribe(state.globals, () => {
		const currentValues = paths.map(p => getByPath(state.globals, p));
		const hasChange = currentValues.some((val, i) => val !== previousValues[i]);
		if (hasChange) {
			previousValues = currentValues;
			callback(currentValues as T);
		}
	});
}

/**
 * Get the entire globals object (read-only snapshot).
 */
export function getGlobals<T = Record<string, unknown>>(): T {
	return state.globals as T;
}

/**
 * Initialize globals from an object. Used internally during game setup.
 */
export function initGlobals(globals: Record<string, unknown>): void {
	for (const [key, value] of Object.entries(globals)) {
		setByPath(state.globals, key, value);
	}
}

/**
 * Reset all globals. Used internally on game dispose.
 */
export function resetGlobals(): void {
	state.globals = {};
}

export { state };