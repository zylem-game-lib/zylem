/**
 * Lodash-style path utilities for getting/setting nested object values.
 */

/**
 * Get a value from an object by path string.
 * @example getByPath({ player: { health: 100 } }, 'player.health') // 100
 */
export function getByPath<T = unknown>(obj: object, path: string): T | undefined {
	if (!path) return undefined;
	const keys = path.split('.');
	let current: any = obj;
	for (const key of keys) {
		if (current == null || typeof current !== 'object') {
			return undefined;
		}
		current = current[key];
	}
	return current as T;
}

/**
 * Set a value on an object by path string, creating intermediate objects as needed.
 * @example setByPath({}, 'player.health', 100) // { player: { health: 100 } }
 */
export function setByPath(obj: object, path: string, value: unknown): void {
	if (!path) return;
	const keys = path.split('.');
	let current: any = obj;
	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		if (current[key] == null || typeof current[key] !== 'object') {
			current[key] = {};
		}
		current = current[key];
	}
	current[keys[keys.length - 1]] = value;
}

/**
 * Check if a path exists in an object.
 */
export function hasPath(obj: object, path: string): boolean {
	if (!path) return false;
	const keys = path.split('.');
	let current: any = obj;
	for (const key of keys) {
		if (current == null || typeof current !== 'object' || !(key in current)) {
			return false;
		}
		current = current[key];
	}
	return true;
}
