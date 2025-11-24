import { UpdateContext } from "../../../core/base-node-life-cycle";
import { MoveableEntity } from "../../capabilities/moveable";
import { Vector } from "@dimforge/rapier3d-compat";
import { BehaviorCallbackType } from "../../../entities/entity";

export interface BoundaryEvent {
	me: MoveableEntity;
	boundary: BoundaryHits;
	position: Vector;
	updateContext: UpdateContext<MoveableEntity>;
}

export interface BoundaryOptions {
	boundaries: {
		top: number;
		bottom: number;
		left: number;
		right: number;
	};
	onBoundary?: (event: BoundaryEvent) => void;
	stopMovement?: boolean;
}

const defaultBoundaryOptions: BoundaryOptions = {
	boundaries: {
		top: 0,
		bottom: 0,
		left: 0,
		right: 0
	},
	stopMovement: true
};

/**
 * Checks if the entity has hit a boundary and stops its movement if it has
 * 
 * @param options Configuration options for the boundary behavior
 * @param options.boundaries The boundaries of the stage
 * @param options.onBoundary A callback function that is called when the entity hits a boundary
 * @param options.stopMovement Whether to stop the entity's movement when it hits a boundary
 * @returns A behavior callback with type 'update' and a handler function
 */
export function boundary2d(
	options: Partial<BoundaryOptions> = {}
): { type: BehaviorCallbackType; handler: (ctx: UpdateContext<MoveableEntity>) => void } {
	return {
		type: 'update' as BehaviorCallbackType,
		handler: (updateContext: UpdateContext<MoveableEntity>) => {
			_boundary2d(updateContext, options);
		}
	};
}

type BoundaryHit = 'top' | 'bottom' | 'left' | 'right';

type BoundaryHits = Record<BoundaryHit, boolean>;

function _boundary2d(updateContext: UpdateContext<MoveableEntity>, options: Partial<BoundaryOptions>) {
	const { me: entity } = updateContext;
	const { boundaries, onBoundary } = {
		...defaultBoundaryOptions,
		...options
	};

	const position = entity.getPosition();
	if (!position) return;

	let boundariesHit: BoundaryHits = { top: false, bottom: false, left: false, right: false };

	if (position.x <= boundaries.left) {
		boundariesHit.left = true;
	} else if (position.x >= boundaries.right) {
		boundariesHit.right = true;
	}

	if (position.y <= boundaries.bottom) {
		boundariesHit.bottom = true;
	} else if (position.y >= boundaries.top) {
		boundariesHit.top = true;
	}

	const stopMovement = options.stopMovement ?? true;
	if (stopMovement && boundariesHit) {
		const velocity = entity.getVelocity() ?? { x: 0, y: 0, z: 0 };
		let { x: newX, y: newY } = velocity;
		if (velocity?.y < 0 && boundariesHit.bottom) {
			newY = 0;
		} else if (velocity?.y > 0 && boundariesHit.top) {
			newY = 0;
		}
		if (velocity?.x < 0 && boundariesHit.left) {
			newX = 0;
		} else if (velocity?.x > 0 && boundariesHit.right) {
			newX = 0;
		}
		entity.moveXY(newX, newY);
	}
	if (onBoundary && boundariesHit) {
		onBoundary({
			me: entity,
			boundary: boundariesHit,
			position: { x: position.x, y: position.y, z: position.z },
			updateContext
		});
	}
}