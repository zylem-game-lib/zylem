import { Color, Vector3 } from 'three';
import Zylem from '../../src';
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
		bricks: 20
	},
	stage: {
		backgroundColor: Color.NAMES.black,
		conditions: [
			(globals, game) => {
				if (globals.bricks === 0) {
					game.reset();
				}
			}
		],
		setup: (scene, HUD) => {
			HUD.createText({
				text: '0',
				binding: 'bricks',
				position: new Vector3(-5, 10, 0)
			});
		},
		children: () => {
			const bricks: any[] = [];
			for (let i = -8; i <= 8; i += 4) {
				for (let j = 8; j >= 4; j -= 2) {
					const brick = Brick(i, j);
					bricks.push(brick);
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
