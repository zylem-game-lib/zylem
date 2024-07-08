import { game, stage, THREE, Perspectives } from '../../src/main';
import { Ship } from './ship';
import { Rock } from './rock';
import { Vector2 } from 'three';
const { Color } = THREE;
const { Flat2D } = Perspectives;

const stage1 = stage({
	perspective: Flat2D,
	backgroundImage: 'asteroids/space-bg.png',
	backgroundColor: new Color('#000'),
	conditions: [
		{
			bindings: ['score', 'lives'],
			callback: (globals, game) => {
				const { lives } = globals;
				if (lives.get() <= 0) {
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
			position: new Vector2(50, 5)
		});
		HUD.addText('0', {
			binding: 'lives',
			update: (element, value) => {
				element.text = `Lives: ${value}`;
			},
			position: new Vector2(25, 5)
		});
	},
	children: () => {
		return [
			Ship(),
			Rock({ x: -0, y: -4, startingHealth: 4 }),
			Rock({ x: 10, y: 10, startingHealth: 4 }),
			Rock({ x: -3, y: 7, startingHealth: 4 }),
			Rock({ x: -2, y: -10, startingHealth: 4 }),
		]
	},
});

const asteroids = game({
	id: 'playground',
	globals: {
		score: 0,
		lives: 3,
	},
	stages: [stage1]
});

asteroids.start();