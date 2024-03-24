import { Color, Vector2, Vector3 } from "three";
import { PerspectiveType } from "../../src/lib/interfaces/perspective";
import { Zylem, ZylemStage } from "../../src/main";
import { Actor, Box, Plane, Sphere, Sprite, Zone } from "../../src/lib/entities";

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

const zone = Zone({
	size: new Vector3(5, 20, 30),
	setup({ entity }) {
		entity.setPosition(10, 3, 20);
	},
	update({ entity }) {
		// console.log(entity);
	},
	destroy() {

	},
	onEnter({ entity, other }) {
		console.log('Entered: ', other);
	},
	onExit({ entity, other }) {
		console.log('Exited: ', other);
	}
});

const ground = Plane({
	tile: new Vector2(50, 80),
	repeat: new Vector2(4, 6),
	static: true,
	texture: 'playground/grass.jpg',
	setup({ entity, globals }) {
	},
	update({ delta, entity, globals, inputs }) {

	},
	destroy({ entity, globals }) {
		console.log(entity);
	}
});

const sphere = Sphere({
	radius: 2,
	texture: 'playground/rain-man.png',
	setup({ entity, globals }) {
		entity.setPosition(-10, 3, 30);
		entity.setRotation(0, -0.25, 0);
	},
	update({ delta, entity, globals, inputs }) {

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
		entity.setPosition(-2, 2, 30);
	},
	update({ delta, entity, inputs, globals }) {
		// console.log(entity);
		entity.setAnimation('run', delta);
		const { moveLeft, moveRight } = inputs[0];
		if (moveRight) {
			entity.moveX(5);
			entity.setAnimation('run', delta * 2);
		} else if (moveLeft) {
			entity.moveX(-5);
			entity.setAnimation('run', delta * 2);
		} else {
			entity.moveX(0);
		}
	},
	destroy({ entity, globals }) {
		console.log(entity);
	}
});

const actorFactory = (pos: Vector3) => {
	return Actor({
		animations: ['playground/run.fbx'],
		// static: true,
		setup({ entity, globals }) {
			entity.setPosition(pos.x, pos.y, pos.z);
		},
		update({ delta, entity, inputs, globals }) {

		},
		destroy({ entity, globals }) {
			console.log(entity);
		}
	});
}

const actor = actorFactory(new Vector3(-3, 4, 20));
const actor2 = actorFactory(new Vector3(0, 4, 10));
const actor3 = actorFactory(new Vector3(3, 4, 30));

export function LevelOne(): ZylemStage {
	return {
		perspective: PerspectiveType.ThirdPerson,
		backgroundColor: new Color('#554400'),
		gravity: new Vector3(0, -1, 0),
		setup: ({ camera, HUD }) => {
			camera.moveCamera(new Vector3(0, 5, 0));
			console.log(camera);
			// TODO: HUD needs to come through on setup
			console.log(HUD);
		},
		update() {

		},
		children: ({ }) => {
			return [
				actor3,
				actor,
				actor2,
				box,
				sphere,
				sprite,
				ground,
				zone,
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



/**
 * 
 * Game()
 * Stage()
 * Act()
 * 
 */