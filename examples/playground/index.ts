import { Color, Vector3 } from "three";
import { PerspectiveType } from "../../src/lib/interfaces/perspective";
import { Zylem, ZylemStage } from "../../src/main";
import { Box } from "../../src/lib/entities";

const { create } = Zylem;

const box = Box(() => {
	return {
		static: true,
		texture: 'playground/wood-box.jpg',
		setup({ entity, globals }) {
			console.log(entity);
			entity.setPosition(0, 3, 30);
			entity.setRotation(135, 35, 0);
			console.log(globals);
			console.log('concrete setup');
		},
		update({ delta, entity, globals }) {
			console.log(entity);
		},
		destroy({ entity, globals }) {
			console.log(entity);
		}
	}
});


export function LevelOne(): ZylemStage {
	return {
		perspective: PerspectiveType.ThirdPerson,
		backgroundColor: new Color('#554400'),
		gravity: new Vector3(0, -1, 0),
		setup: ({ camera }) => {
			camera.moveCamera(new Vector3(0, 3, 0));
			console.log(camera);
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