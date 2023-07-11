import { Vector3 } from 'three';
import Zylem from './src/index';
import { PerspectiveType } from './src/interfaces/Perspective';

const { Box, Sphere } = Zylem.GameEntityType;

const game = Zylem.create({
	id: 'pong',
	perspective: PerspectiveType.Fixed2D,
	globals: {
		p1Score: 0,
		p2Score: 0,
	},
	stage: {
		children: () => {
			return [
				{
					name: 'paddle1',
					type: Box,
					shape: new Vector3(2, 10, 1),
					setup: (entity) => {
						entity.setPosition(20, 0, 0);
					},
					update: (delta, { entity, inputs }) => {
						const { y } = entity.getPosition();
						if (inputs[0].moveUp && y < 8) {
							entity.moveY(0.5);
						} else if (inputs[0].moveDown && y > -8) {
							entity.moveY(-0.5);
						}
					},
					destroy: () => {
					}
				},
				{
					name: 'paddle2',
					type: Box,
					shape: new Vector3(2, 10, 1),
					setup: (entity) => {
						entity.setPosition(-20, 0, 0);
					},
					update: (delta, { entity, inputs }) => {
						const { y } = entity.getPosition();
						if (inputs[0].moveUp && y < 8) {
							entity.moveY(0.5);
						} else if (inputs[0].moveDown && y > -8) {
							entity.moveY(-0.5);
						}
					},
					destroy: () => {
					}
				},
				{
					name: 'ball',
					type: Sphere,
					shape: new Vector3(1, 1, 1),
					props: {
						dx: 1,
						dy: 1
					},
					setup(entity) {
						entity.setPosition(0, 0, 0);
					},
					update(delta, { entity, inputs }) {
						const { dx } = entity.getProps();
						const { x } = entity.getPosition();
						if (dx === 1) {
							entity.moveX(0.5);
						} else if (dx === -1) {
							entity.moveX(-0.5);
						}
						if (x > 25 || x < -25) {
							entity.setPosition(0, 0, 0);
						}

					},
					collision: (entity, other) => {
						console.log(other.name);
						if (other.name === 'paddle1') {
							entity._props.dx = -1;
						} else if (other.name === 'paddle2') {
							entity._props.dx = 1;
						}
					},
					destroy: () => { }
				}
			];
		},
	},
});
game.start();