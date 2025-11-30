import { createGame, sphere, makeMoveable } from '@zylem/game-lib';
import { Color } from 'three';

const ball = await sphere({ color: new Color(Color.NAMES.aqua) });
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

export default game;