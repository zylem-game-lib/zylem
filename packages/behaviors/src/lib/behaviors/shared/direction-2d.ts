export interface Direction2D {
	x: number;
	y: number;
}

const DIRECTION_EPSILON = 1e-6;

export function normalizeDirection2D(x: number, y: number): Direction2D | null {
	const length = Math.hypot(x, y);
	if (length <= DIRECTION_EPSILON) {
		return null;
	}

	return {
		x: x / length,
		y: y / length,
	};
}

export function angleFromDirection2D(direction: Direction2D): number {
	return Math.atan2(-direction.x, direction.y);
}

export function directionFromAngle2D(angle: number): Direction2D {
	return {
		x: Math.sin(-angle),
		y: Math.cos(-angle),
	};
}

export function rightFromAngle2D(angle: number): Direction2D {
	return {
		x: Math.cos(angle),
		y: Math.sin(angle),
	};
}

export function rotateLocalOffset2D(
	offset: Direction2D,
	angle: number,
): Direction2D {
	const right = rightFromAngle2D(angle);
	const forward = directionFromAngle2D(angle);
	return {
		x: right.x * offset.x + forward.x * offset.y,
		y: right.y * offset.x + forward.y * offset.y,
	};
}

export function getRotationAngle2D(
	rotation: { x: number; y: number; z: number; w: number },
): number {
	return Math.atan2(
		2 * (rotation.w * rotation.z + rotation.x * rotation.y),
		1 - 2 * (rotation.y * rotation.y + rotation.z * rotation.z),
	);
}
