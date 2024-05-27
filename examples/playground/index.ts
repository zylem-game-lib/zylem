import { Color, Vector2, Vector3 } from "three";
import { PerspectiveType } from "../../src/lib/interfaces/perspective";
import { Zylem } from "../../src/main";
import { Actor, Box, Plane, Sphere, Sprite, Zone } from "../../src/lib/entities";
import { Stage } from "../../src/lib/core/stage";
import { actionOnRelease, actionWithCooldown } from "../../src/lib/behaviors/actions";

const { Game, Util } = Zylem;
const { actionOnPress } = Util;

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
	tile: new Vector2(200, 200),
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
	},
});


let lastMovement = new Vector3();
let moving = false;
const actorFactory = (positionX, positionZ = 0) => {
	return Actor({
		animations: ['playground/idle.fbx', 'playground/run.fbx'],
		static: false,
		setup({ entity, globals }) {
			entity.setPosition(positionX, 4, positionZ);
			entity.animate(0);
		},
		update({ delta, entity, inputs, globals, camera }) {
			let { horizontal, vertical } = inputs[0];
			const { camera: threeCamera } = camera;
			if (camera?.target?.uuid !== entity.uuid) {
				horizontal = 0;
				vertical = 0;
			}

			let movement = new Vector3();
			movement.setX(horizontal * 12);
			movement.setZ(vertical * 12);

			const forward = new Vector3(0, 0, 1).applyQuaternion(threeCamera.quaternion);
			const right = new Vector3(1, 0, 0).applyQuaternion(threeCamera.quaternion);

			if (Math.abs(horizontal) > 0.2 || Math.abs(vertical) > 0.2) {
				moving = true;
				const deltaVector = new Vector3(movement.x, -9, movement.z)
					.addScaledVector(right, movement.x)
					.addScaledVector(forward, movement.z);
				entity.moveEntity(deltaVector);
				lastMovement = movement;
			} else {
				moving = false;
				const deltaVector = new Vector3(0, -9, 0);
				entity.moveEntity(deltaVector);
			}
			if (moving) {
				entity.animate(1);
			} else {
				entity.animate(0);
			}
			entity.rotateInDirection(lastMovement);
		},
		collision: function (entity: any, other: any, globals?: any): void {
			throw new Error("Function not implemented.");
		}
	})
}

const actor = actorFactory(0, 0);
const actor2 = actorFactory(15, 10);
const actor3 = actorFactory(-15, 10);

let cameraIndex = 0;
let targets = [actor, actor2, actor3];

const stage = Stage({
	perspective: PerspectiveType.ThirdPerson,
	backgroundColor: new Color('#88BBFF'),
	gravity: new Vector3(0, -9, 0),
	setup: ({ camera }) => {
		camera.moveCamera(new Vector3(0, 8, 10));
		camera.target = actor;
	},
	update: ({ camera, inputs }) => {
		const { buttonB, buttonA } = inputs[0];

		actionOnPress(buttonB, () => {
			cameraIndex++;
			if (cameraIndex > 2) {
				cameraIndex = 0;
			}
			camera.target = targets[cameraIndex];
			console.log('start cooldown')
			actionWithCooldown({ timer: 5000, immediate: false }, () => {
				console.log('5 sec cooldown')
			}, () => {

			});
		});

		actionOnRelease(buttonA, () => {
			actor.moveY(100);
		});
	},
	children: () => {
		return [
			actor,
			actor2,
			actor3,
			box,
			sphere,
			sprite,
			ground,
			zone,
		]
	},
})

const game = Game({
	id: 'playground',
	globals: {
		score: 0,
		lives: 3,
		time: 0,
		actualTime: 0,
	},
	stages: [stage]
});

game.start();