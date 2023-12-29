import { Zylem } from '../../src/main';
import { boardHeight, boardWidth, wrapAroundBoard } from './board';

const { Sprite, Sphere } = Zylem.GameEntityType;
const { Vector3, Color } = Zylem.THREE;

export function Bullet({ position = new Vector3(0, 0, 0), velX = 0, velY = 0 }) {
	return {
		name: `bullet`,
		type: Sphere,
		radius: 0.1,
		color: Color.NAMES.gold,
		props: {
			velX: 0,
			velY: 0
		},
		setup: (entity: any) => {
			entity.setPosition(position.x, position.y, 1);
			entity.velX = velX;
			entity.velY = velY;
		},
		update: (_delta: number, { entity: bullet }: any) => {
			const { velX, velY } = bullet;
			bullet.moveXY(velX, velY);
		},
		collision: (bullet: any, other: any, { gameState }: any) => {
			if (other.name === 'rock') {
				if (!other.hit && other.health > 0) {
					other.hit = true;
					gameState.globals.score += Math.abs(4 - other.health) * 25;
				}
				bullet.destroy();
			}
		}
	}
}

export function Ship(x = 0, y = 0) {
	return {
		name: `ship`,
		type: Sprite,
		size: new Vector3(2, 2, 1),
		collisionSize: new Vector3(1, 1, 1),
		images: [{
			name: 'idle',
			file: 'asteroids/ship-idle.png'
		}, {
			name: 'thrust',
			file: 'asteroids/ship-thrust.png'
		}],
		props: {
			rotationSpeed: 0.05,
			thrust: 0.1,
			bulletCurrent: 0,
			bulletRate: 0.2,
		},
		setup: (entity: any) => {
			entity.setPosition(x, y, 0);
		},
		update: (_delta: number, { entity: player, inputs }: any) => {
			const { moveRight, moveLeft, moveUp, buttonA } = inputs[0];
			const { rotationSpeed, thrust } = player;

			if (moveLeft) {
				player.rotate(rotationSpeed);
			} else if (moveRight) {
				player.rotate(-rotationSpeed);
			}

			if (moveUp) {
				player.moveForwardXY(thrust);
				player.setSprite('thrust');
			} else {
				player.setSprite('idle');
			}

			player.wrapAroundXY(boardWidth, boardHeight);

			player.bulletCurrent += _delta;
			if (buttonA && player.bulletCurrent >= player.bulletRate) {
				player.bulletCurrent = 0;
				const bulletSpeed = 50;
				const spawnDistance = 1.5;
				const bulletVelX = player.getDirectionXY().x * bulletSpeed;
				const bulletVelY = player.getDirectionXY().y * bulletSpeed;

				player.spawnRelative(Bullet, { velX: bulletVelX, velY: bulletVelY }, { x: spawnDistance, y: spawnDistance });
			}
		}
	}
}