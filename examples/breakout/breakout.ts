import { Zylem, game, stage } from '../../src/main';
import { Color, Vector2 } from 'three';
import { Paddle } from './paddle';
import { Ball } from './ball';
import { Brick } from './brick';

const { PerspectiveType } = Zylem;

let brickCount = 0;
const stage1 = stage({
	perspective: PerspectiveType.Flat2D,
	backgroundColor: new Color('#000'),
	conditions: [
		{
			bindings: ['score', 'bricks', 'lives'],
			callback: (globals, game) => {
				const { score, bricks, lives } = globals;
				if (score.get() > 0 && bricks.get() === 0) {
					breakout.reset(game);
				}
				if (lives.get() === 0) {
					breakout.reset(game);
				}
			}
		}
	],
	setup: ({ HUD, globals }) => {
		HUD.addText('0', {
			binding: 'score',
			update: (element, value) => {
				element.text = `Score: ${value}`;
			},
			position: new Vector2(50, 5)
		});
		HUD.addText('0', {
			binding: 'lives',
			update: (element, value) => {
				element.text = `Lives: ${value}`;
			},
			position: new Vector2(25, 5)
		});
		globals.bricks.set(brickCount);
	},
	children: ({ globals }) => {
		const bricks: any[] = [];
		for (let i = -8; i <= 8; i += 4) {
			for (let j = 8; j >= 4; j -= 2) {
				const brick = Brick(i, j);
				bricks.push(brick);
				brickCount++;
			}
		}
		return [
			Paddle(),
			Ball(),
			...bricks
		]
	}
});

const breakout = game({
	id: 'playground',
	globals: {
		score: 0,
		level: 1,
		lives: 3,
		bricks: 0
	},
	stages: [stage1]
});

breakout.start();
