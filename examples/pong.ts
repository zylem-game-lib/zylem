import { Color, Vector3 } from 'three';
import Zylem from '../src/index';
import { PerspectiveType } from '../src/interfaces/Perspective';

const { Box, Sphere } = Zylem.GameEntityType;

const paddleSpeed = 20.0;
const ballSpeed = 10.0;
const ballBuffer = 0.5;
const ballSize = 0.25;
const paddleSize = new Vector3(0.5, 8, 1);
const goalBuffer = 25.0;
const board = {
	top: 10,
	bottom: -10,
	right: -20,
	left: 20
};

const paddleUpdate = (delta, { entity, inputs }, inputKey, boardPositionX) => {
	const { y } = entity.getPosition();
	const { moveUp, moveDown } = inputs[inputKey];
	if (moveUp) {
		entity.moveY(paddleSpeed);
	} else if (moveDown) {
		entity.moveY(-paddleSpeed);
	} else {
		entity.moveY(0);
	}
	if (y > board.top) {
		entity.moveY(0);
		entity.setPosition(boardPositionX, board.top, 0);
	}
	if (y < board.bottom) {
		entity.moveY(0);
		entity.setPosition(boardPositionX, board.bottom, 0);
	}
}

const game = Zylem.create({
	id: 'pong',
	perspective: PerspectiveType.Fixed2D,
	globals: {
		p1Score: 0,
		p2Score: 0,
	},
	stage: {
		backgroundColor: Color.NAMES.darkblue,
		conditions: [
			(globals, game) => {
				if (globals.p1Score > 3) {
					console.log("p1 wins!");
					globals.p1Score = 0;
					game.reset();
				}
			}
		],
		children: () => {
			return [
				{
					name: 'paddle1',
					type: Box,
					size: paddleSize,
					setup: (entity) => {
						entity.setPosition(board.left, 0, 0);
					},
					update: (delta, { entity, inputs }) => {
						paddleUpdate(delta, { entity, inputs }, 0, board.left);
					},
					destroy: () => { }
				},
				{
					name: 'paddle2',
					type: Box,
					size: paddleSize,
					setup: (entity) => {
						entity.setPosition(board.right, 0, 0);
					},
					update: (delta, { entity, inputs }) => {
						paddleUpdate(delta, { entity, inputs }, 0, board.right);
					},
					destroy: () => { }
				},
				{
					name: 'ball',
					type: Sphere,
					radius: ballSize,
					props: {
						dx: 1,
						dy: 0
					},
					setup(entity) {
						entity.setPosition(0, 0, 0);
					},
					update(delta, { entity, inputs, globals }) {
						const { dx, dy } = entity.getProps();
						const { x, y } = entity.getPosition();
						if (dx === 1) {
							entity.moveXY(ballSpeed, dy);
						} else if (dx === -1) {
							entity.moveXY(-ballSpeed, dy);
						}
						if (x > goalBuffer) {
							entity.setPosition(0, 0, 0);
							globals.p1Score++;
							console.log(globals.p1Score);
						}
						if (x < -goalBuffer) {
							entity.setPosition(0, 0, 0);
							globals.p2Score++;
							console.log(globals.p2Score);
						}
						if (y <= board.bottom || y >= board.top) {
							entity._props.dy *= -1;
						}
						if (y < board.bottom) {
							const yPos = board.bottom + ballBuffer;
							entity.setPosition(x, yPos, 0);
						}
						if (y > board.top) {
							const yPos = board.top - ballBuffer;
							entity.setPosition(x, yPos, 0);
						}
					},
					collision: (entity, other) => {
						if (other.name === 'paddle1') {
							entity._props.dx = -1;
						} else if (other.name === 'paddle2') {
							entity._props.dx = 1;
						}
						entity._props.dy = other.getVelocity().y / 2;
						entity._props.dy += Math.random() * (other.getVelocity().y / 16);
					},
					destroy: () => { }
				}
			];
		},
	},
});
game.start();