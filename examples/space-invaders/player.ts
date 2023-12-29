import { Zylem } from '../../src/main';
import { Vector3 } from 'three';
import { Bullet } from './bullet';
const { Sprite } = Zylem.GameEntityType;

const playerSize = new Vector3(1, 1, 0.1);

export function Player(x = 0, y = -8, health = 2) {
	return {
		name: `player`,
		type: Sprite,
		size: playerSize,
		images: ['space-invaders/ship.png'],
		props: {
			health: 2,
			bulletRate: 0.4,
			bulletCurrent: 0,
			invulnerable: false,
			invulnerableRate: 3,
			invulnerableCurrent: 0,
		},
		setup: (entity) => {
			entity.setPosition(x, y, 0);
		},
		update: (_delta, { entity: player, inputs }) => {
			const { moveRight, moveLeft, buttonA } = inputs[0];
			const { x, y } = player.getPosition();
			if (moveRight) {
				player.moveX(10);
			} else if (moveLeft) {
				player.moveX(-10);
			} else {
				player.moveX(0);
			}
			player.bulletCurrent += _delta;
			if (buttonA && player.bulletCurrent >= player.bulletRate) {
				player.bulletCurrent = 0;
				player.spawn(Bullet, { x: x, y: y });
			}
			if (player.invulnerable) {
				player.health = 2;
				player.invulnerableCurrent += _delta;
				player.sprites[0].material.opacity = 0.5 + Math.sin(player.invulnerableCurrent * 10);
			}
			if (player.invulnerableCurrent >= player.invulnerableRate) {
				player.invulnerable = false;
				player.invulnerableCurrent = 0;
				player.sprites[0].material.opacity = 1;
			}
			if (player.health <= 1) {
				player.sprites[0].material.color.setHex(0xDDDDD);
			} else {
				player.sprites[0].material.color.setHex(0xffffff);
			}
		},
		collision: (player, other, { gameState }) => {
			if (player.health <= 0) {
				gameState.globals.lives--;
				player.health = 2;
				player.invulnerable = true;
			}
		},
		destroy: () => { }
	}
}