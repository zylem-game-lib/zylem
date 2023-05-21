import Zylem from './src/index';
import { PerspectiveType } from './src/interfaces/Perspective';

const { Box, Sphere } = Zylem.GameEntityType;

const game = Zylem.create({
	id: 'pong',
	perspective: PerspectiveType.Fixed2D,
	stage: {
		children: () => {
			return [
				// ball: Zylem.Sphere,
				{
					name: 'paddle1',
					type: Box,
					setup: (entity) => {
						entity.setPosition(20, 0, 0);
					},
					update: (delta, { entity, inputs }) => {
						if (inputs[0].moveUp) {
							entity.moveY(10);
						} else if (inputs[0].moveDown) {
							entity.moveY(-10);
						}
					},
					destroy: () => {
					}
				},
				{
					name: 'paddle2',
					type: Box,
					setup: (entity) => {
						entity.setPosition(-20, 0, 0);
					},
					update: (delta, { entity, inputs }) => {
						if (inputs[0].moveUp) {
							entity.moveY(10);
						} else if (inputs[0].moveDown) {
							entity.moveY(-10);
						}
					},
					destroy: () => {
					}
				},
				{
					name: 'ball',
					type: Sphere,
				}
			];
		},
	},
});
game.start();