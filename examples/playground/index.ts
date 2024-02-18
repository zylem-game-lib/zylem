import { Color, Vector2, Vector3 } from "three";
import { PerspectiveType } from "../../src/lib/interfaces/perspective";
import { Zylem, ZylemStage } from "../../src/main";
import { Box, Plane, Sphere, Sprite } from "../../src/lib/entities";

const { create } = Zylem;

const box = Box({
	texture: 'playground/wood-box.jpg',
	setup({ entity, globals }) {
		entity.setPosition(9, 3, 30);
		entity.setRotation(14, 16, 4);
	},
	update({ delta, entity, globals }) {
		// console.log(entity);
	},
	destroy({ entity, globals }) {
		console.log(entity);
	}
});

const ground = Plane({
	tile: new Vector2(50, 80),
	texture: 'playground/grass.jpg',
	setup({ entity, globals }) {
	},
	update({ delta, entity, globals, inputs }) {

	},
	destroy({ entity, globals }) {
		console.log(entity);
	}
})

const sphere = Sphere({
	radius: 2,
	texture: 'playground/rain-man.png',
	setup({ entity, globals }) {
		entity.setPosition(-7, 3, 30);
		entity.setRotation(0, -0.25, 0);
	},
	update({ delta, entity, globals, inputs }) {
		const { moveLeft, moveRight } = inputs[0];
		if (moveRight) {
			entity.moveX(5);
		} else if (moveLeft) {
			entity.moveX(-5);
		}
	},
	destroy({ entity, globals }) {
		console.log(entity);
	}
});

const sprite = Sprite({
	images: [{
		name: 'idle',
		file: 'platformer/idle.png'
	}, {
		name: 'idle-left',
		file: 'platformer/idle-left.png'
	}, {
		name: 'run-1',
		file: 'platformer/run-1.png'
	}, {
		name: 'run-2',
		file: 'platformer/run-2.png'
	}
	],
	animations: [{
		name: 'run',
		frames: ['run-1', 'idle', 'run-2'],
		speed: 0.1,
		loop: true,
	}],
	size: new Vector3(1, 1, 1),
	collisionSize: new Vector3(0.5, 1, 1),
	setup({ entity, globals }) {
		entity.setPosition(0, 5, 30);
	},
	update({ delta, entity, globals }) {
		// console.log(entity);
		entity.setAnimation('run', delta);
	},
	destroy({ entity, globals }) {
		console.log(entity);
	}
})


export function LevelOne(): ZylemStage {
	return {
		perspective: PerspectiveType.ThirdPerson,
		backgroundColor: new Color('#554400'),
		gravity: new Vector3(0, -1, 0),
		setup: ({ camera, HUD }) => {
			camera.moveCamera(new Vector3(0, 5, 0));
			console.log(camera);
			// HUD.createUI();
		},
		update() {
			// HUD.renderDebug()
		},
		children: ({ }) => {
			return [
				box,
				sphere,
				sprite,
				ground
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