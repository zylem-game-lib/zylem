import Zylem from '../../src/index';
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
			speed: 10.0
		},
		setup(entity) {
			entity.setPosition(0, startY, 0);
		},
		update(_delta, { entity, globals }) {
			const { dx, dy } = entity.getProps();
			const { x, y } = entity.getPosition();
			if (x > goalBuffer) {
				entity.setPosition(0, startY, 0);
				globals.p1Score++;
				entity._props.speed = minSpeed;
				entity._props.dy = 0;
			} else if (x < -goalBuffer) {
				entity.setPosition(0, startY, 0);
				globals.p2Score++;
				entity._props.speed = minSpeed;
				entity._props.dy = 0;
			}
			if (y < board.bottom) {
				entity.setPosition(x, board.bottom, 0);
				entity._props.dy = Math.abs(entity._props.dy);
			} else if (y > board.top) {
				entity.setPosition(x, board.top, 0);
				entity._props.dy = -(Math.abs(entity._props.dy));
			}
			const velX = dx * entity._props.speed;
			entity.moveXY(velX, dy);
		},
		collision: (entity, other) => {
			sound.play();
			if (other._props.side === BoardSide.LEFT) {
				entity._props.dx = 1;
			} else if (other._props.side === BoardSide.RIGHT) {
				entity._props.dx = -1;
			}
			const paddleSpeed = other.getVelocity().y;
			entity._props.dy += (paddleSpeed / 8);
			entity._props.dy = Math.min(entity._props.dy, maxSpeed);
			entity._props.speed = Math.min(entity._props.speed + 0.5, maxSpeed);
		},
		destroy: () => { }
	}
}