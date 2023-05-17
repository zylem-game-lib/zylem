import Zylem from './src/index';
import { PerspectiveType } from './src/interfaces/Perspective';

const { ZylemBox } = Zylem;

const game = Zylem.create({
	id: 'pong',
	perspective: PerspectiveType.Fixed2D,
	stage: {
		children: () => {
			return [
				// ball: Zylem.Sphere,
				{
					name: 'paddle1',
					type: ZylemBox,
					setup: (entity) => {
						console.log(entity);
					},
					update: (delta, { entity, inputs }) => {
						console.log(delta);
						if (inputs[0].moveUp) {
							entity.moveY(10);
						} else if (inputs[0].moveDown) {
							entity.moveY(-10);
						}
					},
					destroy: () => {
					}
				},
				// paddle2: Zylem.ZylemBox,
			];
		},
	},
});
game.start();