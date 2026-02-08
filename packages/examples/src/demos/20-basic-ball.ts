import { createGame, createSphere, makeMoveable, useArrowsForAxes } from '@zylem/game-lib';
import { Color } from 'three';

const ball = createSphere({ color: new Color(Color.NAMES.aqua) });
makeMoveable(ball).onUpdate(({ me, inputs }) => {
	const { Horizontal, Vertical } = inputs.p1.axes;
	me.moveXY(Horizontal.value * 5, -Vertical.value * 5);
});

const game = createGame({
	debug: true,
	id: 'basic-ball',
	globals: {
		gameNumber: 0,
	},
}, ball);
game.setInputConfiguration(useArrowsForAxes('p1'));

export default game;