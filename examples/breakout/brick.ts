import { Color, Vector3 } from 'three';
import Zylem from '../../src';
const { Box } = Zylem.GameEntityType;
const { destroy } = Zylem;

export function Brick(posX, posY) {
	return {
		name: `brick`,
		type: Box,
		size: new Vector3(2, 0.5, 1),
		props: {
			health: 2,
		},
		setup: (entity) => {
			entity.setPosition(posX, posY, 0);
		},
		update: (_delta, { entity: brick }) => {
			if (brick.health === 1) {
				brick.mesh.material.color = new Color('aqua');
			}
		},
		collision: (brick) => {
			if (brick.health === 0) {
				destroy(brick);
			}
		},
		destroy: (globals) => {
			console.log('destroy: ', globals);
		}
	}
}