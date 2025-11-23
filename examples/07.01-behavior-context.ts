import { createGame, sphere } from '../src/api/main';
import { debugBehavior } from '../src/lib/actions/behaviors/debug/debug';
	
const ball = await sphere();

ball.addBehavior(debugBehavior());

const myGame = createGame(
	{
		debug: true,
		id: 'behavior-context-test',
	},
	ball
);

myGame.start();