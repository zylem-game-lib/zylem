import { Vector3 } from 'three';
import { sprite } from "../../src/lib/entities";

const invaderSize = new Vector3(1, 1, 0.3);
const bulletSize = new Vector3(1, 1, 0.1);

function InvaderBullet({ x = 0, y = -8, health = 2 }) {
	return sprite({
		name: `bullet`,
		size: bulletSize,
		images: [{
			name: 'normal',
			file: 'space-invaders/invader-shot.png'
		}],
		custom: {},
		setup: ({ entity }) => {
			entity.setPosition(x, y, 0);
		},
		update: ({ entity: bullet }) => {
			const { y } = bullet.getPosition();
			bullet.moveXY(Math.sin(y) * 8, -15);
			if (y < -10) {
				(bullet as any).destroy();
			}
		},
		collision: (bullet, other) => {
			if (other.name.includes('player')) {
				bullet.destroy();
				other.health--;
			}
		}
	})
}

export function Invader(x = 0, y = 0, health = 2) {
	return sprite({
		name: `invader_${x}_${y}`,
		size: invaderSize,
		images: [{
			name: 'move1',
			file: 'space-invaders/invader-1.png'
		}, {
			name: 'move2',
			file: 'space-invaders/invader-2.png'
		}],
		custom: {
			animationRate: 1,
			animationCurrent: 0,
			dropRate: 1.5,
			dropCurrent: 0,
			direction: 1,
			speed: 5,
			fireRate: 2,
			fireChance: 12,
			fireCurrent: 0,
		},
		setup: ({ entity }) => {
			entity.setPosition(x, y, 0);
		},
		update: ({ delta, entity: invader }: any) => {
			const { x, y } = invader.getPosition();
			if (invader.animationCurrent < invader.animationRate) {
				invader.animationCurrent += delta;
			} else {
				invader.sprites[invader.spriteIndex].visible = false;
				invader.spriteIndex = invader.spriteIndex === 0 ? 1 : 0;
				invader.animationCurrent = 0;
				invader.sprites[invader.spriteIndex].visible = true;
			}
			if (invader.dropCurrent < invader.dropRate) {
				invader.dropCurrent += delta;
			} else {
				invader.dropCurrent = 0;
				invader.direction = invader.direction === 1 ? -1 : 1;
				invader.moveY(-invader.speed);
				return;
			}
			invader.moveX(invader.speed * invader.direction);
			if (invader.fireCurrent < invader.fireRate) {
				invader.fireCurrent += delta;
			} else {
				invader.fireCurrent = 0;
				const chance = Math.floor(Math.random() * invader.fireChance);
				if (chance <= 6) {
					invader.spawn(InvaderBullet, { x: x, y: y });
				}
			}
		},
		collision: (invader, other) => {
			if (other.name === 'player') {
				invader.destroy();
				other.health--;
			}
		},
	})
}