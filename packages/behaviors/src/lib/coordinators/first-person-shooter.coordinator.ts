import type { GameEntity } from '../entities/entity';
import {
	createFirstPersonInputComponent,
	type FirstPersonInputComponent,
} from '../behaviors/first-person/components';
import {
	createJumpInput3D,
	type JumpInput3D,
} from '../behaviors/jumper-3d/components';

export interface FirstPersonShooterInput {
	moveX: number;
	moveZ: number;
	lookX: number;
	lookY: number;
	sprint: boolean;
	jumpPressed: boolean;
	jumpHeld: boolean;
	jumpReleased: boolean;
	fastFall?: boolean;
}

interface FirstPersonShooterControllerHandle {
	getYaw(): number;
}

interface FirstPersonShooterJumperHandle {
	getState(): unknown;
}

type FirstPersonShooterEntity = GameEntity<any> & {
	$fps?: FirstPersonInputComponent;
	$jumper?: JumpInput3D;
};

export class FirstPersonShooterCoordinator {
	constructor(
		private entity: FirstPersonShooterEntity,
		private fpsController: FirstPersonShooterControllerHandle,
		private jumper: FirstPersonShooterJumperHandle,
	) {}

	public update(input: FirstPersonShooterInput): void {
		if (!this.entity.$fps) {
			this.entity.$fps = createFirstPersonInputComponent();
		}
		if (!this.entity.$jumper) {
			this.entity.$jumper = createJumpInput3D();
		}

		const fpsInput = this.entity.$fps;
		fpsInput.moveX = input.moveX;
		fpsInput.moveZ = input.moveZ;
		fpsInput.lookX = input.lookX;
		fpsInput.lookY = input.lookY;
		fpsInput.sprint = input.sprint;

		const jumperInput = this.entity.$jumper;
		jumperInput.jumpPressed = input.jumpPressed;
		jumperInput.jumpHeld = input.jumpHeld;
		jumperInput.jumpReleased = input.jumpReleased;
		jumperInput.fastFall = input.fastFall ?? false;
		jumperInput.moveDirWorld = this.getMoveDirWorld(
			input.moveX,
			input.moveZ,
			this.fpsController.getYaw(),
		);

		// Keep the jumper handle in the public contract even though the
		// coordinator only needs its current state for future extensions.
		void this.jumper.getState();
	}

	private getMoveDirWorld(
		moveX: number,
		moveZ: number,
		yaw: number,
	): { x: number; y: number; z: number } | undefined {
		const sinYaw = Math.sin(yaw);
		const cosYaw = Math.cos(yaw);
		const rightX = cosYaw;
		const rightZ = -sinYaw;
		const forwardX = -sinYaw;
		const forwardZ = -cosYaw;
		const worldX = rightX * moveX + forwardX * -moveZ;
		const worldZ = rightZ * moveX + forwardZ * -moveZ;
		const length = Math.hypot(worldX, worldZ);
		if (length <= 1e-6) {
			return undefined;
		}

		return {
			x: worldX / length,
			y: 0,
			z: worldZ / length,
		};
	}
}
