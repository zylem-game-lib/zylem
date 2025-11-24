import { createGame, sphere, makeMoveable } from '@zylem/game-lib';

const ball = await sphere();
makeMoveable(ball).onUpdate(({ me, inputs }) => {
	const { Horizontal, Vertical } = inputs.p1.axes;
	me.moveXY(Horizontal.value * 5, -Vertical.value * 5);
});

const game = await createGame({
	debug: true,
	id: 'basic-ball',
	globals: {
		gameNumber: 0,
	},
}, ball);
// myGame.start();

/**
 * 
 * score: varNumber(0)
 * winnerText: varString('')
 * 
 * 
 */
export default game;