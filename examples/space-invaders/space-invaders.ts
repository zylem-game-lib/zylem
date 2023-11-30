import { Color } from "three";
import Zylem from "../../src";
import { PerspectiveType } from "../../src/interfaces/Perspective";
import { Invader } from "./invader";
import { Player } from "./player";

const game = Zylem.create({
	id: 'space-invaders',
	perspective: PerspectiveType.Flat2D,
	globals: {
		score: 0,
		lives: 3,
		invaders: 0,
		invaderSpeed: 0.5,
		invaderDirection: 1,
		invaderDrop: 0.5,
		invaderDropSpeed: 0.5,
		invaderFireRate: 0.01,
		invaderFireChance: 0.01,
		invaderFireSpeed: 0.5,
	},
	stage: {
		backgroundColor: Color.NAMES.black,
		conditions: [
			(globals, game) => {
				if (globals.lives === 0) {
					game.reset();
				}
			}
		],
		setup: (scene, HUD) => {
			HUD.createText({
				text: '0',
				binding: 'score',
				position: { x: 0, y: 10, z: 0 }
			});
			HUD.createText({
				text: '0',
				binding: 'lives',
				position: { x: -15, y: -10, z: 0 }
			});
		},
		children: ({ gameState }) => {
			const invaders: any[] = [];
			for (let i = -8; i <= 8; i += 4) {
				for (let j = 8; j >= 4; j -= 2) {
					const invader = Invader(i, j);
					invaders.push(invader);
					if (gameState) {
						gameState.globals.invaders++;
					}
				}
			}
			return [
				Player(),
				...invaders
			]
		},
	},
});

game.start();