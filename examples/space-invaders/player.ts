import { Vector3 } from 'three';
import { Bullet } from './bullet';
import { sprite } from "../../src/lib/entities";

const playerSize = new Vector3(1, 1, 0.1);

export function Player(x = 0, y = -8, health = 2) {
	return sprite({
		name: `player`,
		size: playerSize,
		images: [{
			name: 'idle',
			file: 'space-invaders/ship.png'
		}],
		custom: {
			health: 2,
			bulletRate: 0.4,
			bulletCurrent: 0,
			invulnerable: false,
			invulnerableRate: 3,
			invulnerableCurrent: 0,
		},
		setup: ({ entity }) => {
			entity.setPosition(x, y, 0);
			(entity as any).health = health;
		},
		update: ({ delta, entity: player, inputs }) => {
			const { moveRight, moveLeft, buttonA } = inputs[0];
			const { x, y } = (player as any).getPosition();
			if (moveRight) {
				player.moveX(10);
			} else if (moveLeft) {
				player.moveX(-10);
			} else {
				player.moveX(0);
			}
			(player as any).bulletCurrent += delta;
			if (buttonA && (player as any).bulletCurrent >= (player as any).bulletRate) {
				(player as any).bulletCurrent = 0;
				player.spawn(Bullet, { x: x, y: y });
			}
			if ((player as any).invulnerable) {
				(player as any).health = 2;
				(player as any).invulnerableCurrent += delta;
				player.sprites[0].material.opacity = 0.5 + Math.sin((player as any).invulnerableCurrent * 10);
			}
			if ((player as any).invulnerableCurrent >= (player as any).invulnerableRate) {
				(player as any).invulnerable = false;
				(player as any).invulnerableCurrent = 0;
				player.sprites[0].material.opacity = 1;
			}
			if ((player as any).health <= 1) {
				player.sprites[0].material.color.setHex(0xDDDDD);
			} else {
				player.sprites[0].material.color.setHex(0xffffff);
			}
		},
		collision: (player, other, globals) => {
			const { lives } = globals;
			if (player.health <= 0) {
				lives.set(lives.get() - 1);
				player.health = 2;
				player.invulnerable = true;
			}
		},
	})
}