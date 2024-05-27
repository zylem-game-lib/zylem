import { Zylem } from '../../src/main';
import { Color, Vector2 } from 'three';
import { Paddle } from './paddle';
import { Ball } from './ball';
import { Brick } from './brick';

const { Flat2D, Game, Stage } = Zylem;

const stage = Stage({
	perspective: Flat2D,
	backgroundColor: new Color('#000'),
	conditions: [
		{
			bindings: ['score'],
			callback: (globals, game) => {
				if (globals.score.get() > 0 && globals.bricks.get() === 0) {
					game.reset();
				}
				if (globals.lives.get() === 0) {
					game.reset();
				}
			}
		}
	],
	setup: ({ HUD }) => {
		HUD.addText('0', {
			binding: 'score',
			update: (element, value) => {
				element.text = `Score: ${value}`;
			},
			position: new Vector2(50, 10)
		});
		HUD.addText('0', {
			binding: 'lives',
			update: (element, value) => {
				element.text = `Lives: ${value}`;
			},
			position: new Vector2(25, 10)
		});
	},
	children: ({ globals }) => {
		const bricks: any[] = [];
		let brickCount = 0;
		for (let i = -8; i <= 8; i += 4) {
			for (let j = 8; j >= 4; j -= 2) {
				const brick = Brick(i, j);
				bricks.push(brick);
				brickCount++;
			}
		}
		globals.bricks.set(brickCount);
		return [
			Paddle(),
			Ball(),
			...bricks
		]
	}
});

const breakout = Game({
	id: 'playground',
	globals: {
		score: 0,
		level: 1,
		lives: 3,
		bricks: 0
	},
	stages: [stage]
});

breakout.start();
