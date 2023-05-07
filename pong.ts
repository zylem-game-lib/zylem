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
					update: () => {
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