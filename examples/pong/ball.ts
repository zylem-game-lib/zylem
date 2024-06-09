import { Howl } from '../../src/main';

import { Sphere } from "../../src/lib/entities";
import { board } from './board';
import { Color } from 'three';

const sound = new Howl({
	src: '/assets/bounce.wav',
	volume: 0.1,
});
const minSpeed = 10.0;
const maxSpeed = 18.0;
const goalBuffer = 25.0;

export function Ball(startY = 0) {
	let dx = 1;
	let dy = 0;
	let speed = 10;

	return Sphere({
		radius: 0.25,
		color: new Color(1, 1, 1),
		setup({ entity }) {
			entity.setPosition(0, startY, 0);
		},
		update({ entity: ball, globals }) {
			const { p1Score, p2Score } = globals;
			const { x, y } = ball.getPosition();

			if (x > goalBuffer) {
				ball.setPosition(0, startY, 0);
				p1Score.set(p1Score.get() + 1);
				speed = minSpeed;
				dy = 0;
			} else if (x < -goalBuffer) {
				ball.setPosition(0, startY, 0);
				p2Score.set(p2Score.get() + 1);
				speed = minSpeed;
				dy = 0;
			}

			if (y < board.bottom) {
				ball.setPosition(x, board.bottom, 0);
				dy = Math.abs(dy);
			} else if (y > board.top) {
				ball.setPosition(x, board.top, 0);
				dy = -(Math.abs(dy));
			}

			const velX = dx * speed;
			ball.moveXY(velX, dy);
		},
		collision: (_ball, paddle) => {
			sound.play();
			if (paddle.name === 'left') {
				dx = 1;
			} else if (paddle.name === 'right') {
				dx = -1;
			}
			const paddleSpeed = paddle.getVelocity().y;
			dy += (paddleSpeed / 8);
			dy = Math.min(dy, maxSpeed);
			speed = Math.min(speed + 0.5, maxSpeed);
		},
		destroy: () => { }
	});
}