import { Zylem } from '../../src/main';
import { Color, Vector3 } from 'three';
import { BoardSide } from './board';
import { Paddle } from './paddle';
import { Ball } from './ball';

const { Flat2D } = Zylem;

const game = Zylem.create({
	id: 'pong',
	globals: {
		p1Score: 0,
		p2Score: 0,
		centerText: '',
		winner: 0
	},
	stages: [{
		id: 'stage-1',
		perspective: Flat2D,
		backgroundColor: Color.NAMES.black,
		conditions: [
			(globals, game) => {
				if (globals.winner !== 0) {
					return;
				}
				const p1Wins = globals.p1Score === 3;
				const p2Wins = globals.p2Score === 3;
				if (p1Wins) {
					globals.winner = 1;
					globals.centerText = "P1 Wins!";
				}
				if (p2Wins) {
					globals.winner = 2;
					globals.centerText = "P2 Wins!";
				}
				if (p1Wins || p2Wins) {
					setTimeout(() => {
						game.reset();
					}, 2000);
				}
			}
		],
		setup: ({ scene, HUD }) => {
			HUD.createText({
				text: '',
				binding: 'centerText',
				position: new Vector3(0, 0, 0)
			});
			HUD.createText({
				text: '0',
				binding: 'p1Score',
				position: new Vector3(-5, 10, 0)
			});
			HUD.createText({
				text: '0',
				binding: 'p2Score',
				position: new Vector3(5, 10, 0)
			});
		},
		children: () => {
			return [
				Paddle(0, BoardSide.LEFT),
				Paddle(1, BoardSide.RIGHT),
				Ball(),
			];
		},
	}],
});
game.start();