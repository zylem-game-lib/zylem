import Zylem from '../../src/index';
const { Sphere } = Zylem.GameEntityType;
import { board } from './board';
const { Howl } = Zylem;

const sound = new Howl({
	src: '/assets/bounce.wav',
	volume: 0.1,
});
const maxSpeed = 18.0;

export function Ball(startY = 0) {
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
			entity.setPosition(0, startY, 0);
		},
		update(_delta, { entity: ball, globals }) {
			const { dx, dy } = ball;
			const { x, y } = ball.getPosition();

			if (y < board.bottom) {
				ball.setPosition(x, board.bottom, 0);
				ball.dy = Math.abs(ball.dy);
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
		collision: (ball, paddle) => {
			sound.play();
			const paddleSpeed = paddle.getVelocity().x;
			ball.dx += (paddleSpeed / 8);
			ball.dx = Math.min(ball.dx, maxSpeed);
			ball.dy = 1;
			ball.speed = Math.min(ball.speed + 0.5, maxSpeed);
		},
		destroy: () => { }
	}
}