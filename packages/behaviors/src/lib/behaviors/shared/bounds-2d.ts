export interface Bounds2DPoint {
	x: number;
	y: number;
}

export interface Bounds2DRect {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

export interface Bounds2DSize {
	width: number;
	height: number;
	centerX?: number;
	centerY?: number;
}

export interface Bounds2DHits {
	left: boolean;
	right: boolean;
	top: boolean;
	bottom: boolean;
}

export interface Bounds2DWrapResult {
	x: number;
	y: number;
	wrapped: boolean;
}

export function createBounds2DRect({
	width,
	height,
	centerX = 0,
	centerY = 0,
}: Bounds2DSize): Bounds2DRect {
	const halfWidth = width / 2;
	const halfHeight = height / 2;
	return {
		minX: centerX - halfWidth,
		maxX: centerX + halfWidth,
		minY: centerY - halfHeight,
		maxY: centerY + halfHeight,
	};
}

export function computeBounds2DHits(
	position: Bounds2DPoint,
	bounds: Bounds2DRect,
): Bounds2DHits {
	const hits: Bounds2DHits = {
		top: false,
		bottom: false,
		left: false,
		right: false,
	};

	if (position.x <= bounds.minX) hits.left = true;
	else if (position.x >= bounds.maxX) hits.right = true;

	if (position.y <= bounds.minY) hits.bottom = true;
	else if (position.y >= bounds.maxY) hits.top = true;

	return hits;
}

export function hasAnyBounds2DHit(hits: Bounds2DHits): boolean {
	return hits.left || hits.right || hits.top || hits.bottom;
}

export function constrainMovementToBounds2D(
	hits: Bounds2DHits,
	moveX: number,
	moveY: number,
): { moveX: number; moveY: number } {
	let adjustedX = moveX;
	let adjustedY = moveY;

	if ((hits.left && moveX < 0) || (hits.right && moveX > 0)) {
		adjustedX = 0;
	}

	if ((hits.bottom && moveY < 0) || (hits.top && moveY > 0)) {
		adjustedY = 0;
	}

	return { moveX: adjustedX, moveY: adjustedY };
}

export function wrapPoint2D(
	position: Bounds2DPoint,
	bounds: Bounds2DRect,
): Bounds2DWrapResult {
	let x = position.x;
	let y = position.y;
	let wrapped = false;

	if (position.x < bounds.minX) {
		x = bounds.maxX - (bounds.minX - position.x);
		wrapped = true;
	} else if (position.x > bounds.maxX) {
		x = bounds.minX + (position.x - bounds.maxX);
		wrapped = true;
	}

	if (position.y < bounds.minY) {
		y = bounds.maxY - (bounds.minY - position.y);
		wrapped = true;
	} else if (position.y > bounds.maxY) {
		y = bounds.minY + (position.y - bounds.maxY);
		wrapped = true;
	}

	return { x, y, wrapped };
}

export function getBounds2DNormalFromHits(
	hits: Bounds2DHits,
): { x: number; y: number } {
	let x = 0;
	let y = 0;

	if (hits.left) x = 1;
	if (hits.right) x = -1;
	if (hits.bottom) y = 1;
	if (hits.top) y = -1;

	return { x, y };
}
