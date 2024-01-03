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
			jumpVelocity: 16,
			gravity: -9.8,
			onGround: false
		},
		setup: (entity: any) => {
			entity.setPosition(0, 0, 0);
		},
		update: (_delta: number, { entity: player, inputs }: any) => {
			const { moveLeft, moveRight, buttonA } = inputs[0];
			let { x: velX, y: velY } = player.getVelocity();

			if (!player.onGround) {
				velY += player.gravity * _delta;
			}

			if (moveLeft) {
				velX = -10;
			} else if (moveRight) {
				velX = 10;
			} else {
				velX = 0;
			}

			if (
				buttonA &&
				player.jumpTimer <= player.jumpTime &&
				player.jumpState !== JumpState.Falling &&
				player.onGround
			) {
				velY = player.jumpVelocity;
				player.jumpState = JumpState.Jumping;
				player.jumpTimer += _delta;
				player.onGround = false;
			}

			if (player.jumpState === JumpState.Jumping || player.jumpState === JumpState.Falling) {
				player.setSprite('jump');
			}

			if (player.jumpState === JumpState.Idle) {
				player.setSprite('idle');
			}

			if (player.jumpTimer > player.jumpTime || !buttonA) {
				player.jumpState = JumpState.Falling;
			}

			player.moveXY(velX, velY);

			if (player.onGround) {
				player.jumpTimer = 0;
			}
		},
		collision: (entity: any, other: any) => {
			if (other.name === 'ground') {
				entity.jumpState = JumpState.Idle;
				entity.onGround = true;
				entity.jumpTimer = 0;
			}
		}
	}
}