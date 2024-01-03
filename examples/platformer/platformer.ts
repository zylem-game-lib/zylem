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
		actualTime: 0,
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
			update: (delta, { camera, stage, inputs, globals }) => {
				const player = stage.getEntityByName('player');
				const { x, y } = player.getPosition();
				camera.moveCamera(new Vector3(x, y, 0));
				const { actualTime } = globals;
				globals.actualTime = actualTime + delta;
				globals.time = Math.round(actualTime);
			}
		}
	],
});

game.start();