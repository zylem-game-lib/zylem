export interface Bounds3DPoint {
	x: number;
	y: number;
	z: number;
}

export interface Bounds3DBox {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
	minZ: number;
	maxZ: number;
}

export interface Bounds3DSize {
	width: number;
	height: number;
	depth: number;
	centerX?: number;
	centerY?: number;
	centerZ?: number;
}

export interface Bounds3DHits {
	left: boolean;
	right: boolean;
	top: boolean;
	bottom: boolean;
	back: boolean;
	front: boolean;
}

export interface Bounds3DPadding {
	x: number;
	y: number;
	z: number;
}

export type Bounds3DPaddingInput =
	| number
	| Partial<Bounds3DPadding>
	| undefined;

export function createBounds3DBox({
	width,
	height,
	depth,
	centerX = 0,
	centerY = 0,
	centerZ = 0,
}: Bounds3DSize): Bounds3DBox {
	const halfWidth = width / 2;
	const halfHeight = height / 2;
	const halfDepth = depth / 2;
	return {
		minX: centerX - halfWidth,
		maxX: centerX + halfWidth,
		minY: centerY - halfHeight,
		maxY: centerY + halfHeight,
		minZ: centerZ - halfDepth,
		maxZ: centerZ + halfDepth,
	};
}

export function normalizeBounds3DPadding(
	padding?: Bounds3DPaddingInput,
): Bounds3DPadding {
	if (typeof padding === 'number') {
		return { x: padding, y: padding, z: padding };
	}

	return {
		x: padding?.x ?? 0,
		y: padding?.y ?? 0,
		z: padding?.z ?? 0,
	};
}

export function insetBounds3D(
	bounds: Bounds3DBox,
	padding?: Bounds3DPaddingInput,
): Bounds3DBox {
	const resolved = normalizeBounds3DPadding(padding);
	return {
		minX: bounds.minX + resolved.x,
		maxX: bounds.maxX - resolved.x,
		minY: bounds.minY + resolved.y,
		maxY: bounds.maxY - resolved.y,
		minZ: bounds.minZ + resolved.z,
		maxZ: bounds.maxZ - resolved.z,
	};
}

export function computeBounds3DHits(
	position: Bounds3DPoint,
	bounds: Bounds3DBox,
): Bounds3DHits {
	const hits: Bounds3DHits = {
		left: false,
		right: false,
		top: false,
		bottom: false,
		back: false,
		front: false,
	};

	if (position.x <= bounds.minX) hits.left = true;
	else if (position.x >= bounds.maxX) hits.right = true;

	if (position.y <= bounds.minY) hits.bottom = true;
	else if (position.y >= bounds.maxY) hits.top = true;

	if (position.z <= bounds.minZ) hits.back = true;
	else if (position.z >= bounds.maxZ) hits.front = true;

	return hits;
}

export function hasAnyBounds3DHit(hits: Bounds3DHits): boolean {
	return hits.left || hits.right || hits.top || hits.bottom || hits.back || hits.front;
}

export function constrainMovementToBounds3D(
	hits: Bounds3DHits,
	moveX: number,
	moveY: number,
	moveZ: number,
): { moveX: number; moveY: number; moveZ: number } {
	let adjustedX = moveX;
	let adjustedY = moveY;
	let adjustedZ = moveZ;

	if ((hits.left && moveX < 0) || (hits.right && moveX > 0)) {
		adjustedX = 0;
	}

	if ((hits.bottom && moveY < 0) || (hits.top && moveY > 0)) {
		adjustedY = 0;
	}

	if ((hits.back && moveZ < 0) || (hits.front && moveZ > 0)) {
		adjustedZ = 0;
	}

	return { moveX: adjustedX, moveY: adjustedY, moveZ: adjustedZ };
}

export function clampPointToBounds3D(
	position: Bounds3DPoint,
	bounds: Bounds3DBox,
): Bounds3DPoint {
	return {
		x: Math.min(bounds.maxX, Math.max(bounds.minX, position.x)),
		y: Math.min(bounds.maxY, Math.max(bounds.minY, position.y)),
		z: Math.min(bounds.maxZ, Math.max(bounds.minZ, position.z)),
	};
}

export function getBounds3DNormalFromHits(
	hits: Bounds3DHits,
): { x: number; y: number; z: number } {
	let x = 0;
	let y = 0;
	let z = 0;

	if (hits.left) x = 1;
	if (hits.right) x = -1;
	if (hits.bottom) y = 1;
	if (hits.top) y = -1;
	if (hits.back) z = 1;
	if (hits.front) z = -1;

	return { x, y, z };
}
