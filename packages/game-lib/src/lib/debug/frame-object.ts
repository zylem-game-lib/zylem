import {
	Box3,
	type Camera,
	type Object3D,
	PerspectiveCamera,
	Vector3,
} from 'three';

const _box = new Box3();
const _size = new Vector3();
const _center = new Vector3();
const _offset = new Vector3();

export interface ObjectBounds {
	width: number;
	height: number;
	depth: number;
	center: Vector3;
	maxDim: number;
}

/**
 * Compute the world-space AABB size and center for an Object3D.
 */
export function getObjectBounds(object: Object3D): ObjectBounds {
	_box.setFromObject(object);
	_box.getSize(_size);
	_box.getCenter(_center);

	const width = Math.max(_size.x, 1e-4);
	const height = Math.max(_size.y, 1e-4);
	const depth = Math.max(_size.z, 1e-4);
	const maxDim = Math.max(width, height, depth);

	return {
		width,
		height,
		depth,
		center: _center.clone(),
		maxDim,
	};
}

/**
 * Distance needed for a perspective camera to fit `maxDim` in view.
 */
export function framingDistance(maxDim: number, camera: PerspectiveCamera, padding = 1.35): number {
	const fov = camera.fov * (Math.PI / 180);
	const distance = (maxDim / (2 * Math.tan(fov / 2))) * padding;
	return Math.max(distance, 0.5);
}

/**
 * Position a perspective camera to frame an object (isometric-ish offset).
 * Mutates `camera` in place.
 */
export function frameObject(object: Object3D, camera: PerspectiveCamera, padding = 1.35): ObjectBounds {
	const bounds = getObjectBounds(object);
	const distance = framingDistance(bounds.maxDim, camera, padding);

	camera.position.copy(bounds.center).add(new Vector3(distance, distance, distance));
	camera.lookAt(bounds.center);
	camera.near = Math.max(distance / 100, 0.01);
	camera.far = Math.max(distance * 20, 100);
	camera.updateProjectionMatrix();

	return bounds;
}

/**
 * Place `camera` so it looks at `object`'s AABB center from the given direction,
 * at a framing distance. Used by debug orbit framing.
 */
export function frameObjectFromDirection(
	object: Object3D,
	camera: Camera,
	direction: Vector3,
	padding = 1.5,
): ObjectBounds {
	const bounds = getObjectBounds(object);
	const dir = _offset.copy(direction);
	if (dir.lengthSq() < 1e-8) {
		dir.set(1, 1, 1);
	}
	dir.normalize();

	let distance = bounds.maxDim * padding;
	if (camera instanceof PerspectiveCamera) {
		distance = framingDistance(bounds.maxDim, camera, padding);
		camera.near = Math.max(distance / 100, 0.01);
		camera.far = Math.max(distance * 20, 100);
		camera.updateProjectionMatrix();
	}

	camera.position.copy(bounds.center).addScaledVector(dir, distance);
	camera.lookAt(bounds.center);

	return bounds;
}
