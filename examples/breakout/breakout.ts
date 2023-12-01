import { Zylem } from '../../src/main';
import { Color, Vector3 } from 'three';
import { PerspectiveType } from '../../src/interfaces/Perspective';
import { Paddle } from './paddle';
import { Ball } from './ball';
import { Brick } from './brick';

const breakout = Zylem.create({
	id: 'breakout',
	perspective: PerspectiveType.Flat2D,
	globals: {
		score: 0,
		level: 1,
		lives: 3,
		bricks: 0
	},
	stage: {
		backgroundColor: Color.NAMES.black,
		conditions: [
			(globals, game) => {
				if (globals.score > 0 && globals.bricks === 0) {
					game.reset();
				}
				if (globals.lives === 0) {
					game.reset();
				}
			}
		],
		setup: (scene, HUD) => {
			HUD.createText({
				text: '0',
				binding: 'score',
				position: new Vector3(0, 10, 0)
			});
			HUD.createText({
				text: '0',
				binding: 'lives',
				position: new Vector3(-15, -10, 0)
			});
		},
		children: ({ gameState }) => {
			const bricks: any[] = [];
			for (let i = -8; i <= 8; i += 4) {
				for (let j = 8; j >= 4; j -= 2) {
					const brick = Brick(i, j);
					bricks.push(brick);
					if (gameState) {
						gameState.globals.bricks++;
					}
				}
			}
			return [
				Paddle(),
				Ball(),
				...bricks
			]
		}
	}
});

breakout.start();
