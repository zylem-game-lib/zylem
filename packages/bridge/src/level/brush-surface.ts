/**
 * Textures on brush faces.
 *
 * A face's UVs are its world positions measured along two axes that lie in
 * the face, so a texture is never stretched by a slope, and two faces in one
 * plane tile as one whichever solids they belong to. The axes depend only on
 * the face normal: a moved solid slides under its texture, and a turned one
 * takes the axes of the way it now faces.
 */

import type { BrushPlane, BrushSurface, BrushVec3 } from './brush';
import { add, copyVec, cross, dot, normalize, scale, sub } from './vec';

export interface SurfaceAxes {
	/** Unit vector the texture's U runs along: to the right when looking at the face. */
	u: BrushVec3;
	/** Unit vector the texture's V runs along: up when looking at the face. */
	v: BrushVec3;
}

export interface SurfaceUv {
	u: number;
	v: number;
}

/**
 * Faces whose normal is at least this vertical take the floor axes. Set under
 * `sin 45°` so a 45° ramp stays with the floor it rises from.
 */
const FLOOR_NORMAL_Y = 0.7;
/** A scale this close to zero would put the whole face on one texel. */
const MIN_SCALE = 1e-6;

const UP: BrushVec3 = { x: 0, y: 1, z: 0 };
const EAST: BrushVec3 = { x: 1, y: 0, z: 0 };

/** A surface showing `textureId` one tile per world unit, unshifted and unturned. */
export function createSurface(textureId: string): BrushSurface {
	return { textureId, scale: { u: 1, v: 1 }, offset: { u: 0, v: 0 }, rotation: 0 };
}

export function copySurface(surface: BrushSurface): BrushSurface {
	return {
		textureId: surface.textureId,
		scale: { u: surface.scale.u, v: surface.scale.v },
		offset: { u: surface.offset.u, v: surface.offset.v },
		rotation: surface.rotation,
	};
}

/** Whether two faces are painted alike. Two bare faces are. */
export function sameSurface(
	a: BrushSurface | null | undefined,
	b: BrushSurface | null | undefined
): boolean {
	if (!a || !b) return !a && !b;
	return (
		a.textureId === b.textureId &&
		a.scale.u === b.scale.u &&
		a.scale.v === b.scale.v &&
		a.offset.u === b.offset.u &&
		a.offset.v === b.offset.v &&
		a.rotation === b.rotation
	);
}

/** A plane's surface, to spread into the plane that replaces it. Empty for a bare plane. */
export function surfaceOf(plane: BrushPlane): { surface?: BrushSurface } {
	return plane.surface ? { surface: copySurface(plane.surface) } : {};
}

function flatten(axis: BrushVec3, normal: BrushVec3): BrushVec3 | null {
	return normalize(sub(axis, scale(normal, dot(axis, normal))));
}

/**
 * The texture axes of a face with this outward normal.
 *
 * Walls keep V pointing up. Floors, ceilings, and ramps up to 45° keep U
 * pointing east, so a ramp tiles on from the floor it meets. `u × v` is the
 * normal.
 */
export function surfaceAxes(normal: BrushVec3): SurfaceAxes {
	const n = normalize(normal) ?? UP;
	if (Math.abs(n.y) >= FLOOR_NORMAL_Y) {
		const u = flatten(EAST, n) ?? EAST;
		return { u, v: cross(n, u) };
	}
	const v = flatten(UP, n) ?? UP;
	return { u: cross(v, n), v };
}

/** A function from a world point on the face to its UV. Build once per face. */
export function surfaceProjector(
	normal: BrushVec3,
	surface?: BrushSurface | null
): (point: BrushVec3) => SurfaceUv {
	const axes = surfaceAxes(normal);
	const rotation = surface?.rotation ?? 0;
	const cos = Math.cos(rotation);
	const sin = Math.sin(rotation);
	const u = add(scale(axes.u, cos), scale(axes.v, sin));
	const v = sub(scale(axes.v, cos), scale(axes.u, sin));
	const tileU = tile(surface?.scale.u);
	const tileV = tile(surface?.scale.v);
	const offsetU = surface?.offset.u ?? 0;
	const offsetV = surface?.offset.v ?? 0;
	return (point) => ({
		u: dot(point, u) / tileU + offsetU,
		v: dot(point, v) / tileV + offsetV,
	});
}

function tile(value: number | undefined): number {
	if (value === undefined || !Number.isFinite(value)) return 1;
	if (Math.abs(value) >= MIN_SCALE) return value;
	return value < 0 ? -MIN_SCALE : MIN_SCALE;
}

/** The UV of one world point on a face. `v` grows up the texture image. */
export function surfaceUv(
	point: BrushVec3,
	normal: BrushVec3,
	surface?: BrushSurface | null
): SurfaceUv {
	return surfaceProjector(normal, surface)(point);
}

/**
 * Surfaces for a brush whose planes were rebuilt from its corners.
 *
 * Each new plane takes the surface of the old plane facing most nearly the
 * same way, so a painted face keeps its texture when a corner moves and the
 * faces a rebuild adds beside it match. A new plane no old one faces stays
 * bare. `after` is not changed.
 */
export function carrySurfaces(
	before: readonly BrushPlane[],
	after: readonly BrushPlane[]
): BrushPlane[] {
	const copy = (plane: BrushPlane): BrushPlane => ({
		normal: copyVec(plane.normal),
		distance: plane.distance,
	});
	if (!before.some((plane) => plane.surface)) return after.map(copy);
	const sources = before.flatMap((plane) => {
		const normal = normalize(plane.normal);
		return normal ? [{ normal, plane }] : [];
	});
	return after.map((plane) => {
		const normal = normalize(plane.normal);
		let best: BrushPlane | null = null;
		let bestFacing = 0;
		if (normal) {
			for (const source of sources) {
				const facing = dot(normal, source.normal);
				if (facing > bestFacing + 1e-9) {
					bestFacing = facing;
					best = source.plane;
				}
			}
		}
		return { ...copy(plane), ...(best ? surfaceOf(best) : {}) };
	});
}
