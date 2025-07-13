import { UpdateContext } from "../../core/base-node-life-cycle";
import { MoveableEntity } from "../../behaviors/moveable";
import { Vector3 } from "three";
import { Vector } from "@dimforge/rapier3d-compat";

export interface RicochetEvent {
	entity: MoveableEntity;
	boundary: 'top' | 'bottom' | 'left' | 'right' | 'front' | 'back';
	position: Vector;
	velocityBefore: Vector;
	velocityAfter: Vector;
	updateContext: UpdateContext<MoveableEntity>;
}

export interface Ricochet2DOptions {
	restitution: number;
	maxSpeed: number;
	minSpeed: number;
	boundaries: {
		top: number;
		bottom: number;
		left: number;
		right: number;
	};
	onRicochet?: (event: RicochetEvent) => void;
}

export interface Ricochet3DOptions extends Ricochet2DOptions {
	boundaries: {
		top: number;
		bottom: number;
		left: number;
		right: number;
		front: number;
		back: number;
	};
}

const defaultRicochet2DOptions: Ricochet2DOptions = {
	restitution: 0.8,
	maxSpeed: 20,
	minSpeed: 2,
	boundaries: {
		top: 5,
		bottom: -5,
		left: -10,
		right: 10
	},
	onRicochet: undefined
};

const defaultRicochet3DOptions: Ricochet3DOptions = {
	restitution: 0.8,
	maxSpeed: 20,
	minSpeed: 2,
	boundaries: {
		top: 5,
		bottom: -5,
		left: -10,
		right: 10,
		front: 5,
		back: -5
	},
	onRicochet: undefined
};

/**
 * Creates a 2D ricochet effect that bounces entities off boundaries
 * Handles bouncing off top, bottom, left, and right boundaries
 * 
 * @param options Configuration options for the ricochet physics
 * @param options.restitution Energy retention factor (0 = no bounce, 1 = perfect bounce)
 * @param options.maxSpeed Maximum velocity the entity can achieve
 * @param options.minSpeed Minimum velocity to maintain momentum
 * @param options.boundaries 2D boundaries (top, bottom, left, right)
 * @param options.onRicochet Optional callback function called when ricochet occurs
 */
export function ricochet2d(
	options: Partial<Ricochet2DOptions> = {}
) {
	return (updateContext: UpdateContext<MoveableEntity>) => {
		_ricochet2d(updateContext, options);
	};
}

/**
 * Creates a 3D ricochet effect that bounces entities off boundaries
 * Handles bouncing off all 6 boundaries in 3D space
 * 
 * @param options Configuration options for the ricochet physics
 * @param options.restitution Energy retention factor (0 = no bounce, 1 = perfect bounce)
 * @param options.maxSpeed Maximum velocity the entity can achieve
 * @param options.minSpeed Minimum velocity to maintain momentum
 * @param options.boundaries 3D boundaries (top, bottom, left, right, front, back)
 * @param options.onRicochet Optional callback function called when ricochet occurs
 */
export function ricochet3d(
	options: Partial<Ricochet3DOptions> = {}
) {
	return (updateContext: UpdateContext<MoveableEntity>) => {
		_ricochet3d(updateContext, options);
	};
}

function _ricochet2d(
	updateContext: UpdateContext<MoveableEntity>,
	options: Partial<Ricochet2DOptions>
) {
	const { entity } = updateContext;
	const { restitution, maxSpeed, minSpeed, boundaries, onRicochet } = {
		...defaultRicochet2DOptions,
		...options
	};

	const position = entity.getPosition();
	const velocity = entity.getVelocity();

	if (!position || !velocity) return;

	let newVelX = velocity.x;
	let newVelY = velocity.y;
	let newX = position.x;
	let newY = position.y;
	let ricochetBoundary: 'top' | 'bottom' | 'left' | 'right' | null = null;

	if (position.x <= boundaries.left) {
		newVelX = Math.abs(velocity.x) * restitution;
		newX = boundaries.left + 0.1;
		ricochetBoundary = 'left';
	} else if (position.x >= boundaries.right) {
		newVelX = -Math.abs(velocity.x) * restitution;
		newX = boundaries.right - 0.1;
		ricochetBoundary = 'right';
	}

	if (position.y <= boundaries.bottom) {
		newVelY = Math.abs(velocity.y) * restitution;
		newY = boundaries.bottom + 0.1;
		ricochetBoundary = 'bottom';
	} else if (position.y >= boundaries.top) {
		newVelY = -Math.abs(velocity.y) * restitution;
		newY = boundaries.top - 0.1;
		ricochetBoundary = 'top';
	}

	const currentSpeed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);

	if (currentSpeed > 0) {
		if (currentSpeed < minSpeed) {
			const scale = minSpeed / currentSpeed;
			newVelX *= scale;
			newVelY *= scale;
		} else if (currentSpeed > maxSpeed) {
			const scale = maxSpeed / currentSpeed;
			newVelX *= scale;
			newVelY *= scale;
		}
	}

	if (newX !== position.x || newY !== position.y) {
		entity.setPosition(newX, newY, position.z);
		entity.moveXY(newVelX, newVelY);

		if (onRicochet && ricochetBoundary) {
			const velocityAfter = entity.getVelocity();
			if (velocityAfter) {
				onRicochet({
					entity,
					boundary: ricochetBoundary,
					position: { x: newX, y: newY, z: position.z },
					velocityBefore: velocity,
					velocityAfter,
					updateContext
				});
			}
		}
	}
}

