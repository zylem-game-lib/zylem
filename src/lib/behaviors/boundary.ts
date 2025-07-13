import { UpdateContext } from "../core/base-node-life-cycle";
import { MoveableEntity } from "./moveable";
import { Vector } from "@dimforge/rapier3d-compat";

export interface BoundaryEvent {
	entity: MoveableEntity;
	boundary: 'top' | 'bottom' | 'left' | 'right';
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
 * @returns A function that can be used to check if the entity has hit a boundary
 */
export function boundary(
	options: Partial<BoundaryOptions> = {}
) {
	return (updateContext: UpdateContext<MoveableEntity>) => {
		_boundary(updateContext, options);
	};
}

function _boundary(updateContext: UpdateContext<MoveableEntity>, options: Partial<BoundaryOptions>) {
	const { entity } = updateContext;
	const { boundaries, onBoundary } = {
		...defaultBoundaryOptions,
		...options
	};

	const position = entity.getPosition();
	if (!position) return;

	let boundaryHit: 'top' | 'bottom' | 'left' | 'right' | null = null;

	if (position.x <= boundaries.left) {
		boundaryHit = 'left';
	} else if (position.x >= boundaries.right) {
		boundaryHit = 'right';
	}

	if (position.y <= boundaries.bottom) {
		boundaryHit = 'bottom';
	} else if (position.y >= boundaries.top) {
		boundaryHit = 'top';
	}

	const stopMovement = options.stopMovement ?? true;
	if (stopMovement && boundaryHit) {
		const velocity = entity.getVelocity() ?? { x: 0, y: 0, z: 0 };
		if (velocity?.y < 0 && boundaryHit === 'bottom') {
			entity.moveY(0);
		} else if (velocity?.y > 0 && boundaryHit === 'top') {
			entity.moveY(0);
		}
	}
	if (onBoundary && boundaryHit) {
		onBoundary({
			entity,
			boundary: boundaryHit,
			position: { x: position.x, y: position.y, z: position.z },
			updateContext
		});
	}
}