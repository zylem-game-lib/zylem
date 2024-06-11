import { Vector3 } from 'three';
import { sprite } from "../../src/lib/entities";

const bulletSize = new Vector3(1, 1, 0.1);

export function Bullet({ x = 0, y = -8, health = 2 }) {
	return sprite({
		name: `bullet`,
		size: bulletSize,
		images: [{
			name: 'normal',
			file: 'space-invaders/shot.png'
		}],
		setup: ({ entity }) => {
			entity.setPosition(x, y, 0);
		},
		update: ({ entity: bullet }) => {
			const { y } = bullet.getPosition();
			bullet.moveXY(Math.sin(y), 15);
			if (y > 10) {
				(bullet as any).destroy();
			}
		},
		collision: (bullet, other, globals) => {
			const { score } = globals;
			if (other.name.includes('invader')) {
				bullet.destroy();
				other.destroy();
				score.set(score.get() + 10);
			}
		},
	})
}