/**
 * Geometry for marquee (drag-rectangle) selection.
 *
 * A rectangle dragged on screen is the cross-section of a frustum: the
 * sub-volume of the camera's view that projects onto that rectangle. Casting
 * it into the scene is the multi-entity counterpart of the single pick ray,
 * so everything the rectangle covers can be tested at once.
 *
 * Pure functions over Three.js math types, with no DOM or scene access, so
 * the hit test can be unit-tested with hand-built boxes.
 */
import { Box3, type Camera, Frustum, Plane, Vector2, Vector3 } from 'three';

export type SelectionMergeMode = 'replace' | 'add' | 'subtract';

const _corners = Array.from({ length: 8 }, () => new Vector3());
const _min = new Vector2();
const _max = new Vector2();

/**
 * The view frustum whose cross-section is the NDC rectangle spanned by `a`
 * and `b` (either corner order). Near and far are the camera's own planes.
 *
 * Planes are built from the unprojected corners rather than from a modified
 * projection matrix, so this works for orthographic and perspective cameras
 * alike and never has to touch the camera's state.
 */
export function frustumFromNdcRect(camera: Camera, a: Vector2, b: Vector2, target = new Frustum()): Frustum {
	_min.set(Math.min(a.x, b.x), Math.min(a.y, b.y));
	_max.set(Math.max(a.x, b.x), Math.max(a.y, b.y));

	// A zero-area rectangle has no volume; nudge it open so the planes are
	// well defined and a near-click still covers a sliver of the view.
	const epsilon = 1e-5;
	if (_max.x - _min.x < epsilon) _max.x = _min.x + epsilon;
	if (_max.y - _min.y < epsilon) _max.y = _min.y + epsilon;

	// Corner order: near plane then far plane, each going
	// bottom-left, bottom-right, top-right, top-left.
	setCorner(0, _min.x, _min.y, -1, camera);
	setCorner(1, _max.x, _min.y, -1, camera);
	setCorner(2, _max.x, _max.y, -1, camera);
	setCorner(3, _min.x, _max.y, -1, camera);
	setCorner(4, _min.x, _min.y, 1, camera);
	setCorner(5, _max.x, _min.y, 1, camera);
	setCorner(6, _max.x, _max.y, 1, camera);
	setCorner(7, _min.x, _max.y, 1, camera);

	const [nbl, nbr, ntr, ntl, fbl, fbr, ftr, ftl] = _corners as [
		Vector3, Vector3, Vector3, Vector3, Vector3, Vector3, Vector3, Vector3,
	];
	const planes = target.planes;
	// `Frustum` treats the positive side of every plane as inside, so each
	// triple is wound to make the normal point into the volume.
	setPlane(planes[0]!, nbl, fbl, ftl); // left
	setPlane(planes[1]!, nbr, ftr, fbr); // right
	setPlane(planes[2]!, ntl, ftl, ftr); // top
	setPlane(planes[3]!, nbl, fbr, fbl); // bottom
	setPlane(planes[4]!, nbl, ntl, ntr); // near
	setPlane(planes[5]!, fbl, ftr, ftl); // far
	return target;
}

function setCorner(index: number, x: number, y: number, z: number, camera: Camera): void {
	_corners[index]!.set(x, y, z).unproject(camera);
}

function setPlane(plane: Plane, a: Vector3, b: Vector3, c: Vector3): void {
	plane.setFromCoplanarPoints(a, b, c);
}

/**
 * Whether a world-space box is caught by the frustum. Intersect semantics: any
 * overlap selects, so an entity half inside the rectangle counts, which is the
 * behaviour of most scene editors' default marquee.
 */
export function frustumCatchesBox(frustum: Frustum, box: Box3): boolean {
	if (box.isEmpty()) return false;
	if (!Number.isFinite(box.min.x) || !Number.isFinite(box.max.x)) return false;
	return frustum.intersectsBox(box);
}

/**
 * Combine the entities a marquee caught with the selection that existed when
 * the drag began. `replace` swaps; `add` appends new ones in caught order;
 * `subtract` removes. Order is preserved so the first entry (which mirrors
 * `selectedEntityId`) stays stable while a selection grows.
 */
export function mergeSelection(
	current: readonly string[],
	caught: readonly string[],
	mode: SelectionMergeMode,
): string[] {
	switch (mode) {
		case 'add': {
			const seen = new Set(current);
			const next = [...current];
			for (const uuid of caught) {
				if (seen.has(uuid)) continue;
				seen.add(uuid);
				next.push(uuid);
			}
			return next;
		}
		case 'subtract': {
			const removed = new Set(caught);
			return current.filter((uuid) => !removed.has(uuid));
		}
		default:
			return [...new Set(caught)];
	}
}

/** The merge mode a drag's modifier keys ask for. */
export function mergeModeFromModifiers(modifiers: { shiftKey: boolean; altKey: boolean }): SelectionMergeMode {
	if (modifiers.altKey) return 'subtract';
	if (modifiers.shiftKey) return 'add';
	return 'replace';
}
