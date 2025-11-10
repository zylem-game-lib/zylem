import { Vector3 } from 'three';
import { createGame, sphere, makeMoveable } from '../src/api/main';
import { ricochet2DInBounds } from '../src/lib/actions/behaviors/ricochet/ricochet-2d-in-bounds';
import { ricochetSound } from '../src/lib/sounds';

const ball = makeMoveable(await sphere());
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

game.start();