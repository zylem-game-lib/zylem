import { UpdateContext } from '../../../core/base-node-life-cycle';
import { MoveableEntity } from '../../capabilities/moveable';
import { Ricochet2DInBoundsOptions, Ricochet2DCallback, clamp } from './ricochet';
import { BehaviorCallbackType } from '../../../entities/entity';

/**
 * Behavior for ricocheting an entity within fixed 2D boundaries
 */
export function ricochet2DInBounds(
	options: Partial<Ricochet2DInBoundsOptions> = {},
	callback?: Ricochet2DCallback
): { type: BehaviorCallbackType; handler: (ctx: UpdateContext<MoveableEntity>) => void } {
	return {
		type: 'update' as BehaviorCallbackType,
		handler: (updateContext: UpdateContext<MoveableEntity>) => {
			_handleRicochet2DInBounds(updateContext, options, callback);
		},
	};
}

function _handleRicochet2DInBounds(
	updateContext: UpdateContext<MoveableEntity>,
	options: Partial<Ricochet2DInBoundsOptions>,
	callback?: Ricochet2DCallback
) {
	const { me } = updateContext;
	const {
		restitution = 0,
		minSpeed = 2,
		maxSpeed = 20,
		boundaries = { top: 5, bottom: -5, left: -6.5, right: 6.5 },
		separation = 0.0
	} = { ...options } as Ricochet2DInBoundsOptions;

	const position = me.getPosition();
	const velocity = me.getVelocity();
	if (!position || !velocity) return;

	let newVelX = velocity.x;
	let newVelY = velocity.y;
	let newX = position.x;
	let newY = position.y;
	let ricochetBoundary: 'top' | 'bottom' | 'left' | 'right' | null = null;

	if (position.x <= boundaries.left) {
		newVelX = Math.abs(velocity.x);
		newX = boundaries.left + separation;
		ricochetBoundary = 'left';
	} else if (position.x >= boundaries.right) {
		newVelX = -Math.abs(velocity.x);
		newX = boundaries.right - separation;
		ricochetBoundary = 'right';
	}

	if (position.y <= boundaries.bottom) {
		newVelY = Math.abs(velocity.y);
		newY = boundaries.bottom + separation;
		ricochetBoundary = 'bottom';
	} else if (position.y >= boundaries.top) {
		newVelY = -Math.abs(velocity.y);
		newY = boundaries.top - separation;
		ricochetBoundary = 'top';
	}

	const currentSpeed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
	if (currentSpeed > 0) {
		const targetSpeed = clamp(currentSpeed, minSpeed, maxSpeed);
		if (targetSpeed !== currentSpeed) {
			const scale = targetSpeed / currentSpeed;
			newVelX *= scale;
			newVelY *= scale;
		}
	}

	if (restitution) {
		newVelX *= restitution;
		newVelY *= restitution;
	}

	if (newX !== position.x || newY !== position.y) {
		me.setPosition(newX, newY, position.z);
		me.moveXY(newVelX, newVelY);

		if (callback && ricochetBoundary) {
			const velocityAfter = me.getVelocity();
			if (velocityAfter) {
				callback({
					boundary: ricochetBoundary,
					position: { x: newX, y: newY, z: position.z },
					velocityBefore: velocity,
					velocityAfter,
					...updateContext,
				});
			}
		}
	}
}