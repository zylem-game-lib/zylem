/**
 * Bundle Rendering demo.
 *
 * The first demo to run a stage on the unified WASM runtime with
 * `wasmRuntime.bundleRendering` enabled: WASM (`WasmStageRuntime` +
 * `StageSimulation`) owns physics and transforms, and three.js (WebGPU) draws
 * the result through `BundleGroup`s fed by a `StagePhysicsBridge`.
 *
 * It exercises both render strategies of the `RenderBundleManager`:
 *  - object-path bundles: a handful of distinctly-colored dynamic boxes whose
 *    own `Object3D`s are parented into a `BundleGroup` and synced each frame;
 *  - instanced-path bundles: a high-count batch (`runtime.render: 'instanced'`)
 *    drawn by a single `InstancedMesh` inside a `BundleGroup`.
 *
 * Everything falls under gravity onto a static ground box. Colliders are
 * auto-derived as boxes by the bridge, so every entity here is box-shaped.
 */
import { Color, Vector3 } from 'three';
import { createBox } from '@zylem/game-lib/entity';
import { createCamera, createGame, createStage } from '@zylem/game-lib/core';

import { ZYLEM_RUNTIME_WASM_URL } from '../../runtime/zylem-runtime';

const GROUND_SIZE = 64;
/** Ground thickness — kept generous so the auto-derived box collider is a solid floor. */
const GROUND_THICKNESS = 2;
/** Top surface of the ground (centered box, half its thickness above origin). */
const GROUND_TOP = GROUND_THICKNESS / 2;

/** Horizontal spread of the small object-path cluster (drops together, reads clearly). */
const OBJECT_SPREAD = 18;

/** Number of per-entity (object-path) boxes — small so individual motion reads clearly. */
const OBJECT_BOX_COUNT = 24;

/** Instanced boxes are laid out on a grid so they don't spawn overlapping. */
const INSTANCED_GRID = 39; // 39 x 39 = 1521 instances
const INSTANCED_BOX_SIZE = 0.6;
/** Cell pitch leaves a gap between boxes so the solver isn't fighting overlaps. */
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
			wasmRuntime: {
				source: ZYLEM_RUNTIME_WASM_URL,
				bundleRendering: true,
				options: { initialCapacity: 4096 },
			},
		},
		createCamera({ position: { x: 0, y: 18, z: 28 } }),
	);

	// Static ground: a thick box so the auto-derived box collider is a solid floor.
	const ground = createBox({
		name: 'ground',
		position: { x: 0, y: 0, z: 0 },
		size: { x: GROUND_SIZE, y: GROUND_THICKNESS, z: GROUND_SIZE },
		material: { color: new Color(0xee8855) },
		runtime: { body: 'static' },
	});

	const entities = [ground];

	// Object-path dynamic boxes: each owns a mesh parented into a BundleGroup.
	// They drop as a tight cluster so individual rotation/settling reads clearly.
	for (let i = 0; i < OBJECT_BOX_COUNT; i++) {
		const color = new Color(OBJECT_BOX_PALETTE[i % OBJECT_BOX_PALETTE.length]);
		entities.push(
			createBox({
				name: `object-box-${i}`,
				position: { x: spread(OBJECT_SPREAD), y: 8 + Math.random() * 14, z: spread(OBJECT_SPREAD) },
				size: { x: 1.2, y: 1.2, z: 1.2 },
				material: { color },
				runtime: { body: 'dynamic' },
			}),
		);
	}

	// Instanced dynamic boxes: drawn by a shared InstancedMesh inside a bundle.
	// Laid out on a spaced grid above the ground (with a little jitter) so they
	// don't spawn overlapping — they then drop straight down into a clean layer.
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
					runtime: { body: 'dynamic', render: 'instanced' },
				}),
			);
		}
	}

	return createGame({ id: 'bundle-rendering', debug: true }, stage, ...entities);
}
