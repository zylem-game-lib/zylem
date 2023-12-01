import { Color } from "three";
import { Zylem } from "../../src/main";
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
			for (let i = -8; i <= 8; i += 2) {
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