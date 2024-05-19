import { Zylem } from '../../src/main';
import { Color, Vector3 } from 'three';
import { BoardSide } from './board';
import { Paddle } from './paddle';
import { Ball } from './ball';

const { Flat2D, Game, Stage } = Zylem;

const paddle1 = Paddle(0, BoardSide.LEFT);
const paddle2 = Paddle(1, BoardSide.RIGHT);
const ball = Ball();

const stage = Stage({
	// id: 'stage-1',
	perspective: Flat2D,
	backgroundColor: new Color(0, 0, 0),
	// gravity: new Vector3(0, -4, 0),
	// conditions: [
	// 	(globals, game) => {
	// 		if (globals.winner !== 0) {
	// 			return;
	// 		}
	// 		const p1Wins = globals.p1Score === 3;
	// 		const p2Wins = globals.p2Score === 3;
	// 		if (p1Wins) {
	// 			globals.winner = 1;
	// 			globals.centerText = "P1 Wins!";
	// 		}
	// 		if (p2Wins) {
	// 			globals.winner = 2;
	// 			globals.centerText = "P2 Wins!";
	// 		}
	// 		if (p1Wins || p2Wins) {
	// 			setTimeout(() => {
	// 				game.reset();
	// 			}, 2000);
	// 		}
	// 	}
	// ],
	setup: ({ camera }) => {
		// camera.moveCamera(new Vector3(0, 0, 90));
		// camera.target = ball;
		// HUD.createText({
		// 	text: '',
		// 	binding: 'centerText',
		// 	position: new Vector3(0, 0, 0)
		// });
		// HUD.createText({
		// 	text: '0',
		// 	binding: 'p1Score',
		// 	position: new Vector3(-5, 10, 0)
		// });
		// HUD.createText({
		// 	text: '0',
		// 	binding: 'p2Score',
		// 	position: new Vector3(5, 10, 0)
		// });
	},
	children: () => {
		return [
			paddle1,
			paddle2,
			ball,
		];
	},
	collision: function (entity: any, other: any, globals?: any): void {
		throw new Error('Function not implemented.');
	}
});

const game = Game({
	id: 'playground',
	globals: {
		p1Score: 0,
		p2Score: 0,
		centerText: '',
		winner: 0
	},
	stages: [stage],
});

game.start();