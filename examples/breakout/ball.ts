import { Zylem } from '../../src/main';
const { Sphere } = Zylem.GameEntityType;
import { board } from './board';
const { Howl } = Zylem;

const sound = new Howl({
	src: '/assets/bounce.wav',
	volume: 0.1,
});
const maxSpeed = 18.0;

export function Ball(startY = 0) {
	const resetBall = (ball) => {
		ball.setPosition(0, startY, 0);
		ball.dy = -1;
		ball.dx = 0;
		ball.speed = 10;
	}

	return {
		name: 'ball',
		type: Sphere,
		radius: 0.25,
		props: {
			dx: 0,
			dy: -1,
			speed: 10
		},
		setup(entity) {
			resetBall(entity);
		},
		// Update is being called multiple times per collision
		update(_delta, { entity: ball, globals }) {
			const { dx, dy } = ball;
			const { x, y } = ball.getPosition();

			if (y < board.bottom - 5 && globals.lives > 0) {
				resetBall(ball);
				globals.lives--;
				return;
			} else if (y > board.top) {
				ball.setPosition(x, board.top, 0);
				ball.dy = -(Math.abs(ball.dy));
			}
			if (x < board.left) {
				ball.setPosition(board.left, y, 0);
				ball.dx = Math.abs(ball.dx);
			} else if (x > board.right) {
				ball.setPosition(board.right, y, 0);
				ball.dx = -Math.abs(ball.dx);
			}

			const velY = dy * ball.speed;
			ball.moveXY(dx, velY);
		},
		collision: (ball, other, { gameState }) => {
			if (other.name === 'paddle') {
				sound.play();
				const paddleSpeed = other.getVelocity().x;
				ball.dx += (paddleSpeed / 8);
				ball.dx = Math.min(ball.dx, maxSpeed);
				ball.dy = 1;
				ball.speed = Math.min(ball.speed + 0.5, maxSpeed);
			}
			if (other.name === 'brick') {
				const { x, y } = ball.getPosition();
				const { y: brickY } = other.getPosition();
				sound.play();
				other.health--;
				if (brickY > y) {
					ball.setPosition(x, brickY - 0.5, 0);
					ball.dy = -1;
				} else if (brickY < y) {
					ball.setPosition(x, brickY + 0.5, 0);
					ball.dy = 1;
				}
			}
			if (other.health > 0) {
				gameState.globals.score += 25;
			}
		},
		destroy: () => { }
	}
}