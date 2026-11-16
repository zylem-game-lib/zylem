/**
 * Picking for HUD elements.
 *
 * Text, rects, and cooldown icons pinned to the viewport have no collider, so
 * the physics raycast behind the Select tool passes straight through them.
 * They are flat boxes on the screen, though, so a pick is a point-in-box
 * test against where each one is drawn (`getScreenRect`).
 *
 * A HUD element hangs off the camera it was set up with. It is only where its
 * box says while that camera is the one rendering, so every test here names
 * the rendering camera and passes over elements pinned to another.
 */

import type { Object3D } from 'three';
import { isHudEntity, type ViewportRect } from '../entities/screen-anchor';

/** A pointer position in normalized device coordinates: -1..1, +y up. */
export interface PointerNdc {
	x: number;
	y: number;
}

/** Whether `object` is `ancestor` or hangs off it. */
export function isAttachedTo(object: Object3D | null | undefined, ancestor: Object3D): boolean {
	for (let node = object ?? null; node; node = node.parent) {
		if (node === ancestor) return true;
	}
	return false;
}

/** Whether the object and every parent are visible. */
function isShown(object: Object3D): boolean {
	for (let node: Object3D | null = object; node; node = node.parent) {
		if (!node.visible) return false;
	}
	return true;
}

/**
 * Where a HUD element is drawn through `camera`.
 *
 * @returns `null` for anything that is not a HUD element, is hidden, or is
 * pinned to a camera other than `camera`.
 */
export function hudRectOf(entity: unknown, camera: Object3D): ViewportRect | null {
	if (!isHudEntity(entity)) return null;
	const object = (entity as { group?: Object3D | null }).group;
	if (!object || !isAttachedTo(object, camera) || !isShown(object)) return null;
	const rect = entity.getScreenRect();
	return rect && rect.width > 0 && rect.height > 0 ? rect : null;
}

/** Whether the pointer is inside the box. */
export function rectHoldsPointer(rect: ViewportRect, ndc: PointerNdc): boolean {
	const x = (ndc.x + 1) / 2;
	const y = (1 - ndc.y) / 2;
	return (
		x >= rect.left &&
		x <= rect.left + rect.width &&
		y >= rect.top &&
		y <= rect.top + rect.height
	);
}

/** How far in front of the lens the element sits. Nearer draws on top. */
function depthOf(entity: unknown): number {
	const depth = (entity as { options?: { zDistance?: number } }).options?.zDistance;
	return typeof depth === 'number' && Number.isFinite(depth) ? depth : 1;
}

/**
 * The HUD element on top under the pointer.
 *
 * The nearest to the lens wins, as it is the one drawn over the others. Two
 * at the same depth draw in the order they were added, so the later one wins.
 *
 * @param entities The stage's entities by uuid, in the order they were added.
 */
export function pickHud(
	entities: Iterable<[string, unknown]>,
	camera: Object3D,
	ndc: PointerNdc,
): string | null {
	let picked: string | null = null;
	let pickedDepth = Infinity;
	for (const [uuid, entity] of entities) {
		const rect = hudRectOf(entity, camera);
		if (!rect || !rectHoldsPointer(rect, ndc)) continue;
		const depth = depthOf(entity);
		if (depth > pickedDepth) continue;
		picked = uuid;
		pickedDepth = depth;
	}
	return picked;
}
