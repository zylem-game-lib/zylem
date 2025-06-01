import { Perspectives, game, stage } from '../../src/main';
import { Color, Vector2 } from 'three';
import { Paddle } from './paddle';
import { Ball } from './ball';
import { Brick } from './brick';

const { Flat2D } = Perspectives;

let brickCount = 0;
const stage1 = stage({
	backgroundColor: new Color('#000'),
	conditions: [
		{
			bindings: ['score', 'bricks', 'lives'],
			callback: (globals, game) => {
				const { score, bricks, lives } = globals;
				if (score.get() > 0 && bricks.get() === 0) {
					breakout.reset();
				}
				if (lives.get() === 0) {
					breakout.reset();
				}
			}
		}
	],
	// setup: ({ HUD, globals }) => {
	// 	// TODO: fix binding issue
	// 	HUD.addLabel({
	// 		binding: 'score',
	// 		update: (element, value) => {
	// 			element.updateText(`Score: ${value}`);
	// 		},
	// 		position: new Vector2(250, 5)
	// 	});
	// 	HUD.addLabel({
	// 		binding: 'lives',
	// 		update: (element, value) => {
	// 			element.updateText(`Lives: ${value}`);
	// 		},
	// 		position: new Vector2(25, 5)
	// 	});
	// 	globals.bricks.set(brickCount);
	// },
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
		];
	}
});

const config = {
	id: 'playground',
	globals: {
		score: 0,
		level: 1,
		lives: 3,
		bricks: 0
	},
};

const breakout = game(
	config,
	stage1
);

breakout.start();
