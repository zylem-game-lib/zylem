import { Color, Vector3 } from "three";
import { PerspectiveType } from "../../src/lib/interfaces/perspective";
import { Zylem, ZylemStage } from "../../src/main";
import { NewBox } from "../../src/lib/entities";

const { create } = Zylem;

const box = NewBox(() => {
	return {
		setup() {
			console.log('concrete setup');
		},
		update({ }) {
			console.log('concrete update');
		},
		size: new Vector3(1, 1, 1)
	}
})


export function LevelOne(): ZylemStage {
	return {
		perspective: PerspectiveType.ThirdPerson,
		backgroundColor: new Color('#554400'),
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