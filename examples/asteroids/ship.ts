import { Zylem } from '../../src/main';
import { wrapAroundBoard } from './board';

const { Sprite, Sphere } = Zylem.GameEntityType;
const { Vector3 } = Zylem.THREE;

export function Bullet({ x = 0, y = 0, velX = 0, velY = 0 }) {
	return {
		name: `bullet`,
		type: Sphere,
		size: new Vector3(0.2, 0.2, 0.2),
		props: {
			velX: 0,
			velY: 0
		},
		setup: (entity: any) => {
			entity.setPosition(x, y, 1);
			entity.mesh.scale.set(0.2, 0.2, 0.2);
			entity.velX = velX;
			entity.velY = velY;
		},
		update: (_delta: number, { entity: bullet }: any) => {
			const { velX, velY } = bullet;
			bullet.moveXY(velX, velY);
			const { x, y } = bullet.getPosition();
			const { newPosX, newPosY } = wrapAroundBoard(x, y);
		},
		collision: (bullet: any, other: any, { gameState }: any) => {
			if (other.name === 'rock') {
				if (!other.hit) {
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
		images: ['asteroids/ship-idle.png', 'asteroids/ship-thrust.png'],
		props: {
			velocity: new Vector3(0, 0, 0),
			rotationSpeed: 0.1, // Adjust as needed for rotation speed
			thrust: 0.005,
			rotation: 0,
			bulletCurrent: 0,
			bulletRate: 0.2,
		},
		setup: (entity: any) => {
			entity.setPosition(x, y, 0);
		},
		update: (_delta: number, { entity: player, inputs }: any) => {
			const { moveRight, moveLeft, moveUp, buttonA } = inputs[0];
			const { velocity, rotationSpeed, thrust } = player;

			// Rotate left or right
			if (moveLeft) {
				player.rotation += rotationSpeed;
			} else if (moveRight) {
				player.rotation -= rotationSpeed;
			}

			// Apply thrust
			if (moveUp) {
				let thrustX = Math.sin(-player.rotation) * thrust;
				let thrustY = Math.cos(-player.rotation) * thrust;
				velocity.x += thrustX;
				velocity.y += thrustY;
				player.sprites[0].visible = false;
				player.sprites[1].visible = true;
			} else {
				player.sprites[0].visible = true;
				player.sprites[1].visible = false;
			}

			// Update position based on velocity
			let { x: posX, y: posY } = player.getPosition();
			posX += velocity.x;
			posY += velocity.y;

			const { newPosX, newPosY } = wrapAroundBoard(posX, posY);
			player.setPosition(newPosX, newPosY, 0);

			if (player.sprites[0]) {
				player.sprites[0].material.rotation = player.rotation;
				player.sprites[1].material.rotation = player.rotation;
				// player.mesh.scale.set(2.5, 2.5, 4);
			}
			player.bulletCurrent += _delta;
			if (buttonA && player.bulletCurrent >= player.bulletRate) {
				player.bulletCurrent = 0;
				const bulletSpeed = 100; // Speed of the bullet
				const spawnDistance = 1; // Distance in front of the player where the bullet will spawn

				const spawnPosX = newPosX + (Math.sin(-player.rotation) * spawnDistance);
				const spawnPosY = newPosY + (Math.cos(-player.rotation) * spawnDistance);

				// Calculate bullet's velocity
				const bulletVelX = Math.sin(-player.rotation) * bulletSpeed;
				const bulletVelY = Math.cos(-player.rotation) * bulletSpeed;
				player.spawn(Bullet, { x: spawnPosX, y: spawnPosY, velX: bulletVelX, velY: bulletVelY });
			}
		}
	}
}