import { BaseNode } from '../base-node';
import { CameraWrapper } from '../../camera/camera';

/**
 * Check if an item is a BaseNode (has a create function).
 */
export function isBaseNode(item: unknown): item is BaseNode {
	return !!item && typeof item === 'object' && typeof (item as any).create === 'function';
}

/**
 * Check if an item is a Promise-like (thenable).
 */
export function isThenable(item: unknown): item is Promise<any> {
	return !!item && typeof (item as any).then === 'function';
}

/**
 * Check if an item is a CameraWrapper.
 */
export function isCameraWrapper(item: unknown): item is CameraWrapper {
	return !!item && typeof item === 'object' && (item as any).constructor?.name === 'CameraWrapper';
}

/**
 * Check if an item is a plain config object (not a special type).
 * Excludes BaseNode, CameraWrapper, functions, and promises.
 */
export function isConfigObject(item: unknown): boolean {
	if (!item || typeof item !== 'object') return false;
	if (isBaseNode(item)) return false;
	if (isCameraWrapper(item)) return false;
	if (isThenable(item)) return false;
	if (typeof (item as any).then === 'function') return false;
	// Must be a plain object
	return (item as any).constructor === Object || (item as any).constructor?.name === 'Object';
}

/**
 * Check if an item is an entity input (BaseNode, Promise, or factory function).
 */
export function isEntityInput(item: unknown): boolean {
	if (!item) return false;
	if (isBaseNode(item)) return true;
	if (typeof item === 'function') return true;
	if (isThenable(item)) return true;
	return false;
}
