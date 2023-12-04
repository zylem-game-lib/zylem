import { Zylem } from '../../src/main';
import { Vector3 } from 'three';
import { board } from './board';
const { Box } = Zylem.GameEntityType;

const paddleSpeed = 20.0;
const paddleSize = new Vector3(4, 0.5, 1);

export function Paddle() {
	return {
		name: `paddle`,
		type: Box,
		size: paddleSize,
		props: {},
		setup: (entity) => {
			entity.setPosition(0, -10, 0);
		},
		update: (_delta, { entity: paddle, inputs }) => {
			const { x } = paddle.getPosition();
			const { moveRight, moveLeft } = inputs[0];
			const canMoveRight = x < board.right;
			const canMoveLeft = x > board.left;
			if (moveRight && canMoveRight) {
				paddle.moveX(paddleSpeed);
			} else if (moveLeft && canMoveLeft) {
				paddle.moveX(-paddleSpeed);
			} else {
				paddle.moveX(0);
			}
		},
		destroy: () => { }
	}
}