import { Color, Vector3 } from 'three';
import { createBox, createPlane } from '@zylem/game-lib/entity';
import { createCamera, createGame, createStage, setStageFrameProfilerEnabled } from '@zylem/game-lib/core';

import { demoAsset } from '../../assets/manifest';

const skybox = demoAsset('general/skybox-default.png');

const COUNT = 3000;
const SPREAD = 30;
const HEIGHT = 30;
const HALF_EXTENT = 0.35;
const FLOOR_SIZE = 40;

/**
 * Thousands of dynamic boxes simulated by the wasm runtime and drawn through
 * the instanced-mesh pack path (`category: 'pack'`).
 *
 * Profiling: `setStageFrameProfilerEnabled(true)` logs per-section timings every
 * 60 frames to the console (`renderStrategy` section). Dynamic boxes use `canSleep: true` and `ccdEnabled:
 * false` — defaults (`canSleep: false`, `ccdEnabled: true`) are far too costly
 * at 3000 bodies. After JS-side instancing fixes, `worldUpdate` should dominate;
 * if it still exceeds ~8–10ms/frame, consider Rust buffer opts or Web Workers.
 */
export default function createDemo() {
	setStageFrameProfilerEnabled(true);

	const stage = createStage(
		{
			gravity: new Vector3(0, -9.81, 0),
			backgroundImage: skybox,
		},
		createCamera({ position: { x: 0, y: 18, z: 28 } }),
	);
	const ground = createPlane({
		tile: { x: FLOOR_SIZE, y: FLOOR_SIZE },
		size: { x: FLOOR_SIZE, y: FLOOR_SIZE, z: 1 },
		position: { x: 0, y: 0, z: 0 },
		color: new Color(0xee8855),
		collision: { static: true },
	});
	const color = new Color(0x3388ff);
	const entities = [ground];

	for (let i = 0; i < COUNT; i++) {
		const x = (Math.random() - 0.5) * SPREAD;
		const y = 5 + Math.random() * HEIGHT;
		const z = (Math.random() - 0.5) * SPREAD;

		const box = createBox({
			position: { x, y, z },
			size: { x: HALF_EXTENT * 2, y: HALF_EXTENT * 2, z: HALF_EXTENT * 2 },
			material: { color },
			name: `runtime-box-${i}`,
			category: 'pack',
			collision: { canSleep: true, ccdEnabled: false },
		});
		entities.push(box);
	}

	return createGame({ id: 'massive-instancing', debug: false }, stage, ...entities);
}
