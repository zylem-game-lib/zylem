/**
 * Ground plane and animated actor shared by several exhibits, copied from
 * `src/utils.ts` in the examples repo.
 */
import { createActor, createPlane } from '@zylem/game-lib/entity';
import { Color } from 'three';

import { demoAsset } from '../../assets/manifest';

const grass = demoAsset('general/texture-grass.jpg');
const dirt = demoAsset('general/texture-dirt.png');
const wood = demoAsset('general/texture-wood-box.jpg');
const mars = demoAsset('general/texture-mars-surface.jpg');
const steel = demoAsset('general/texture-steel.png');

const playerIdle = demoAsset('general/player/idle.fbx');
const playerWalking = demoAsset('general/player/walking.fbx');
const playerRunning = demoAsset('general/player/running.fbx');
const playerJumpingUp = demoAsset('general/player/jumping-up.fbx');
const playerJumpingDown = demoAsset('general/player/jumping-down.fbx');

const mascotIdle = demoAsset('general/mascot/idle.fbx');
const mascotRun = demoAsset('general/mascot/run.fbx');

export type PlaygroundPlaneType = 'grass' | 'dirt' | 'wood' | 'mars' | 'steel';

const planeTypeToPath: Record<PlaygroundPlaneType, string> = {
	grass: grass,
	dirt: dirt,
	wood: wood,
	mars: mars,
	steel: steel,
};

export const playgroundPlane: any = (
	type: PlaygroundPlaneType,
	size: { x: number; y: number } = { x: 100, y: 100 },
) => {
	const repeatX = size.x / 40;
	const repeatY = size.y / 40;

	return createPlane({
		tile: size,
		collision: { static: true },
		material: {
			path: planeTypeToPath[type],
			repeat: { x: repeatX, y: repeatY },
		},
		position: { x: 0, y: -4, z: 0 },
		randomizeHeight: true,
	});
};

export type PlaygroundActorType = 'player' | 'mascot';

const actorTypeToPath: Record<PlaygroundActorType, string> = {
	player: playerIdle,
	mascot: mascotIdle,
};

const actorTypeToAnimations: Record<PlaygroundActorType, string[]> = {
	player: ['idle', 'walking', 'running', 'jumping-up', 'jumping-down'],
	mascot: ['idle', 'run'],
};

const animationMap: Record<PlaygroundActorType, Record<string, string>> = {
	player: {
		idle: playerIdle,
		walking: playerWalking,
		running: playerRunning,
		'jumping-up': playerJumpingUp,
		'jumping-down': playerJumpingDown,
	},
	mascot: {
		idle: mascotIdle,
		run: mascotRun,
	},
};

const actorTypeToScale: Record<PlaygroundActorType, { x: number; y: number; z: number }> = {
	player: { x: 0.02, y: 0.02, z: 0.02 },
	mascot: { x: 1, y: 1, z: 1 },
};

const actorTypeToCollision: Record<PlaygroundActorType, any> = {
	player: { size: { x: 1, y: 3.8, z: 0.5 }, static: false },
	mascot: { size: { x: 2, y: 3, z: 0 }, position: { x: 0, y: 1.2, z: 0 }, static: false },
};

export const playgroundActor: any = (
	type: PlaygroundActorType,
	color?: Color,
	position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
) => {
	return createActor({
		position,
		scale: actorTypeToScale[type],
		models: [actorTypeToPath[type]],
		animations: actorTypeToAnimations[type].map((animation) => ({
			key: animation,
			path: animationMap[type][animation]!,
		})),
		stripRootMotionY: true,
		material: {
			color: color ?? new Color(Color.NAMES.lightgreen),
		},
		collision: actorTypeToCollision[type],
		collisionShape: 'capsule',
	});
};

export const playgroundActorFactory = (type: PlaygroundActorType) => {
	return () => playgroundActor(type);
};