function _ricochet3d(
	updateContext: UpdateContext<MoveableEntity>,
	options: Partial<Ricochet3DOptions>
) {
	const { entity } = updateContext;
	const { restitution, maxSpeed, minSpeed, boundaries, onRicochet } = {
		...defaultRicochet3DOptions,
		...options
	};

	const position = entity.getPosition();
	const velocity = entity.getVelocity();

	if (!position || !velocity) return;

	let newVelX = velocity.x;
	let newVelY = velocity.y;
	let newVelZ = velocity.z;
	let newX = position.x;
	let newY = position.y;
	let newZ = position.z;
	let ricochetBoundary: 'top' | 'bottom' | 'left' | 'right' | 'front' | 'back' | null = null;

	if (position.x <= boundaries.left) {
		newVelX = Math.abs(velocity.x) * restitution;
		newX = boundaries.left + 0.1;
		ricochetBoundary = 'left';
	} else if (position.x >= boundaries.right) {
		newVelX = -Math.abs(velocity.x) * restitution;
		newX = boundaries.right - 0.1;
		ricochetBoundary = 'right';
	}

	if (position.y <= boundaries.bottom) {
		newVelY = Math.abs(velocity.y) * restitution;
		newY = boundaries.bottom + 0.1;
		ricochetBoundary = 'bottom';
	} else if (position.y >= boundaries.top) {
		newVelY = -Math.abs(velocity.y) * restitution;
		newY = boundaries.top - 0.1;
		ricochetBoundary = 'top';
	}

	if (position.z <= boundaries.back) {
		newVelZ = Math.abs(velocity.z) * restitution;
		newZ = boundaries.back + 0.1;
		ricochetBoundary = 'back';
	} else if (position.z >= boundaries.front) {
		newVelZ = -Math.abs(velocity.z) * restitution;
		newZ = boundaries.front - 0.1;
		ricochetBoundary = 'front';
	}

	const currentSpeed = Math.sqrt(newVelX * newVelX + newVelY * newVelY + newVelZ * newVelZ);

	if (currentSpeed > 0) {
		if (currentSpeed < minSpeed) {
			const scale = minSpeed / currentSpeed;
			newVelX *= scale;
			newVelY *= scale;
			newVelZ *= scale;
		} else if (currentSpeed > maxSpeed) {
			const scale = maxSpeed / currentSpeed;
			newVelX *= scale;
			newVelY *= scale;
			newVelZ *= scale;
		}
	}

	if (newX !== position.x || newY !== position.y || newZ !== position.z) {
		entity.setPosition(newX, newY, newZ);
		entity.move(new Vector3(newVelX, newVelY, newVelZ));

		if (onRicochet && ricochetBoundary) {
			const velocityAfter = entity.getVelocity();
			if (velocityAfter) {
				onRicochet({
					entity,
					boundary: ricochetBoundary,
					position: { x: newX, y: newY, z: newZ },
					velocityBefore: velocity,
					velocityAfter,
					updateContext
				});
			}
		}
	}
}

/**
 * Simplified 2D ricochet without speed limits
 */
export function basicRicochet2d(
	updateContext: UpdateContext<MoveableEntity>,
	options: Partial<Ricochet2DOptions>
) {
	const { entity } = updateContext;
	const { restitution, boundaries, onRicochet } = { ...defaultRicochet2DOptions, ...options };

	const position = entity.getPosition();
	const velocity = entity.getVelocity();

	if (!position || !velocity) return;

	let newVelX = velocity.x;
	let newVelY = velocity.y;
	let newX = position.x;
	let newY = position.y;
	let ricochetBoundary: 'top' | 'bottom' | 'left' | 'right' | null = null;

	if (position.x <= boundaries.left || position.x >= boundaries.right) {
		newVelX = -velocity.x * restitution;
		newX = position.x <= boundaries.left ? boundaries.left + 0.1 : boundaries.right - 0.1;
		ricochetBoundary = position.x <= boundaries.left ? 'left' : 'right';
	}

	if (position.y <= boundaries.bottom || position.y >= boundaries.top) {
		newVelY = -velocity.y * restitution;
		newY = position.y <= boundaries.bottom ? boundaries.bottom + 0.1 : boundaries.top - 0.1;
		ricochetBoundary = position.y <= boundaries.bottom ? 'bottom' : 'top';
	}

	if (newX !== position.x || newY !== position.y) {
		entity.setPosition(newX, newY, position.z);
		entity.moveXY(newVelX, newVelY);

		if (onRicochet && ricochetBoundary) {
			const velocityAfter = entity.getVelocity();
			if (velocityAfter) {
				onRicochet({
					entity,
					boundary: ricochetBoundary,
					position: { x: newX, y: newY, z: position.z },
					velocityBefore: velocity,
					velocityAfter,
					updateContext
				});
			}
		}
	}
}
