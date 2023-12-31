import { Zylem, THREE } from "../../src/main";

const { Sprite } = Zylem;
const { Vector3 } = THREE;

enum JumpState {
	Idle,
	Jumping,
	Falling,
};

export function Player() {
	return {
		name: `player`,
		type: Sprite,
		images: [{
			name: 'idle',
			file: 'platformer/idle.png'
		}, {
			name: 'run-1',
			file: 'platformer/run-1.png'
		}, {
			name: 'run-2',
			file: 'platformer/run-2.png'
		}, {
			name: 'jump',
			file: 'platformer/jump.png'
		}],
		size: new Vector3(2, 2, 1),
		props: {
			jumpState: JumpState.Idle,
			jumpTime: 0.25,
			jumpTimer: 0,
		},
		setup: (entity: any) => {
			entity.setPosition(0, 0, 0);
		},
		update: (_delta: number, { entity: player, inputs }: any) => {
			const { moveLeft, moveRight, buttonA } = inputs[0];
			const { x: velX, y: velY } = player.getVelocity();
			if (moveLeft) {
				player.moveXY(-10, velY);
			} else if (moveRight) {
				player.moveXY(10, velY);
			} else {
				player.moveXY(0, velY);
			}
			if (buttonA && player.jumpTimer <= player.jumpTime && player.jumpState !== JumpState.Falling) {
				player.moveXY(velX, 30);
				player.jumpState = JumpState.Jumping;
				player.jumpTimer += _delta;
			}
			if (!buttonA && player.jumpTimer > 0) {
				player.jumpState = JumpState.Falling;
				player.jumpTimer = 0;
				player.moveXY(velX, 0);
			}
			if (player.jumpTimer > player.jumpTime) {
				player.jumpState = JumpState.Falling;
				player.jumpTimer = 0;
				player.moveXY(velX, 0);
			}
			if (player.jumpState === JumpState.Jumping || player.jumpState === JumpState.Falling) {
				player.setSprite('jump');
			}
			if (player.jumpState === JumpState.Idle) {
				player.setSprite('idle');
			}
		},
		collision: (entity: any, other: any) => {
			if (other.name === 'ground') {
				entity.jumpState = JumpState.Idle;
			}
		}
	}
}