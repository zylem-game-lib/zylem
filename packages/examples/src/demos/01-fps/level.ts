/// <reference types="@zylem/assets" />

import { box, plane, zone } from '@zylem/game-lib';
import { Vector2, Vector3, Color } from 'three';

import steel from '@zylem/assets/3d/textures/steel.png';
import wood from '@zylem/assets/3d/textures/wood-box.jpg';

// Floor
export const createFloor = async () => {
	return await plane({
		tile: new Vector2(50, 50),
		position: { x: 0, y: 0, z: 0 },
		collision: { static: true },
		material: {
			path: steel,
			repeat: new Vector2(10, 10),
		},
	});
};

// Wall segment
export const createWall = async (
	position: Vector3,
	size: Vector3,
	rotation: number = 0
) => {
	return await box({
		name: 'wall',
		position: { x: position.x, y: position.y, z: position.z },
		size,
		collision: { static: true },
		material: {
			path: wood,
			repeat: new Vector2(size.x / 2, size.y / 2),
		},
	});
};

// Create a simple arena-style level
export const createArenaLevel = async () => {
	const walls: any[] = [];
	const wallHeight = 4;
	const wallThickness = 0.5;
	const arenaSize = 25;

	// North wall
	walls.push(await createWall(
		new Vector3(0, wallHeight / 2, arenaSize),
		new Vector3(arenaSize * 2, wallHeight, wallThickness)
	));

	// South wall
	walls.push(await createWall(
		new Vector3(0, wallHeight / 2, -arenaSize),
		new Vector3(arenaSize * 2, wallHeight, wallThickness)
	));

	// East wall
	walls.push(await createWall(
		new Vector3(arenaSize, wallHeight / 2, 0),
		new Vector3(wallThickness, wallHeight, arenaSize * 2)
	));

	// West wall
	walls.push(await createWall(
		new Vector3(-arenaSize, wallHeight / 2, 0),
		new Vector3(wallThickness, wallHeight, arenaSize * 2)
	));

	// Some cover obstacles in the arena
	walls.push(await createWall(
		new Vector3(5, 0, 5),
		new Vector3(3, 2, 3)
	));

	walls.push(await createWall(
		new Vector3(-8, 0, -3),
		new Vector3(4, 2, 2)
	));

	walls.push(await createWall(
		new Vector3(10, 0, -10),
		new Vector3(2, 2, 5)
	));

	walls.push(await createWall(
		new Vector3(-12, 0, 8),
		new Vector3(5, 2, 2)
	));

	return walls;
};

// Spawn point zone
export const createSpawnZone = async (position: Vector3, name: string) => {
	return await zone({
		position: { x: position.x, y: position.y, z: position.z },
		size: new Vector3(3, 3, 3),
		onEnter: ({ self, visitor, globals }) => {
			console.log(`${visitor.uuid} entered spawn zone: ${name}`);
		},
		onExit: ({ self, visitor, globals }) => {
			console.log(`${visitor.uuid} exited spawn zone: ${name}`);
		},
	});
};

// Pickup zone (for ammo/health)
export type PickupType = 'health' | 'ammo';

export const createPickupZone = async (
	position: Vector3,
	type: PickupType,
	amount: number
) => {
	return await zone({
		position: { x: position.x, y: position.y, z: position.z },
		size: new Vector3(2, 2, 2),
		onEnter: ({ self, visitor, globals }) => {
			console.log(`Pickup: ${type} +${amount}`);
			// Could emit event to add health/ammo to player
		},
		onExit: () => {},
	});
};

// Enemy spawn positions
export const enemySpawnPositions = [
	new Vector3(15, 1, 15),
	new Vector3(-15, 1, 15),
	new Vector3(15, 1, -15),
	new Vector3(-15, 1, -15),
	new Vector3(0, 1, 20),
	new Vector3(0, 1, -20),
	new Vector3(20, 1, 0),
	new Vector3(-20, 1, 0),
];
