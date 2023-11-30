import Zylem from '../../src/index';
import { Vector3 } from 'three';
const { Sprite } = Zylem.GameEntityType;

const playerSize = new Vector3(0.5, 4, 1);

export function Player(x = 0, y = -8, health = 2) {
	return {
		name: `player_${x}_${y}`,
		type: Sprite,
		size: playerSize,
		images: ['space-invaders/ship.png'],
		props: {
			health,
		},
		setup: (entity) => {
			entity.setPosition(x, y, 0);
		},
		update: (_delta, { entity: player, inputs }) => {
			const { moveRight, moveLeft } = inputs[0];
			if (moveRight) {
				player.moveX(10);
			} else if (moveLeft) {
				player.moveX(-10);
			} else {
				player.moveX(0);
			}
		},
		destroy: () => { }
	}
}