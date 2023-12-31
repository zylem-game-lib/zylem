import { Zylem, THREE } from '../../src/main';
import { Ship } from './ship';
import { Rock } from './rock';
const { Color } = THREE;
const { Flat2D } = Zylem;

const game = Zylem.create({
	id: 'asteroids',
	globals: {
		score: 0,
		lives: 3,
	},
	stages: [{
		perspective: Flat2D,
		backgroundImage: 'asteroids/space-bg.png',
		backgroundColor: Color.NAMES.black,
		conditions: [
			(globals, game) => {
				if (globals.lives <= 0) {
					game.reset();
				}
			}
		],
		setup: ({ scene, HUD }) => {
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
	}],
});

game.start();