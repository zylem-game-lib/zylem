import { Zylem, THREE } from "../../src/main";
import { Ground } from "./ground";
import { Player } from "./player";

const { create, Flat2D } = Zylem;
const { Color, Vector3 } = THREE;

const game = create({
	id: 'platformer',
	globals: {
		score: 0,
		lives: 3,
		time: 0,
	},
	stages: [
		{
			id: 'level-1',
			perspective: Flat2D,
			gravity: new Vector3(0, -10, 0),
			backgroundColor: new Color(0xA1ADFF),
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
					position: { x: -10, y: 10, z: 10 }
				});
				HUD.createText({
					text: '0',
					binding: 'time',
					position: { x: 15, y: 10, z: 10 }
				});
			},
			children: ({ gameState }) => {
				return [
					Player(),
					Ground(),
					Ground(new Vector3(30, -4, 0)),
				];
			},
			update: (delta, { camera, inputs, globals }) => {
				// const { score, time } = globals;
				// globals.time = time + delta;
				// camera.position.x += 0.1;
				// if (inputs[0].buttonB) {
				// 	globals.score = score + 1;
				// }
			}
		}
	],
});

game.start();