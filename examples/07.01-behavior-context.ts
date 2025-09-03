import { game, sphere } from '../src/main';
import { debugBehavior } from '../../src/lib/behaviors/debug/debug';

const ball = await sphere();

ball.addBehavior(debugBehavior());

const myGame = game(
	{
		debug: true,
		id: 'behavior-context-test',
	},
	ball
);

myGame.start();