import { Vector3 } from 'three';
import Zylem from '../../src';
const { Box } = Zylem.GameEntityType;

export function Brick(posX, posY) {
	return {
		name: `brick`,
		type: Box,
		size: new Vector3(2, 0.5, 1),
		props: {
			health: 2
		},
		setup: (entity) => {
			entity.setPosition(posX, posY, 0);
		},
		update: (_delta, { entity: brick }) => {
			// console.log(brick);
		},
		collision: (brick, other) => {
			if (other.name === 'ball') {
				brick.health--;
			}
			if (brick.health === 0) {
				brick.setPosition(-100, -100, 0);
			}
		},
		destroy: () => {

		}
	}
}