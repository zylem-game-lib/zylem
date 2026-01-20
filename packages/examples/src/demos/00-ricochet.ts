import { Color, Vector3 } from 'three';
import { 
	createGame, createSphere, makeMoveable, 
	Ricochet2DBehavior, WorldBoundary2DBehavior,
	ricochetSound 
} from '@zylem/game-lib';

const ball = makeMoveable(createSphere({ color: new Color(Color.NAMES.red) }));

// Attach ricochet behavior for collision reflection
const ricochet = ball.use(Ricochet2DBehavior, {
	minSpeed: 5,
	maxSpeed: 15,
	speedMultiplier: 1.5,
	reflectionMode: 'simple',
	maxAngleDeg: 60,
});

// Attach boundary behavior to detect wall hits
const boundary = ball.use(WorldBoundary2DBehavior, {
	boundaries: { top: 6, bottom: -6, left: -12, right: 12 },
});

ball.onSetup(({ me }) => {
	me.move(new Vector3(3, 4, 0));
});

// On update, check boundary hits and compute ricochet
ball.onUpdate(({ me }) => {
	const hits = boundary.getLastHits();
	if (!hits) return;

	const anyHit = hits.left || hits.right || hits.top || hits.bottom;
	if (!anyHit) return;

	// Get current velocity
	const body = me.body;
	if (!body) return;

	const velocity = body.linvel();

	// Compute collision normal from boundary hits
	let normalX = 0;
	let normalY = 0;
	if (hits.left) normalX = 1;
	if (hits.right) normalX = -1;
	if (hits.bottom) normalY = 1;
	if (hits.top) normalY = -1;

	// Compute ricochet result
	const result = ricochet.getRicochet({
		entity: me,
		contact: { normal: { x: normalX, y: normalY } },
	});

	if (result) {
		// Consumer decides how to apply the result
		body.setLinvel({ x: result.velocity.x, y: result.velocity.y, z: 0 }, true);
		ricochetSound();
	}
});

const game = createGame({
	id: 'ricochet-test',
}, ball);

export default game;