/**
 * The volume an entity presents to the editor's selection tools.
 *
 * Outlines, the hover cursor and the marquee hit test all need "the box
 * around this entity", and a raw world AABB is a poor answer for anything
 * flat: a plane has zero height, a sprite zero depth, a line is thin on two
 * axes, and a zone or particle emitter has no renderable at all. This module
 * gives every consumer one answer, in two layers:
 *
 * - a default that measures `group ?? mesh` and pads thin axes up to a
 *   minimum thickness proportional to the entity's size, plus a small margin
 *   so the outline sits just outside the surface;
 * - an optional per-entity override, {@link SelectionBoundsProvider}, for
 *   entities whose selection view cannot be derived from their render object.
 */
import { Box3, type Object3D, Vector3 } from 'three';

/** Uniform margin around the box, as a fraction of its largest extent. */
export const SELECTION_BOUNDS_MARGIN = 0.02;
/** A thin axis is padded up to this fraction of the largest extent... */
export const SELECTION_THIN_AXIS_FRACTION = 0.05;
/** ...clamped between these world-unit bounds. */
export const SELECTION_THIN_AXIS_MIN = 0.1;
export const SELECTION_THIN_AXIS_MAX = 1.0;

/**
 * Implemented by entities that define their own selection view. `target`
 * is a scratch box to write into; return it, or `null` when the entity
 * currently has no selectable volume. World space.
 */
export interface SelectionBoundsProvider {
	getSelectionBounds(target: Box3): Box3 | null;
}

export function hasSelectionBounds(obj: unknown): obj is SelectionBoundsProvider {
	return Boolean(obj) && typeof (obj as SelectionBoundsProvider).getSelectionBounds === 'function';
}

const _size = new Vector3();

function isUsable(box: Box3): boolean {
	return (
		!box.isEmpty()
		&& Number.isFinite(box.min.x) && Number.isFinite(box.min.y) && Number.isFinite(box.min.z)
		&& Number.isFinite(box.max.x) && Number.isFinite(box.max.y) && Number.isFinite(box.max.z)
	);
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/**
 * Thicken any axis thinner than the minimum and add the uniform margin, in
 * place. The minimum is proportional to the entity's largest extent so a
 * 10-unit floor gets a visible slab while a coin-sized disk does not turn
 * into a cube. Empty or non-finite boxes are returned untouched.
 */
export function padSelectionBounds(box: Box3): Box3 {
	if (!isUsable(box)) return box;

	box.getSize(_size);
	const largest = Math.max(_size.x, _size.y, _size.z);
	const minThickness = clamp(largest * SELECTION_THIN_AXIS_FRACTION, SELECTION_THIN_AXIS_MIN, SELECTION_THIN_AXIS_MAX);

	for (const axis of ['x', 'y', 'z'] as const) {
		const extent = _size[axis];
		if (extent >= minThickness) continue;
		const grow = (minThickness - extent) / 2;
		box.min[axis] -= grow;
		box.max[axis] += grow;
	}

	// Measured before the thin-axis growth so the margin is a property of the
	// entity's size, not of how much padding it just received.
	box.expandByScalar(largest * SELECTION_BOUNDS_MARGIN);
	return box;
}

/** The default selection view: the object's world AABB, padded. */
export function measureObjectSelectionBounds(object: Object3D, target: Box3): Box3 {
	target.setFromObject(object);
	return padSelectionBounds(target);
}

/** The render object an entity is measured through when it has no override. */
type MeasurableEntity = {
	group?: Object3D | null;
	mesh?: Object3D | null;
};

/**
 * The selection bounds for an entity: its own {@link SelectionBoundsProvider}
 * answer when it has one, otherwise the padded AABB of `group ?? mesh`.
 * Returns `null` when there is nothing to select, so callers need one check.
 */
export function resolveSelectionBounds(entity: unknown, target: Box3): Box3 | null {
	if (!entity) return null;

	let result: Box3 | null;
	if (hasSelectionBounds(entity)) {
		result = entity.getSelectionBounds(target);
	} else {
		const measurable = entity as MeasurableEntity;
		const object = measurable.group ?? measurable.mesh ?? null;
		if (!object) return null;
		result = measureObjectSelectionBounds(object, target);
	}

	return result && isUsable(result) ? result : null;
}
