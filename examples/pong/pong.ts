import { Zylem, stage, game } from '../../src/main';
import { Color, Vector2 } from 'three';
import { BoardSide } from './board';
import { Paddle } from './paddle';
import { Ball } from './ball';

const { PerspectiveType } = Zylem;
const paddle1 = Paddle(0, BoardSide.LEFT);
const paddle2 = Paddle(1, BoardSide.RIGHT);
const ball = Ball();

const stage1 = stage({
	perspective: PerspectiveType.Flat2D,
	backgroundColor: new Color(0, 0, 0),
	conditions: [
		{
			bindings: ['p1Score', 'p2Score'],
			callback: (globals, game) => {
				const { p1Score, p2Score, winner } = globals;
				if (p1Score.get() === 3) {
					winner.set(1);
				}
				if (p2Score.get() === 3) {
					winner.set(2);
				}
			}
		}
	],
	setup: ({ HUD }) => {
		HUD.addText('0', {
			binding: 'p1Score',
			update: (element, value) => {
				element.text = value;
			},
			position: new Vector2(25, 10)
		});
		HUD.addText('0', {
			binding: 'p2Score',
			update: (element, value) => {
				element.text = value;
			},
			position: new Vector2(75, 10)
		});
		HUD.addText('', {
			binding: 'winner',
			update: (element, value) => {
				if (value === 0) {
					return;
				}
				element.text = `Player ${value} wins!`;
			},
			position: new Vector2(50, 50)
		})
	},
	children: () => {
		return [
			paddle1,
			paddle2,
			ball,
		];
	}
});

const pong = game({
	id: 'playground',
	globals: {
		p1Score: 0,
		p2Score: 0,
		winner: 0
	},
	stages: [stage1],
});

pong.start();