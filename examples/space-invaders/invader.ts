import Zylem from '../../src/index';
import { Vector3 } from 'three';
// import invader from './assets/invader-1.png';
const { Sprite } = Zylem.GameEntityType;

const invaderSize = new Vector3(0.5, 0.5, 0.5);

export function Invader(x = 0, y = 0, health = 2) {
	return {
		name: `invader_${x}_${y}`,
		type: Sprite,
		size: invaderSize,
		images: ['space-invaders/invader-1.png', 'space-invaders/invader-2.png'],
		props: {
			health,
			timer: 1,
			total: 0,
		},
		setup: (entity) => {
			entity.setPosition(x, y, 0);
		},
		update: (_delta, { entity: invader, inputs }) => {
			if (invader.total < invader.timer) {
				invader.total += _delta;
			} else {
				invader.sprites[invader.spriteIndex].visible = false;
				invader.spriteIndex = invader.spriteIndex === 0 ? 1 : 0;
				invader.total = 0;
				invader.sprites[invader.spriteIndex].visible = true;
			}
		},
		destroy: () => { }
	}
}