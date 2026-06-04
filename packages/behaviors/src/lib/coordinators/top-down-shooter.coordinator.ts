import {
	createTopDownMovementInputComponent,
	type TopDownMovementInputComponent,
} from '../behaviors/top-down-movement/components';
import type {
	Shooter2DHandle,
	Shooter2DSourceEntity,
	Shooter2DStageLike,
} from '../behaviors/shooter-2d/shooter-2d.descriptor';
import { getEntityFacingAngle2D, resolveAim2D } from './shared/top-down-aim';

export interface TopDownShooterInput {
	moveX: number;
	moveY: number;
	aimX: number;
	aimY: number;
	shootPressed: boolean;
	shootHeld: boolean;
}

type TopDownShooterEntity = Shooter2DSourceEntity & {
	$topDownMovement?: TopDownMovementInputComponent;
};

export class TopDownShooterCoordinator {
	constructor(
		private entity: TopDownShooterEntity,
		private shooter: Shooter2DHandle,
		private stage: Shooter2DStageLike,
	) {}

	public update(input: TopDownShooterInput): void {
		if (!this.entity.$topDownMovement) {
			this.entity.$topDownMovement = createTopDownMovementInputComponent();
		}

		this.entity.$topDownMovement.moveX = input.moveX;
		this.entity.$topDownMovement.moveY = input.moveY;
		this.entity.$topDownMovement.faceX = input.aimX;
		this.entity.$topDownMovement.faceY = input.aimY;

		if (!input.shootPressed && !input.shootHeld) {
			return;
		}

		const sourcePosition = this.entity.body?.translation();
		if (!sourcePosition) {
			return;
		}

		const aim = resolveAim2D(
			input.aimX,
			input.aimY,
			getEntityFacingAngle2D(this.entity),
		);
		void this.shooter.fire({
			source: this.entity,
			stage: this.stage,
			target: {
				x: sourcePosition.x + aim.direction.x,
				y: sourcePosition.y + aim.direction.y,
			},
		});
	}
}
