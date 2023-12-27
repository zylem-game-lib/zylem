import { Zylem } from '../../src/main';
import { Ship } from './ship';
import { Rock } from './rock';
const { Color } = Zylem.THREE;

const game = Zylem.create({
	id: 'asteroids',
	// @ts-ignore TODO: expose perspective type
	perspective: 'flat-2d',
	globals: {
		score: 0,
		lives: 3,
	},
	stage: {
		backgroundColor: Color.NAMES.black,
		conditions: [
			(globals, game) => {
				if (globals.lives <= 0) {
					game.reset();
				}
			}
		],
		setup: (scene, HUD) => {
			HUD.createText({
				text: '0',
				binding: 'score',
				position: { x: 0, y: 10, z: 10 }
			});
			HUD.createText({
				text: '0',
				binding: 'lives',
				position: { x: -15, y: -10, z: 10 }
			});
		},
		children: ({ gameState }) => {
			return [
				Ship(),
				Rock({ x: -14, y: -4, startingHealth: 4 }),
				Rock({ x: 10, y: 10, startingHealth: 4 }),
				Rock({ x: -16, y: 7, startingHealth: 4 }),
				Rock({ x: -2, y: -12, startingHealth: 4 }),
			]
		},
	},
});

game.start();