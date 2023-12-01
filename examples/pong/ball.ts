import { Zylem } from '../../src/main';
const { Sphere } = Zylem.GameEntityType;
import { board, BoardSide } from './board';
const { Howl } = Zylem;

const sound = new Howl({
	src: '/assets/bounce.wav',
	volume: 0.1,
});
const minSpeed = 10.0;
const maxSpeed = 18.0;
const goalBuffer = 25.0;

export function Ball(startY = 0) {
	return {
		name: 'ball',
		type: Sphere,
		radius: 0.25,
		props: {
			dx: 1,
			dy: 0,
			speed: 10
		},
		setup(entity) {
			entity.setPosition(0, startY, 0);
		},
		update(_delta, { entity: ball, globals }) {
			const { dx, dy } = ball;
			const { x, y } = ball.getPosition();

			if (x > goalBuffer) {
				ball.setPosition(0, startY, 0);
				globals.p1Score++;;
				ball.speed = minSpeed;
				ball.dy = 0;
			} else if (x < -goalBuffer) {
				ball.setPosition(0, startY, 0);
				globals.p2Score++;
				ball.speed = minSpeed;
				ball.dy = 0;
			}

			if (y < board.bottom) {
				ball.setPosition(x, board.bottom, 0);
				ball.dy = Math.abs(ball.dy);
			} else if (y > board.top) {
				ball.setPosition(x, board.top, 0);
				ball.dy = -(Math.abs(ball.dy));
			}

			const velX = dx * ball.speed;
			ball.moveXY(velX, dy);
		},
		collision: (ball, paddle) => {
			sound.play();
			if (paddle.side === BoardSide.LEFT) {
				ball.dx = 1;
			} else if (paddle.side === BoardSide.RIGHT) {
				ball.dx = -1;
			}
			const paddleSpeed = paddle.getVelocity().y;
			ball.dy += (paddleSpeed / 8);
			ball.dy = Math.min(ball.dy, maxSpeed);
			ball.speed = Math.min(ball.speed + 0.5, maxSpeed);
		},
		destroy: () => { }
	}
}