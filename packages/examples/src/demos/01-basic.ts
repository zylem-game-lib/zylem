import { createGame, createStage, sphere, makeMoveable, camera } from '@zylem/game-lib';
import { Color, Vector3 } from 'three';

// Create the ball first  
const ball = await sphere({
  name: 'ball',
  position: new Vector3(0, 0, 0),
  radius: 0.5,
  color: new Color(0x00ff00), // Green
});

// Make it moveable with input handling
const moveableBall = makeMoveable(ball);

moveableBall.onUpdate(({ me, inputs }) => {
  const { Up, Down, Left, Right } = inputs.p1.directions;
  const speed = 0.1; // Reduced speed for smoother movement
  
  let vx = 0;
  let vy = 0;
  
  if (Up.held) vy += speed;
  if (Down.held) vy -= speed;
  if (Left.held) vx -= speed;
  if (Right.held) vx += speed;
  
  me.moveXY(vx, vy);
});

// Create the camera
const cam = camera({
  position: new Vector3(0, 0, 10),
  perspective: 'third-person',
});

// Create a stage with the ball
const stage = createStage({}, cam, moveableBall);

//Create the game with input configuration
const game = createGame({
  id: 'basic-game',
  debug: true,
  input: {
    p1: { 
      key: { 
        ArrowUp: ['directions.up'],
        ArrowDown: ['directions.down'],
        ArrowLeft: ['directions.left'],
        ArrowRight: ['directions.right'],
      } 
    },
  },
}, stage);

export default game;
