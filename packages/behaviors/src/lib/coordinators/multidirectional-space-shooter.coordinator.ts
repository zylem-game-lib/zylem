import type { GameEntity } from '../entities/entity';
import {
	createThrusterInputComponent,
	type ThrusterInputComponent,
} from '../behaviors/thruster/components';
import type {
	Shooter2DHandle,
	Shooter2DSourceEntity,
	Shooter2DStageLike,
} from '../behaviors/shooter-2d/shooter-2d.descriptor';
import { getEntityFacingAngle2D, resolveAim2D } from './shared/top-down-aim';

export interface MultidirectionalSpaceShooterInput {
	moveX: number;
	moveY: number;
	aimX: number;
	aimY: number;
	shootPressed: boolean;
	shootHeld: boolean;
}

type MultidirectionalSpaceShooterEntity = GameEntity<any> & Shooter2DSourceEntity & {
	$thruster?: ThrusterInputComponent;
};

export class MultidirectionalSpaceShooterCoordinator {
	constructor(
		private entity: MultidirectionalSpaceShooterEntity,
		private shooter: Shooter2DHandle,
		private stage: Shooter2DStageLike,
	) {}

	public update(input: MultidirectionalSpaceShooterInput): void {
		if (!this.entity.$thruster) {
			this.entity.$thruster = createThrusterInputComponent();
		}

		this.entity.$thruster.thrustX = input.moveX;
		this.entity.$thruster.thrustY = input.moveY;
		this.entity.$thruster.thrust = 0;
		this.entity.$thruster.rotate = 0;

		const aim = resolveAim2D(
			input.aimX,
			input.aimY,
			getEntityFacingAngle2D(this.entity),
		);
		if (aim.hasAimInput) {
			this.entity.setRotationZ(aim.angle);
		}

		if (!input.shootPressed && !input.shootHeld) {
			return;
		}

		const sourcePosition = this.entity.body?.translation();
		if (!sourcePosition) {
			return;
		}

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
