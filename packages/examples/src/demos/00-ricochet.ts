import { Color, Vector3 } from 'three';
import { 
	createGame, createSphere, makeMoveable, 
	Ricochet2DBehavior, WorldBoundary2DBehavior,
	BoundaryRicochetCoordinator,
	ricochetSound
} from '@zylem/game-lib';

const ball = makeMoveable(createSphere({ color: new Color(Color.NAMES.red) }));

const ricochet = ball.use(Ricochet2DBehavior, {
	minSpeed: 5,
	maxSpeed: 15,
	speedMultiplier: 1.5,
	reflectionMode: 'simple',
	maxAngleDeg: 60,
});

const boundary = ball.use(WorldBoundary2DBehavior, {
	boundaries: { top: 6, bottom: -6, left: -12, right: 12 },
});

ball.onSetup(({ me }) => {
	me.move(new Vector3(3, 4, 0));
});

const coordinator = new BoundaryRicochetCoordinator(ball, boundary, ricochet);

ricochet.onRicochet(() => {
	ricochetSound();
});

ball.onUpdate(() => {
	coordinator.update();
});

const game = createGame({
	id: 'ricochet-test',
}, ball);

export default game;