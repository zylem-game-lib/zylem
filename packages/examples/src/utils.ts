/// <reference types="@zylem/assets" />
// import type { CollisionOptions } from "@zylem/game-lib";
import type { ZylemBox } from "@zylem/game-lib";
import { actor, box, plane } from "@zylem/game-lib";
import { Color, Vector2, Vector3 } from "three";

import grass from '@zylem/assets/3d/textures/grass.jpg';
import dirt from '@zylem/assets/3d/textures/dirt.png';
import wood from '@zylem/assets/3d/textures/wood-box.jpg';
import mars from '@zylem/assets/3d/textures/mars-surface.jpg';
import steel from '@zylem/assets/3d/textures/steel.png';

import player from '@zylem/assets/3d/player/idle.fbx';
import playerWalking from '@zylem/assets/3d/player/walking.fbx';
import playerRunning from '@zylem/assets/3d/player/running.fbx';
import playerJumpingUp from '@zylem/assets/3d/player/jumping-up.fbx';
import playerJumpingDown from '@zylem/assets/3d/player/jumping-down.fbx';
import playerIdle from '@zylem/assets/3d/player/idle.fbx';

import mascotIdle from '@zylem/assets/3d/mascot/idle.fbx';
import mascotRun from '@zylem/assets/3d/mascot/run.fbx';

export type PlaygroundPlaneType = 'grass' | 'dirt' | 'wood' | 'mars' | 'steel';

const planeTypeToPath: Record<PlaygroundPlaneType, string> = {
	grass: grass,
	dirt: dirt,
	wood: wood,
	mars: mars,
	steel: steel
};

export const playgroundPlane: any = async (type: PlaygroundPlaneType, size: Vector2 = new Vector2(100, 100)) => {
	const repeatX = size.x / 40;
	const repeatY = size.y / 40;

	return await plane({
		tile: size,
		collision: { static: true },
		material: {
			path: planeTypeToPath[type],
			repeat: new Vector2(repeatX, repeatY)
		},
		randomizeHeight: true,
	});
}

export type PlaygroundActorType = 'player' | 'mascot';

const actorTypeToPath: Record<PlaygroundActorType, string> = {
	player: player,
	mascot: mascotIdle
};

const actorTypeToAnimations: Record<PlaygroundActorType, string[]> = {
	player: ['idle', 'walking', 'running', 'jumping-up', 'jumping-down'],
	mascot: ['idle', 'run']
};

const animationMap: Record<PlaygroundActorType, Record<string, string>> = {
	player: {
		idle: playerIdle,
		walking: playerWalking,
		running: playerRunning,
		"jumping-up": playerJumpingUp,
		"jumping-down": playerJumpingDown
	},
	mascot: {
		idle: mascotIdle,
		run: mascotRun
	}
};

const actorTypeToScale: Record<PlaygroundActorType, Vector3> = {
	player: new Vector3(0.02, 0.02, 0.02),
	mascot: new Vector3(1, 1, 1)
};

const actorTypeToCollision: Record<PlaygroundActorType, any> = {
	player: { size: new Vector3(0.8, 0.8, 0.8), position: new Vector3(0, 0, 0), static: false },
	mascot: { size: new Vector3(0.5, 0.5, 0.5), position: new Vector3(0, 0, 0), static: false }
};

export const playgroundActor: any = async (type: PlaygroundActorType) => {
	return await actor({
		position: { x: 0, y: 10, z: 4 },
		scale: actorTypeToScale[type],
		models: [actorTypeToPath[type]],
		animations: actorTypeToAnimations[type].map(animation => ({ key: animation, path: animationMap[type][animation]! })),
		material: {
			color: new Color(Color.NAMES.lightgreen),
		},
		collision: actorTypeToCollision[type],
	});
}

export const playgroundPlatforms = async () => {
	const boxes: ZylemBox[] = [];

	// Create a starting platform
	const startPlatform = await box({
		position: { x: 0, y: 1, z: 0 },
		size: { x: 6, y: 0.5, z: 4 },
		collision: { static: true },
		material: {
			path: steel,
		}
	});

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
				path: steel,
			}
		}));
	}

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
					path: steel,
				}
			}));
		}

		loopPlatforms.push(await box({
			position: { x: x, y: loopHeight, z: z - 6 },
			size: { x: width, y: 0.5, z: depth },
			collision: { static: true },
			material: {
				path: steel,
			}
		}));
	}

	boxes.push(startPlatform, ...jumpPlatforms, ...loopPlatforms);

	return boxes;
};

// const cargoContainer = await actor({
// 	position: { x: 20, y: 10, z: 4 },
// 	scale: { x: 0.02, y: 0.02, z: 0.02 },
// 	models: ['playground/cargo-container/Cargo-Container.gltf'],
// 	animations: [
// 		{ key: 'idle', path: 'playground/cargo-container/Cargo-Container.gltf' },
// 	],
// });