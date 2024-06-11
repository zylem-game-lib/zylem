import { THREE } from "../../src/main";
import { sprite } from "../../src/lib/entities";
import { settings } from './settings';

const { Vector3 } = THREE;
const { groundLevel } = settings;

enum JumpState {
	Idle,
	Jumping,
	Falling,
};

export function Player() {
	return sprite({
		name: `player`,
		images: [{
			name: 'idle',
			file: 'platformer/idle.png'
		}, {
			name: 'idle-left',
			file: 'platformer/idle-left.png'
		}, {
			name: 'run-1',
			file: 'platformer/run-1.png'
		}, {
			name: 'run-2',
			file: 'platformer/run-2.png'
		}, {
			name: 'run-1-left',
			file: 'platformer/run-1-left.png'
		}, {
			name: 'run-2-left',
			file: 'platformer/run-2-left.png'
		}, {
			name: 'jump',
			file: 'platformer/jump.png'
		}, {
			name: 'jump-left',
			file: 'platformer/jump-left.png'
		}],
		animations: [{
			name: 'run',
			frames: ['run-1', 'idle', 'run-2'],
			speed: 0.1,
			loop: true,
		}, {
			name: 'run-left',
			frames: ['run-1-left', 'idle-left', 'run-2-left'],
			speed: 0.1,
			loop: true,
		}],
		size: new Vector3(2, 2, 1),
		collisionSize: new Vector3(0.5, 2, 1),
		custom: {
			jumpState: JumpState.Idle,
			jumpTime: 0.25,
			jumpTimer: 0,
			jumpVelocity: 16,
			gravity: -9.8,
			onGround: false,
			movingLeft: false,
		},
		setup: ({ entity }) => {
			entity.setPosition(0, groundLevel + 5, 0);
		},
		update: ({ delta, entity: player, inputs }: any) => {
			const { moveLeft, moveRight, buttonA } = inputs[0];
			let { x: velX, y: velY } = player.getVelocity();

			if (!player.onGround) {
				velY += player.gravity * delta;
			}

			if (player.jumpState === JumpState.Idle) {
				const useIdleSprite = player.movingLeft ? 'idle-left' : 'idle';
				player.setSprite(useIdleSprite);
			}

			if (moveLeft) {
				velX = -10;
				player.movingLeft = true;
				player.setAnimation('run-left', delta);
			} else if (moveRight) {
				velX = 10;
				player.movingLeft = false;
				player.setAnimation('run', delta);
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
				player.jumpTimer += delta;
				player.onGround = false;
			}

			if (player.jumpState === JumpState.Jumping || player.jumpState === JumpState.Falling) {
				const useJumpSprite = player.movingLeft ? 'jump-left' : 'jump';
				player.setSprite(useJumpSprite);
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
	})
}