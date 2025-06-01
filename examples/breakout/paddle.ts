import { Color, Vector3 } from 'three';
import { board } from './board';
import { box } from '../../src/lib/entities';

const paddleSpeed = 20.0;
const paddleSize = new Vector3(4, 0.5, 1);

export async function Paddle() {
	const paddle = await box({
		name: 'paddle',
		size: paddleSize,
		color: new Color(1, 1, 1),
		position: new Vector3(0, -9, 0),
	});
	paddle.update = ({ entity: paddle, inputs }) => {
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
	};
	return paddle;
}