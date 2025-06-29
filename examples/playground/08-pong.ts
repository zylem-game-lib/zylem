import { Color, Vector3 } from 'three';
import { game, box, sphere, stage, camera } from '../../src/main';
import { MoveableEntity, makeMoveable } from '../../src/lib/behaviors/moveable';
import { Vec0 } from '../../src/lib/core/utility';
import { GameEntity } from '../../src/lib/core';

const ball = await sphere({
	position: Vec0,
	radius: 0.1,
	material: {
		color: new Color(Color.NAMES.lightgreen),
	},
});

function pingPong(entity: MoveableEntity, other: GameEntity<any>) {
	const { x, y } = entity.body?.translation() || { x: 0, y: 0 };
	const { x: otherX, y: otherY } = other.body?.translation() || { x: 0, y: 0 };
	const yDiff = y - otherY;
	const velocity = entity.getVelocity() || { x: 0, y: 0 };
	const speed = Math.min(Math.abs(velocity.x) + 1, 15);
	if (otherX > x) {
		entity.setPosition(otherX - 0.2, y, 0);
		entity.moveXY(-speed, yDiff);
	} else {
		entity.setPosition(otherX + 0.2, y, 0);
		entity.moveXY(speed, yDiff);
	}
}

const moveableBall = makeMoveable(ball);
moveableBall.onSetup(({ entity }) => {
	entity.setPosition(0, 0, 0);
	entity.moveX(3);
});

moveableBall.onCollision(({ entity, other, globals }) => {
	pingPong(entity, other);
});

const paddleSize = { x: 0.20, y: 1.5, z: 1 };
const paddleMaterial = { color: new Color(Color.NAMES.lightblue) };
const paddleSpeed = 5;

const paddle1 = await box({
	position: { x: -10, y: 0, z: 0 },
	size: paddleSize,
	material: paddleMaterial,
});
makeMoveable(paddle1).onUpdate(({ entity, inputs }) => {
	const { Vertical } = inputs.p1.axes;
	const { value } = Vertical;
	entity.moveY(-value * paddleSpeed);
});

const paddle2 = await box({
	position: { x: 10, y: 0, z: 0 },
	size: paddleSize,
	material: paddleMaterial,
});
makeMoveable(paddle2).onUpdate(({ entity, inputs }) => {
	const { Horizontal } = inputs.p1.axes;
	const { value } = Horizontal;
	entity.moveY(value * paddleSpeed);
});


const camera1 = await camera({
	position: new Vector3(0, 0, 10),
	perspective: 'fixed-2d',
});

const stage1 = await stage({
	gravity: Vec0,
	camera: camera1,
	variables: {
		p1Score: 0,
		p2Score: 0,
	}
});

const game1 = game({
	id: 'pong',
	debug: true,
}, stage1, ball, paddle1, paddle2);


game1.start();