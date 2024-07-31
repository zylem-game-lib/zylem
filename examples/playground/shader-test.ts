import { Color, Vector2, Vector3 } from 'three';
import { Perspectives, game, stage } from '../../src/main';
import { actor, plane, sphere } from '../../src/lib/entities';
import { GameEntity } from '../../src/lib/core';

const player = actor({
	name: `player`,
	animations: ['playground/idle.fbx', 'playground/run.fbx'],
	static: false,
	custom: {
		moving: false,
		lastMovement: new Vector3()
	},
	setup({ entity, HUD }) {
		entity.setPosition(0, 4, 0);
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
			entity.moving = true;
			const deltaVector = new Vector3(movement.x, -9, movement.z)
				.addScaledVector(right, movement.x)
				.addScaledVector(forward, movement.z);
			entity.moveEntity(deltaVector);
			entity.lastMovement = movement;
		} else {
			entity.moving = false;
			const deltaVector = new Vector3(0, -9, 0);
			entity.moveEntity(deltaVector);
		}
		if (entity.moving) {
			entity.animate(1);
		} else {
			entity.animate(0);
		}
		entity.rotateInDirection(entity.lastMovement);
	},
	collision: function (entity: any, other: any, globals?: any): void {
		throw new Error("Function not implemented.");
	}
})

const shaderTest = game({
	id: 'playground',
	globals: {
		health: 100,
		maxHealth: 100
	},
	stages: [
		stage({
			perspective: Perspectives.ThirdPerson,
			backgroundColor: new Color('#000000'),
			gravity: new Vector3(0, -9, 0),
			setup: ({ HUD, camera }) => {
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
						element.updateText(`Health: ${value}`);
					}
				});
				camera.moveCamera(new Vector3(0, 8, 10));
				camera.target = player as any;
			},
			update: ({ camera }) => {
				camera.target = player as any;
			},
			children: () => {
				return [
					plane({
						tile: new Vector2(200, 200),
						repeat: new Vector2(4, 6),
						static: true,
						shader: 'star',
						texture: 'playground/wood-box.jpg',
					}),
					// TODO: figure out why TS doesn't think ZylemActor inherits GameEntity
					player as unknown as GameEntity<any>,
					sphere({
						radius: 3,
						color: new Color(Color.NAMES.yellow),
						shader: 'fire',
						setup: ({ entity }) => {
							entity.setPosition(5, 6, 0)
						}
					}),
					sphere({
						radius: 2,
						texture: 'playground/grass-normal.png',
						setup: ({ entity }) => {
							entity.setPosition(-5, 6, 0)
						}
					})
					
				]
			}
		})
	]
});

shaderTest.start();