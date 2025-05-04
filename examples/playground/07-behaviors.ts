import { ArrowHelper, Color, Vector2, Vector3 } from 'three';
import { game, stage, box, plane, actor, zone, sphere } from '../../src/main';
import { ZylemBox } from '../../src/lib/entities/box';
import { ZylemSphere } from '../../src/lib/entities/sphere';
import { RotatableEntity, rotateInDirection } from '../../src/lib/behaviors/rotatable';
import { move } from '../../src/lib/behaviors/moveable';
import { Ray } from '@dimforge/rapier3d-compat';

const groundPlane = await plane({
	tile: new Vector2(100, 100),
	collision: { static: true },
	material: {
		path: 'playground/ground-texture.png',
		repeat: new Vector2(5, 5)
	}
})

const stage1 = await stage({
	gravity: new Vector3(0, -9.82, 0),
	backgroundImage: 'playground/skybox.png',
});

// 'playground/idle.fbx'
const player = await actor({
	position: { x: 0, y: 10, z: 4 },
	scale: { x: 0.02, y: 0.02, z: 0.02 },
	models: ['playground/test-player/idle.fbx'],
	animations: [
		'playground/test-player/idle.fbx',
		'playground/test-player/walking.fbx',
		'playground/test-player/running.fbx',
		'playground/test-player/jumping-up.fbx',
		'playground/test-player/jumping-down.fbx',
	],
	material: {
		color: new Color(Color.NAMES.lightgreen),
	}
});

const spheres: ZylemSphere[] = [];

for (let i = 0; i < 100; i++) {
	const colorkeys = Object.keys(Color.NAMES);
	const randomColor = colorkeys[Math.floor(Math.random() * colorkeys.length)];
	let myMaterial = {};
	if (Math.random() > 0.5) {
		myMaterial = { shader: 'star' };
	} else {
		myMaterial = { shader: 'standard', color: new Color(randomColor) };
	}
	spheres.push(await sphere({
		position: { x: Math.random() * 25 - 12.5, y: Math.random() * 20, z: Math.random() * 25 - 12.5 },
		radius: 0.3,
		material: myMaterial,
	}));
}

const startingZone = await zone({
	position: { x: 0, y: 0, z: 0 },
	size: new Vector3(10, 10, 10),
	onEnter: ({ self, visitor, globals }) => {
		testGame.log(`${visitor.uuid} entered the starting zone 🚶‍♂️`);
	},
	onExit: ({ self, visitor, globals }) => {
		testGame.log(`${visitor.uuid} exited the starting zone 🚶‍♂️`);
	},
});

const endingZone = await zone({
	position: { x: 0, y: 20, z: 0 },
	size: new Vector3(10, 10, 10),
	onEnter: ({ self, visitor, globals }) => {
		testGame.log(`${visitor.uuid} entered the ending zone ⛳️`);
	},
	onExit: ({ self, visitor, globals }) => {
		testGame.log(`${visitor.uuid} exited the ending zone ⛳️`);
	},
});

const boxes: ZylemBox[] = [];

// Create a starting platform
const startPlatform = await box({
	position: { x: 0, y: 1, z: 0 },
	size: { x: 6, y: 0.5, z: 4 },
	collision: { static: true },
	material: {
		path: 'playground/steel.png',
	}
});

// Create a series of ascending platforms for the player to jump on
// Some platforms are connected to create more interesting paths
const platformConfigs = [
	// First set - connected platforms forming a staircase
	{ x: 8, y: 3, z: 0, width: 6, depth: 4 },
	{ x: 12, y: 4, z: 1, width: 4, depth: 3 },
	{ x: 16, y: 5, z: 2, width: 5, depth: 5 },

	// Second set - larger isolated platform
	{ x: 8, y: 7, z: 4, width: 8, depth: 6 },

	// Third set - connected narrow bridge
	{ x: 0, y: 9, z: 6, width: 10, depth: 2 },
	{ x: -8, y: 9, z: 6, width: 8, depth: 2 },

	// Fourth set - varying sizes
	{ x: -16, y: 13, z: 2, width: 7, depth: 4 },
	{ x: -8, y: 15, z: 0, width: 3, depth: 8 },

	// Fifth set - connected L-shape
	{ x: 0, y: 17, z: -2, width: 6, depth: 3 },
	{ x: 4, y: 17, z: -4, width: 3, depth: 5 }
];

