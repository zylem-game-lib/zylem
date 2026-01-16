import { Color, Vector3 } from 'three';
import { createGame, createSphere, makeMoveable, ricochet2DInBounds, ricochetSound } from '@zylem/game-lib';

const ball = makeMoveable(createSphere({ color: new Color(Color.NAMES.red) }));
ball.addBehavior(
	ricochet2DInBounds(
		{ boundaries: { top: 6, bottom: -6, left: -12, right: 12 } },
		() => { ricochetSound() }
	)
).onSetup(
	({ me }) => { me.move(new Vector3(3, 4, 0)) }
);

const game = createGame({
	id: 'ricochet-test',
}, ball);

export default game;