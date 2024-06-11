import { THREE } from '../../src/main';
import { boardHeight, boardWidth } from './board';
import { Bullet } from './bullet';
import { sprite } from "../../src/lib/entities";
import { actionOnPress } from '../../src/lib/behaviors/actions';

const { Vector3 } = THREE;

export function Ship(x = 0, y = 0) {
	return sprite({
		name: `ship`,
		size: new Vector3(2, 2, 1),
		collisionSize: new Vector3(1, 1, 1),
		images: [{
			name: 'idle',
			file: 'asteroids/ship-idle.png'
		}, {
			name: 'thrust',
			file: 'asteroids/ship-thrust.png'
		}],
		custom: {
			rotationSpeed: 0.05,
			thrust: 0.1,
			bulletCurrent: 0,
			// bulletRate: 0.2,
		},
		setup: ({ entity }) => {
			entity.setPosition(x, y, 0);
		},
		update: ({ entity: player, inputs }) => {
			const { moveRight, moveLeft, moveUp, buttonA } = inputs[0];
			const { rotationSpeed, thrust } = player as any;

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

			actionOnPress(buttonA, async () => {
				const bulletSpeed = 20;
				const spawnDistance = 1.5;
				const bulletVelX = player.getDirection2D().x * bulletSpeed;
				const bulletVelY = player.getDirection2D().y * bulletSpeed;

				await player.spawnRelative(
					Bullet,
					{ velX: bulletVelX, velY: bulletVelY },
					{ x: spawnDistance, y: spawnDistance }
				);
			});
		}
	})
}