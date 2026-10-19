import { Box3, Camera, OrthographicCamera, PerspectiveCamera, Vector3 } from 'three';

/**
 * An entity whose longest side exceeds this multiple of the gameplay camera's
 * longest visible side is left out of the orthographic fit. The check is per
 * entity, so several ordinary pieces can still make the view wider.
 */
export const ENTITY_FIT_LIMIT = 4;

export interface PictureSize {
	width: number;
	height: number;
}

/** World size of the gameplay picture at `distance` along its view, not the far clip. */
export function pictureSize(camera: Camera, distance: number): PictureSize {
	if (camera instanceof PerspectiveCamera) {
		const zoom = Math.max(camera.zoom, 1e-6);
		const height = 2 * Math.tan((camera.fov * Math.PI) / 360) * Math.max(distance, 0.01) / zoom;
		const aspect = camera.aspect > 0 ? camera.aspect : 1;
		return { width: height * aspect, height };
	}
	if (camera instanceof OrthographicCamera) {
		const zoom = Math.max(camera.zoom, 1e-6);
		return {
			width: (camera.right - camera.left) / zoom,
			height: (camera.top - camera.bottom) / zoom,
		};
	}
	return { width: 1, height: 1 };
}

/** Vertical field of view, in degrees, that matches an orthographic picture at `distance`. */
export function perspectiveFovMatchingOrthographic(camera: OrthographicCamera, distance: number): number {
	const halfHeight = (camera.top - camera.bottom) / 2 / Math.max(camera.zoom, 1e-6);
	return 2 * Math.atan(halfHeight / Math.max(distance, 0.01)) * (180 / Math.PI);
}

function longestSide(box: Box3): number {
	return Math.max(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z);
}

/** Drop empty, non-finite, and oversized boxes. Oversized still drops when it fills the gameplay view. */
export function boxesWithinFitLimit(boxes: readonly Box3[], picture: PictureSize): Box3[] {
	const limit = ENTITY_FIT_LIMIT * Math.max(picture.width, picture.height);
	return boxes.filter((box) => {
		if (box.isEmpty()) return false;
		const side = longestSide(box);
		return Number.isFinite(side) && side <= limit;
	});
}

/**
 * Orthographic frustum height that fits `boxes` around `lookAt` and is at
 * least as large as the gameplay picture. Width follows the screen aspect.
 */
export function frustumHeightForFit(
	lookAt: Vector3,
	right: Vector3,
	up: Vector3,
	boxes: readonly Box3[],
	picture: PictureSize,
	aspect: number,
): number {
	let halfW = picture.width / 2;
	let halfH = picture.height / 2;
	const corner = new Vector3();
	for (const box of boxes) {
		const xs = [box.min.x, box.max.x];
		const ys = [box.min.y, box.max.y];
		const zs = [box.min.z, box.max.z];
		for (const x of xs) {
			for (const y of ys) {
				for (const z of zs) {
					corner.set(x, y, z).sub(lookAt);
					halfW = Math.max(halfW, Math.abs(corner.dot(right)));
					halfH = Math.max(halfH, Math.abs(corner.dot(up)));
				}
			}
		}
	}
	const safeAspect = Math.max(aspect, 1e-6);
	return Math.max(halfH * 2, (halfW * 2) / safeAspect);
}

/**
 * Near and far that contain `boxes` along `forward`. An empty list keeps the
 * view's own clip planes.
 */
export function clipRangeForBoxes(
	cameraPosition: Vector3,
	forward: Vector3,
	boxes: readonly Box3[],
	fallback: { near: number; far: number },
): { near: number; far: number } {
	if (boxes.length === 0) return fallback;
	let min = Infinity;
	let max = -Infinity;
	const corner = new Vector3();
	for (const box of boxes) {
		const xs = [box.min.x, box.max.x];
		const ys = [box.min.y, box.max.y];
		const zs = [box.min.z, box.max.z];
		for (const x of xs) {
			for (const y of ys) {
				for (const z of zs) {
					corner.set(x, y, z).sub(cameraPosition);
					const depth = corner.dot(forward);
					min = Math.min(min, depth);
					max = Math.max(max, depth);
				}
			}
		}
	}
	if (!Number.isFinite(min) || !Number.isFinite(max)) return fallback;
	const pad = Math.max((max - min) * 0.05, 1);
	return { near: min - pad, far: Math.max(max + pad, min - pad + 1) };
}
