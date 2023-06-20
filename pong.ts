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
						if (inputs[0].moveUp) {
							entity.moveY(0.5);
						} else if (inputs[0].moveDown) {
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
						if (inputs[0].moveUp) {
							entity.moveY(0.5);
						} else if (inputs[0].moveDown) {
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
						direction: 1
					},
					setup(entity) {
						entity.setPosition(0, 0, 0);
					},
					update(delta, { entity, inputs }) {
						const { direction } = entity.getProps();
						if (direction === 1) {
							entity.moveX(0.5);
						} else if (direction === -1) {
							entity.moveX(-0.5);
						}
					},
					collision: (entity, other) => {
						console.log(other.name);
						if (other.name === 'paddle1') {
							entity._props.direction = -1;
						} else if (other.name === 'paddle2') {
							entity._props.direction = 1;
						}
					},
					destroy: () => { }
				}
			];
		},
	},
});
game.start();