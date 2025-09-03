import { game, sphere, makeMoveable } from '../src/main';

const ball = await sphere();
makeMoveable(ball).onUpdate(({ me, inputs }) => {
	const { Horizontal, Vertical } = inputs.p1.axes;
	me.moveXY(Horizontal.value * 5, -Vertical.value * 5);
});

const myGame = await game({
	debug: true,
	id: 'basic-ball',
	globals: {
		gameNumber: 0,
	},
}, ball);
myGame.start();

/**
 * 
 * score: varNumber(0)
 * winnerText: varString('')
 * 
 * 
 */