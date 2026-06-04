import {
	angleFromDirection2D,
	normalizeDirection2D,
} from '../shared/direction-2d';
import type {
	TopDownMovementComponent,
	TopDownMovementInputComponent,
	TopDownMovementStateComponent,
} from './components';

export interface TopDownMovementEntity {
	body: {
		linvel(): { x: number; y: number; z: number };
	};
	transformStore?: {
		velocity: { x: number; y: number; z: number };
		dirty: { velocity: boolean };
	};
	setRotationZ?: (angle: number) => void;
	topDownMovement: TopDownMovementComponent;
	$topDownMovement: TopDownMovementInputComponent;
	topDownMovementState: TopDownMovementStateComponent;
}

export class TopDownMovementRuntimeBehavior {
	updateEntity(entity: TopDownMovementEntity, _delta: number): void {
		if (
			!entity.body
			|| !entity.transformStore
			|| !entity.topDownMovement
			|| !entity.$topDownMovement
			|| !entity.topDownMovementState
		) {
			return;
		}

		const movement = entity.topDownMovement;
		const input = entity.$topDownMovement;
		const state = entity.topDownMovementState;
		const moveDirection = normalizeDirection2D(input.moveX, input.moveY);
		const velocity = entity.body.linvel();

		state.moving = moveDirection !== null;
		entity.transformStore.velocity.x = (moveDirection?.x ?? 0) * movement.moveSpeed;
		entity.transformStore.velocity.y = (moveDirection?.y ?? 0) * movement.moveSpeed;
		entity.transformStore.velocity.z = velocity.z;
		entity.transformStore.dirty.velocity = true;

		const facingDirection = normalizeDirection2D(input.faceX, input.faceY);
		if (facingDirection) {
			state.facingAngle = angleFromDirection2D(facingDirection);
		}

		entity.setRotationZ?.(state.facingAngle);
	}
}
