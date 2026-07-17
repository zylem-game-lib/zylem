/**
 * Bundle Rendering demo.
 *
 * Exercises all three render categories:
 *  - `environment` — static ground and scenery via WebGPU `BundleGroup`
 *  - `pack` — many identical dynamic boxes via `InstancedMesh`
 *  - `none` — a handful of uniquely colored dynamic boxes (scene-direct)
 */
import { Color, Vector3 } from 'three';
import { createBox } from '@zylem/game-lib/entity';
import { createCamera, createGame, createStage } from '@zylem/game-lib/core';

const GROUND_SIZE = 64;
const GROUND_THICKNESS = 2;
const GROUND_TOP = GROUND_THICKNESS / 2;

const OBJECT_SPREAD = 18;
const OBJECT_BOX_COUNT = 12;

const INSTANCED_GRID = 25;
const INSTANCED_BOX_SIZE = 0.6;
const INSTANCED_CELL = 1.3;

const OBJECT_BOX_PALETTE = [
	0xff5555, 0xffaa33, 0xffe14d, 0x66dd55,
	0x44ccff, 0x5577ff, 0xaa66ff, 0xff66cc,
];

function spread(extent: number): number {
	return (Math.random() - 0.5) * extent;
}

export default function createDemo() {
	const stage = createStage(
		{
			gravity: new Vector3(0, -9.81, 0),
			backgroundColor: new Color(0x10131a),
		},
		createCamera({ position: { x: 0, y: 18, z: 28 } }),
	);

	const ground = createBox({
		name: 'ground',
		position: { x: 0, y: 0, z: 0 },
		size: { x: GROUND_SIZE, y: GROUND_THICKNESS, z: GROUND_SIZE },
		material: { color: new Color(0xee8855) },
		category: 'environment',
		collision: { static: true },
	});

	const entities = [ground];

	// Static scenery pillars — bundled environment meshes.
	for (let i = 0; i < 16; i++) {
		const angle = (i / 16) * Math.PI * 2;
		const radius = GROUND_SIZE * 0.35;
		entities.push(
			createBox({
				name: `pillar-${i}`,
				position: {
					x: Math.cos(angle) * radius,
					y: 3,
					z: Math.sin(angle) * radius,
				},
				size: { x: 1.5, y: 6, z: 1.5 },
				material: { color: new Color(0x556677) },
				category: 'environment',
				collision: { static: true },
			}),
		);
	}

	// Scene-direct dynamic boxes — unique colors, small count.
	for (let i = 0; i < OBJECT_BOX_COUNT; i++) {
		const color = new Color(OBJECT_BOX_PALETTE[i % OBJECT_BOX_PALETTE.length]);
		entities.push(
			createBox({
				name: `object-box-${i}`,
				position: { x: spread(OBJECT_SPREAD), y: 8 + Math.random() * 14, z: spread(OBJECT_SPREAD) },
				size: { x: 1.2, y: 1.2, z: 1.2 },
				material: { color },
				category: 'none',
			}),
		);
	}

	// Instanced dynamic boxes — high-count identical mesh/material.
	const instancedColor = new Color(0x3388ff);
	const gridOffset = ((INSTANCED_GRID - 1) * INSTANCED_CELL) / 2;
	for (let gx = 0; gx < INSTANCED_GRID; gx++) {
		for (let gz = 0; gz < INSTANCED_GRID; gz++) {
			const x = gx * INSTANCED_CELL - gridOffset + spread(0.2);
			const z = gz * INSTANCED_CELL - gridOffset + spread(0.2);
			entities.push(
				createBox({
					name: `instanced-box-${gx}-${gz}`,
					position: { x, y: GROUND_TOP + INSTANCED_BOX_SIZE + 2 + Math.random() * 3, z },
					size: { x: INSTANCED_BOX_SIZE, y: INSTANCED_BOX_SIZE, z: INSTANCED_BOX_SIZE },
					material: { color: instancedColor },
					category: 'pack',
					collision: { canSleep: true, ccdEnabled: false },
				}),
			);
		}
	}

	// debug: false — collider wireframes for ~660 bodies rebuild every frame
	// and dwarf the rendering being demonstrated.
	return createGame({ id: 'bundle-rendering', debug: false }, stage, ...entities);
}
