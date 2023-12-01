import { Zylem } from '../../src/main';
import { Vector3 } from 'three';
const { Sprite } = Zylem.GameEntityType;
const { destroy } = Zylem;

const bulletSize = new Vector3(0.1, 0.1, 0.1);

export function Bullet({ x = 0, y = -8, health = 2 }) {
	return {
		name: `bullet`,
		type: Sprite,
		size: bulletSize,
		images: ['space-invaders/shot.png'],
		props: {},
		setup: (entity) => {
			entity.setPosition(x, y, 0);
		},
		update: (_delta, { entity: bullet, inputs }) => {
			const { y } = bullet.getPosition();
			bullet.moveXY(Math.sin(y), 15);
			if (y > 10) {
				destroy(bullet);
			}
		},
		collision: (bullet, other, { gameState }) => {
			if (other.name.includes('invader')) {
				destroy(bullet);
				destroy(other);
				gameState.globals.score += 10;
			}
		},
		destroy: () => { }
	}
}