import Zylem from '../../src/index';
import { Vector3 } from 'three';
import { board, BoardSide } from './board';
const { Box } = Zylem.GameEntityType;

const paddleSpeed = 20.0;
const paddleSize = new Vector3(0.5, 4, 1);

export function Paddle(inputKey, side: BoardSide, y = 0) {
	return {
		name: `paddle_${side}`,
		type: Box,
		size: paddleSize,
		props: {
			side: side,
		},
		setup: (entity) => {
			entity.setPosition(board[side], y, 0);
		},
		update: (_delta, { entity, inputs }) => {
			const { y } = entity.getPosition();
			const { moveUp, moveDown, buttonW, buttonY } = inputs[inputKey];
			// console.log(inputs);
			// TODO: kind of hacky should handle this better
			let upPressed = (inputKey) ? buttonW : moveUp;
			let downPressed = (inputKey) ? buttonY : moveDown;
			const canMoveUp = y < board.top;
			const canMoveDown = y > board.bottom;
			if (upPressed && canMoveUp) {
				entity.moveY(paddleSpeed);
			} else if (downPressed && canMoveDown) {
				entity.moveY(-paddleSpeed);
			} else {
				entity.moveY(0);
			}
		},
		destroy: () => { }
	}
}