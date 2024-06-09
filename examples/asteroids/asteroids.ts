import { Zylem, THREE } from '../../src/main';
import { Ship } from './ship';
import { Rock } from './rock';
import { Vector2 } from 'three';
const { Color } = THREE;
const { Flat2D, Game, Stage } = Zylem;

const asteroids = Game({
	id: 'playground',
	globals: {
		score: 0,
		lives: 3,
	},
	stages: [Stage({
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
		children: ({ globals }) => {
			return [
				Ship(),
				Rock({ x: -14, y: -4, startingHealth: 4 }),
				Rock({ x: 10, y: 10, startingHealth: 4 }),
				Rock({ x: -16, y: 7, startingHealth: 4 }),
				Rock({ x: -2, y: -12, startingHealth: 4 }),
			]
		},
	})]
});

asteroids.start();