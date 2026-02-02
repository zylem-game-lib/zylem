/// <reference types="@zylem/assets" />
// import type { CollisionOptions } from "@zylem/game-lib";
import type { ZylemBox } from "@zylem/game-lib";
import { createActor, createBox, createPlane, makeTransformable } from "@zylem/game-lib";
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

export const playgroundPlane: any = (type: PlaygroundPlaneType, size: Vector2 = new Vector2(100, 100)) => {
	const repeatX = size.x / 40;
	const repeatY = size.y / 40;

	return createPlane({
		tile: size,
		collision: { static: true },
		material: {
			path: planeTypeToPath[type],
			repeat: new Vector2(repeatX, repeatY)
		},
		position: { x: 0, y: -4, z: 0 },
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

export const playgroundActor: any = (type: PlaygroundActorType) => {
	return makeTransformable(createActor({
		position: { x: 0, y: 10, z: 4 },
		scale: actorTypeToScale[type],
		models: [actorTypeToPath[type]],
		animations: actorTypeToAnimations[type].map(animation => ({ key: animation, path: animationMap[type][animation]! })),
		material: {
			color: new Color(Color.NAMES.lightgreen),
		},
		collision: actorTypeToCollision[type],
	}));
}

/**
 * Platform shape definitions for the platformer course
 */
const platformShapes = {
	// Long thin platform for bridges
	longPlank: { x: 8, y: 0.5, z: 2 },
	// Small square platform
	square: { x: 3, y: 0.5, z: 3 },
	// Larger square platform
	largeSquare: { x: 6, y: 0.5, z: 6 },
	// Tall box (can jump on top)
	box: { x: 3, y: 3, z: 3 },
	// Medium height box
	mediumBox: { x: 4, y: 2, z: 4 },
};

type PlatformShape = keyof typeof platformShapes;

interface PlatformConfig {
	shape: PlatformShape;
	position: { x: number; y: number; z: number };
}

export const playgroundPlatforms = () => {
	const boxes: ZylemBox[] = [];

	// Starting platform - large square at ground level
	const startPlatform = createBox({
		position: { x: 0, y: 1, z: 0 },
		size: platformShapes.largeSquare,
		collision: { static: true },
		material: { path: steel }
	});

	// Course layout - platforms arranged in the center area (-30 to 30 range)
	// leaving ~20 units of empty space on borders of 100x100 ground plane
	const courseConfigs: PlatformConfig[] = [
		// Path 1: Staircase of boxes going up
		{ shape: 'mediumBox', position: { x: 8, y: 0, z: 0 } },
		{ shape: 'box', position: { x: 12, y: 0, z: -4 } },
		{ shape: 'square', position: { x: 16, y: 4, z: -4 } },
		
		// Path 2: Long plank bridge to side area
		{ shape: 'longPlank', position: { x: 0, y: 3, z: -8 } },
		{ shape: 'square', position: { x: -8, y: 3, z: -8 } },
		{ shape: 'mediumBox', position: { x: -12, y: 0, z: -8 } },
		
		// Central tower area
		{ shape: 'largeSquare', position: { x: 0, y: 6, z: 0 } },
		{ shape: 'box', position: { x: 0, y: 6.5, z: 12 } },
		{ shape: 'square', position: { x: 0, y: 10, z: 8 } },
		
		// Left wing
		{ shape: 'longPlank', position: { x: -10, y: 8, z: 4 } },
		{ shape: 'square', position: { x: -18, y: 8, z: 4 } },
		{ shape: 'mediumBox', position: { x: -22, y: 0, z: 4 } },
		{ shape: 'square', position: { x: -22, y: 4, z: 8 } },
		
		// Right wing
		{ shape: 'longPlank', position: { x: 10, y: 8, z: 4 } },
		{ shape: 'largeSquare', position: { x: 18, y: 8, z: 4 } },
		{ shape: 'box', position: { x: 22, y: 0, z: 0 } },
		
		// Upper level connecting bridges
		{ shape: 'longPlank', position: { x: -8, y: 12, z: 0 } },
		{ shape: 'longPlank', position: { x: 8, y: 12, z: 0 } },
		{ shape: 'largeSquare', position: { x: 0, y: 14, z: 0 } },
		
		// Scattered stepping stones
		{ shape: 'square', position: { x: -15, y: 5, z: -15 } },
		{ shape: 'square', position: { x: -10, y: 6, z: -18 } },
		{ shape: 'square', position: { x: -5, y: 7, z: -22 } },
		{ shape: 'mediumBox', position: { x: 0, y: 0, z: -30 } },
		
		// Back corner area
		{ shape: 'box', position: { x: 15, y: 0, z: -15 } },
		{ shape: 'square', position: { x: 15, y: 5, z: -20 } },
		{ shape: 'longPlank', position: { x: 20, y: 6, z: -15 } },
	];

	// Create all platforms from configs
	for (const [i, config] of courseConfigs.entries()) {
		const size = platformShapes[config.shape];
		boxes.push(createBox({
			name: `${config.shape}-${i}`,
			position: config.position,
			size,
			collision: { static: true },
			material: { path: steel }
		}));
	}

	boxes.push(startPlatform);
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