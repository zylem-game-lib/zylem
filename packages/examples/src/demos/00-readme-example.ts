import { boundary2d, createGame, makeMoveable, sphere } from '@zylem/game-lib';

// Creates a moveable sphere
const ball = makeMoveable(await sphere());

// when the ball is updated, move it based on the inputs
ball.onUpdate(({ me, inputs, delta }) => {
	// get the horizontal and vertical inputs from player one's controller
	const { Horizontal, Vertical } = inputs.p1.axes;
	// set the speed of the ball based on the delta time for smoother movement
	const speed = 600 * delta;
	// move the ball based on the inputs and the speed
	me.moveXY(
		Horizontal.value * speed,
		-Vertical.value * speed
	);
});

// add a boundary behavior to the ball
ball.addBehavior(
	boundary2d({
		boundaries: {
			top: 3,
			bottom: -3,
			left: -6,
			right: 6,
		},
	})
);

// start the game with the ball
export default createGame(ball);