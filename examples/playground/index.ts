import { Color, Vector2, Vector3 } from "three";
import { game, stage, actor, box, plane, sphere, zone, Perspectives, Zylem } from "../../src/main";
import { node } from "../../src/lib/entities";

const { actionOnRelease, actionWithCooldown, actionOnPress } = Zylem.Util;
const { ThirdPerson } = Perspectives;

const box1 = box({
	texture: 'playground/wood-box.jpg',
	setup({ entity }) {
		entity.setPosition(9, 3, 30);
		entity.setRotation(14, 16, 4);
	},
});


const nodeTest = node(
	box({
		texture: 'playground/wood-box.jpg',
		setup({ entity }) {
			entity.setPosition(0, 3, 30);
			entity.setRotation(0, 16, 4);
		},
	}),
	box({
		texture: 'playground/grass-normal.png',
		setup({ entity }) {
			entity.setPosition(4, 3, 30);
			entity.setRotation(4, 16, 4);
		},
	})
);

const zone1 = zone({
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

const ground = plane({
	tile: new Vector2(200, 200),
	repeat: new Vector2(4, 6),
	static: true,
	texture: 'playground/grass.jpg',
});

const sphere1 = sphere({
	radius: 2,
	texture: 'playground/rain-man.png',
	setup({ entity }) {
		entity.setPosition(-6, 3, 30);
		entity.setRotation(0, -0.25, 0);
	},
});

let lastMovement = new Vector3();
let moving = false;
const actorFactory = (positionX, positionZ = 0, index = 0) => {
	return actor({
		name: `player-${index}`,
		animations: ['playground/idle.fbx', 'playground/run.fbx'],
		static: false,
		setup({ entity, HUD }) {
			entity.setPosition(positionX, 4, positionZ);
			entity.animate(0);
		},
		update({ entity, inputs, camera }) {
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

const actor1 = actorFactory(0, -10);
const actor2 = actorFactory(17, 10);
const actor3 = actorFactory(-17, 10);
const actor4 = actorFactory(-10, 10);
const actor5 = actorFactory(-20, 10);
const actor6 = actorFactory(-10, 0);

let cameraIndex = 0;
let targets = [actor1, actor2, actor3, actor4,
	actor5,
	actor6,];

const testSpike = actor({
	models: ['playground/spike.gltf'],
	static: true,
	collision: (spike, other, globals) => {
		const { health } = globals;
		if (other.name.includes('player')) {
			const newHealth = Math.max(health.get() - 10, 0);
			health.set(newHealth);
		}
	}
});

const testHealth = actor({
	models: ['playground/health-box.gltf'],
	static: true,
	setup: ({ entity }) => {
		entity.setPosition(10,2,2);
	},
	collision: (healthBox, other, globals) => {
		const { health, maxHealth } = globals;
		if (other.name.includes('player')) {
			const newHealth = Math.min(health.get() + 20, maxHealth.get());
			health.set(newHealth);
		}
	}
});


const stage1 = stage({
	perspective: ThirdPerson,
	backgroundColor: new Color('#88BBFF'),
	gravity: new Vector3(0, -9, 0),
	setup: ({ camera, HUD }) => {
		camera.moveCamera(new Vector3(0, 8, 10));
		camera.target = actor1 as any;
		HUD.addText('0', {
			binding: 'score',
			update: (element, value) => {
				element.updateText(`Score: ${value}`);
			},
			position: new Vector2(420, 30)
		});
		HUD.addBar({
			bindings: ['health', 'maxHealth'],
			update: (element, value) => {
				element.updateBar(value);
			}
		});
		HUD.addLabel({
			style: {
				fontSize: 16,
				fill: 0xFFFFFF,
			},
			position: new Vector2(24, 22),
			binding: 'health',
			update: (element, value) => {
				if (value < 500 ) {
					element.updateText(`Health is geting low! ${value}`);
				} else {
					element.updateText(`Health: ${value}`);
				}
			}
		});
	},
	update: ({ camera, inputs }) => {
		const { buttonB, buttonA } = inputs[0];

		actionOnPress(buttonB, () => {
			cameraIndex++;
			if (cameraIndex > targets.length - 1) {
				cameraIndex = 0;
			}
			camera.target = targets[cameraIndex] as any;
			console.log('start cooldown')
			actionWithCooldown({ timer: 5000, immediate: false }, () => {
				console.log('5 sec cooldown')
			}, () => {

			});
		});

		actionOnRelease(buttonA, () => {
			actor1.moveY(100);
		});
	},
	children: () => {
		return [
			actor1,
			actor2,
			actor3,
			actor4,
			actor5,
			actor6,
			testSpike,
			testHealth,
			box1,
			...nodeTest,
			sphere1,
			ground,
			zone1,
		]
	},
});

const config = {
	id: 'playground',
	debug: false,
	debugConfiguration: {},
	globals: {
		score: 0,
		health: 1000,
		maxHealth: 1000,
		lives: 3,
		time: 0,
		actualTime: 0,
	},
};

const playground = game(
	config,
	stage1
);

playground.start();