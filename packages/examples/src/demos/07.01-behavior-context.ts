import { createGame, sphere } from '@zylem/game-lib';
// import { debugBehavior } from '@zylem/game-lib';
	
const ball = await sphere();

// ball.addBehavior(debugBehavior());

const myGame = createGame(
	{
		debug: true,
		id: 'behavior-context-test',
	},
	ball
);

export default myGame;