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
});

const zone = Zone({
	size: new Vector3(5, 20, 30),
	setup({ entity }) {
		entity.setPosition(10, 3, 20);
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
});

const sphere = Sphere({
	radius: 2,
	texture: 'playground/rain-man.png',
	setup({ entity, globals }) {
		entity.setPosition(-6, 3, 30);
		entity.setRotation(0, -0.25, 0);
	},
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


let lastMovement = new Vector3();
let moving = false;
const actor = Actor({
	animations: ['playground/idle.fbx', 'playground/run.fbx'],
	static: false,
	setup({ entity, globals }) {
		entity.setPosition(0, 4, 0);
		entity.animate(0);
	},
	update({ delta, entity, inputs, globals, camera }) {
		const { horizontal, vertical } = inputs[0];
		let movement = new Vector3();
		movement.setX(horizontal * 5);
		movement.setZ(vertical * 5);

		const { camera: threeCamera } = camera;

		const forward = new Vector3(0, 0, 1).applyQuaternion(threeCamera.quaternion);
		const right = new Vector3(1, 0, 0).applyQuaternion(threeCamera.quaternion);

		// const { x: ex, y: ey, z: ez } = entity.getPosition();
		if (Math.abs(horizontal) > 0.2 || Math.abs(vertical) > 0.2) {
			moving = true;
			const deltaVector = new Vector3(movement.x, 0, movement.z)
				.addScaledVector(right, movement.x)
				.addScaledVector(forward, movement.z);
			entity.moveXZ(deltaVector.x, deltaVector.z);
			lastMovement = movement;
		} else {
			moving = false;
			entity.resetVelocity();
		}
		// const { x: ex, y: ey, z: ez } = entity.getPosition();
		// if (Math.abs(horizontal) > 0.1 || Math.abs(vertical) > 0.1) {
		// 	moving = true;
		// 	const deltaVector = new Vector3(ex, ey, ez)
		// 		.addScaledVector(right, movement.x * delta)
		// 		.addScaledVector(forward, movement.z * delta);
		// 	entity.setPosition(deltaVector.x, ey, deltaVector.z);
		// 	lastMovement = movement;
		// } else {
		// 	moving = false;
		// }
		if (moving) {
			entity.animate(1);
		} else {
			entity.animate(0);
		}
		entity.rotateInDirection(lastMovement);
	},
});

export function LevelOne(): ZylemStage {
	return {
		perspective: PerspectiveType.ThirdPerson,
		backgroundColor: new Color('#554400'),
		gravity: new Vector3(0, -9, 0),
		setup: ({ camera }) => {
			camera.moveCamera(new Vector3(0, 5, 0));
			camera.target = actor;
		},
		update({ inputs }) {
			// console.log(inputs);
			// CharacterController(actor);
		},
		children: ({ }) => {
			return [
				actor,
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

Game({
	// gameOptions
})
	.stages()
	.start()
	.end()

Stage({
	// stageOptions
	
})
	.children()
	.start()
	.setup()
	.update()
	.end()

Box({
	// Box options
})
	.setup((params) => {

	})
	.update((params) => {

	})
	.destroy((params) => {

	})

Game({
	globals: {
		score: 0,
		lives: 3,
		time: 0,
		actualTime: 0,
	},
	stages: [
		Stage({
			perspective: PerspectiveType.ThirdPerson,
			backgroundColor: new Color('#554400'),
			gravity: new Vector3(0, -1, 0),
			children: [
				Actor({
					animations: ['playground/run.fbx'],
					setup({ entity, globals }) {
						entity.setPosition(pos.x, pos.y, pos.z);
						entity.animate(0);
					}
				}),
				Plane({
					tile: new Vector2(50, 80),
					repeat: new Vector2(4, 6),
					static: true,
					texture: 'playground/grass.jpg',
				});
			]
		})
	]
})






 */

/**
 * 
 * Game()
 * Stage()
 * Act()
 * 
 */