const jumpPlatforms: ZylemBox[] = [];
for (const config of platformConfigs) {
	jumpPlatforms.push(await box({
		position: { x: config.x, y: config.y, z: config.z },
		size: { x: config.width, y: 0.5, z: config.depth },
		collision: { static: true },
		material: {
			path: 'playground/steel.png',
		}
	}));
}

// Create some loop platforms at the top with varying sizes
const loopRadius = 12;
const loopHeight = 21;
const loopSegments = 8;
const loopPlatforms: ZylemBox[] = [];

for (let i = 0; i < loopSegments; i++) {
	const angle = (i / loopSegments) * Math.PI * 2;
	const x = Math.cos(angle) * loopRadius;
	const z = Math.sin(angle) * loopRadius;

	// Vary platform sizes based on position in the loop
	const width = 3 + Math.sin(angle * 2) * 2; // Varies between 1-5
	const depth = 2 + Math.cos(angle * 3) * 1.5; // Varies between 0.5-3.5

	// Connect some adjacent platforms in the loop
	if (i % 2 === 0 && i < loopSegments - 1) {
		// Create a connecting platform between this and the next platform
		const nextAngle = ((i + 1) / loopSegments) * Math.PI * 2;
		const nextX = Math.cos(nextAngle) * loopRadius;
		const nextZ = Math.sin(nextAngle) * loopRadius;

		// Calculate midpoint for the connecting platform
		const midX = (x + nextX) / 2;
		const midZ = (z + nextZ) / 2;

		loopPlatforms.push(await box({
			position: { x: midX, y: loopHeight, z: midZ - 6 },
			size: { x: 2, y: 0.5, z: 2 },
			collision: { static: true },
			material: {
				path: 'playground/steel.png',
			}
		}));
	}

	loopPlatforms.push(await box({
		position: { x: x, y: loopHeight, z: z - 6 },
		size: { x: width, y: 0.5, z: depth },
		collision: { static: true },
		material: {
			path: 'playground/steel.png',
		}
	}));
}

boxes.push(startPlatform, ...jumpPlatforms, ...loopPlatforms);

const testGame = game(
	{
		debug: true,
		behaviors: [
			// moveable,
		],
	},
	stage1,
	startingZone,
	endingZone,
	groundPlane,
	player,
	...spheres,
	...boxes
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
	// Initialize camera target if not set
	if (player.group && camera && !camera.target) {
		camera.target = player;
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
		stage1.scene.scene.add(arrow);
		// @ts-ignore
	}
	// @ts-ignore
	const rayOrigin = player.body.translation();
	const rayDirection = new Vector3(0, -1, 0); // Downward
	rapierRay.origin = rayOrigin;
	rapierRay.direction = rayDirection;
	stage1.world!.world.castRay(rapierRay, rayLength, true, undefined, undefined, undefined, undefined, (collider) => {
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

	// Get input values
	const horizontal = p1.axes.Horizontal.value;
	const vertical = p1.axes.Vertical.value;

	// Create movement vectors
	const forward = new Vector3(0, 0, -1);
	const right = new Vector3(-1, 0, 0);

	// Calculate movement force
	const moveForce = 12;

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
	move(player, playerForce);

	if (grounded) {
		if (playerForce.x > 2 || playerForce.x < -2 || playerForce.z > 2 || playerForce.z < -2) {
			player.playAnimation(1);
		} else {
			player.playAnimation(0);
		}
	} else {
		if (playerForce.y > 5) {
			player.playAnimation(3);
		} else if (playerForce.y < -10) {
			player.playAnimation(4);
		}
	}

	// Store last movement for rotation
	if (Math.abs(horizontal) > 0.2 || Math.abs(vertical) > 0.2 || jumping) {
		lastMovement = playerForce.clone();
	}

	// Rotate player in movement direction
	// @ts-ignore
	rotateInDirection(player, lastMovement);
};