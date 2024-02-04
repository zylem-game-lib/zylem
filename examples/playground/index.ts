import { Color, Vector3 } from "three";
import { PerspectiveType } from "../../src/lib/interfaces/perspective";
import { Zylem, ZylemStage } from "../../src/main";
import { Box } from "../../src/lib/entities";

const { create } = Zylem;

const box = Box(() => {
	return {
		static: true,
		setup({ entity, globals }) {
			console.log(entity);
			console.log(globals);
			console.log('concrete setup');
		},
		update({ }) {
			// console.log('concrete update');
		},
		destroy() {

		}
	}
});


export function LevelOne(): ZylemStage {
	return {
		perspective: PerspectiveType.ThirdPerson,
		backgroundColor: new Color('#554400'),
		gravity: new Vector3(0, -1, 0),
		setup: ({ }) => {

		},
		children: ({ }) => {
			return [
				box,
			]
		},
		conditions: [
			(globals, game) => {
				if (globals.lives <= 0) {
					game.reset();
				}
			}
		]
	}
}


const game = create({
	id: 'playground',
	globals: {
		score: 0,
		lives: 3,
		time: 0,
		actualTime: 0,
	},
	stages: [
		LevelOne(),
	],
});

game.start();