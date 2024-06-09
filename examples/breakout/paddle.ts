import { Color, Vector3 } from 'three';
import { board } from './board';
import { Box } from "../../src/lib/entities";

const paddleSpeed = 20.0;
const paddleSize = new Vector3(4, 0.5, 1);

export function Paddle() {
	return Box({
		name: 'paddle',
		size: paddleSize,
		color: new Color(1, 1, 1),
		setup: ({ entity }) => {
			entity.setPosition(0, -9, 0);
		},
		update: ({ entity: paddle, inputs }) => {
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
	})
}