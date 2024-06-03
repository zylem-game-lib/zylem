import { Howl } from '../../src/main';
import { Sphere } from "../../src/lib/entities";
import { board } from './board';

const sound = new Howl({
	src: '/assets/bounce.wav',
	volume: 0.1,
});
const maxSpeed = 18.0;

export function Ball(startY = 0) {
	let dx = 0;
	let dy = -1;
	let speed = 10;

	const resetBall = (ball) => {
		ball.setPosition(0, startY, 0);
		dy = -1;
		dx = 0;
		speed = 10;
	}

	return Sphere({
		name: 'ball',
		radius: 0.25,
		setup({ entity }) {
			resetBall(entity);
		},
		update({ entity: ball, globals }) {
			const { x, y } = ball.getPosition();
			const currentLives = globals.lives.get();
			if (y < board.bottom - 5 && currentLives > 0) {
				resetBall(ball);
				globals.lives.set(currentLives - 1);
				return;
			} else if (y > board.top) {
				ball.setPosition(x, board.top, 0);
				dy = -(Math.abs(dy));
			}
			if (x < board.left) {
				ball.setPosition(board.left, y, 0);
				dx = Math.abs(dx);
			} else if (x > board.right) {
				ball.setPosition(board.right, y, 0);
				dx = -Math.abs(dx);
			}

			const velY = dy * speed;
			ball.moveXY(dx, velY);
		},
		collision: (ball, other, globals) => {
			if (other.name === 'paddle') {
				sound.play();
				const paddleSpeed = other.getVelocity().x;
				dx += (paddleSpeed / 8);
				dx = Math.min(dx, maxSpeed);
				dy = 1;
				speed = Math.min(speed + 0.5, maxSpeed);
			}
			if (other.name === 'brick') {
				const { x, y } = ball.getPosition();
				const { y: brickY } = other.getPosition();
				sound.play();
				other.health--;
				if (brickY > y) {
					ball.setPosition(x, brickY - 0.5, 0);
					dy = -1;
				} else if (brickY < y) {
					ball.setPosition(x, brickY + 0.5, 0);
					dy = 1;
				}
			}
			if (other.health > 0) {
				const newScore = globals.score.get() + 25;
				globals.score.set(newScore);
			}
		},
		destroy: () => { }
	});
}