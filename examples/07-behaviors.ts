/// <reference types="@zylem/assets" />

import { ArrowHelper, Vector3 } from 'three';
import { game, stage, zone } from '../src/main';
import { rotateInDirection } from '../src/lib/actions/capabilities/rotatable';
import { move, resetVelocity } from '../src/lib/actions/capabilities/moveable';
import { Ray } from '@dimforge/rapier3d-compat';
import { playgroundPlane, playgroundActor, playgroundPlatforms } from './utils';
import { StageEntity } from '../src/lib/interfaces/entity';
import skybox from '@zylem/assets/3d/skybox/default.png';

const stage1 = await stage({
	gravity: new Vector3(0, -9.82, 0),
	backgroundImage: skybox,
});

const groundPlane = await playgroundPlane('dirt');
const player = await playgroundActor('player');
const platforms = await playgroundPlatforms();
const startingZone = await zone({
	position: { x: 0, y: 0, z: 0 },
	size: new Vector3(10, 10, 10),
	onEnter: ({ self, visitor, globals }) => {
		// testGame.log(`${visitor.uuid} entered the starting zone 🚶‍♂️`);
	},
	onExit: ({ self, visitor, globals }) => {
		// testGame.log(`${visitor.uuid} exited the starting zone 🚶‍♂️`);
	},
});

const endingZone = await zone({
	position: { x: 0, y: 20, z: 0 },
	size: new Vector3(10, 10, 10),
	onEnter: ({ self, visitor, globals }) => {
		// testGame.log(`${visitor.uuid} entered the ending zone ⛳️`);
	},
	onExit: ({ self, visitor, globals }) => {
		// testGame.log(`${visitor.uuid} exited the ending zone ⛳️`);
	},
});

let counter = 0;
platforms[4].update = ({ delta }) => {
	counter += delta;
	if (counter > 3) {
		// destroy(platforms[4]);
	}
};

platforms[4].destroy = () => {
	// console.log('platform has been destroyed');
};

const testGame = game(
	{
		id: 'behaviors-test',
		debug: true,
		// preset: 'SNES',
		// resolution: '512x448',
	},
	stage1,
	startingZone,
	endingZone,
	groundPlane,
	player,
	...platforms,
);

testGame.start();

let lastMovement = new Vector3();
let playerForce = new Vector3();

let rayLength = 1;
let rapierRay;
let arrow;

let grounded = false;
let jumping = false;
let jumpStart = 5;
const maxJumpHeight = 12;

testGame.setup = ({ camera }) => {
	if (player.group && camera && !camera.target) {
		camera.target = player as unknown as StageEntity;
	}
}

testGame.update = ({ inputs, delta }) => {
	const { p1 } = inputs;

	if (!rapierRay) {
		// Ray casting for ground detection
		// @ts-ignore
		const rayOrigin = player.body.translation();
		const rayDirection = new Vector3(0, -1, 0); // Downward
		rapierRay = new Ray(
			{ x: rayOrigin.x, y: rayOrigin.y, z: rayOrigin.z },
			{ x: rayDirection.x, y: rayDirection.y, z: rayDirection.z }
		);
		arrow = new ArrowHelper(rayDirection, rayOrigin, rayLength, 0xff0000);
		// @ts-ignore
		if (stage1.stageRef!.scene) {
			stage1.stageRef!.scene.scene.add(arrow);
		}
		// @ts-ignore
	}
	// @ts-ignore
	const rayOrigin = player.body.translation();
	const rayDirection = new Vector3(0, -1, 0); // Downward
	rapierRay.origin = rayOrigin;
	rapierRay.direction = rayDirection;
	if (stage1.stageRef!.world) {
		stage1.stageRef!.world.world.castRay(rapierRay, rayLength, true, undefined, undefined, undefined, undefined, (collider) => {
			// @ts-ignore
			const ref = collider._parent.userData.uuid;
			if (ref === player.uuid) {
				return false;
			}
			if (ref !== player.uuid && !jumping) {
				grounded = true;
			}
			return true;
		});
	}

	// Get input values
	const horizontal = p1.axes.Horizontal.value;
	const vertical = p1.axes.Vertical.value;

	// Create movement vectors
	const forward = new Vector3(0, 0, 1);
	const right = new Vector3(1, 0, 0);

	// Calculate movement force
	let moveForce = 12;

	if (p1.shoulders.LTrigger.held > 0 && grounded) {
		moveForce = 24;
	}

	const gravity = 9.82;

	// Reset force vector
	playerForce.set(0, 0, 0);

	// Apply movement forces based on input
	if (Math.abs(horizontal) > 0.2 || Math.abs(vertical) > 0.2) {
		playerForce.addScaledVector(right, horizontal * moveForce);
		playerForce.addScaledVector(forward, vertical * moveForce);
	}

	// Handle jumping
	if (p1.buttons.A.held > 0 && grounded && !jumping) {
		jumping = true;
		jumpStart = maxJumpHeight;
		grounded = false;
	}

	if (jumping) {
		jumpStart -= (delta * maxJumpHeight);
		playerForce.y = jumpStart + maxJumpHeight;
	}

	// Apply gravity if not grounded
	playerForce.y -= gravity;

	if (playerForce.y < -gravity) {
		jumping = false;
	}

	// Apply movement using physics body
	// @ts-ignore
	resetVelocity(player);
	// @ts-ignore
	move(player, playerForce);

	if (grounded) {
		const forceMagnitudeX = Math.abs(playerForce.x);
		const forceMagnitudeZ = Math.abs(playerForce.z);
		const highestForceMagnitude = Math.max(forceMagnitudeX, forceMagnitudeZ);
		if (highestForceMagnitude > 2 && highestForceMagnitude <= 12) {
			player.playAnimation({ key: 'walking' });
		} else if (highestForceMagnitude > 12) {
			player.playAnimation({ key: 'running' });
		} else {
			player.playAnimation({ key: 'idle' });
		}
	} else {
		if (playerForce.y > 5) {
			player.playAnimation({ key: 'jumping-up', pauseAtEnd: true });
		} else if (jumping === false) {
			player.playAnimation({ key: 'jumping-down', pauseAtEnd: true });
		}
	}

	// Store last movement for rotation
	if (Math.abs(horizontal) > 0.2 || Math.abs(vertical) > 0.2) {
		lastMovement = playerForce.clone();
	}

	// Rotate player in movement direction
	// @ts-ignore
	// resetRotation(player);
	// @ts-ignore
	rotateInDirection(player, lastMovement);
};