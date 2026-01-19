import {
  WorldBoundary2DBehavior,
  createGame,
  makeMoveable,
  createSphere,
} from '@zylem/game-lib';

// Creates a moveable sphere
const ball = makeMoveable(createSphere());

// attach new boundary behavior and keep the handle
const boundary = ball.use(WorldBoundary2DBehavior, {
  boundaries: { top: 3, bottom: -3, left: -6, right: 6 },
});

// when the ball is updated, move it based on the inputs
ball.onUpdate(({ me, inputs, delta }) => {
  const { Horizontal, Vertical } = inputs.p1.axes;

  const speed = 600 * delta;

  // Input -> desired movement (note: Y is inverted)
  let moveX = Horizontal.value * speed;
  let moveY = -Vertical.value * speed;

  // Adjust movement based on boundary collisions
  ({ moveX, moveY } = boundary.getMovement(moveX, moveY));

  me.moveXY(moveX, moveY);
});

export default createGame(ball);
