import { game, sphere, makeMoveable } from '../../src/main';

const ball = await sphere();
makeMoveable(ball).onUpdate(({ entity, inputs }) => {
	const { Horizontal, Vertical } = inputs.p1.axes;
	entity.moveXY(Horizontal.value * 5, -Vertical.value * 5);
});
game(ball).start();